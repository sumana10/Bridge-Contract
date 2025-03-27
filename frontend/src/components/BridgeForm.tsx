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
    <div className="bg-[#d6a4a4] rounded-3xl shadow-sm border border-gray-200 p-5 md:p-6 w-full h-auto">
      <div className="flex flex-col h-full">
        <h1 className="text-xl font-bold mb-4">Bridge</h1>

        <div className="mb-3">
          <label className="text-gray-600 mb-2 block text-sm">Transfer from</label>
          <div className="bg-[#d6a4a4] rounded-xl p-2 md:p-2">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#d6a4a4] rounded-full">
                  <img src="./poly.png" alt="zkEVM" className="w-7 h-7" />
                </div>
                <span className="font-medium text-sm">Amoy</span>
              </div>
              <div className="text-xs text-gray-600">
                Balance: {fromToken.balance}
              </div>
            </div>

            <div className="flex gap-2 rounded-xl p-3 border border-gray-300 shadow-md hover:shadow-lg transition-shadow">
              <button className="w-24 flex items-center justify-between gap-1 px-3 py-2 bg-[#d6a4a4] rounded-lg border border-gray-200 text-sm">
                <span className="font-medium">POL</span>
                <ChevronDown size={16} />
              </button>

              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-[#d6a4a4] rounded-lg px-3 py-2 text-right text-sm"
              />
            </div>

            <div className="flex gap-2 mt-3">
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs">25%</button>
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs">50%</button>
              <button className="px-2 py-1 rounded-lg border border-gray-200 text-xs">MAX</button>
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 w-24">
                <img src="./bnb.png" alt="bnb" className="w-7 h-7" />
                <span className="font-medium text-sm">BSC</span>
              </div>
              <div className="text-xs text-gray-600">
                Balance: {toToken.balance}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[15px]"></div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              Est. Gas Fees <HelpCircle size={14} className="text-gray-700" />
            </div>
            <div className="flex items-end gap-1">
              <span>0.00690 POL</span>
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
        <button className="w-full bg-custom-gradient text-gray-700 py-3 rounded-xl font-medium hover:bg-[#d6a4a4] transition-all text-sm shadow-md hover:shadow-lg">
          Bridge Amoy to BNB testnet
        </button>


        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>1. Bridge</span>
          <span>2. Claim</span>
        </div>
      </div>
    </div>
  );
};

export default BridgeForm;
