import { useState, useEffect, useContext } from 'react';
import { DataContext } from './App';

/**
 * Custom hook για συγχρονισμό mode σε όλες τις σελίδες
 */
export function useAppMode() {
  const context = useContext(DataContext);
  
  // Local state για το mode
  const [mode, setMode] = useState<'in' | 'out'>('in');
  
  // 1️⃣ Load mode από localStorage on mount
  useEffect(() => {
    try {
      const bookingData = JSON.parse(localStorage.getItem('bookingData') || '{}');
      const savedMode = bookingData.mode || 'in';
      console.log('🔍 useAppMode: Loading mode from localStorage:', savedMode);
      setMode(savedMode);
    } catch (e) {
      console.error('Error loading mode from localStorage:', e);
    }
  }, []);
  
  // 2️⃣ Update from Context
  useEffect(() => {
    if (context?.data?.mode) {
      console.log('🔍 useAppMode: Updating mode from Context:', context.data.mode);
      setMode(context.data.mode);
    }
  }, [context?.data?.mode]);
  
  // 3️⃣ Listen for mode changes (custom event)
  useEffect(() => {
    const handleModeChange = (e: CustomEvent) => {
      if (e.detail?.mode) {
        console.log('🔍 useAppMode: Mode changed via event:', e.detail.mode);
        setMode(e.detail.mode);
      }
    };
    
    window.addEventListener('modeChanged', handleModeChange as EventListener);
    
    return () => {
      window.removeEventListener('modeChanged', handleModeChange as EventListener);
    };
  }, []);
  
  // 4️⃣ Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookingData' && e.newValue) {
        try {
          const bookingData = JSON.parse(e.newValue);
          if (bookingData.mode) {
            console.log('🔍 useAppMode: Mode changed in localStorage:', bookingData.mode);
            setMode(bookingData.mode);
          }
        } catch (err) {
          console.error('Error parsing bookingData:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // 5️⃣ Listen for window focus
  useEffect(() => {
    const handleFocus = () => {
      try {
        const bookingData = JSON.parse(localStorage.getItem('bookingData') || '{}');
        if (bookingData.mode) {
          console.log('🔍 useAppMode: Window focused, mode:', bookingData.mode);
          setMode(bookingData.mode);
        }
      } catch (e) {
        console.error('Error loading mode on focus:', e);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  console.log('🔍 useAppMode CURRENT STATE:', { mode, isCheckIn: mode === 'in', isCheckOut: mode === 'out' });
  
  return {
    mode,
    isCheckIn: mode === 'in',
    isCheckOut: mode === 'out'
  };
}