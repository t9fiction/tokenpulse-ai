// app/DataContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface DataContextProps {
  isLive: boolean;
  isLoading: boolean;
  lastUpdate: Date;
  handleRefresh: () => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Check connectivity status
  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use CoinGecko ping for lightweight connectivity check
      const response = await fetch('https://api.coingecko.com/api/v3/ping');
      if (response.ok) {
        setIsLive(true);
        setLastUpdate(new Date());
      } else {
        setIsLive(false);
      }
    } catch (err) {
      console.error('Error checking connectivity:', err);
      setIsLive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (isLive) {
        fetchStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [fetchStatus, isLive]);

  return (
    <DataContext.Provider value={{ isLive, isLoading, lastUpdate, handleRefresh }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};