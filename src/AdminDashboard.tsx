import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from './authService';
import ChatManagementModal from './ChatManagementModal';
import UserGuide from './UserGuide';

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
  const user = authService.getCurrentUser();
  const reactNavigate = useNavigate();

  // Filter boats based on search
  const filteredBoats = boats.filter(boat => {
    if (!searchTerm.trim()) return true;

    const search = searchTerm.toLowerCase().trim();
    const searchTerms = search.split(' ').filter(t => t.length > 0);

    const boatText = `${boat.id} ${boat.name} ${boat.type} ${boat.model || ''}`.toLowerCase();

    return searchTerms.every(term => boatText.includes(term));
  });

  // Load financials data
  useEffect(() => {
    loadFinancialsData();
  }, [boats]);

  const loadFinancialsData = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const boatsData = [];

    boats.forEach(boat => {
      const chartersKey = `fleet_${boat.id}_ΝΑΥΛΑ`;
      const chartersStored = localStorage.getItem(chartersKey);
      const charters = chartersStored ? JSON.parse(chartersStored) : [];

      const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

      const boatIncome = charters.reduce((sum, c) => sum + (c.amount || 0), 0);
      const charterExpenses = charters.reduce((sum, c) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
      const invoiceExpenses = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
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
    });

    setFinancialsData({
      boats: boatsData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses
      }
    });
  };

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
          {/* Left Buttons */}
          <div className="w-28 sm:w-32 bg-white/80 backdrop-blur-xl border-r border-blue-200 flex flex-col items-center py-3 gap-3 px-2">
            <button
              onClick={() => {
                authService.logActivity('view_fleet_booking_plan');
                navigate('fleetBookingPlan');
              }}
              className="w-full h-10 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Booking Plan"
            >
              {icons.bookingSheet}
              <span className="text-xs font-medium">Plan</span>
            </button>

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowEmployeeManagement(true)}
                className="w-full h-10 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαχείριση Υπαλλήλων"
              >
                {icons.shield}
                <span className="text-xs font-medium">Users</span>
              </button>
            )}

            {authService.canManageFleet() && (
              <button
                onClick={() => setShowAddBoat(true)}
                className="w-full h-10 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Προσθήκη Σκάφους"
              >
                {icons.plus}
                <span className="text-xs font-medium">+Boat</span>
              </button>
            )}
          </div>

          {/* Center - Boats List */}
          <div className="flex-grow overflow-y-auto p-3 flex flex-col">
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
              {filteredBoats.length > 0 ? filteredBoats.map(boat => (
                <button
                  key={boat.id}
                  onClick={() => onSelectBoat(boat)}
                  className="text-left bg-white/90 backdrop-blur-xl p-4 rounded-2xl hover:bg-white transition-all duration-300 border border-blue-200 hover:border-blue-400 shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 h-fit transform-gpu"
                  style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-blue-600">{boat.name || boat.id}</h3>
                      <p className="text-xs text-slate-600 font-semibold">{boat.id}</p>
                      <p className="text-xs text-slate-500">{boat.type} {boat.model && `• ${boat.model}`}</p>
                    </div>
                    <div className="text-blue-500 text-xl">→</div>
                  </div>
                </button>
              )) : (
                <div className="col-span-full bg-white/90 backdrop-blur-xl p-4 rounded-2xl text-center border border-blue-200">
                  <p className="text-slate-600 text-sm">
                    {searchTerm ? `Δεν βρέθηκαν σκάφη για "${searchTerm}"` : 'Δεν βρέθηκαν σκάφη.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Buttons */}
          <div className="w-28 sm:w-32 bg-white/80 backdrop-blur-xl border-l border-blue-200 flex flex-col items-center py-3 gap-3 px-2">
            <button
              onClick={() => setShowChatManagement(true)}
              className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
              title="Chat Management"
            >
              💬
              <span className="text-xs font-medium">Chats</span>
            </button>

            {authService.canClearData() && (
              <button
                onClick={() => setShowDataManagement(true)}
                className="w-full h-10 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Διαγραφή Δεδομένων"
              >
                {icons.x}
                <span className="text-xs font-medium">Delete</span>
              </button>
            )}

            {authService.canManageCodes() && (
              <button
                onClick={() => setShowActivityLog(true)}
                className="w-full h-10 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 rounded-xl flex items-center justify-center gap-2 text-white transition-all shadow-lg hover:shadow-xl"
                title="Activity Log"
              >
                {icons.fileText}
                <span className="text-xs font-medium">Log</span>
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
