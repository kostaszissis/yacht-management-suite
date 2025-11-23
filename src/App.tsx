import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Import των σελίδων σου
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
import AdminPanel from './AdminPanel'; // 🆕 NEW
import TechnicalSupportChat from './TechnicalSupportChat'; // 🆕 Technical Support Chat
import TechnicalManagerDashboard from './TechnicalManagerDashboard'; // 🆕 Technical Manager Dashboard

// 🆕 NEW: Import auth service
import { initializeAuth } from './authService';

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
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  
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

  // 🆕 Initialize authentication system on mount
  useEffect(() => {
    initializeAuth();
    console.log('✅ Authentication system initialized');
  }, []);

  // 🆕 Load mode από localStorage on mount
  useEffect(() => {
    try {
      const currentBooking = localStorage.getItem('currentBooking');
      if (currentBooking) {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        const savedMode = bookings[currentBooking]?.bookingData?.mode || 'in';
        const bookingNumber = currentBooking;
        
        console.log('🔄 App.tsx: Loading initial booking:', bookingNumber, 'mode:', savedMode);
        
        setSharedData(prev => ({ 
          ...prev, 
          mode: savedMode,
          bookingNumber: bookingNumber
        }));
        setPreviousMode(savedMode);
      }
    } catch (e) {
      console.error('Error loading mode:', e);
    }
  }, []);

  // 🔥 NEW: Detect mode change and initialize Check-out data from Check-in
  useEffect(() => {
    // Only run if mode actually changed
    if (previousMode !== sharedData.mode) {
      console.log(`🔄 Mode changed: ${previousMode} → ${sharedData.mode}`);
      
      // If switching to Check-out for the first time, copy Check-in data
      if (sharedData.mode === 'out') {
        initializeCheckOutFromCheckIn();
      }
      
      // Update previous mode
      setPreviousMode(sharedData.mode);
      
      // Dispatch event to notify all pages
      window.dispatchEvent(new CustomEvent('modeChanged', { 
        detail: { mode: sharedData.mode } 
      }));
      
      console.log('✅ Mode change handled!');
    }
  }, [sharedData.mode, previousMode]);

  // 🔥 NEW: Initialize Check-out data from Check-in (first time only)
  const initializeCheckOutFromCheckIn = () => {
    try {
      const currentBooking = localStorage.getItem('currentBooking');
      if (!currentBooking) return;
      
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (!bookings[currentBooking]) return;
      
      // 🔥 PAGE 2: Copy Check-in → Check-out (if not exists)
      if (!bookings[currentBooking].page2DataCheckOut) {
        const page2CheckIn = bookings[currentBooking].page2DataCheckIn || {};
        bookings[currentBooking].page2DataCheckOut = JSON.parse(JSON.stringify(page2CheckIn));
        
        // Reset 'out' field to null for user input
        ['items', 'hullItems', 'dinghyItems'].forEach(section => {
          if (bookings[currentBooking].page2DataCheckOut[section]) {
            bookings[currentBooking].page2DataCheckOut[section].forEach((item: any) => {
              item.out = null;
            });
          }
        });
        
        console.log('✅ Page 2 Check-out data initialized from Check-in');
      }
      
      // 🔥 PAGE 3: Copy Check-in → Check-out (if not exists)
      if (!bookings[currentBooking].page3DataCheckOut) {
        const page3CheckIn = bookings[currentBooking].page3DataCheckIn || {};
        bookings[currentBooking].page3DataCheckOut = JSON.parse(JSON.stringify(page3CheckIn));
        
        // Reset 'out' field to null for user input
        ['safetyItems', 'cabinItems', 'optionalItems'].forEach(section => {
          if (bookings[currentBooking].page3DataCheckOut[section]) {
            bookings[currentBooking].page3DataCheckOut[section].forEach((item: any) => {
              item.out = null;
            });
          }
        });
        
        console.log('✅ Page 3 Check-out data initialized from Check-in');
      }
      
      // 🔥 PAGE 4: Copy Check-in → Check-out (if not exists)
      if (!bookings[currentBooking].page4DataCheckOut) {
        const page4CheckIn = bookings[currentBooking].page4DataCheckIn || {};
        bookings[currentBooking].page4DataCheckOut = JSON.parse(JSON.stringify(page4CheckIn));
        
        // Reset 'out' field to null for user input
        const sections = ['items', 'navItems', 'safetyItems', 'genItems', 'deckItems', 'fdeckItems', 'dinghyItems', 'fendersItems', 'boathookItems'];
        sections.forEach(section => {
          if (bookings[currentBooking].page4DataCheckOut[section]) {
            bookings[currentBooking].page4DataCheckOut[section].forEach((item: any) => {
              item.out = null;
            });
          }
        });
        
        console.log('✅ Page 4 Check-out data initialized from Check-in');
      }
      
      // Save to localStorage
      localStorage.setItem('bookings', JSON.stringify(bookings));
      
      console.log('🎉 All Check-out data initialized successfully!');
    } catch (e) {
      console.error('❌ Error initializing Check-out data:', e);
    }
  };

  // 🆕 Listen for storage changes (when mode changes in Page 1)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bookings' && e.newValue) {
        try {
          const currentBooking = localStorage.getItem('currentBooking');
          if (currentBooking) {
            const bookings = JSON.parse(e.newValue);
            const savedMode = bookings[currentBooking]?.bookingData?.mode;
            if (savedMode) {
              setSharedData(prev => ({ ...prev, mode: savedMode }));
            }
          }
        } catch (err) {
          console.error('Error parsing bookings:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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

  // 🔥 FIXED: Listen for booking change event
  useEffect(() => {
    const handleBookingChange = (e: CustomEvent) => {
      try {
        const newBookingNumber = e.detail?.bookingNumber;
        console.log('📢 App.tsx received bookingChanged event:', newBookingNumber);
        
        if (newBookingNumber) {
          const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
          const savedMode = bookings[newBookingNumber]?.bookingData?.mode || 'in';
          
          setSharedData(prev => ({ 
            ...prev, 
            mode: savedMode,
            bookingNumber: newBookingNumber
          }));
          setPreviousMode(savedMode);
          
          console.log('✅ App.tsx: Booking updated to:', newBookingNumber, 'mode:', savedMode);
        }
      } catch (e) {
        console.error('Error loading booking:', e);
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
    
    // 🔥 FIXED: Dispatch bookingChanged event when bookingNumber changes
    if (updates.bookingNumber && updates.bookingNumber !== sharedData.bookingNumber) {
      console.log('📢 App.tsx: Dispatching bookingChanged event for:', updates.bookingNumber);
      
      // Update localStorage
      localStorage.setItem('currentBooking', updates.bookingNumber);
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('bookingChanged', { 
        detail: { bookingNumber: updates.bookingNumber } 
      }));
    }
    
    // 🆕 Αν αλλάζει το mode, αποθήκευσέ το στο localStorage
    if (updates.mode) {
      try {
        const currentBooking = updates.bookingNumber || sharedData.bookingNumber || localStorage.getItem('currentBooking');
        if (currentBooking) {
          const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
          if (bookings[currentBooking]) {
            bookings[currentBooking].bookingData = bookings[currentBooking].bookingData || {};
            bookings[currentBooking].bookingData.mode = updates.mode;
            localStorage.setItem('bookings', JSON.stringify(bookings));
            
            // Dispatch custom event for same-tab sync
            window.dispatchEvent(new CustomEvent('modeChanged', { 
              detail: { mode: updates.mode } 
            }));
            
            console.log('✅ App.tsx: Mode saved to localStorage:', updates.mode);
          }
        }
      } catch (e) {
        console.error('Error saving mode:', e);
      }
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
    finalizeCheckOut
  };

  return (
    <DataContext.Provider value={contextValue}>
      <Router>
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
            
            {/* 🆕 Fleet Management - For Admin/Employee and Owner (boat details) */}
            <Route path="/fleet-management" element={<FleetManagement />} />
            
            {/* 🆕 Administrator - Same as Fleet Management (legacy route) */}
            <Route path="/admin" element={<FleetManagement />} />
            
            {/* 🆕 NEW: Admin Panel - Code Management (ADMIN2025 only) */}
            <Route path="/admin-panel" element={<AdminPanel />} />

            {/* 🆕 NEW: Technical Support Chat - Customer chat with technical manager */}
            <Route path="/technical-support" element={<TechnicalSupportChat />} />

            {/* 🆕 NEW: Technical Manager Dashboard - View all support chats */}
            <Route path="/technical-manager" element={<TechnicalManagerDashboard />} />

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
