import React from 'react';
import { Package } from 'lucide-react';

const TransactionsList = () => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="font-semibold text-base md:text-lg">Recent Transactions</h2>
        <button className="text-purple-600 text-xs md:text-sm">View All</button>
      </div>
      
      <div className="flex flex-col items-center justify-center py-6 md:py-8 text-center">
        <Package size={36} className="text-purple-600 mb-3 md:mb-4 md:h-12 md:w-12" />
        <p className="text-gray-900 font-medium mb-1 text-sm md:text-base px-2">
          There are no pending transactions,
        </p>
        <p className="text-gray-900 font-medium text-sm md:text-base px-2">
          but you can start one with a single click.
        </p>
      </div>
    </div>
  );
};

export default TransactionsList;
