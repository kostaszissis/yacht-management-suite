import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getBoatsForOwner } from './ownerCodes';
import { getVessels } from './services/apiService';

// 🔥 NEW: Function to get pending charters for a boat
const getPendingCharters = (boatId: string) => {
  try {
    const key = `fleet_${boatId}_ΝΑΥΛΑ`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const charters = JSON.parse(stored);
      // 🔥 FIX: Check for Option OR Pending status
      return charters.filter((c: any) => c.status === 'Pending' || c.status === 'Option');
    }
    return [];
  } catch (e) {
    console.error('Error loading charters:', e);
    return [];
  }
};

// 🔥 NEW: Function to get invoices for a boat
const getInvoices = (boatId: string) => {
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
  const [boatData, setBoatData] = useState<{[key: string]: {pendingCharters: any[], invoices: any[]}}>({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get owner code from navigation state
    const code = location.state?.ownerCode;

    if (!code) {
      // If no code, redirect to home
      navigate('/');
      return;
    }

    setOwnerCode(code);

    // Get boats for this owner from API
    const loadBoats = async () => {
      try {
        const vessels = await getVessels();
        const boatIds = getBoatsForOwner(code);
        const boats = vessels.filter(boat => boatIds.includes(boat.id));
        setOwnerBoats(boats);

        // 🔥 NEW: Load pending charters and invoices for each boat
        const data: {[key: string]: {pendingCharters: any[], invoices: any[]}} = {};
        boats.forEach(boat => {
          data[boat.id] = {
            pendingCharters: getPendingCharters(boat.id),
            invoices: getInvoices(boat.id)
          };
        });
        setBoatData(data);
      } catch (error) {
        console.error('Error loading vessels:', error);
      }
    };

    loadBoats();

  }, [location, navigate]);

  const handleBoatClick = (boatId: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      
      {/* Header */}
      <header className="bg-slate-800 shadow-lg sticky top-0 z-50 border-b-2 border-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/')}
                className="text-3xl hover:scale-110 transition-transform"
              >
                🏠
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {language === 'en' ? 'Owner Portal' : 'Πύλη Ιδιοκτήτη'}
                </h1>
                <p className="text-sm text-teal-300">
                  {language === 'en' ? 'Your Fleet' : 'Ο Στόλος σας'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-teal-500 text-white rounded-lg font-semibold">
                🔑 {ownerCode}
              </div>
              <button
                onClick={() => setLanguage(language === 'en' ? 'gr' : 'en')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
              >
                {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <div className="text-6xl mb-4">⚓</div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {language === 'en' ? 'Welcome to Your Fleet!' : 'Καλώς ήρθατε στον Στόλο σας!'}
          </h2>
          <p className="text-lg text-teal-300">
            {language === 'en' 
              ? `You have ${ownerBoats.length} vessel${ownerBoats.length > 1 ? 's' : ''} in your fleet` 
              : `Έχετε ${ownerBoats.length} σκάφ${ownerBoats.length > 1 ? 'η' : 'ος'} στον στόλο σας`}
          </p>
        </div>

        {/* 🔥 NEW: Notifications Summary */}
        {(totalPendingCharters > 0 || totalInvoices > 0) && (
          <div className="mb-6 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-4 shadow-lg">
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
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-3"
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
                className={`bg-slate-800 hover:bg-slate-700 rounded-xl p-4 shadow-lg transition-all duration-300 border-2 ${hasPending ? 'border-orange-500 animate-pulse' : 'border-teal-500/30 hover:border-teal-500'} hover:shadow-2xl hover:-translate-y-2 hover:scale-105 text-left transform-gpu`}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                {/* Boat Emoji & ID */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-3xl">
                    {boat.type === 'Catamaran' ? '⛵' : '🛥️'}
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-white">
                      {boat.id}
                    </h3>
                  </div>
                </div>
                
                {/* Boat Details */}
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-teal-300 font-medium">
                    {boat.model}
                  </p>
                  <p className="text-xs text-gray-400">
                    {boat.type}
                  </p>
                </div>
                
                {/* 🔥 NEW: Pending Charters & Invoices */}
                {(hasPending || hasInvoices) && (
                  <div className="mb-3 p-2 bg-slate-900 rounded-lg space-y-2">
                    {hasPending && (
                      <div className="flex items-center gap-2 text-orange-400">
                        <span>⚠️</span>
                        <span className="text-sm font-semibold">
                          {data.pendingCharters.length} {language === 'en' ? 'Pending Charter' : 'Εκκρεμής Ναύλος'}
                          {data.pendingCharters.length > 1 && 's'}
                        </span>
                      </div>
                    )}
                    {data.pendingCharters.slice(0, 2).map((charter: any) => (
                      <div key={charter.id} className="text-xs text-orange-300 pl-6">
                        📋 {charter.code} ({charter.startDate})
                      </div>
                    ))}
                    {data.pendingCharters.length > 2 && (
                      <div className="text-xs text-orange-300 pl-6">
                        +{data.pendingCharters.length - 2} {language === 'en' ? 'more' : 'ακόμα'}...
                      </div>
                    )}
                    
                    {hasInvoices && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <span>📄</span>
                        <span className="text-sm font-semibold">
                          {data.invoices.length} {language === 'en' ? 'Invoice' : 'Τιμολόγιο'}
                          {data.invoices.length > 1 && (language === 'en' ? 's' : 'α')}
                        </span>
                      </div>
                    )}
                    {data.invoices.slice(0, 2).map((invoice: any) => (
                      <div key={invoice.id} className="text-xs text-blue-300 pl-6">
                        💰 {invoice.code} - {invoice.amount?.toFixed(2)}€
                      </div>
                    ))}
                    {data.invoices.length > 2 && (
                      <div className="text-xs text-blue-300 pl-6">
                        +{data.invoices.length - 2} {language === 'en' ? 'more' : 'ακόμα'}...
                      </div>
                    )}
                  </div>
                )}
                
                {/* View Details Button */}
                <div className="pt-3 border-t border-teal-500/30">
                  <div className="text-center text-teal-400 text-sm font-semibold">
                    {language === 'en' ? '👉 View Details' : '👉 Λεπτομέρειες'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-slate-800 border-2 border-teal-500 rounded-xl p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">ℹ️</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {language === 'en' ? 'Owner Access' : 'Πρόσβαση Ιδιοκτήτη'}
            </h3>
            <p className="text-teal-300 text-sm">
              {language === 'en' 
                ? 'Click on any vessel to view details, accept charters, and send messages' 
                : 'Πατήστε σε οποιοδήποτε σκάφος για προβολή λεπτομερειών, αποδοχή ναύλων και αποστολή μηνυμάτων'}
            </p>
            {ownerBoats.length > 1 && (
              <p className="text-yellow-300 text-sm mt-2">
                {language === 'en'
                  ? '📊 Use "Fleet Summary" to see all boats data in one place'
                  : '📊 Χρησιμοποιήστε "Συγκεντρωτικά" για όλα τα δεδομένα των σκαφών'}
              </p>
            )}
          </div>
        </div>

      </main>

    </div>
  );
}
