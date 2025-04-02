import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { BRIDGE_ABI } from './utils/constants';

interface AdminPanelProps {
  bridgeAddress: string;
}

export function AdminPanel({ bridgeAddress }: AdminPanelProps) {
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>('0x');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [isWhitelisting, setIsWhitelisting] = useState(false);
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const handleWhitelistToken = async (status: boolean) => {
    try {
      setIsWhitelisting(true);
      
      if (!tokenAddress || !tokenAddress.startsWith('0x')) {
        alert('Please enter a valid token address');
        return;
      }
      
      console.log(`${status ? 'Whitelisting' : 'Removing whitelist for'} token: ${tokenAddress}`);
      
      writeContract({
        address: bridgeAddress,
        abi: BRIDGE_ABI,
        functionName: 'setTokenWhitelist',
        args: [tokenAddress, status],
      });
    } catch (error) {
      console.error('Whitelist error:', error);
      alert(`Failed to update whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsWhitelisting(false);
    }
  };

  const handleSetMinAmount = async () => {
    try {
      if (!tokenAddress || !minAmount) {
        alert('Please enter both token address and minimum amount');
        return;
      }
      
      const minAmountBigInt = parseUnits(minAmount, 18);
      
      writeContract({
        address: bridgeAddress,
        abi: BRIDGE_ABI,
        functionName: 'setMinAmount',
        args: [tokenAddress, minAmountBigInt],
      });
    } catch (error) {
      console.error('Set min amount error:', error);
      alert(`Failed to set minimum amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSetMaxAmount = async () => {
    try {
      if (!tokenAddress || !maxAmount) {
        alert('Please enter both token address and maximum amount');
        return;
      }
      
      const maxAmountBigInt = parseUnits(maxAmount, 18);
      
      writeContract({
        address: bridgeAddress,
        abi: BRIDGE_ABI,
        functionName: 'setMaxAmount',
        args: [tokenAddress, maxAmountBigInt],
      });
    } catch (error) {
      console.error('Set max amount error:', error);
      alert(`Failed to set maximum amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="admin-panel">
      <h2>Bridge Admin Panel</h2>
      
      <div className="form-group">
        <label>Token Address:</label>
        <input 
          type="text" 
          value={tokenAddress} 
          onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)} 
          placeholder="0x..." 
        />
      </div>
      
      <div className="actions">
        <button 
          onClick={() => handleWhitelistToken(true)} 
          disabled={isWhitelisting}
        >
          {isWhitelisting ? 'Processing...' : 'Whitelist Token'}
        </button>
        
        <button 
          onClick={() => handleWhitelistToken(false)} 
          disabled={isWhitelisting}
        >
          {isWhitelisting ? 'Processing...' : 'Remove from Whitelist'}
        </button>
      </div>
      
      <div className="form-group">
        <label>Minimum Amount:</label>
        <input 
          type="text" 
          value={minAmount} 
          onChange={(e) => setMinAmount(e.target.value)} 
          placeholder="0.01" 
        />
        <button onClick={handleSetMinAmount}>Set Min Amount</button>
      </div>
      
      <div className="form-group">
        <label>Maximum Amount:</label>
        <input 
          type="text" 
          value={maxAmount} 
          onChange={(e) => setMaxAmount(e.target.value)} 
          placeholder="1000" 
        />
        <button onClick={handleSetMaxAmount}>Set Max Amount</button>
      </div>
    </div>
  );
}
