import React, { useState } from 'react';
import { Sidebar, Header, BridgeForm, TransactionsList } from './components'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-custom-gradient">
      <Header onMenuToggle={toggleMobileMenu} />

      <div className="flex">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={closeMobileMenu}
          />
        )}

        <aside className={`
          fixed md:sticky top-16 h-[calc(100vh-64px)] z-30 bg-custom-gradient
          w-64 transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0
        `}>
          <Sidebar onClose={closeMobileMenu} />
        </aside>

        <main className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 md:gap-4">
              <div className="lg:col-span-8">
                <BridgeForm />
              </div>
              <div className="lg:col-span-4">
                <TransactionsList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
