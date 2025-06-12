'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void>) | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
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

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchStatus(),
        refreshCallback ? refreshCallback() : Promise.resolve(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchStatus, refreshCallback]);

  const registerRefreshCallback = useCallback((callback: () => Promise<void>) => {
    setRefreshCallback(() => callback);
  }, []);

  const unregisterRefreshCallback = useCallback(() => {
    setRefreshCallback(null);
  }, []);

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(() => {
      if (isLive) {
        handleRefresh();
      }
    }, 30000); // 30 seconds for prices
    return () => clearInterval(interval);
  }, [handleRefresh, isLive]);

  return (
    <DataContext.Provider
      value={{
        isLive,
        isLoading,
        lastUpdate,
        handleRefresh,
        registerRefreshCallback,
        unregisterRefreshCallback,
      }}
    >
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