import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreHorizontal, Menu } from 'lucide-react';

const Header = ({ onMenuToggle }) => {
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNetworkDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleNetworkDropdown = () => {
    setNetworkDropdownOpen(!networkDropdownOpen);
  };

  const networks = [
    { id: 'amoy', name: 'Polygon Amoy', shortName: 'Amoy', icon: './poly.png' },
    { id: 'bnb', name: 'Binance Testnet', shortName: 'BNB', icon: './bnb.png' }
  ];

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-[#d6a4a4] sticky top-0 z-40 h-16">
      <div className="flex items-center">
        <button
          className="mr-3 p-2 rounded-md text-gray-600 md:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-3">
          <div>
            <span className="font-semibold text-base">Moonrise</span>
            <span className="ml-2 text-xs bg-purple-100 text-gray-700 px-2 py-0.5 rounded-full">Beta</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
            onClick={toggleNetworkDropdown}
            aria-expanded={networkDropdownOpen}
            aria-haspopup="true"
          >
            <img src="./poly.png" alt="Network" className="w-6 h-6" />
            <span className="hidden sm:inline">Polygon Amoy</span>
            <span className="inline sm:hidden">zkEVM</span>
            <ChevronDown size={18} className={networkDropdownOpen ? "transform rotate-180 transition-transform" : "transition-transform"} />
          </button>

          {networkDropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {networks.map((network) => (
                <button
                  key={network.id}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                  onClick={() => setNetworkDropdownOpen(false)}
                >
                  <img src={network.icon} alt={network.name} className="w-5 h-5" />
                  <span>{network.name}</span>
                  {network.id === 'zkevm' && (
                    <span className="ml-auto text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-200 my-1"></div>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-purple-600 hover:bg-gray-50">
                <span>Add custom network</span>
              </button>
            </div>
          )}
        </div>

        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm">
          <img src="./bnb.png" alt="Wallet" className="w-6 h-6" />
          <span className="hidden xs:inline sm:inline">0x93...b5fa</span>
          <ChevronDown size={18} className="hidden xs:block" />
        </button>

        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <MoreHorizontal size={22} />
        </button>
      </div>
    </div>
  );
};

export default Header;
