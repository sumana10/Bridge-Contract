import React, { useState } from 'react';
import { Wallet, Grid as BridgeIcon, FileText, Activity, Radio, Download, HelpCircle, FileCode, X } from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import { useAccount } from 'wagmi';

const initialMenuItems = [
  { icon: Wallet, text: 'Wallet', active: false },
  { icon: BridgeIcon, text: 'Bridge', active: true },
  { icon: FileText, text: 'Transactions', active: false },
  { icon: Activity, text: 'Network status', active: false },
  { icon: Download, text: 'Get testnet ETH', active: false },
  { icon: HelpCircle, text: 'Support', active: false },
  { icon: FileText, text: 'FAQs', active: false },
  { icon: FileCode, text: 'Documentation', active: false },
];

const Sidebar = ({ onClose }: any) => {
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const { isConnected } = useAccount();

  const handleItemClick = (clickedIndex: number) => {
    setMenuItems(menuItems.map((item, index) => ({
      ...item,
      active: index === clickedIndex
    })));
  };

  const CustomConnectButton = ({ isActive }: { isActive: boolean }) => {
    return (
      <ConnectKitButton.Custom>
        {({ isConnected, show }) => {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                show();
                handleItemClick(0); 
              }}
              className="text-sm w-full text-left"
            >
              Wallet
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-custom-gradient p-5 border-r border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <button
          className="p-2 rounded-md text-gray-700 md:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="space-y-2">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer ${
              item.active ? 'bg-[#dae2f8] text-gray-700' : 'text-gray-700 hover:bg-[#dae2f8]'
            }`}
            onClick={() => handleItemClick(index)}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {item.text === "Wallet" ? (
              <CustomConnectButton isActive={item.active} />
            ) : (
              <span className="text-sm">{item.text}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
