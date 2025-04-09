import React, { useState, useEffect } from 'react';
import { Package, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { getTransactions, updateTransaction } from '../utils/transactionManager';

const TransactionsList = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const txs = getTransactions(address);

      const updatedTxs = await Promise.all(
        txs.map(async (tx) => {
          if (tx.status === 'pending' && tx.hash && publicClient) {
            try {
              const receipt = await publicClient.getTransactionReceipt({
                hash: tx.hash,
              });

              if (receipt) {
                const newStatus = receipt.status === 'success' ? 'completed' : 'failed';

                updateTransaction(tx.hash, {
                  status: newStatus,
                  blockNumber: receipt.blockNumber,
                  blockHash: receipt.blockHash,
                });

                return {
                  ...tx,
                  status: newStatus,
                  blockNumber: receipt.blockNumber,
                  blockHash: receipt.blockHash,
                };
              }
            } catch (error) {
              console.log(`Error checking tx ${tx.hash}:`, error);
            }
          }
          return tx;
        })
      );

      updatedTxs.sort((a, b) => b.timestamp - a.timestamp);
      const recentTxs = updatedTxs.slice(0, 5);

      setTransactions(recentTxs);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const intervalId = setInterval(fetchTransactions, 15000); 

    return () => clearInterval(intervalId);
  }, [address, isConnected, publicClient]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      case 'pending':
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getExplorerUrl = (hash, chainId) => {
    if (chainId === 97) {
      return `https://testnet.bscscan.com/tx/${hash}`;
    } else if (chainId === 80002) {
      return `https://www.oklink.com/amoy/tx/${hash}`;
    }
    return '#';
  };

  useEffect(() => {
    console.log("Current transactions:", transactions);
  }, [transactions]);

  return (
    <div className="bg-[#d6a4a4] rounded-3xl shadow-sm border border-gray-200 p-5 md:p-6 h-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-base md:text-lg">Recent Transactions</h2>
        <button
          onClick={fetchTransactions}
          className="text-gray-700 text-xs md:text-sm hover:underline"
        >
          Refresh
        </button>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-3 text-gray-900 font-medium text-sm">Loading transactions...</p>
        </div>
      ) : transactions.length > 0 ? (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.hash} className="bg-[#dae2f8] rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tx.type || 'Bridge'}</span>
                    {getStatusIcon(tx.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(tx.timestamp)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{tx.amount} {tx.token}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <a
                      href={getExplorerUrl(tx.hash, tx.chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center"
                    >
                      {formatAddress(tx.hash)} <ExternalLink size={12} className="ml-1" />
                    </a>
                  </div>
                </div>
              </div>
              {tx.fromNetwork && tx.toNetwork && (
                <div className="mt-2 text-xs text-gray-600">
                  From {tx.fromNetwork} to {tx.toNetwork}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
          <Package size={32} className="text-gray-700 mb-3" />
          <p className="text-gray-900 font-medium mb-2 text-sm px-2">
            There are no pending transactions,
          </p>
          <p className="text-gray-900 font-medium text-sm px-2">
            but you can start one with a single click.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionsList;
