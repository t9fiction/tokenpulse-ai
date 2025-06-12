// app/Navbar.tsx
'use client';

import React, { useState } from 'react';
import { TrendingUp, RefreshCw, Bell, Wifi, WifiOff, Menu, X } from 'lucide-react';
import { ConnectButton } from 'thirdweb/react';
import { client } from '@/app/client';
import Link from 'next/link';
import { useDataContext } from '@/context/DataContext';
type MenuItem = {
  name: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
];

const Navbar: React.FC = () => {
  const { isLive, isLoading, lastUpdate, handleRefresh } = useDataContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-background backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TokenPulse AI
              </h1>
            </div>

            {/* Live Status - Hidden on mobile */}
            <div className="hidden md:flex items-center space-x-2 text-sm">
              {isLive ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-600">{isLive ? 'Live Data' : 'Offline Mode'}</span>
              <span className="hidden lg:inline text-xs text-gray-400">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="flex space-x-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="text-fontMain hover:text-fontHover font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </button>

            <ConnectButton client={client} />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {/* Live Status for Mobile */}
            <div className="flex items-center justify-center space-x-2 text-sm mb-4 pb-4 border-b border-gray-100">
              {isLive ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-gray-600">{isLive ? 'Live Data' : 'Offline Mode'}</span>
              <span className="text-xs text-gray-400">
                Updated {lastUpdate.toLocaleTimeString()}
              </span>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-3">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="block w-full text-center text-gray-700 font-medium p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Actions */}
            <div className="space-y-3 mt-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                aria-label="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-gray-700 font-medium">Refresh Data</span>
              </button>

              <button
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="text-gray-700 font-medium">Notifications</span>
              </button>

              <div className="flex justify-center">
                <ConnectButton client={client} />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;