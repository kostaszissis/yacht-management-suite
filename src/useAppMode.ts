import { useState, useEffect, useContext } from 'react';
import { DataContext } from './App';

/**
 * Custom hook για συγχρονισμό mode σε όλες τις σελίδες
 * Mode comes from Context (API is source of truth) - no localStorage
 */
export function useAppMode() {
  const context = useContext(DataContext);

  // Local state για το mode - defaults to context or 'in'
  const [mode, setMode] = useState<'in' | 'out'>(() => context?.mode || 'in');

  // Update from Context (API is source of truth)
  useEffect(() => {
    if (context?.mode) {
      console.log('🔍 useAppMode: Updating mode from Context:', context.mode);
      setMode(context.mode);
    } else if (context?.data?.mode) {
      console.log('🔍 useAppMode: Updating mode from Context.data:', context.data.mode);
      setMode(context.data.mode);
    }
  }, [context?.mode, context?.data?.mode]);

  // Listen for mode changes (custom event)
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

  console.log('🔍 useAppMode CURRENT STATE:', { mode, isCheckIn: mode === 'in', isCheckOut: mode === 'out' });

  return {
    mode,
    isCheckIn: mode === 'in',
    isCheckOut: mode === 'out'
  };
}