import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, MoreHorizontal, Menu } from 'lucide-react';
import { ConnectKitButton } from 'connectkit';
import { useAccount, useChainId } from 'wagmi';
import { switchNetwork } from 'wagmi/actions';

const Header = ({ onMenuToggle }) => {
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const { isConnected } = useAccount();
  const chainId = useChainId();

  const getCurrentNetworkInfo = () => {
    if (!chainId) return networks[0]; 

    if (chainId === 97) {
      return networks[1]; // BNB Testnet
    } else if (chainId === 80002) {
      return networks[0]; // Polygon Amoy
    }

    return {
      id: chainId.toString(),
      name: `Chain ID: ${chainId}`,
      shortName: `Chain ${chainId}`,
      icon: './poly.png' 
    };
  };

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

  const handleSwitchNetwork = (newChainId) => {
    try {
      switchNetwork({ chainId: newChainId });
      setNetworkDropdownOpen(false);
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  const networks = [
    { id: 'amoy', name: 'Polygon Amoy', shortName: 'Amoy', icon: './poly.png', chainId: 80002 },
    { id: 'bnb', name: 'Binance Testnet', shortName: 'BNB', icon: './bnb.png', chainId: 97 }
  ];

  const currentNetwork = getCurrentNetworkInfo();

  const CustomConnectButton = () => {
    return (
      <ConnectKitButton.Custom>
        {({ isConnected, show, truncatedAddress, ensName }) => {
          return (
            <button
              onClick={show}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isConnected
                  ? 'hover:bg-[#dae2f8]'
                  : 'bg-[#d6a4a4] hover:bg-[#c99393] font-medium'
                }`}
            >
              {isConnected ? (
                <>
                  <img src={currentNetwork.icon} alt="Wallet" className="w-6 h-6" />
                  <span className="hidden sm:inline">{ensName || truncatedAddress}</span>
                  <ChevronDown size={18} className="hidden xs:block" />
                </>
              ) : (
                <>
                  <span>Connect Wallet</span>
                </>
              )}
            </button>
          );
        }}
      </ConnectKitButton.Custom>
    );
  };

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 bg-custom-gradient sticky top-0 z-40 h-16">
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
            <span className="ml-2 text-xs bg-[#dae2f8] text-gray-700 px-2 py-0.5 rounded-full">Beta</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative" ref={dropdownRef}>
          {/* <button
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#dae2f8] text-sm"
            onClick={toggleNetworkDropdown}
            aria-expanded={networkDropdownOpen}
            aria-haspopup="true"
          >
            <img src={currentNetwork.icon} alt="Network" className="w-6 h-6" />
            <span className="hidden sm:inline">{currentNetwork.name}</span>
            <span className="inline sm:hidden">{currentNetwork.shortName}</span>
            <ChevronDown size={18} className={networkDropdownOpen ? "transform rotate-180 transition-transform" : "transition-transform"} />
          </button> */}
          {networkDropdownOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-[#dae2f8] rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              {networks.map((network) => (
                <button
                  key={network.id}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-[#dae2f8]"
                  onClick={() => handleSwitchNetwork(network.chainId)}
                >
                  <img src={network.icon} alt={network.name} className="w-5 h-5" />
                  <span>{network.name}</span>
                  {currentNetwork.id === network.id && (
                    <span className="ml-auto text-xs bg-[#dae2f8] text-purple-600 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-200 my-1"></div>
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-purple-600 hover:bg-[#dae2f8]">
                <span>Add custom network</span>
              </button>
            </div>
          )}
        </div>

        <CustomConnectButton />

        <button className="p-2 hover:bg-gray-50 rounded-lg">
          <MoreHorizontal size={22} />
        </button>
      </div>
    </div>
  );
};

export default Header;
