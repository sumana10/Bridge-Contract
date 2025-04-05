import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { BRIDGE_ABI, BRIDGE_ABI_NEW } from './utils/constants';

interface AdminPanelProps {
  bridgeAddress: string;
}

export function AdminPanel({ bridgeAddress }: AdminPanelProps) {
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>('0x');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  // Transaction receipt tracking
  const { data: txReceipt, isLoading: isWaiting, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash: txHash as `0x${string}`, 
      enabled: !!txHash 
    });
  
  // Check if token is whitelisted
  const { data: isWhitelisted, refetch: refetchWhitelist } = useReadContract({
    address: bridgeAddress,
    abi: BRIDGE_ABI_NEW,
    functionName: 'whitelistedTokens',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42,
    }
  });

  // Get minimum amount
  const { data: currentMinAmount, refetch: refetchMinAmount } = useReadContract({
    address: bridgeAddress,
    abi: BRIDGE_ABI_NEW,
    functionName: 'minAmounts',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42,
    }
  });

  // Get maximum amount
  const { data: currentMaxAmount, refetch: refetchMaxAmount } = useReadContract({
    address: bridgeAddress,
    abi: BRIDGE_ABI_NEW,
    functionName: 'maxAmounts',
    args: [tokenAddress],
    query: {
      enabled: !!tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42,
    }
  });

  // Refetch all data when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && txReceipt) {
      console.log("Transaction confirmed:", txReceipt);
      refetchWhitelist();
      refetchMinAmount();
      refetchMaxAmount();
      setStatusMessage("Transaction confirmed successfully!");
      setTimeout(() => setStatusMessage(""), 5000);
    }
  }, [isConfirmed, txReceipt, refetchWhitelist, refetchMinAmount, refetchMaxAmount]);

  // Update status when token address changes
  useEffect(() => {
    if (tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42) {
      refetchWhitelist();
      refetchMinAmount();
      refetchMaxAmount();
    }
  }, [tokenAddress, refetchWhitelist, refetchMinAmount, refetchMaxAmount]);

  const handleWhitelistToken = async (status: boolean) => {
    try {
      setIsWhitelisting(true);
      setErrorMessage('');
      setStatusMessage('');
      
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        setErrorMessage('Please enter a valid token address');
        return;
      }
      
      const hash = await writeContractAsync({
        address: bridgeAddress,
        abi: BRIDGE_ABI_NEW,
        functionName: 'setTokenWhitelist',
        args: [tokenAddress, status],
      });
      
      setTxHash(hash);
      setStatusMessage(`Transaction submitted: ${status ? 'Whitelisting' : 'Removing'} token...`);
      
    } catch (error) {
      console.error('Whitelist error:', error);
      setErrorMessage(`Failed to update whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsWhitelisting(false);
    }
  };

  const handleSetMinAmount = async () => {
    try {
      setErrorMessage('');
      setStatusMessage('');
      
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        setErrorMessage('Please enter a valid token address');
        return;
      }
      
      if (!minAmount || isNaN(Number(minAmount)) || Number(minAmount) < 0) {
        setErrorMessage('Please enter a valid minimum amount');
        return;
      }
      
      const minAmountBigInt = parseUnits(minAmount, 18);
      
      const hash = await writeContractAsync({
        address: bridgeAddress,
        abi: BRIDGE_ABI_NEW,
        functionName: 'setMinAmount',
        args: [tokenAddress, minAmountBigInt],
      });
      
      setTxHash(hash);
      setStatusMessage(`Transaction submitted: Setting minimum amount...`);
      
    } catch (error) {
      console.error('Set min amount error:', error);
      setErrorMessage(`Failed to set minimum amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSetMaxAmount = async () => {
    try {
      setErrorMessage('');
      setStatusMessage('');
      
      if (!tokenAddress || !tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
        setErrorMessage('Please enter a valid token address');
        return;
      }
      
      if (!maxAmount || isNaN(Number(maxAmount)) || Number(maxAmount) <= 0) {
        setErrorMessage('Please enter a valid maximum amount');
        return;
      }
      
      const maxAmountBigInt = parseUnits(maxAmount, 18);
      
      const hash = await writeContractAsync({
        address: bridgeAddress,
        abi: BRIDGE_ABI_NEW,
        functionName: 'setMaxAmount',
        args: [tokenAddress, maxAmountBigInt],
      });
      
      setTxHash(hash);
      setStatusMessage(`Transaction submitted: Setting maximum amount...`);
      
    } catch (error) {
      console.error('Set max amount error:', error);
      setErrorMessage(`Failed to set maximum amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Quick setup for common tokens
  const setupAmoyToken = () => {
    // Replace with your actual Amoy token address
    const amoyTokenAddress = '0x6d6c2a212537ff45847fdd7e02908f618484f51e' as `0x${string}`;
    setTokenAddress(amoyTokenAddress);
    setMinAmount('0.1');
    setMaxAmount('1000');
  };

  const setupBnbToken = () => {
    // Replace with your actual BNB token address
    const bnbTokenAddress = '0xf7d2fF5F6F1403dCe33b63ae5028F822F70Ca34e' as `0x${string}`;
    setTokenAddress(bnbTokenAddress);
    setMinAmount('0.1');
    setMaxAmount('1000');
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-xl font-bold text-center text-gray-800">Bridge Admin Panel</h2>
      
      {/* Quick setup buttons */}
      <div className="flex gap-2">
        <button
          onClick={setupAmoyToken}
          className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-md"
        >
          Setup Amoy Token
        </button>
        <button
          onClick={setupBnbToken}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md"
        >
          Setup BNB Token
        </button>
      </div>
      
      {/* Token status display */}
      {tokenAddress && tokenAddress.startsWith('0x') && tokenAddress.length === 42 && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <h3 className="font-medium mb-2">Token Status:</h3>
          <p><strong>Address:</strong> {tokenAddress}</p>
          <p><strong>Whitelisted:</strong> {isWhitelisted === undefined ? 'Loading...' : isWhitelisted ? 'Yes' : 'No'}</p>
          <p><strong>Min Amount:</strong> {currentMinAmount ? formatUnits(currentMinAmount, 18) : 'Not set'}</p>
          <p><strong>Max Amount:</strong> {currentMaxAmount ? formatUnits(currentMaxAmount, 18) : 'Not set'}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Token Address</label>
        <input
          type="text"
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
          placeholder="0x..."
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        />
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => handleWhitelistToken(true)}
          disabled={isWhitelisting || isWaiting}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isWhitelisting || isWaiting ? 'Processing...' : 'Whitelist Token'}
        </button>
        <button
          onClick={() => handleWhitelistToken(false)}
          disabled={isWhitelisting || isWaiting}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isWhitelisting || isWaiting ? 'Processing...' : 'Remove Whitelist'}
        </button>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Minimum Amount</label>
        <input
          type="text"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          placeholder="0.01"
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={handleSetMinAmount}
          disabled={isWaiting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isWaiting ? 'Processing...' : 'Set Min Amount'}
        </button>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Maximum Amount</label>
        <input
          type="text"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          placeholder="1000"
          className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={handleSetMaxAmount}
          disabled={isWaiting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isWaiting ? 'Processing...' : 'Set Max Amount'}
        </button>
      </div>
      
      {/* Status and error messages */}
      {statusMessage && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {statusMessage}
        </div>
      )}
      
      {errorMessage && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}
      
      {txHash && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium">Transaction {isWaiting ? 'Processing' : 'Confirmed'}:</p>
          <a 
            href={`${chainId === 97 ? 'https://testnet.bscscan.com/tx/' : 'https://www.oklink.com/amoy/tx/'}${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 break-all hover:underline"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
