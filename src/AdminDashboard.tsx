import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import ChatManagementModal from './ChatManagementModal';
import UserGuide from './UserGuide';
import InstallButton from './InstallButton';
import { textMatches } from './utils/searchUtils';
// 🔥 FIX 16: Import API functions for multi-device sync
// 🔥 FIX 31: Added checkExpiredOptions for auto-expire
import { getBookingsByVesselHybrid, checkExpiredOptions } from './services/apiService';
// 🔥 Auto-refresh hook for polling API data
import { useAutoRefresh } from './hooks/useAutoRefresh';

// Import icons from FleetManagement or create here
const icons = {
  home: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>),
  logout: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>),
  bookingSheet: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>),
  shield: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>),
  plus: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>),
  x: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>),
  fileText: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>),
  chevronLeft: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>),
  eye: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>)
};

const COMPANY_INFO = {
  name: "TAILWIND YACHTING",
  emails: {
    info: "info@tailwindyachting.com"
  }
};

// Header Component
function Header({ title, onBack, onLogout }) {
  const user = authService.getCurrentUser();

  return (
    <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between border-b border-gray-700">
      {onBack && <button onClick={onBack} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg transition-colors">{icons.chevronLeft}</button>}
      {!onBack && <div className="w-10"></div>}

      <div className="flex-grow text-center">
        <h1 className="text-xl font-bold text-gray-100 truncate px-2">{title}</h1>
        {user && (
          <div className="flex items-center justify-center gap-2 mt-1">
            {user.role === 'OWNER' ? icons.eye : icons.shield}
            <span className="text-xs text-teal-400 font-semibold">
              {user.role === 'OWNER' ? `${user.name} (View Only)` : user.name}
            </span>
          </div>
        )}
      </div>

      {onLogout && (
        <button
          onClick={onLogout}
          className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Logout"
        >
          {icons.logout}
        </button>
      )}
      {!onLogout && <div className="w-10"></div>}
    </div>
  );
}

// AdminDashboard Component - FULLSCREEN με ανοιχτά χρώματα
export default function AdminDashboard({
  boats,
  onSelectBoat,
  onLogout,
  navigate,
  loadBoats,
  showAddBoat,
  setShowAddBoat,
  showEmployeeManagement,
  setShowEmployeeManagement,
  showDataManagement,
  setShowDataManagement,
  showActivityLog,
  setShowActivityLog,
  showFinancials,
  setShowFinancials
}) {
  const [financialsData, setFinancialsData] = useState({
    boats: [],
    totals: { income: 0, expenses: 0, net: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showChatManagement, setShowChatManagement] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  // 🔥 Auto-refresh: Track last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  // 📝 Track Page 1 bookings per boat for highlighting
  const [page1BookingsByBoat, setPage1BookingsByBoat] = useState<{[boatId: string]: {count: number, firstBooking: any}}>({});
  // 🔧 Expandable tasks menu state
  const [tasksMenuExpanded, setTasksMenuExpanded] = useState(false);

  // Task categories for navigation (all same light blue color)
  const taskCategories = [
    { key: 'engine', icon: '⚙️', name: 'ΜΗΧΑΝΗ' },
    { key: 'generator', icon: '⚡', name: 'ΓΕΝΝΗΤΡΙΑ' },
    { key: 'shaft', icon: '🔧', name: 'ΑΞΟΝΑΣ' },
    { key: 'valves', icon: '🚿', name: 'ΒΑΝΕΣ ΘΑΛΑΣΣΗΣ' },
    { key: 'electrical', icon: '💡', name: 'ΗΛΕΚΤΡΟΛΟΓΙΚΑ' },
    { key: 'desalination', icon: '💧', name: 'ΑΦΑΛΑΤΩΣΗ' },
    { key: 'documents', icon: '📄', name: 'ΕΓΓΡΑΦΑ' }
  ];
  const user = authService.getCurrentUser();
  const reactNavigate = useNavigate();

  // 🔥 DEBUG: Show all fleet localStorage data on mount
  useEffect(() => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           🔍 FLEET LOCALSTORAGE DEBUG                          ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    const keys = Object.keys(localStorage).filter(k => k.includes('fleet_') && k.includes('ΝΑΥΛΑ'));
    console.log('📦 Found', keys.length, 'fleet keys:', keys);
    console.log('');
    keys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔑 KEY:', key);
        console.log('   Charters count:', data.length);
        data.forEach((c: any) => {
          console.log('   📋 Charter:', c.code);
          console.log('      vesselName:', c.vesselName);
          console.log('      vesselId:', c.vesselId, '(type:', typeof c.vesselId + ')');
          console.log('      boatName:', c.boatName);
          console.log('      source:', c.source);
          console.log('      status:', c.status);
        });
      } catch (e) {
        console.log('❌ Error parsing key:', key, e);
      }
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚢 Available boats:', boats.map(b => ({ id: b.id, name: b.name })));
    console.log('╚════════════════════════════════════════════════════════════════╝');
  }, [boats]);

  // Filter boats based on search (case-insensitive)
  const filteredBoats = boats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const boatText = `${boat.id} ${boat.name} ${boat.type} ${boat.model || ''}`;
    return textMatches(boatText, searchTerm);
  });

  // 🔥 FIX 16 + Auto-refresh: Load financials from API (memoized)
  const loadFinancialsData = useCallback(async () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const boatsData: any[] = [];

    // Load all boats in parallel for better performance
    await Promise.all(boats.map(async (boat: any) => {
      // Load charters from API (with localStorage merge and fallback)
      let charters: any[] = [];
      try {
        charters = await getBookingsByVesselHybrid(boat.id);
      } catch (e) {
        const chartersKey = `fleet_${boat.id}_ΝΑΥΛΑ`;
        const chartersStored = localStorage.getItem(chartersKey);
        charters = chartersStored ? JSON.parse(chartersStored) : [];
      }

      // Load invoices (localStorage only for now)
      const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

      const boatIncome = charters.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const charterExpenses = charters.reduce((sum: number, c: any) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
      const invoiceExpenses = invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const boatExpenses = charterExpenses + invoiceExpenses;
      const boatNet = boatIncome - boatExpenses;

      totalIncome += boatIncome;
      totalExpenses += boatExpenses;

      boatsData.push({
        id: boat.id,
        name: boat.name,
        income: boatIncome,
        expenses: boatExpenses,
        net: boatNet,
        chartersCount: charters.length,
        invoicesCount: invoices.length
      });
    }));

    // 🔥 FIX 31: Check for expired options (6 days old)
    try {
      const expiredCharters = await checkExpiredOptions();
      if (expiredCharters.length > 0) {
        console.log(`✅ Auto-expired ${expiredCharters.length} options:`, expiredCharters);
      }
    } catch (e) {
      console.log('⚠️ Could not check expired options:', e);
    }

    setFinancialsData({
      boats: boatsData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses
      }
    });
    setLastUpdated(new Date());
    console.log('✅ AdminDashboard: Financials loaded from API');
  }, [boats]);

  // 🔥 Auto-refresh: Poll data every 5 minutes
  const { isRefreshing } = useAutoRefresh(loadFinancialsData, 5);

  // Load financials data on mount and when boats change
  useEffect(() => {
    loadFinancialsData();
  }, [loadFinancialsData]);

  // 📝 Scan localStorage for Page 1 bookings per boat
  useEffect(() => {
    const scanPage1Bookings = () => {
      const bookingsByBoat: {[boatId: string]: {count: number, firstBooking: any}} = {};

      // 🔍 DEBUG: Log ALL localStorage keys to find the mismatch
      console.log('📂 ALL localStorage keys:', Object.keys(localStorage));
      console.log('📂 Keys with "fleet":', Object.keys(localStorage).filter(k => k.toLowerCase().includes('fleet')));
      console.log('📂 Keys with "ΝΑΥΛΑ":', Object.keys(localStorage).filter(k => k.includes('ΝΑΥΛΑ')));
      console.log('📂 Keys with "bookings":', Object.keys(localStorage).filter(k => k.toLowerCase().includes('booking')));

      console.log('🔍 AdminDashboard: Scanning for Page 1 bookings...');
      console.log('📦 Available boats:', boats.map(b => ({ id: b.id, name: b.name })));

      boats.forEach((boat: any) => {
        // 🔥 FIX: Check ALL possible key variations (case sensitivity)
        const keysToCheck = [
          `fleet_${boat.id}_ΝΑΥΛΑ`,                           // By ID (e.g., fleet_7_ΝΑΥΛΑ)
          `fleet_${boat.name}_ΝΑΥΛΑ`,                         // By name exact (e.g., fleet_Perla_ΝΑΥΛΑ)
          `fleet_${boat.name?.toUpperCase()}_ΝΑΥΛΑ`,          // By name UPPER (e.g., fleet_PERLA_ΝΑΥΛΑ)
          `fleet_${boat.name?.toLowerCase()}_ΝΑΥΛΑ`,          // By name lower (e.g., fleet_perla_ΝΑΥΛΑ)
        ];

        // 🔥 FIX: Also scan ALL localStorage keys for any that match this boat
        // This handles cases where vesselId was stored differently
        const allStorageKeys = Object.keys(localStorage);
        const fleetKeys = allStorageKeys.filter(k => k.startsWith('fleet_') && k.endsWith('_ΝΑΥΛΑ'));

        // Add any fleet keys that might match this boat (case-insensitive comparison)
        fleetKeys.forEach(key => {
          // Extract vessel identifier from key (fleet_{vesselId}_ΝΑΥΛΑ)
          const match = key.match(/^fleet_(.+)_ΝΑΥΛΑ$/);
          if (match) {
            const keyVesselId = match[1];
            // Check if this key's vesselId matches boat name (case-insensitive)
            if (keyVesselId.toLowerCase() === boat.name?.toLowerCase() ||
                keyVesselId.toLowerCase() === boat.id?.toString().toLowerCase()) {
              if (!keysToCheck.includes(key)) {
                keysToCheck.push(key);
                console.log(`   🔍 Added matching key from scan: ${key}`);
              }
            }

            // 🔥 FIX: Also check if any charter inside this key has vesselName matching this boat
            if (!keysToCheck.includes(key)) {
              try {
                const stored = localStorage.getItem(key);
                if (stored) {
                  const charters = JSON.parse(stored);
                  const hasMatchingCharter = charters.some((c: any) =>
                    c.vesselName?.toLowerCase() === boat.name?.toLowerCase() ||
                    c.boatName?.toLowerCase() === boat.name?.toLowerCase()
                  );
                  if (hasMatchingCharter) {
                    keysToCheck.push(key);
                    console.log(`   🔍 Added key with matching vesselName: ${key}`);
                  }
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        });

        // Combine charters from ALL keys
        let allCharters: any[] = [];

        keysToCheck.forEach(key => {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const charters = JSON.parse(stored);
              // Add only if not already in the list (avoid duplicates)
              charters.forEach((c: any) => {
                if (!allCharters.find(existing => existing.code === c.code || existing.id === c.id)) {
                  allCharters.push(c);
                }
              });
              console.log(`   ✅ Found ${charters.length} charters in ${key}`);
            } catch (e) {
              console.error(`❌ Error parsing ${key}:`, e);
            }
          }
        });

        // 🔍 SPECIAL DEBUG FOR PERLA - show ALL data
        if (boat.name?.toLowerCase() === 'perla') {
          console.log('🔍 PERLA SPECIAL DEBUG:', {
            boatId: boat.id,
            boatName: boat.name,
            keysChecked: keysToCheck,
            allChartersFound: allCharters,
            chartersWithSource: allCharters.map(c => ({ code: c.code, source: c.source, status: c.status, amount: c.amount })),
            allFleetKeys: Object.keys(localStorage).filter(k => k.includes('fleet') && k.includes('ΝΑΥΛΑ'))
          });
        }

        console.log(`📂 ${boat.name}: Found ${allCharters.length} total charters`);

        if (allCharters.length > 0) {
          // Find Page 1 bookings that need financial details
          // Check: source='page1' OR status='Draft' (more lenient)
          // AND: amount is missing or 0
          const page1Bookings = allCharters.filter((c: any) => {
            const isFromPage1 = c.source === 'page1';
            const isDraft = c.status === 'Draft';
            const needsAmount = !c.amount || c.amount === 0;

            // 🔍 Debug each charter
            if (boat.name?.toLowerCase() === 'perla') {
              console.log(`   🔍 Charter ${c.code}:`, { isFromPage1, isDraft, needsAmount, source: c.source, status: c.status, amount: c.amount });
            }

            // Include if: (from Page 1 OR Draft) AND needs amount
            return (isFromPage1 || isDraft) && needsAmount;
          });

          console.log(`📝 ${boat.name}: Found ${page1Bookings.length} Page 1 bookings needing attention from ${allCharters.length} total`);

          if (page1Bookings.length > 0) {
            bookingsByBoat[boat.id] = {
              count: page1Bookings.length,
              firstBooking: page1Bookings[0]
            };
          }
        }
      });

      console.log('✅ Page 1 bookings summary:', bookingsByBoat);
      console.log('✅ Boats with Page 1 bookings:', Object.keys(bookingsByBoat));
      setPage1BookingsByBoat(bookingsByBoat);
    };

    scanPage1Bookings();

    // Re-scan when storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.includes('fleet_') && e.key?.includes('_ΝΑΥΛΑ')) {
        console.log('🔄 Storage changed, re-scanning Page 1 bookings');
        scanPage1Bookings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [boats]);

  const handleBackNavigation = () => {
    const isEmployee = authService.isTechnical() || authService.isBooking() || authService.isAccounting();

    if (isEmployee) {
      reactNavigate('/owner-dashboard');
    } else if (authService.isAdmin()) {
      window.location.href = '/';
    } else {
      reactNavigate('/');
    }
  };

  if (!authService.isLoggedIn()) {
    return (
      <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 fixed inset-0 z-50">
        <Header title="Access Denied" onLogout={onLogout} />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-8xl mb-6">🔒</div>
            <h2 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-slate-600 mb-6">You don't have permission to access Admin Dashboard.</p>
            <p className="text-sm text-slate-500">Contact: {COMPANY_INFO.emails.info}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 fixed inset-0 z-50 overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob pointer-events-none"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full">
        <Header
          title="Πίνακας Διαχειριστή"
          onBack={handleBackNavigation}
          onLogout={onLogout}
        />

        {/* User Info Bar */}
        <div className="p-3 bg-white/90 backdrop-blur-xl border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <div className="text-base font-bold text-slate-800">{user?.name || user?.code}</div>
                <div className="text-xs text-blue-600">{user?.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <InstallButton className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white rounded-lg text-sm font-semibold transition-colors" />
              <button
                onClick={() => setShowUserGuide(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                📖 Οδηγίες
              </button>
              <div className="text-green-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold">Online</span>
              </div>
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{lastUpdated.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                {isRefreshing && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full animate-pulse text-xs">
                    Ανανέωση...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financials Button */}
        {authService.canViewFinancials() && (
          <div className="border-b border-blue-100">
            <button
              onClick={() => setShowFinancials(true)}
              className="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 backdrop-blur-xl flex items-center justify-between border-b border-blue-100 transition-all"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <span className="font-bold text-slate-800">Συγκεντρωτικά Οικονομικά</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-600 font-bold">{financialsData.totals.net.toFixed(0)}€</span>
                <span className="text-slate-600">→</span>
              </div>
            </button>
          </div>
        )}

        {/* Main Content - 3 columns */}
        <div className="flex-grow flex overflow-hidden">
          {/* Left Buttons - BIGGER */}
          <div className="w-40 sm:w-48 bg-white/80 backdrop-blur-xl border-r border-blue-200 flex flex-col items-center py-4 gap-4 px-3 overflow-y-auto">
            <button
              onClick={() => {
                authService.logActivity('view_fleet_booking_plan');
                navigate('fleetBookingPlan');
              }}
              className="w-full h-16 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Booking Plan"
            >
              {icons.bookingSheet}
              <span className="text-base font-bold">Plan</span>
            </button>

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowEmployeeManagement(true)}
                className="w-full h-16 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαχείριση Υπαλλήλων"
              >
                {icons.shield}
                <span className="text-base font-bold">Users</span>
              </button>
            )}

            {authService.canManageFleet() && (
              <button
                onClick={() => setShowAddBoat(true)}
                className="w-full h-16 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Προσθήκη Σκάφους"
              >
                {icons.plus}
                <span className="text-base font-bold">+Boat</span>
              </button>
            )}

            {/* 🔧 Expandable Tasks Menu */}
            {authService.canManageTasks() && (
              <div className="w-full">
                {/* Main Toggle Button */}
                <button
                  onClick={() => setTasksMenuExpanded(!tasksMenuExpanded)}
                  className="w-full h-16 bg-gradient-to-r from-sky-400 to-cyan-400 hover:from-sky-500 hover:to-cyan-500 rounded-xl flex items-center justify-center gap-2 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  title="Εργασίες Σκαφών"
                >
                  <span className="text-xl">🔧</span>
                  <span className="text-base font-bold">ΕΡΓΑΣΙΕΣ</span>
                  <span className={`text-sm transition-transform duration-300 ${tasksMenuExpanded ? 'rotate-180' : ''}`}>▼</span>
                </button>

                {/* Expandable Menu Items with Scroll */}
                <div className={`transition-all duration-300 ease-in-out ${tasksMenuExpanded ? 'max-h-[60vh] opacity-100 mt-2 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                  <div className="space-y-2 pl-2 border-l-2 border-sky-300 pr-1 pb-2">
                    {/* Winter Check-in */}
                    <button
                      onClick={() => reactNavigate('/winterization')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">❄️</span>
                      <span className="text-xs font-semibold">Winter Check-in</span>
                    </button>
                    {/* Inventory */}
                    <button
                      onClick={() => reactNavigate('/winter-inventory')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">📦</span>
                      <span className="text-xs font-semibold">Χειμερινές Εργασίες</span>
                    </button>
                    {/* TakeOver */}
                    <button
                      onClick={() => reactNavigate('/winter-takeover')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">📋</span>
                      <span className="text-xs font-semibold">Take Over</span>
                    </button>
                    {/* Safety */}
                    <button
                      onClick={() => reactNavigate('/winter-safety')}
                      className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                      style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                    >
                      <span className="text-lg">🩹</span>
                      <span className="text-xs font-semibold">Safety Equipment</span>
                    </button>
                    {/* Divider */}
                    <div className="border-t border-sky-200 my-2"></div>

                    {/* Task Categories - Navigate to Pages (all same light blue) */}
                    {taskCategories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => reactNavigate(`/tasks/${category.key}`)}
                        className="w-full h-10 rounded-lg flex items-center gap-2 px-3 text-slate-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md text-left"
                        style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}
                      >
                        <span className="text-lg">{category.icon}</span>
                        <span className="text-xs font-semibold">{category.name}</span>
                        <span className="ml-auto text-xs text-slate-500">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center - Boats List (more compact) */}
          <div className="flex-grow overflow-y-auto p-3 flex flex-col max-w-4xl mx-auto">
            {/* Search Box */}
            <div className="mb-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Αναζήτηση (όνομα, τύπος, μοντέλο...)"
                  className="w-full px-4 py-2 bg-white/90 backdrop-blur-xl text-slate-800 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm placeholder-slate-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <h2 className="text-lg font-semibold mb-3 text-blue-700 text-center">
              Σκάφη ({filteredBoats.length}{searchTerm ? ` / ${boats.length}` : ''})
            </h2>

            {/* Responsive Grid for Boats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 flex-grow overflow-y-auto">
              {filteredBoats.length > 0 ? filteredBoats.map(boat => {
                const hasPage1Bookings = page1BookingsByBoat[boat.id];
                const page1Count = hasPage1Bookings?.count || 0;

                // 🔍 DEBUG: Log card rendering for Perla
                if (boat.name === 'Perla' || boat.name === 'PERLA') {
                  console.log('🎨 RENDERING PERLA CARD:', {
                    boatId: boat.id,
                    boatName: boat.name,
                    page1BookingsByBoat,
                    hasPage1Bookings,
                    page1Count,
                    shouldHighlight: !!hasPage1Bookings
                  });
                }

                return (
                  <button
                    key={boat.id}
                    onClick={() => onSelectBoat(boat)}
                    className={`text-left backdrop-blur-xl p-4 rounded-2xl transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 h-fit transform-gpu ${
                      hasPage1Bookings
                        ? 'bg-blue-50 border-2 border-blue-500 hover:bg-blue-100'
                        : 'bg-white/90 border border-blue-200 hover:bg-white hover:border-blue-400'
                    }`}
                    style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    {/* Page 1 Badge */}
                    {hasPage1Bookings && (
                      <div className="mb-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1">
                        📝 {page1Count === 1 ? 'Νέο ναύλο από Check-in' : `${page1Count} νέα ναύλα από Check-in`}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-blue-600">{boat.name || boat.id}</h3>
                        <p className="text-xs text-slate-600 font-semibold">{boat.id}</p>
                        <p className="text-xs text-slate-500">{boat.type} {boat.model && `• ${boat.model}`}</p>
                      </div>
                      <div className="text-blue-500 text-xl">→</div>
                    </div>
                  </button>
                );
              }) : (
                <div className="col-span-full bg-white/90 backdrop-blur-xl p-4 rounded-2xl text-center border border-blue-200">
                  <p className="text-slate-600 text-sm">
                    {searchTerm ? `Δεν βρέθηκαν σκάφη για "${searchTerm}"` : 'Δεν βρέθηκαν σκάφη.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Buttons - BIGGER */}
          <div className="w-40 sm:w-48 bg-white/80 backdrop-blur-xl border-l border-blue-200 flex flex-col items-center py-4 gap-4 px-3">
            <button
              onClick={() => setShowChatManagement(true)}
              className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Chat Management"
            >
              <span className="text-xl">💬</span>
              <span className="text-base font-bold">Chats</span>
            </button>

            {authService.canClearData() && (
              <button
                onClick={() => setShowDataManagement(true)}
                className="w-full h-16 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαγραφή Δεδομένων"
              >
                {icons.x}
                <span className="text-base font-bold">Delete</span>
              </button>
            )}

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowActivityLog(true)}
                className="w-full h-16 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Activity Log"
              >
                {icons.fileText}
                <span className="text-base font-bold">Log</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Chat Management Modal */}
      {showChatManagement && (
        <ChatManagementModal onClose={() => setShowChatManagement(false)} />
      )}

      {/* User Guide Modal */}
      <UserGuide isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />
    </div>
  );
}
