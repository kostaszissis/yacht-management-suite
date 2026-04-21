import { useEffect, useRef, useState } from 'react';

export const useAutoRefresh = (
  fetchFunction: () => Promise<void>,
  intervalMinutes: number = 5
) => {
  const intervalRef = useRef<NodeJS.Timeout>();
  const fetchRef = useRef(fetchFunction);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Keep the ref updated with latest function to avoid stale closures
  useEffect(() => {
    fetchRef.current = fetchFunction;
  }, [fetchFunction]);

  useEffect(() => {
    // Set up interval
    intervalRef.current = setInterval(async () => {
      setIsRefreshing(true);
      await fetchRef.current();
      setTimeout(() => setIsRefreshing(false), 2000);
    }, intervalMinutes * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalMinutes]);

  return { isRefreshing };
};
