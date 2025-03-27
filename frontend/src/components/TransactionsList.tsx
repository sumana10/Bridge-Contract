import React from 'react';
import { Package } from 'lucide-react';

const TransactionsList = () => {
  return (
    <div className="bg-[#d6a4a4] rounded-3xl shadow-sm border border-gray-200 p-5 md:p-6 h-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-base md:text-lg">Recent Transactions</h2>
        <button className="text-gray-700 text-xs md:text-sm">View All</button>
      </div>

      <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
        <Package size={32} className="text-gray-700 mb-3" />
        <p className="text-gray-900 font-medium mb-2 text-sm px-2">
          There are no pending transactions,
        </p>
        <p className="text-gray-900 font-medium text-sm px-2">
          but you can start one with a single click.
        </p>
      </div>
    </div>
  );
};

export default TransactionsList;
