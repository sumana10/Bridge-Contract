import { Contract, WebSocketProvider, Wallet, Interface, JsonRpcProvider } from "ethers";
import Bull from "bull";
import dotenv from "dotenv";
import { ABI } from "./contract";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const prisma = new PrismaClient();

// Middleware to log Prisma query duration

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  console.log(`Prisma Query: ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

// Maintains active blockchain providers for each network

let activeProviders = {
  BNB: null as WebSocketProvider | JsonRpcProvider | null,
  Amoy: null as WebSocketProvider | JsonRpcProvider | null
};

// Maintains active contract instances for each network

let activeContracts = {
  BNB: null as Contract | null,
  Amoy: null as Contract | null
};

/**
 * Creates a new WebSocket or HTTP provider for a given network
 * Reconnects automatically if WebSocket closes
 * Also sets up the contract instance
 */

const createProvider = (url: string, networkName: "BNB" | "Amoy") => {
  try {
    console.log(`Creating new connection for ${networkName}...`);

    if (activeProviders[networkName]) {
      try {
        activeProviders[networkName].destroy();
      } catch (e) {
      }
    }

    let provider;

    if (url.startsWith('ws')) {
      try {
        provider = new WebSocketProvider(url);

        provider.websocket.onclose = () => {
          console.log(`WebSocket connection for ${networkName} closed. Reconnecting in 3 seconds...`);

          if (activeProviders[networkName] === provider) {
            activeProviders[networkName] = null;
          }

          setTimeout(() => {
            if (!activeProviders[networkName]) {
              createProvider(url, networkName);
              initializeListeners();
            }
          }, 3000);
        };

        console.log(`WebSocket connection for ${networkName} established`);
      } catch (wsError) {
        console.log(`WebSocket failed for ${networkName}, using HTTP fallback`);
        const httpUrl = url.replace('wss', 'https').replace('ws', 'http');
        provider = new JsonRpcProvider(httpUrl);
      }
    } else {
      provider = new JsonRpcProvider(url);
    }

    activeProviders[networkName] = provider;

    const contractAddress = networkName === "BNB"
      ? process.env.BNB_BRIDGE!
      : process.env.AMOY_BRIDGE!;

    activeContracts[networkName] = new Contract(contractAddress, ABI, provider);

    return provider;
  } catch (error) {
    console.error(`Failed to create provider for ${networkName}:`, error);

    const httpUrl = url.replace('wss', 'https').replace('ws', 'http');
    console.log(`Using fallback HTTP provider for ${networkName}: ${httpUrl}`);
    const provider = new JsonRpcProvider(httpUrl);
    activeProviders[networkName] = provider;

    const contractAddress = networkName === "BNB"
      ? process.env.BNB_BRIDGE!
      : process.env.AMOY_BRIDGE!;

    activeContracts[networkName] = new Contract(contractAddress, ABI, provider);

    return provider;
  }
};

// Initialize providers for both BNB and Amoy networks

const providerBNB = createProvider(process.env.BNB_RPC!, "BNB");
const providerAMOY = createProvider(process.env.AMOY_RPC!, "Amoy");

console.log(`BNB Bridge Contract: ${process.env.BNB_BRIDGE}`);
console.log(`Amoy Bridge Contract: ${process.env.AMOY_BRIDGE}`);

// Redis queue setup for processing bridge jobs


const redisConfig = {
  redis: {
    host: "127.0.0.1",
    port: parseInt("6379", 10),
    password: "",
  },
};

const bridgeQueue = new Bull("bridgeQueue", redisConfig);

// Event listeners for queue lifecycle logging

bridgeQueue.on('completed', job => {
  console.log(`Job ${job.id} completed for tx: ${job.data.txhash}`);
});

bridgeQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed for tx: ${job.data.txhash}`, err);
});

bridgeQueue.on('error', err => {
  console.error('Bull queue error:', err);
});

// Stores the currently active on-chain event listeners

let activeListeners = {
  BNB: null as ((tokenAddress, amount, sender, event) => void) | null,
  Amoy: null as ((tokenAddress, amount, sender, event) => void) | null
};

/**
 * Ensures provider is alive; if not, reinitializes it
 */

const ensureProviderConnection = async (networkName: "BNB" | "Amoy") => {
  const provider = activeProviders[networkName];
  const rpcUrl = networkName === "BNB" ? process.env.BNB_RPC! : process.env.AMOY_RPC!;

  if (!provider) {
    console.log(`No provider for ${networkName}, creating new one`);
    createProvider(rpcUrl, networkName);
    return false;
  }

  try {
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    console.error(`Provider for ${networkName} is not responding. Reconnecting...`);
    createProvider(rpcUrl, networkName);
    return false;
  }
};

/**
 * Listens for new and past 'Bridge' events on a network
 * Syncs missed logs and sets up real-time listeners
 */

const listenToBridgeEvents = async (network: "BNB" | "Amoy") => {
  try {
    const provider = activeProviders[network];
    const contract = activeContracts[network];

    if (!provider || !contract) {
      console.error(`No provider or contract for ${network}`);
      return;
    }

    console.log(`Setting up listener for ${network} on contract ${contract.target}`);

    let lastProcessedBlock = await prisma.networkStatus.findUnique({
      where: { network },
    });

    const latestBlock = await provider.getBlockNumber();
    console.log(`Current block for ${network}: ${latestBlock}`);

    if (!lastProcessedBlock) {
      console.log(`No last processed block found for ${network}, creating initial record`);
      const data = await prisma.networkStatus.upsert({
        where: { network },
        update: { lastProcessedBlock: latestBlock },
        create: { network, lastProcessedBlock: latestBlock },
      });
      lastProcessedBlock = { ...data };
    } else {
      console.log(`Last processed block for ${network}: ${lastProcessedBlock.lastProcessedBlock}`);
    }

    const blockGap = latestBlock - lastProcessedBlock.lastProcessedBlock;
    console.log(`Block gap for ${network}: ${blockGap}`);

    if (blockGap > 0 && blockGap < 1000) {
      try {
        console.log(`Fetching historical events for ${network} from block ${lastProcessedBlock.lastProcessedBlock + 1} to ${latestBlock}`);

        const bridgeEventSignature = "0x23f935471fa0ccb228cd4a132f081a7d594812837b377faedd389cf49a264ae3";

        const logs = await provider.getLogs({
          address: contract.target as string,
          topics: [bridgeEventSignature],
          fromBlock: lastProcessedBlock.lastProcessedBlock + 1,
          toBlock: latestBlock,
        });

        console.log(`Found ${logs.length} historical events on ${network}`);

        for (const log of logs) {
          try {
            console.log(`Processing log:`, log);

            const tokenAddress = "0x" + log.topics[1].substring(26);
            const sender = "0x" + log.topics[2].substring(26);
            const amount = log.data;

            console.log(`Parsed event data: Token=${tokenAddress}, Sender=${sender}, Amount=${amount}`);

            const txhash = log.transactionHash;

            console.log(`Adding job to queue for historical event: ${txhash}`);

            await bridgeQueue.add({
              txhash: txhash.toLowerCase(),
              tokenAddress,
              amount,
              sender,
              network,
            });

            console.log(`Job added to queue for historical event: ${txhash}`);
          } catch (error) {
            console.error(`Error processing log:`, error);
          }
        }
      } catch (error) {
        console.warn(`Could not fetch historical logs for ${network}:`, error.message);
      }
    }

    console.log(`Updating last processed block for ${network} to ${latestBlock}`);
    await prisma.networkStatus.update({
      where: { network },
      data: { lastProcessedBlock: latestBlock },
    });

    if (activeListeners[network]) {
      try {
        console.log(`Removing existing Bridge event listener for ${network}`);
        contract.off("Bridge", activeListeners[network]);
      } catch (e) {
        console.log(`Error removing listener: ${e.message}`);
      }
      activeListeners[network] = null;
    }

    const bridgeListener = (tokenAddress, amount, sender, event) => {
      console.log(`Bridge event detected on ${network}: Token ${tokenAddress} Amount ${amount}`);

      const txhash = event.log.transactionHash.toLowerCase();

      console.log(`Adding job to queue for new event: ${txhash}`);

      bridgeQueue.add({
        txhash,
        tokenAddress: tokenAddress.toString(),
        amount: amount.toString(),
        sender: sender.toString(),
        network,
      }).catch(error => {
        console.error(`Error adding job to queue:`, error);
      });

      prisma.networkStatus.update({
        where: { network },
        data: { lastProcessedBlock: event.log.blockNumber },
      }).catch(error => {
        console.error(`Error updating last processed block:`, error);
      });
    };

    activeListeners[network] = bridgeListener;

    contract.on("Bridge", bridgeListener);

    console.log(`Listening for new bridge events on ${network} from block ${latestBlock}`);
  } catch (error) {
    console.error(`Error in ${network} listener:`, error);
  }
};

/**
 * Transfers tokens by interacting with the bridge contract
 * Uses WebSocket or HTTP fallback for transaction signing
 */

const transferToken = async (
  isBNB: boolean,
  amount: string,
  sender: string,
  nonce: number
) => {
  let provider = null;

  try {
    const RPC = !isBNB ? process.env.BNB_RPC : process.env.AMOY_RPC;
    const pk = process.env.PK!;
    const contractAddress = !isBNB
      ? process.env.BNB_BRIDGE!
      : process.env.AMOY_BRIDGE!;

    console.log(`Creating provider for transfer on ${!isBNB ? 'BNB' : 'Amoy'} network`);

    if (RPC!.startsWith('ws')) {
      try {
        provider = new WebSocketProvider(RPC!);
      } catch (error) {
        console.log(`Falling back to HTTP provider for transaction`);
        const httpUrl = RPC!.replace('wss', 'https').replace('ws', 'http');
        provider = new JsonRpcProvider(httpUrl);
      }
    } else {
      provider = new JsonRpcProvider(RPC!);
    }

    console.log(`Creating wallet and contract instance for transfer`);
    const wallet = new Wallet(pk, provider);
    const contractInstance = new Contract(contractAddress, ABI, wallet);

    const testToken = !isBNB
      ? process.env.BNB_TOKEN!
      : process.env.AMOY_TOKEN!;

    let parsedAmount = amount;
    if (amount.startsWith('0x')) {
      parsedAmount = BigInt(amount).toString();
    }

    console.log(`Executing redeem on ${isBNB ? 'Amoy' : 'BNB'} network with nonce ${nonce}`);
    console.log(`Token: ${testToken}, Sender: ${sender}, Amount: ${parsedAmount}`);

    const tx = await contractInstance.redeem(testToken, sender, parsedAmount, nonce);
    console.log(`Transaction sent: ${tx.hash}`);

    console.log(`Waiting for transaction confirmation...`);
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return receipt;
  } catch (error) {
    console.error("Error in transferToken:", error);
    throw error;
  } finally {
    if (provider) {
      try {
        console.log(`Cleaning up provider`);
        provider.destroy();
      } catch (e) {
      }
    }
  }
};

const initializeListeners = async () => {
  await ensureProviderConnection("BNB");

  try {
    await listenToBridgeEvents("BNB");
    console.log("BNB listener initialized successfully");
  } catch (error) {
    console.error("Error initializing BNB listener:", error.message);
  }

  await ensureProviderConnection("Amoy");

  try {
    await listenToBridgeEvents("Amoy");
    console.log("Amoy listener initialized successfully");
  } catch (error) {
    console.error("Error initializing Amoy listener:", error.message);
  }
};

initializeListeners();

setInterval(async () => {
  const bnbConnected = await ensureProviderConnection("BNB");
  const amoyConnected = await ensureProviderConnection("Amoy");

  if (!bnbConnected || !amoyConnected) {
    console.log("Provider reconnected, reinitializing listeners...");

    setTimeout(initializeListeners, 1000);
  }
}, 30000); // Check every 30 seconds

setInterval(async () => {
  try {
    if (activeProviders.BNB) {
      const blockNumber = await activeProviders.BNB.getBlockNumber();
      console.log(`BNB heartbeat successful, current block: ${blockNumber}`);

      const lastProcessed = await prisma.networkStatus.findUnique({
        where: { network: "BNB" },
      });

      if (lastProcessed && blockNumber > lastProcessed.lastProcessedBlock) {
        console.log(`New blocks detected on BNB: ${blockNumber - lastProcessed.lastProcessedBlock} blocks behind`);

        if (blockNumber - lastProcessed.lastProcessedBlock > 5) {
          console.log(`Checking for missed events on BNB...`);
          await listenToBridgeEvents("BNB");
        }
      }
    }
  } catch (error) {
    console.log("BNB heartbeat failed, reconnecting...");
    await ensureProviderConnection("BNB");
  }

  try {
    if (activeProviders.Amoy) {
      const blockNumber = await activeProviders.Amoy.getBlockNumber();
      console.log(`Amoy heartbeat successful, current block: ${blockNumber}`);

      const lastProcessed = await prisma.networkStatus.findUnique({
        where: { network: "Amoy" },
      });

      if (lastProcessed && blockNumber > lastProcessed.lastProcessedBlock) {
        console.log(`New blocks detected on Amoy: ${blockNumber - lastProcessed.lastProcessedBlock} blocks behind`);

        if (blockNumber - lastProcessed.lastProcessedBlock > 5) {
          console.log(`Checking for missed events on Amoy...`);
          await listenToBridgeEvents("Amoy");
        }
      }
    }
  } catch (error) {
    console.log("Amoy heartbeat failed, reconnecting...");
    await ensureProviderConnection("Amoy");
  }
}, 15000); // Every 15 seconds

bridgeQueue.process(async (job) => {
  const { txhash, tokenAddress, amount, sender, network } = job.data;
  console.log(`Processing job for txhash ${txhash} on ${network}`);

  try {
    console.log(`Checking if transaction ${txhash} exists in database`);
    let transaction = await prisma.transactionData.findUnique({
      where: { txHash: txhash },
    });

    if (!transaction) {
      console.log(`Transaction ${txhash} not found, creating new record`);

      console.log(`Getting nonce for ${network}`);
      const nonceRecord = await prisma.nonce.upsert({
        where: { network },
        update: { nonce: { increment: 1 } },
        create: { network, nonce: 1 },
      });

      console.log(`Using nonce ${nonceRecord.nonce} for ${network}`);

      transaction = await prisma.transactionData.create({
        data: {
          txHash: txhash,
          tokenAddress,
          amount,
          sender,
          network,
          isDone: false,
          nonce: nonceRecord.nonce,
        },
      });

      console.log(`Created transaction record for ${txhash}`);
    } else {
      console.log(`Transaction ${txhash} already exists in database`);
    }

    if (transaction.isDone) {
      console.log(`Transaction ${txhash} already processed, skipping`);
      return { success: true, message: "Transaction already processed" };
    }

    console.log(`Executing transfer for transaction ${txhash}`);
    await transferToken(network === "BNB", amount, sender, transaction.nonce);

    console.log(`Transfer completed, updating transaction status for ${txhash}`);
    await prisma.transactionData.update({
      where: { txHash: txhash },
      data: { isDone: true },
    });

    console.log(`Transaction ${txhash} marked as done`);
    return { success: true };
  } catch (error) {
    console.error(`Error processing job for txhash ${txhash}:`, error);
    throw error;
  }
});

const checkForNewEvents = async () => {
  console.log("Manually checking for new events on both networks...");

  try {
    await listenToBridgeEvents("BNB");
    await listenToBridgeEvents("Amoy");
  } catch (error) {
    console.error("Error during manual event check:", error);
  }
};

setInterval(checkForNewEvents, 120000);

(async () => {
  try {
    console.log("Testing database connection...");

    const networks = await prisma.networkStatus.findMany();
    console.log(`Found ${networks.length} network status records`);

    const transactions = await prisma.transactionData.count();
    console.log(`Found ${transactions} transaction records`);

    const nonces = await prisma.nonce.count();
    console.log(`Found ${nonces} nonce records`);

    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection test failed:", error);
    console.error("Please check your database configuration");
    process.exit(1);
  }
})();

process.on('SIGINT', async () => {
  console.log('Shutting down...');

  try {
    if (activeListeners.BNB && activeContracts.BNB) {
      activeContracts.BNB.off("Bridge", activeListeners.BNB);
    }
  } catch (e) {
    console.log(`Error during BNB listener cleanup: ${e.message}`);
  }

  try {
    if (activeListeners.Amoy && activeContracts.Amoy) {
      activeContracts.Amoy.off("Bridge", activeListeners.Amoy);
    }
  } catch (e) {
    console.log(`Error during Amoy listener cleanup: ${e.message}`);
  }

  try {
    if (activeProviders.BNB) {
      activeProviders.BNB.destroy();
    }
  } catch (e) {
    console.log(`Error closing BNB provider: ${e.message}`);
  }

  try {
    if (activeProviders.Amoy) {
      activeProviders.Amoy.destroy();
    }
  } catch (e) {
    console.log(`Error closing Amoy provider: ${e.message}`);
  }

  await bridgeQueue.close();

  await prisma.$disconnect();

  console.log('Shutdown complete');
  process.exit(0);
});


process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});


process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
});
