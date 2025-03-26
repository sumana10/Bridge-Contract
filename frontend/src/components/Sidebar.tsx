import React from 'react';
import { Wallet, Grid as BridgeIcon, FileText, Activity, Radio, Download, HelpCircle, FileCode, X } from 'lucide-react';

const menuItems = [
  { icon: Wallet, text: 'Wallet', active: false },
  { icon: BridgeIcon, text: 'Bridge', active: true },
  { icon: FileText, text: 'Transactions', active: false },
  { icon: Activity, text: 'Network status', active: false },
  { icon: Download, text: 'Get testnet ETH', active: false },
  { icon: HelpCircle, text: 'Support', active: false },
  { icon: FileText, text: 'FAQs', active: false },
  { icon: FileCode, text: 'Documentation', active: false },
];

const Sidebar = ({ onClose }) => {
  return (
    <div className="h-full overflow-y-auto bg-custom-gradient p-4 border-r border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <button 
          className="p-1.5 rounded-md text-gray-700 md:hidden" 
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      
      <nav>
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-3 md:px-4 py-2 rounded-lg mb-1 cursor-pointer ${
              item.active ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <item.icon size={18} className="flex-shrink-0" />
            <span className="text-sm md:text-base">{item.text}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
