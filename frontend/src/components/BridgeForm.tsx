import React, { useState, useEffect } from 'react';
import { addTransaction, updateTransaction } from "../utils/transactionManager";
import { ChevronDown, HelpCircle, ArrowDown, CheckCircle } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { BNB_BRIDGE, BNB_TOKEN, BRIDGE_ABI, BRIDGE_ABI_AMOY, AMOY_BRIDGE, AMOY_TOKEN, TOKEN_ABI, TOKEN_ABI_AMOY } from "../utils/constants";

interface TokenBalance {
  balance: string;
  symbol: string;
}

const BridgeForm = () => {
  const [amount, setAmount] = useState<string>('0.1');
  const [equivalentAmount, setEquivalentAmount] = useState<string>('0.1');
  const [fromToken, setFromToken] = useState<TokenBalance>({ balance: '0.218649', symbol: 'ETH' });
  const [toToken, setToToken] = useState<TokenBalance>({ balance: '0', symbol: 'ETH' });

  const [fromNetwork, setFromNetwork] = useState('Amoy');
  const [toNetwork, setToNetwork] = useState('BNB');
  const [isAllowanceSufficient, setIsAllowanceSufficient] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { isConnected, chainId, address } = useAccount();
  const [tokenAddress, setTokenAddress] = useState(AMOY_TOKEN);
  const [spenderAddress, setSpenderAddress] = useState(AMOY_BRIDGE);
  const [currentTokenAbi, setCurrentTokenAbi] = useState(TOKEN_ABI_AMOY);
  const [currentBridgeAbi, setCurrentBridgeAbi] = useState(BRIDGE_ABI_AMOY);

  const { writeContractAsync } = useWriteContract();
  const { data: txReceipt, isLoading: isWaiting, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      enabled: !!txHash
    });

  useEffect(() => {
    setEquivalentAmount(amount);
  }, [amount]);

  useEffect(() => {
    if (!isConnected) return;
    console.log("Chain ID detected:", chainId);

    if (chainId === 97) {  // BNB Chain
      console.log("Setting up for BNB Chain");
      setFromNetwork('BNB');
      setToNetwork('Amoy');
      setTokenAddress(BNB_TOKEN);
      setSpenderAddress(BNB_BRIDGE);
      setCurrentTokenAbi(TOKEN_ABI);
      setCurrentBridgeAbi(BRIDGE_ABI);
      setFromToken({ balance: '0.218649', symbol: 'BNB' });
      setToToken({ balance: '0', symbol: 'POL' });
    } else if (chainId === 80002) {  // Amoy testnet
      console.log("Setting up for Amoy Chain");
      setFromNetwork('Amoy');
      setToNetwork('BNB');
      setTokenAddress(AMOY_TOKEN);
      setSpenderAddress(AMOY_BRIDGE);
      setCurrentTokenAbi(TOKEN_ABI_AMOY);
      setCurrentBridgeAbi(BRIDGE_ABI_AMOY);
      setFromToken({ balance: '0.218649', symbol: 'POL' });
      setToToken({ balance: '0', symbol: 'BNB' });
    } else {
      console.log("Unsupported chain, defaulting to BNB");
      setFromNetwork('BNB');
      setToNetwork('Amoy');
      setTokenAddress(BNB_TOKEN);
      setSpenderAddress(BNB_BRIDGE);
      setCurrentTokenAbi(TOKEN_ABI);
      setCurrentBridgeAbi(BRIDGE_ABI);
      setFromToken({ balance: '0.218649', symbol: 'BNB' });
      setToToken({ balance: '0', symbol: 'POL' });

      if (chainId) {
        console.warn(`Network with chainId ${chainId} is not supported. Please switch to BNB Chain or Amoy Testnet.`);
      }
    }
  }, [chainId, isConnected]);

  const { data: isWhitelisted } = useReadContract({
    address: spenderAddress,
    abi: currentBridgeAbi,
    functionName: 'whitelistedTokens',
    args: [tokenAddress],
    query: {
      enabled: isConnected && !!tokenAddress && !!spenderAddress,
    }
  });

  const { data: minAmount } = useReadContract({
    address: spenderAddress,
    abi: currentBridgeAbi,
    functionName: 'minAmounts',
    args: [tokenAddress],
    query: {
      enabled: isConnected && !!tokenAddress && !!spenderAddress,
    }
  });

  const { data: maxAmount } = useReadContract({
    address: spenderAddress,
    abi: currentBridgeAbi,
    functionName: 'maxAmounts',
    args: [tokenAddress],
    query: {
      enabled: isConnected && !!tokenAddress && !!spenderAddress,
    }
  });

  const { data: allowance, refetch, isError: allowanceError } = useReadContract({
    address: tokenAddress,
    abi: currentTokenAbi,
    functionName: 'allowance',
    args: [address, spenderAddress],
    query: {
      enabled: isConnected && !!address && !!tokenAddress && !!spenderAddress,
    }
  });

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: currentTokenAbi,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: isConnected && !!address && !!tokenAddress,
    }
  });

  useEffect(() => {
    if (tokenBalance) {
      setFromToken(prev => ({
        ...prev,
        balance: formatUnits(tokenBalance, 18)
      }));
    }
  }, [tokenBalance]);

  useEffect(() => {
    if (!amount || !allowance) {
      setIsAllowanceSufficient(false);
      return;
    }
    try {
      const amountBigInt = parseUnits(amount.toString(), 18);

      setIsAllowanceSufficient(allowance >= amountBigInt);

      console.log("Allowance check:", {
        allowance: formatUnits(allowance, 18),
        amount: amount,
        isSufficient: allowance >= amountBigInt
      });
    } catch (error) {
      console.error("Error checking allowance:", error);
      setIsAllowanceSufficient(false);
    }
  }, [allowance, amount]);

  useEffect(() => {
    setWalletConnected(isConnected);

    if (isConnected) {
      console.log("Wallet connected:", address);
    } else {
      console.log("Wallet disconnected");
      setIsAllowanceSufficient(false);
      setSuccessMessage('');
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (isConfirmed && txReceipt) {
      console.log("Transaction confirmed:", txReceipt);


      if (txHash) {
        const status = txReceipt.status === 'success' ? 'completed' : 'failed';
        updateTransaction(txHash, {
          status: status,
          blockNumber: txReceipt.blockNumber,
          blockHash: txReceipt.blockHash
        });
      }

      refetch();
      refetchBalance();

      if (txReceipt.status === 'success') {
        const actionType = isAllowanceSufficient ? 'Bridge' : 'Approval';
        setSuccessMessage(`${actionType} transaction successful! Your transaction has been confirmed.`);

        if (isAllowanceSufficient) {
          setAmount('');
          setEquivalentAmount('');
        }
      }

      setIsLoading(false);

      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [isConfirmed, txReceipt, txHash, refetch, refetchBalance, isAllowanceSufficient]);

  const validateInputs = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return false;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid amount");
      return false;
    }

    if (!tokenAddress || !spenderAddress) {
      alert("Contract addresses not properly configured");
      return false;
    }

    if (isWhitelisted === false) {
      setErrorMessage(`Token ${tokenAddress} is not whitelisted for bridging`);
      return false;
    }

    if (minAmount) {
      const amountBigInt = parseUnits(amount.toString(), 18);
      if (amountBigInt < minAmount) {
        setErrorMessage(`Amount is too small. Minimum required: ${formatUnits(minAmount, 18)}`);
        return false;
      }
    }

    if (maxAmount && maxAmount > 0n) {
      const amountBigInt = parseUnits(amount.toString(), 18);
      if (amountBigInt > maxAmount) {
        setErrorMessage(`Amount is too large. Maximum allowed: ${formatUnits(maxAmount, 18)}`);
        return false;
      }
    }

    return true;
  };

  const approve = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const approveAmount = parseUnits(amount.toString(), 18);

      console.log(`Approving ${amount} tokens from ${tokenAddress} to ${spenderAddress}`);

      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: currentTokenAbi,
        functionName: 'approve',
        args: [spenderAddress, approveAmount],
      });

      setTxHash(hash);
      console.log("Approval transaction submitted:", hash);

      addTransaction({
        hash: hash,
        type: 'Approve',
        status: 'pending',
        amount: amount,
        token: fromToken.symbol,
        chainId: chainId,
        userAddress: address
      });

    } catch (error) {
      console.error("Approval error:", error);
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!validateInputs() || !isAllowanceSufficient) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');

    try {
      const bridgeAmount = parseUnits(amount.toString(), 18);

      console.log(`Bridging ${amount} tokens from ${fromNetwork} to ${toNetwork}`);
      console.log(`Token: ${tokenAddress}, Bridge: ${spenderAddress}`);

      const gasLimit = chainId === 80002 ? BigInt(1000000) : BigInt(500000);

      const hash = await writeContractAsync({
        address: spenderAddress,
        abi: currentBridgeAbi,
        functionName: 'bridge',
        args: [tokenAddress, bridgeAmount],
        gas: gasLimit
      });

      setTxHash(hash);
      console.log("Bridge transaction submitted:", hash);

      addTransaction({
        hash: hash,
        type: 'Bridge',
        status: 'pending',
        amount: amount,
        token: fromToken.symbol,
        fromNetwork: fromNetwork,
        toNetwork: toNetwork,
        chainId: chainId,
        userAddress: address
      });

    } catch (error) {
      console.error("Bridge error:", error);

      const errorString = String(error);

      if (errorString.includes("Token_Not_Whitelisted")) {
        setErrorMessage("This token is not whitelisted for bridging");
      } else if (errorString.includes("Amount_Too_Small")) {
        setErrorMessage(`Amount is too small. Minimum required: ${minAmount ? formatUnits(minAmount, 18) : 'unknown'}`);
      } else if (errorString.includes("Amount_Too_Large")) {
        setErrorMessage(`Amount is too large. Maximum allowed: ${maxAmount ? formatUnits(maxAmount, 18) : 'unknown'}`);
      } else if (errorString.includes("Insufficient_Allowance")) {
        setErrorMessage("Insufficient allowance. Please approve more tokens.");
        setIsAllowanceSufficient(false);
      } else {
        setErrorMessage(errorString);
      }

      setIsLoading(false);
    }
  };

  const handlePercentage = (percentage: number) => {
    if (!tokenBalance) return;

    const calculatedAmount = (Number(formatUnits(tokenBalance, 18)) * percentage / 100).toString();
    setAmount(calculatedAmount);
  };

  const handleMax = () => {
    if (!tokenBalance) return;
    setAmount(formatUnits(tokenBalance, 18));
  };

  const handleClearForm = () => {
    setAmount('');
    setEquivalentAmount('');
    setErrorMessage('');
    setSuccessMessage('');
    setTxHash('');
  };

  return (
    <div className="bg-[#d6a4a4] rounded-3xl shadow-sm border border-gray-200 p-5 md:p-6 w-full h-auto">
      <div className="flex flex-col h-full">
        <h1 className="text-xl font-bold mb-4">Bridge</h1>
        <div className="mb-3">
          <label className="text-gray-600 mb-2 block text-sm">Transfer from</label>
          <div className="bg-[#d6a4a4] rounded-xl p-2 md:p-2">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#d6a4a4] rounded-full">
                  <img src={fromNetwork === 'Amoy' ? "./poly.png" : "./bnb.png"} alt={fromNetwork} className="w-7 h-7" />
                </div>
                <span className="font-medium text-sm">{fromNetwork}</span>
              </div>
              <div className="text-xs text-gray-600">
                Balance: {fromToken.balance}
              </div>
            </div>
            <div className="flex gap-2 rounded-xl p-3 border border-gray-300 shadow-md hover:shadow-lg transition-shadow">
              <button className="w-24 flex items-center justify-between gap-1 px-3 py-2 bg-[#d6a4a4] rounded-lg border border-gray-200 text-sm">
                <span className="font-medium">{fromToken.symbol}</span>
                <ChevronDown size={16} />
              </button>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-[#d6a4a4] rounded-lg px-3 py-2 text-right text-sm"
                placeholder="0.0"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handlePercentage(25)}
                className="px-2 py-1 rounded-lg border border-gray-200 text-xs hover:bg-gray-100 transition-colors"
              >
                25%
              </button>
              <button
                onClick={() => handlePercentage(50)}
                className="px-2 py-1 rounded-lg border border-gray-200 text-xs hover:bg-gray-100 transition-colors"
              >
                50%
              </button>
              <button
                onClick={handleMax}
                className="px-2 py-1 rounded-lg border border-gray-200 text-xs hover:bg-gray-100 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>
        </div>
        <div className="flex justify-center my-2">
          <div className="w-8 h-8 bg-[#d6a4a4] rounded-full flex items-center justify-center">
            <ArrowDown size={18} className="text-gray-700" />
          </div>
        </div>
        <div className="mb-4">
          <label className="text-gray-600 mb-2 block text-sm">Transfer To</label>
          <div className="bg-[#d6a4a4] rounded-xl p-3 md:p-4 border border-gray-300 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div className="flex items-center gap-2 w-24">
                <img src={toNetwork === 'BNB' ? "./bnb.png" : "./poly.png"} alt={toNetwork} className="w-7 h-7" />
                <span className="font-medium text-sm">{toNetwork}</span>
              </div>
              <div className="text-xs text-gray-600">
                Balance: {toToken.balance}
              </div>
            </div>

            <div className="flex gap-2 rounded-xl p-3 border border-gray-300 bg-[#d6a4a4]/50">
              <div className="w-24 flex items-center gap-1 px-3 py-2 bg-[#d6a4a4] rounded-lg border border-gray-200 text-sm">
                <span className="font-medium">{toToken.symbol}</span>
              </div>
              <div className="flex-1 bg-[#d6a4a4]/30 rounded-lg px-3 py-2 text-right text-sm">
                {equivalentAmount || '0.0'}
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600 italic text-right">
              Estimated amount you will receive
            </div>
          </div>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm border border-green-200 flex items-start gap-2">
            <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Success!</p>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="p-3 bg-[#d6a4a4]/50 rounded-lg text-xs mb-4 border border-gray-300">
            <div className="flex flex-col gap-1">
              {isWhitelisted !== undefined && (
                <div className="flex justify-between">
                  <span>Token Whitelisted:</span>
                  <span>{isWhitelisted ? 'Yes' : 'No'}</span>
                </div>
              )}
              {minAmount && (
                <div className="flex justify-between">
                  <span>Min Amount:</span>
                  <span>{formatUnits(minAmount, 18)}</span>
                </div>
              )}
              {maxAmount && (
                <div className="flex justify-between">
                  <span>Max Amount:</span>
                  <span>{formatUnits(maxAmount, 18)}</span>
                </div>
              )}
              {allowance && (
                <div className="flex justify-between">
                  <span>Current Allowance:</span>
                  <span>{formatUnits(allowance, 18)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-[15px]"></div>
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              Est. Gas Fees <HelpCircle size={14} className="text-gray-700" />
            </div>
            <div className="flex items-end gap-1">
              <span>0.00690 {fromToken.symbol}</span>
              <span className="text-gray-700 hidden sm:inline">~12.63 USD</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              Est. Time <HelpCircle size={14} className="text-gray-700" />
            </div>
            <span>15 mins</span>
          </div>
        </div>

        {txHash && (
          <div className="mb-4 p-3 bg-[#d6a4a4]/50 rounded-lg text-xs border border-gray-300">
            <p className="font-medium">Transaction {isWaiting ? 'Processing' : 'Confirmed'}:</p>
            <a
              href={`${chainId === 97 ? 'https://testnet.bscscan.com/tx/' : 'https://www.oklink.com/amoy/tx/'}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 break-all hover:underline"
            >
              {txHash}
            </a>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-xs border border-red-200 flex items-start gap-2">
            <div>
              <p className="font-medium">Error:</p>
              <p>{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {isConnected && isAllowanceSufficient ? (
          <button
            onClick={handleSwap}
            disabled={!walletConnected || !isAllowanceSufficient || isLoading || isWaiting || !amount}
            className={`w-full bg-custom-gradient text-gray-700 py-3 rounded-xl font-medium transition-all text-sm shadow-md hover:shadow-lg ${(!amount || isLoading || isWaiting) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#d6a4a4]'}`}
          >
            {isLoading || isWaiting ? 'Processing...' : `Bridge ${fromNetwork} to ${toNetwork}`}
          </button>
        ) : (
          <button
            onClick={approve}
            disabled={!walletConnected || isLoading || isWaiting || !amount}
            className={`w-full bg-yellow-500 text-white py-3 rounded-xl font-medium transition-all text-sm shadow-md hover:shadow-lg ${(!amount || isLoading || isWaiting) ? 'opacity-70 cursor-not-allowed' : 'hover:bg-yellow-600'}`}
          >
            {isLoading || isWaiting ? 'Processing...' : 'Approve'}
          </button>
        )}

        {(amount || errorMessage || successMessage || txHash) && (
          <button
            onClick={handleClearForm}
            className="w-full mt-2 bg-transparent text-gray-600 py-2 rounded-xl font-medium text-xs hover:bg-gray-100 transition-colors"
          >
            Clear Form
          </button>
        )}

        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>1. Bridge</span>
          <span>2. Claim</span>
        </div>
      </div>
    </div>
  );
};

export default BridgeForm;
