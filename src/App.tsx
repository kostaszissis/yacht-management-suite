import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import Page1 from './page1-with-fleet-management';
import Page2 from './vessel-checkin-page2';
import Page3 from './vessel-checkin-page3';
import Page4 from './page4-with-vessel-floorplans';
import Page5 from './vessel-final-page';
import CharterAgreementPage from './CharterAgreementPage';
import FleetManagement from './FleetManagement';
import CompanyNews from './CompanyNews';
import ChartererDashboard from './ChartererDashboard';
import OwnerDashboard from './OwnerDashboard';
import OwnerProfile from './OwnerProfile';
import AdminPanel from './AdminPanel';
import TechnicalSupportChat from './TechnicalSupportChat';
import TechnicalManagerDashboard from './TechnicalManagerDashboard';
import WinterizationCheckin from './WinterizationCheckin';
import WinterMaintenanceInventory from './WinterMaintenanceInventory';
import WinterTakeOver from './WinterTakeOver';
import WinterSafetyEquipment from './WinterSafetyEquipment';
import TaskCategoryCheckin from './TaskCategoryCheckin';
import SyncIndicator from './SyncIndicator';
import AddBoat from './AddBoat';
import ConsolidatedReports from './ConsolidatedReports';
import EditFloorPlan from './EditFloorPlan';
import { initializeAuth } from './authService';
import authService from './authService';
import { getVessels, migrateTasksFromLocalStorage, migrateInvoicesFromLocalStorage } from './services/apiService';

// 🔥 Global auto-refresh interval (3 minutes)
const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 180000 ms

// 🔥 Production API URL (same as apiService.ts)
const API_BASE = 'https://yachtmanagementsuite.com/api';

// 🔒 SECURITY: Protected Admin Route - Block Owner access
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    const user = authService.getCurrentUser();

    // Check if user is Owner
    if (user && user.role === 'OWNER') {
      alert('Access Denied: Owners cannot access the admin area.');
      navigate('/owner-dashboard', { state: { ownerCode: user.code }, replace: true });
      return;
    }

    // Only allow ADMIN, TECHNICAL, BOOKING, ACCOUNTING roles
    const allowedRoles = ['ADMIN', 'TECHNICAL', 'BOOKING', 'ACCOUNTING'];
    if (user && !allowedRoles.includes(user.role)) {
      alert('Access Denied: You do not have permission to access this area.');
      navigate('/', { replace: true });
      return;
    }

    setChecked(true);
  }, [navigate]);

  if (!checked) return null;
  return <>{children}</>;
};

// Κεντρικό Context για συγχρονισμό δεδομένων
export const DataContext = React.createContext<any>(null);

// Navigation wrapper component
const NavigationWrapper: React.FC<{ pageNum: number; children: React.ReactNode }> = ({ 
  pageNum, 
  children 
}) => {
  const navigate = useNavigate();

  const handleNavigate = (direction: 'next' | 'prev') => {
    const routes = ['/', '/page1', '/page2', '/page3', '/page4', '/page5'];
    const currentIndex = routes.indexOf(window.location.pathname);
    
    console.log(`🚀 handleNavigate called: direction=${direction}, currentPath=${window.location.pathname}, currentIndex=${currentIndex}`);
    
    if (direction === 'next' && currentIndex < routes.length - 1) {
      const nextRoute = routes[currentIndex + 1];
      console.log(`➡️ Navigating to: ${nextRoute}`);
      navigate(nextRoute);
    } else if (direction === 'prev' && currentIndex > 0) {
      const prevRoute = routes[currentIndex - 1];
      console.log(`⬅️ Navigating to: ${prevRoute}`);
      navigate(prevRoute);
    }
  };

  return (
    <div>
      {React.cloneElement(children as React.ReactElement, { 
        onNavigate: handleNavigate,
        pageNum 
      })}
    </div>
  );
};

function App() {
  console.log('🚀 APP LOADED - App component rendering');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // 🔥 NEW: Global bookings state (shared across all pages)
  const [globalBookings, setGlobalBookings] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Shared data across all pages
  const [sharedData, setSharedData] = useState<any>({
    mode: 'in', // Default mode: 'in' or 'out'
    bookingNumber: '',
    vesselName: '',
    damages: [],
    photos: [],
    signatures: {},
    equipment: {},
    inventory: {}
  });

  // Track previous mode for change detection
  const [previousMode, setPreviousMode] = useState<string>('in');

  // 🔥 NEW: Fetch bookings from API
  const fetchGlobalBookings = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 [Global Auto-Refresh] Fetching bookings from API...');

      const response = await fetch(`${API_BASE}/bookings.php`);
      const data = await response.json();

      if (data.success && data.bookings) {
        const bookingsList = Array.isArray(data.bookings)
          ? data.bookings
          : Object.values(data.bookings);

        setGlobalBookings(bookingsList);
        setLastRefresh(new Date());

        // 🔥 Dispatch event so all components know data was refreshed
        window.dispatchEvent(new CustomEvent('globalBookingsRefreshed', {
          detail: { bookings: bookingsList, timestamp: Date.now() }
        }));

        console.log(`✅ [Global Auto-Refresh] Loaded ${bookingsList.length} bookings`);
      }
    } catch (error) {
      console.error('❌ [Global Auto-Refresh] Error fetching bookings:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 🔥 NEW: Set up auto-refresh interval (3 minutes)
  useEffect(() => {
    // Initial fetch
    fetchGlobalBookings();

    // Set up interval
    refreshIntervalRef.current = setInterval(() => {
      console.log('⏰ [Global Auto-Refresh] 3-minute interval triggered');
      fetchGlobalBookings();
    }, AUTO_REFRESH_INTERVAL);

    console.log('✅ [Global Auto-Refresh] Started - refreshing every 3 minutes');

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        console.log('🛑 [Global Auto-Refresh] Stopped');
      }
    };
  }, [fetchGlobalBookings]);

  // 🔥 NEW: Listen for manual refresh requests from any component
  useEffect(() => {
    const handleRefreshRequest = () => {
      console.log('📢 [Global Auto-Refresh] Manual refresh requested');
      fetchGlobalBookings();
    };

    window.addEventListener('requestGlobalRefresh', handleRefreshRequest);

    return () => {
      window.removeEventListener('requestGlobalRefresh', handleRefreshRequest);
    };
  }, [fetchGlobalBookings]);

  // 🆕 Initialize authentication system on mount
  useEffect(() => {
    initializeAuth();
    console.log('✅ Authentication system initialized');
  }, []);

  // 🔥 AUTO-MIGRATION: Upload localStorage data to API on app load
  useEffect(() => {
    const runMigration = async () => {
      try {
        console.log('🔄 [Auto-Migration] Starting automatic data migration...');

        // Fetch all vessels from API
        const vessels = await getVessels();

        if (!vessels || vessels.length === 0) {
          console.log('ℹ️ [Auto-Migration] No vessels found, skipping migration');
          return;
        }

        console.log(`📦 [Auto-Migration] Found ${vessels.length} vessels, checking for localStorage data...`);

        // Migrate data for each vessel
        for (const vessel of vessels) {
          const vesselId = vessel.id;
          const vesselName = vessel.name || String(vesselId);

          // Migrate tasks
          await migrateTasksFromLocalStorage(vesselId, vesselName);

          // Migrate invoices
          await migrateInvoicesFromLocalStorage(vesselId, vesselName);
        }

        console.log('✅ [Auto-Migration] Completed for all vessels');
      } catch (error) {
        console.error('❌ [Auto-Migration] Error during migration:', error);
      }
    };

    // Run migration after a short delay to not block initial render
    const timer = setTimeout(runMigration, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 🆕 Load current booking number on mount (UI state only)
  useEffect(() => {
    try {
      const currentBooking = localStorage.getItem('currentBooking');
      if (currentBooking) {
        console.log('🔄 App.tsx: Loading current booking:', currentBooking);
        setSharedData(prev => ({
          ...prev,
          bookingNumber: currentBooking
        }));
      }
    } catch (e) {
      console.error('Error loading booking:', e);
    }
  }, []);

  // 🔥 Mode change detection - dispatch event to notify pages
  useEffect(() => {
    if (previousMode !== sharedData.mode) {
      console.log(`🔄 Mode changed: ${previousMode} → ${sharedData.mode}`);
      setPreviousMode(sharedData.mode);

      // Dispatch event to notify all pages (pages will handle data from API)
      window.dispatchEvent(new CustomEvent('modeChanged', {
        detail: { mode: sharedData.mode }
      }));

      console.log('✅ Mode change handled!');
    }
  }, [sharedData.mode, previousMode]);

  // 🆕 Listen for custom mode change event (same tab)
  useEffect(() => {
    const handleModeChange = (e: CustomEvent) => {
      setSharedData(prev => ({ ...prev, mode: e.detail.mode }));
    };

    window.addEventListener('modeChanged', handleModeChange as EventListener);
    
    return () => {
      window.removeEventListener('modeChanged', handleModeChange as EventListener);
    };
  }, []);

  // 🔥 Listen for booking change event
  useEffect(() => {
    const handleBookingChange = (e: CustomEvent) => {
      const newBookingNumber = e.detail?.bookingNumber;
      console.log('📢 App.tsx received bookingChanged event:', newBookingNumber);

      if (newBookingNumber) {
        setSharedData(prev => ({
          ...prev,
          bookingNumber: newBookingNumber
        }));
        console.log('✅ App.tsx: Booking updated to:', newBookingNumber);
      }
    };

    window.addEventListener('bookingChanged', handleBookingChange as EventListener);

    return () => {
      window.removeEventListener('bookingChanged', handleBookingChange as EventListener);
    };
  }, []);

  // Update shared data
  const updateSharedData = (updates: any) => {
    console.log('📝 App.tsx: updateSharedData called with:', updates);

    const newData = { ...sharedData, ...updates };
    setSharedData(newData);

    // Track current booking number (UI state only)
    if (updates.bookingNumber && updates.bookingNumber !== sharedData.bookingNumber) {
      console.log('📢 App.tsx: Dispatching bookingChanged event for:', updates.bookingNumber);
      localStorage.setItem('currentBooking', updates.bookingNumber);
      window.dispatchEvent(new CustomEvent('bookingChanged', {
        detail: { bookingNumber: updates.bookingNumber }
      }));
    }

    // Dispatch mode change event (no localStorage for booking data)
    if (updates.mode) {
      window.dispatchEvent(new CustomEvent('modeChanged', {
        detail: { mode: updates.mode }
      }));
      console.log('✅ App.tsx: Mode changed to:', updates.mode);
    }
  };

  // Add damage
  const addDamage = (damage: any) => {
    setSharedData({
      ...sharedData,
      damages: [...(sharedData.damages || []), damage]
    });
  };

  // Add photo
  const addPhoto = (photo: any) => {
    setSharedData({
      ...sharedData,
      photos: [...(sharedData.photos || []), photo]
    });
  };

  // Save to database (placeholder)
  const saveToDatabase = async () => {
    console.log('Saving to database:', sharedData);
    alert('Αποθηκεύτηκε! (προσωρινά στην κονσόλα)');
  };

  // Finalize check-in
  const finalizeCheckIn = async () => {
    console.log('Finalizing check-in');
    alert('Check-in ολοκληρώθηκε!');
  };

  // Finalize check-out
  const finalizeCheckOut = async () => {
    console.log('Finalizing check-out');
    alert('Check-out ολοκληρώθηκε!');
  };

  // Context value
  const contextValue = {
    data: sharedData,
    mode: sharedData.mode,
    bookingNumber: sharedData.bookingNumber,
    updateData: updateSharedData,
    addDamage,
    addPhoto,
    saveToDatabase,
    finalizeCheckIn,
    finalizeCheckOut,
    // 🔥 NEW: Global bookings with auto-refresh
    globalBookings,
    isRefreshing,
    lastRefresh,
    refreshBookings: fetchGlobalBookings, // Manual refresh function
  };

  return (
    <DataContext.Provider value={contextValue}>
      <Router>
        {/* Sync status indicator - shows when refreshing data */}
        <SyncIndicator isRefreshing={isRefreshing} lastRefresh={lastRefresh} />
        <div style={{ minHeight: '100vh', background: '#eae8dc' }}>
          <Routes>
            {/* Home Page - Landing page με Welcome Section */}
            <Route path="/" element={<HomePage />} />
            
            {/* 🆕 Company News - Public access */}
            <Route path="/company-news" element={<CompanyNews />} />
            
            {/* 🆕 Charterer Dashboard - After login with charter code/date */}
            <Route path="/charterer-dashboard" element={<ChartererDashboard />} />
            
            {/* 🆕 Owner Dashboard - After login with owner code (shows list of boats) */}
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />

            {/* 🆕 Owner Profile - Owner profile settings */}
            <Route path="/owner-profile" element={<OwnerProfile />} />

            {/* 🆕 Fleet Management - For Admin/Employee and Owner (boat details) */}
            <Route path="/fleet-management" element={<FleetManagement />} />
            
            {/* 🆕 Administrator - Same as Fleet Management (legacy route) - PROTECTED */}
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <FleetManagement />
              </ProtectedAdminRoute>
            } />
            
            {/* 🆕 NEW: Admin Panel - Code Management (ADMIN2025 only) */}
            <Route path="/admin-panel" element={<AdminPanel />} />

            {/* 🆕 NEW: Technical Support Chat - Customer chat with technical manager */}
            <Route path="/technical-support" element={<TechnicalSupportChat />} />

            {/* 🆕 NEW: Technical Manager Dashboard - View all support chats */}
            <Route path="/technical-manager" element={<TechnicalManagerDashboard />} />

            {/* 🆕 NEW: Winterization Check-in */}
            <Route path="/winterization" element={<WinterizationCheckin />} />

            {/* 🆕 NEW: Winter Maintenance Inventory */}
            <Route path="/winter-inventory" element={<WinterMaintenanceInventory />} />

            {/* 🆕 NEW: Winter Take Over Tracking */}
            <Route path="/winter-takeover" element={<WinterTakeOver />} />

            {/* 🆕 NEW: Winter Safety Equipment with Expiry Tracking */}
            <Route path="/winter-safety" element={<WinterSafetyEquipment />} />

            {/* 🆕 NEW: Task Category Check-in Pages */}
            <Route path="/tasks/:category" element={<TaskCategoryCheckin />} />

            {/* 🆕 NEW: Add Boat - Full page vessel creator with floor plan */}
            <Route path="/add-boat" element={<AddBoat />} />

            {/* 🆕 NEW: Edit Floor Plan - Edit existing vessel floor plans */}
            <Route path="/edit-floorplan" element={<EditFloorPlan />} />

            {/* 🆕 NEW: Consolidated Reports - Financial summaries */}
            <Route path="/reports" element={<ConsolidatedReports />} />

            {/* Charter Agreement & Documents Page */}
            <Route path="/charter-agreement" element={<CharterAgreementPage />} />
            
            {/* Page 1 - Fleet Management & Booking Details */}
            <Route path="/page1" element={
              <NavigationWrapper pageNum={1}>
                <Page1 />
              </NavigationWrapper>
            } />
            
            {/* Page 2 - Acceptance/Delivery Statement */}
            <Route path="/page2" element={
              <NavigationWrapper pageNum={2}>
                <Page2 />
              </NavigationWrapper>
            } />
            
            {/* Page 3 - Safety/Cabin/Optional Equipment */}
            <Route path="/page3" element={
              <NavigationWrapper pageNum={3}>
                <Page3 />
              </NavigationWrapper>
            } />
            
            {/* Page 4 - Interactive Vessel Floorplans */}
            <Route path="/page4" element={
              <NavigationWrapper pageNum={4}>
                <Page4 />
              </NavigationWrapper>
            } />
            
            {/* Page 5 - Final Check-in/out */}
            <Route path="/page5" element={
              <NavigationWrapper pageNum={5}>
                <Page5 />
              </NavigationWrapper>
            } />
          </Routes>
        </div>
      </Router>
    </DataContext.Provider>
  );
}

export default App;
