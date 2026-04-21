import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBoatsForOwner } from './ownerCodes';
import UserGuide from './UserGuide';
import InstallButton from './InstallButton';
// 🔥 FIX 16: Import API functions for multi-device sync
// 🔥 FIX 31: Added checkExpiredOptions for auto-expire
import { getBookingsByVessel, checkExpiredOptions } from './services/apiService';
// 🔥 Auto-refresh hook for polling API data
import { useAutoRefresh } from './hooks/useAutoRefresh';

// 🔥 FIX 5: Fleet data with numeric IDs matching API format
const INITIAL_FLEET = [
  { id: 8, name: "Bob", type: "Catamaran", model: "Lagoon 42" },
  { id: 7, name: "Perla", type: "Catamaran", model: "Lagoon 46" },
  { id: 6, name: "Infinity", type: "Catamaran", model: "Bali 4.2" },
  { id: 1, name: "Maria 1", type: "Monohull", model: "Jeanneau Sun Odyssey 449" },
  { id: 2, name: "Maria 2", type: "Monohull", model: "Jeanneau yacht 54" },
  { id: 4, name: "Bar Bar", type: "Monohull", model: "Beneteau Oceanis 46.1" },
  { id: 5, name: "Kalispera", type: "Monohull", model: "Bavaria c42 Cruiser" },
  { id: 3, name: "Valesia", type: "Monohull", model: "Bavaria c42 Cruiser" }
];

// 🔥 FIX 16 + FIX 29: Async function to get pending charters from API (no localStorage fallback)
// Now includes "Pending Final Confirmation" status for second owner approval
const getPendingChartersAsync = async (boatId: number | string): Promise<any[]> => {
  try {
    // Fetch from API only (API is source of truth)
    const charters = await getBookingsByVessel(boatId);
    console.log(`✅ OwnerDashboard: Loaded ${charters.length} charters for boat ${boatId}`);
    // Filter for statuses needing owner attention: Option, Pending, OR Pending Final Confirmation
    return charters.filter((c: any) =>
      c.status === 'Pending' ||
      c.status === 'Option' ||
      c.status === 'Pending Final Confirmation'
    );
  } catch (e) {
    console.error('❌ Error loading charters from API:', e);
    return []; // No localStorage fallback - API is source of truth
  }
};

// 🔥 FIX 5: Function to get invoices for a boat (supports numeric ID)
const getInvoices = (boatId: number | string) => {
  try {
    const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (e) {
    console.error('Error loading invoices:', e);
    return [];
  }
};

export default function OwnerDashboard() {
  const [language, setLanguage] = useState('en');
  const [ownerCode, setOwnerCode] = useState('');
  const [ownerBoats, setOwnerBoats] = useState<any[]>([]);
  const [showUserGuide, setShowUserGuide] = useState(false);
  // 🔥 FIX 5: Support numeric keys for boat data
  const [boatData, setBoatData] = useState<{[key: number | string]: {pendingCharters: any[], invoices: any[]}}>({});
  // 🔥 Auto-refresh: Track last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const navigate = useNavigate();
  const location = useLocation();

  // 🔥 Auto-refresh: Load boat data from API (memoized)
  const loadBoatData = useCallback(async () => {
    if (ownerBoats.length === 0) return;

    const data: {[key: string]: {pendingCharters: any[], invoices: any[]}} = {};

    // Load all boats in parallel for better performance
    await Promise.all(ownerBoats.map(async (boat) => {
      const pendingCharters = await getPendingChartersAsync(boat.id);
      const invoices = getInvoices(boat.id);
      data[boat.id] = { pendingCharters, invoices };
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

    setBoatData(data);
    setLastUpdated(new Date());
    console.log('✅ OwnerDashboard: All boat data loaded from API');
  }, [ownerBoats]);

  // 🔥 Auto-refresh: Poll data every 5 minutes
  const { isRefreshing } = useAutoRefresh(loadBoatData, 5);

  useEffect(() => {
    // Get owner code from navigation state
    const code = location.state?.ownerCode || (() => {
        try {
            const stored = sessionStorage.getItem('auth_current_user');
            if (stored) {
                const u = JSON.parse(stored);
                if (u.role === 'OWNER') return u.code;
            }
        } catch(e) {}
        return null;
    })();

    if (!code) {
      // If no code, redirect to home
      navigate('/');
      return;
    }

    setOwnerCode(code);

    // Get boats for this owner
    const boatIds = getBoatsForOwner(code);
    const boats = INITIAL_FLEET.filter(boat => boatIds.includes(boat.id));
    setOwnerBoats(boats);
  }, [location, navigate]);

  // Load boat data when ownerBoats changes
  useEffect(() => {
    loadBoatData();
  }, [loadBoatData]);

  // 🔥 FIX 5: Support numeric boat IDs
  const handleBoatClick = (boatId: number | string) => {
    // Navigate to boat details (FleetManagement with owner access)
    navigate('/fleet-management', {
      state: {
        userType: 'OWNER',
        boatId: boatId,
        ownerCode: ownerCode
      }
    });
  };

  const handleSummaryClick = () => {
    // 🔥 FIXED: Send boat IDs array for summary
    const boatIds = ownerBoats.map(boat => boat.id);
    
    navigate('/fleet-management', {
      state: {
        userType: 'OWNER',
        ownerCode: ownerCode,
        showSummary: true,
        boatIds: boatIds  // 🔥 ADDED: Array of boat IDs
      }
    });
  };

  if (!ownerCode || ownerBoats.length === 0) {
    return null;
  }

  // 🔥 NEW: Calculate total pending items
  const totalPendingCharters = Object.values(boatData).reduce((sum, data) => sum + data.pendingCharters.length, 0);
  const totalInvoices = Object.values(boatData).reduce((sum, data) => sum + data.invoices.length, 0);

  return (
    <div className="min-h-screen bg-[#f3f4f6]">

      {/* Header */}
      <header className="bg-[#1e40af] shadow-lg sticky top-0 z-50 border-b border-[#d1d5db]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Home button - styled with house icon */}
              <button
                onClick={() => navigate('/')}
                className="bg-[#1e40af] hover:bg-blue-700 border border-blue-400 rounded-lg px-3 py-2 transition-colors flex flex-col items-center min-w-[60px]"
                title={language === 'en' ? 'Home' : 'Αρχική'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="text-[10px] text-white mt-1 font-medium">
                  {language === 'en' ? 'Home' : 'Αρχική'}
                </span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {language === 'en' ? 'Owner Portal' : 'Πύλη Ιδιοκτήτη'}
                </h1>
                <p className="text-sm text-blue-200">
                  {language === 'en' ? 'Your Fleet' : 'Ο Στόλος σας'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                🔑 {ownerCode}
              </div>
              <InstallButton className="px-4 py-2 bg-[#059669] hover:bg-emerald-600 rounded-lg font-semibold text-white transition-colors" />
              <button
                onClick={() => setShowUserGuide(true)}
                className="px-4 py-2 bg-[#f97316] hover:bg-orange-600 rounded-lg font-semibold text-white transition-colors"
              >
                📖 {language === 'en' ? 'Guide' : 'Οδηγίες'}
              </button>
              <button
                onClick={() => navigate('/owner-profile', { state: { ownerCode } })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition-colors"
              >
                👤 {language === 'en' ? 'Profile' : 'Προφίλ'}
              </button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'gr' : 'en')}
                className="px-4 py-2 bg-[#6b7280] hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
              >
                {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
              </button>
              {/* Auto-refresh indicator */}
              <div className="flex items-center gap-2 text-xs text-blue-200">
                <span>{lastUpdated.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
                {isRefreshing && (
                  <span className="px-2 py-0.5 bg-blue-700 text-blue-100 rounded-full animate-pulse">
                    {language === 'en' ? 'Updating...' : 'Ανανέωση...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">⚓</div>
          <h2 className="text-3xl font-bold text-[#374151] mb-2">
            {language === 'en' ? 'Welcome to Your Fleet!' : 'Καλώς ήρθατε στον Στόλο σας!'}
          </h2>
          <p className="text-lg text-[#6b7280]">
            {language === 'en'
              ? `You have ${ownerBoats.length} vessel${ownerBoats.length > 1 ? 's' : ''} in your fleet`
              : `Έχετε ${ownerBoats.length} σκάφ${ownerBoats.length > 1 ? 'η' : 'ος'} στον στόλο σας`}
          </p>
        </div>

        {/* Notifications Summary */}
        {(totalPendingCharters > 0 || totalInvoices > 0) && (
          <div className="mb-6 bg-[#f97316] rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-center gap-6 text-white">
              {totalPendingCharters > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-bold">
                    {totalPendingCharters} {language === 'en' ? 'Pending Charter(s)' : 'Εκκρεμή Ναύλο(α)'}
                  </span>
                </div>
              )}
              {totalInvoices > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📄</span>
                  <span className="font-bold">
                    {totalInvoices} {language === 'en' ? 'Invoice(s)' : 'Τιμολόγιο(α)'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ΣΥΓΚΕΝΤΡΩΤΙΚΑ Button - Only show if more than 1 boat */}
        {ownerBoats.length > 1 && (
          <div className="mb-6">
            <button
              onClick={handleSummaryClick}
              className="w-full bg-[#1e40af] hover:bg-blue-800 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <span className="text-2xl">📊</span>
              <span className="text-lg">
                {language === 'en' ? 'FLEET SUMMARY' : 'ΣΥΓΚΕΝΤΡΩΤΙΚΑ ΣΤΟΙΧΕΙΑ'}
              </span>
            </button>
          </div>
        )}

        {/* Boats Grid - Elegant & Compact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownerBoats.map((boat) => {
            const data = boatData[boat.id] || { pendingCharters: [], invoices: [] };
            const hasPending = data.pendingCharters.length > 0;
            const hasInvoices = data.invoices.length > 0;

            return (
              <button
                key={boat.id}
                onClick={() => handleBoatClick(boat.id)}
                className={`bg-white hover:bg-gray-50 rounded-xl p-4 shadow-md transition-all duration-300 border ${hasPending ? 'border-[#f97316] animate-pulse' : 'border-[#d1d5db] hover:border-[#1e40af]'} hover:shadow-xl hover:-translate-y-2 hover:scale-105 text-left transform-gpu`}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                {/* Boat Emoji & Name */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">
                    {boat.type === 'Catamaran' ? '⛵' : '🛥️'}
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-[#1e40af]">
                      {boat.name || boat.id}
                    </h3>
                    <p className="text-xs text-[#6b7280]">{boat.id}</p>
                  </div>
                </div>

                {/* Boat Details */}
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-[#374151] font-medium">
                    {boat.model}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {boat.type}
                  </p>
                </div>

                {/* Pending Charters & Invoices */}
                {(hasPending || hasInvoices) && (
                  <div className="mb-3 p-2 bg-[#f9fafb] rounded-lg space-y-2 border border-[#d1d5db]">
                    {hasPending && (
                      <div className="flex items-center gap-2 text-[#f97316]">
                        <span>⚠️</span>
                        <span className="text-sm font-semibold">
                          {data.pendingCharters.length} {language === 'en' ? 'Pending Charter' : 'Εκκρεμής Ναύλος'}
                          {data.pendingCharters.length > 1 && 's'}
                        </span>
                      </div>
                    )}
                    {data.pendingCharters.slice(0, 2).map((charter: any) => (
                      <div key={charter.id} className="text-xs text-[#6b7280] pl-6">
                        📋 {charter.code} ({charter.startDate})
                      </div>
                    ))}
                    {data.pendingCharters.length > 2 && (
                      <div className="text-xs text-[#6b7280] pl-6">
                        +{data.pendingCharters.length - 2} {language === 'en' ? 'more' : 'ακόμα'}...
                      </div>
                    )}

                    {hasInvoices && (
                      <div className="flex items-center gap-2 text-[#1e40af]">
                        <span>📄</span>
                        <span className="text-sm font-semibold">
                          {data.invoices.length} {language === 'en' ? 'Invoice' : 'Τιμολόγιο'}
                          {data.invoices.length > 1 && (language === 'en' ? 's' : 'α')}
                        </span>
                      </div>
                    )}
                    {data.invoices.slice(0, 2).map((invoice: any) => (
                      <div key={invoice.id} className="text-xs text-[#6b7280] pl-6">
                        💰 {invoice.code} - {invoice.amount?.toFixed(2)}€
                      </div>
                    ))}
                    {data.invoices.length > 2 && (
                      <div className="text-xs text-[#6b7280] pl-6">
                        +{data.invoices.length - 2} {language === 'en' ? 'more' : 'ακόμα'}...
                      </div>
                    )}
                  </div>
                )}

                {/* View Details Button */}
                <div className="pt-3 border-t border-[#d1d5db]">
                  <div className="text-center text-[#1e40af] text-sm font-semibold">
                    {language === 'en' ? '👉 View Details' : '👉 Λεπτομέρειες'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-white border border-[#1e40af] rounded-xl p-6 shadow-md">
          <div className="text-center">
            <div className="text-3xl mb-3">ℹ️</div>
            <h3 className="text-xl font-bold text-[#1e40af] mb-2">
              {language === 'en' ? 'Owner Access' : 'Πρόσβαση Ιδιοκτήτη'}
            </h3>
            <p className="text-[#6b7280] text-sm">
              {language === 'en'
                ? 'Click on any vessel to view details, accept charters, and send messages'
                : 'Πατήστε σε οποιοδήποτε σκάφος για προβολή λεπτομερειών, αποδοχή ναύλων και αποστολή μηνυμάτων'}
            </p>
            {ownerBoats.length > 1 && (
              <p className="text-[#f97316] text-sm mt-2 font-medium">
                {language === 'en'
                  ? '📊 Use "Fleet Summary" to see all boats data in one place'
                  : '📊 Χρησιμοποιήστε "Συγκεντρωτικά" για όλα τα δεδομένα των σκαφών'}
              </p>
            )}
          </div>
        </div>

      </main>

      {/* User Guide Modal */}
      <UserGuide isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />

    </div>
  );
}
