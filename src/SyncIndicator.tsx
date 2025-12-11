import React, { useState, useEffect } from 'react';

interface SyncIndicatorProps {
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

/**
 * Subtle sync status indicator
 * Shows at the top of the screen when syncing or last sync time
 */
const SyncIndicator: React.FC<SyncIndicatorProps> = ({ isRefreshing, lastRefresh }) => {
  const [visible, setVisible] = useState(false);
  const [showLastSync, setShowLastSync] = useState(false);

  // Show indicator when refreshing starts, hide after showing "synced" message
  useEffect(() => {
    if (isRefreshing) {
      setVisible(true);
      setShowLastSync(false);
    } else if (lastRefresh) {
      // Show "synced" message briefly after refresh completes
      setShowLastSync(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, lastRefresh]);

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('el-GR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render if not visible and not refreshing
  if (!visible && !isRefreshing) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Progress bar when syncing */}
      {isRefreshing && (
        <div
          style={{
            width: '100%',
            height: '3px',
            background: 'rgba(30, 64, 175, 0.2)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '30%',
              height: '100%',
              background: 'linear-gradient(90deg, #1e40af, #3b82f6, #1e40af)',
              animation: 'syncProgress 1s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Status badge */}
      <div
        style={{
          marginTop: '8px',
          padding: '4px 12px',
          background: isRefreshing ? 'rgba(30, 64, 175, 0.9)' : 'rgba(22, 163, 74, 0.9)',
          color: 'white',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.3s ease',
          opacity: visible || isRefreshing ? 1 : 0,
          transform: visible || isRefreshing ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        {isRefreshing ? (
          <>
            {/* Spinning icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span>Syncing...</span>
          </>
        ) : showLastSync && lastRefresh ? (
          <>
            {/* Checkmark icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>Synced {formatTime(lastRefresh)}</span>
          </>
        ) : null}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes syncProgress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SyncIndicator;
