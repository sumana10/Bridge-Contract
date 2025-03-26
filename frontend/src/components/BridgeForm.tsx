import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowDown } from 'lucide-react';

interface TokenBalance {
  balance: string;
  symbol: string;
}

const BridgeForm = () => {
  const [amount, setAmount] = useState<string>('0.1');
  const [fromToken] = useState<TokenBalance>({ balance: '0.218649', symbol: 'ETH' });
  const [toToken] = useState<TokenBalance>({ balance: '0', symbol: 'ETH' });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 md:p-6 h-auto min-h-[600px] md:min-h-[650px] lg:h-[calc(100vh-128px)] w-full">
      <div className="h-full flex flex-col">
        <h1 className="text-xl md:text-2xl font-bold mb-4">Bridge</h1>
       
        <div className="mb-3">
          <label className="text-gray-600 mb-2 block text-sm md:text-base">Transfer from</label>
          <div className="bg-gray-50 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-200 rounded-full">
                <img src="./poly.png" alt="zkEVM" className="w-7 h-7 md:w-8 md:h-8" />

                </div>
                <span className="font-medium text-sm md:text-base">Amoy</span>
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Balance: {fromToken.balance}
              </div>
            </div>
            
            <div className="flex gap-2 md:gap-4">
              <button className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 bg-white rounded-lg border border-gray-200 text-sm md:text-base">
                <span className="font-medium">POL</span>
                <ChevronDown size={16} />
              </button>
              
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-white rounded-lg border border-gray-200 px-2 md:px-4 py-2 text-right text-sm md:text-base"
              />
            </div>
            
            <div className="flex gap-1 md:gap-2 mt-3">
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs md:text-sm">25%</button>
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs md:text-sm">50%</button>
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs md:text-sm">MAX</button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center my-2 md:my-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <ArrowDown size={18} className="text-gray-400" />
          </div>
        </div>
       
        <div className="mb-4">
          <label className="text-gray-600 mb-2 block text-sm md:text-base">Transfer To</label>
          <div className="bg-gray-50 rounded-xl p-3 md:p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <img src="./bnb.png" alt="zkEVM" className="w-7 h-7 md:w-8 md:h-8" />
                <span className="font-medium text-sm md:text-base">BSC testnet</span>
              </div>
              <div className="text-xs md:text-sm text-gray-600">
                Balance: {toToken.balance}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-[20px]"></div>
      
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-1">
              Est. Gas Fees <HelpCircle size={14} className="text-gray-400" />
            </div>
            <div className="flex items-end gap-1 md:gap-2">
              <span>0.00690 POL</span>
              <span className="text-gray-400 hidden sm:inline">~12.63 USD</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center gap-1">
              Est. Time <HelpCircle size={14} className="text-gray-400" />
            </div>
            <span>15 mins</span>
          </div>
        </div>
       
        <button className="w-full bg-custom-gradient text-gray-700 py-2.5 md:py-3 lg:py-4 rounded-xl font-medium hover:bg-purple-700 transition-colors text-sm md:text-base">
          Bridge Amoy to BNB testnet
        </button>
        
        <div className="flex justify-between items-center mt-3 text-xs md:text-sm text-gray-500">
          <span>1. Bridge</span>
          <span>2. Claim</span>
        </div>
      </div>
    </div>
  );
};

export default BridgeForm;
