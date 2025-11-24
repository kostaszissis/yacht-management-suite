import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  initializeAuth,
  getCurrentUser,
  isAdmin,
  logout,
  getAllEmployeeCodes,
  addEmployeeCode,
  updateEmployeeCode,
  deleteEmployeeCode,
  toggleEmployeeCode,
  getAllOwnerCodes,
  addOwnerCode,
  updateOwnerCode,
  deleteOwnerCode,
  getAllActivityLogs,
  clearActivityLogs,
  EmployeeCode,
  OwnerCode,
  ActivityLog
} from './authService';
import { getVessels } from './services/apiService';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState<'employees' | 'owners' | 'logs'>('employees');

  // Fleet State
  const [vessels, setVessels] = useState<any[]>([]);

  // Employee State
  const [employees, setEmployees] = useState<EmployeeCode[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<string | null>(null);

  // Owner State
  const [owners, setOwners] = useState<OwnerCode[]>([]);
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [editingOwner, setEditingOwner] = useState<string | null>(null);

  // Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // New Employee Form
  const [newEmployee, setNewEmployee] = useState({
    code: '',
    name: '',
    role: 'TECHNICAL' as 'ADMIN' | 'TECHNICAL' | 'BOOKING' | 'ACCOUNTING'
  });
  
  // New Owner Form
  const [newOwner, setNewOwner] = useState({
    code: '',
    boatIds: [] as string[]
  });

  useEffect(() => {
    initializeAuth();

    // Check if user is admin
    if (!isAdmin()) {
      alert(language === 'en'
        ? '⛔ Access Denied! Admin access required.'
        : '⛔ Δεν επιτρέπεται! Απαιτείται πρόσβαση Admin.');
      navigate('/');
      return;
    }

    loadData();
    loadVessels();
  }, []);

  const loadData = () => {
    setEmployees(getAllEmployeeCodes());
    setOwners(getAllOwnerCodes());
    setLogs(getAllActivityLogs());
  };

  const loadVessels = async () => {
    try {
      const data = await getVessels();
      setVessels(data);
    } catch (error) {
      console.error('Error loading vessels:', error);
    }
  };

  // ==================== EMPLOYEE MANAGEMENT ====================
  
  const handleAddEmployee = () => {
    if (!newEmployee.code.trim() || !newEmployee.name.trim()) {
      alert(language === 'en' 
        ? 'Please fill in all fields!' 
        : 'Παρακαλώ συμπληρώστε όλα τα πεδία!');
      return;
    }

    const permissions = getDefaultPermissionsForRole(newEmployee.role);
    
    const success = addEmployeeCode({
      code: newEmployee.code.trim().toUpperCase(),
      name: newEmployee.name.trim(),
      role: newEmployee.role,
      ...permissions
    });

    if (success) {
      setNewEmployee({ code: '', name: '', role: 'TECHNICAL' });
      setShowAddEmployee(false);
      loadData();
      alert(language === 'en' ? '✅ Employee added!' : '✅ Υπάλληλος προστέθηκε!');
    } else {
      alert(language === 'en' ? '❌ Error adding employee!' : '❌ Σφάλμα προσθήκης!');
    }
  };

  const handleToggleEmployee = (code: string) => {
    if (code === 'ADMIN2025') {
      alert(language === 'en' 
        ? '⛔ Cannot disable ADMIN2025!' 
        : '⛔ Δεν μπορείς να απενεργοποιήσεις το ADMIN2025!');
      return;
    }
    
    toggleEmployeeCode(code);
    loadData();
  };

  const handleDeleteEmployee = (code: string) => {
    if (code === 'ADMIN2025') {
      alert(language === 'en' 
        ? '⛔ Cannot delete ADMIN2025!' 
        : '⛔ Δεν μπορείς να διαγράψεις το ADMIN2025!');
      return;
    }

    if (window.confirm(language === 'en' 
      ? `Delete employee ${code}?` 
      : `Διαγραφή υπαλλήλου ${code};`)) {
      deleteEmployeeCode(code);
      loadData();
      alert(language === 'en' ? '✅ Employee deleted!' : '✅ Υπάλληλος διαγράφηκε!');
    }
  };

  const getDefaultPermissionsForRole = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          canEdit: true,
          canDelete: true,
          canManageFleet: true,
          canClearData: true,
          canManageCodes: true,
          canViewFinancials: true,
          canEditFinancials: true,
          canDoCheckInOut: true,
          canManageTasks: true
        };
      case 'TECHNICAL':
        return {
          canEdit: true,
          canDelete: false,
          canManageFleet: false,
          canClearData: false,
          canManageCodes: false,
          canViewFinancials: false,
          canEditFinancials: false,
          canDoCheckInOut: true,
          canManageTasks: true
        };
      case 'BOOKING':
        return {
          canEdit: true,
          canDelete: false,
          canManageFleet: false,
          canClearData: false,
          canManageCodes: false,
          canViewFinancials: false,
          canEditFinancials: false,
          canDoCheckInOut: false,
          canManageTasks: false
        };
      case 'ACCOUNTING':
        return {
          canEdit: true,
          canDelete: false,
          canManageFleet: false,
          canClearData: false,
          canManageCodes: false,
          canViewFinancials: true,
          canEditFinancials: true,
          canDoCheckInOut: false,
          canManageTasks: false
        };
      default:
        return {
          canEdit: false,
          canDelete: false,
          canManageFleet: false,
          canClearData: false,
          canManageCodes: false,
          canViewFinancials: false,
          canEditFinancials: false,
          canDoCheckInOut: false,
          canManageTasks: false
        };
    }
  };

  // ==================== OWNER MANAGEMENT ====================
  
  const handleAddOwner = () => {
    if (!newOwner.code.trim() || newOwner.boatIds.length === 0) {
      alert(language === 'en' 
        ? 'Please fill in code and select at least one boat!' 
        : 'Παρακαλώ συμπληρώστε κωδικό και επιλέξτε τουλάχιστον ένα σκάφος!');
      return;
    }

    const success = addOwnerCode({
      code: newOwner.code.trim().toUpperCase(),
      boatIds: newOwner.boatIds
    });

    if (success) {
      setNewOwner({ code: '', boatIds: [] });
      setShowAddOwner(false);
      loadData();
      alert(language === 'en' ? '✅ Owner added!' : '✅ Ιδιοκτήτης προστέθηκε!');
    } else {
      alert(language === 'en' ? '❌ Error adding owner!' : '❌ Σφάλμα προσθήκης!');
    }
  };

  const handleUpdateOwnerBoats = (code: string, boatIds: string[]) => {
    updateOwnerCode(code, { boatIds });
    loadData();
  };

  const handleDeleteOwner = (code: string) => {
    if (window.confirm(language === 'en' 
      ? `Delete owner ${code}?` 
      : `Διαγραφή ιδιοκτήτη ${code};`)) {
      deleteOwnerCode(code);
      loadData();
      alert(language === 'en' ? '✅ Owner deleted!' : '✅ Ιδιοκτήτης διαγράφηκε!');
    }
  };

  const toggleBoatSelection = (boatId: string) => {
    setNewOwner(prev => ({
      ...prev,
      boatIds: prev.boatIds.includes(boatId)
        ? prev.boatIds.filter(id => id !== boatId)
        : [...prev.boatIds, boatId]
    }));
  };

  // ==================== LOGS ====================
  
  const handleClearLogs = () => {
    if (window.confirm(language === 'en' 
      ? 'Clear all activity logs?' 
      : 'Διαγραφή όλων των logs;')) {
      clearActivityLogs();
      loadData();
      alert(language === 'en' ? '✅ Logs cleared!' : '✅ Logs διαγράφηκαν!');
    }
  };

  const filteredLogs = filterRole === 'all' 
    ? logs 
    : logs.filter(log => {
        const employee = employees.find(e => e.code === log.employeeCode);
        return employee?.role === filterRole;
      });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500';
      case 'TECHNICAL': return 'bg-blue-500';
      case 'BOOKING': return 'bg-green-500';
      case 'ACCOUNTING': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CHECK_IN': return '✅';
      case 'CHECK_OUT': return '🚪';
      case 'TASK_ADDED': return '➕';
      case 'TASK_UPDATED': return '✏️';
      case 'BOOKING_CREATED': return '📋';
      case 'BOOKING_UPDATED': return '🔄';
      default: return '📝';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      
      {/* Header */}
      <header className="bg-slate-800 shadow-lg sticky top-0 z-50 border-b-2 border-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🔐</div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {language === 'en' ? 'Admin Panel' : 'Πίνακας Διαχειριστή'}
                </h1>
                <p className="text-sm text-red-300">
                  {language === 'en' ? 'Code Management System' : 'Σύστημα Διαχείρισης Κωδικών'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold">
                👑 ADMIN2025
              </div>
              <button
                onClick={() => navigate('/technical-manager')}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg font-semibold text-white transition-all shadow-lg"
              >
                💬 {language === 'en' ? 'Technical Support' : 'Τεχνική Υποστήριξη'}
              </button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
              >
                {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition-colors"
              >
                🏠 {language === 'en' ? 'Home' : 'Αρχική'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'employees'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            👥 {language === 'en' ? 'Employees' : 'Υπάλληλοι'}
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'owners'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            ⚓ {language === 'en' ? 'Owners' : 'Ιδιοκτήτες'}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              activeTab === 'logs'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
            }`}
          >
            📊 {language === 'en' ? 'Activity Logs' : 'Ιστορικό'}
          </button>
        </div>

        {/* ==================== EMPLOYEES TAB ==================== */}
        {activeTab === 'employees' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {language === 'en' ? 'Employee Codes' : 'Κωδικοί Υπαλλήλων'}
              </h2>
              <button
                onClick={() => setShowAddEmployee(!showAddEmployee)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
              >
                {showAddEmployee ? '❌ Cancel' : '➕ Add Employee'}
              </button>
            </div>

            {showAddEmployee && (
              <div className="mb-6 bg-slate-800 p-6 rounded-lg border-2 border-green-500">
                <h3 className="text-xl font-bold text-white mb-4">
                  {language === 'en' ? 'New Employee' : 'Νέος Υπάλληλος'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {language === 'en' ? 'Code' : 'Κωδικός'}
                    </label>
                    <input
                      type="text"
                      value={newEmployee.code}
                      onChange={(e) => setNewEmployee({ ...newEmployee, code: e.target.value })}
                      placeholder="TEC004!NAME"
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {language === 'en' ? 'Name' : 'Όνομα'}
                    </label>
                    <input
                      type="text"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      {language === 'en' ? 'Role' : 'Ρόλος'}
                    </label>
                    <select
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
                    >
                      <option value="TECHNICAL">Technical Manager</option>
                      <option value="BOOKING">Booking Manager</option>
                      <option value="ACCOUNTING">Accounting Manager</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAddEmployee}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                >
                  ✅ {language === 'en' ? 'Add Employee' : 'Προσθήκη Υπαλλήλου'}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {employees.map((emp) => (
                <div
                  key={emp.code}
                  className={`bg-slate-800 p-4 rounded-lg border-2 ${
                    emp.enabled ? 'border-slate-700' : 'border-red-500 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-white">{emp.code}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getRoleBadgeColor(emp.role)}`}>
                          {emp.role}
                        </span>
                        {!emp.enabled && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <div className="text-lg text-gray-300 mb-2">👤 {emp.name}</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {emp.canEdit && <span className="px-2 py-1 bg-blue-700 text-white rounded">✏️ Edit</span>}
                        {emp.canDelete && <span className="px-2 py-1 bg-red-700 text-white rounded">🗑️ Delete</span>}
                        {emp.canDoCheckInOut && <span className="px-2 py-1 bg-green-700 text-white rounded">✅ Check-in/out</span>}
                        {emp.canManageTasks && <span className="px-2 py-1 bg-yellow-700 text-white rounded">🔧 Tasks</span>}
                        {emp.canViewFinancials && <span className="px-2 py-1 bg-purple-700 text-white rounded">💰 Financials</span>}
                        {emp.canManageCodes && <span className="px-2 py-1 bg-red-700 text-white rounded">🔐 Manage Codes</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleEmployee(emp.code)}
                        className={`px-4 py-2 rounded-lg font-bold transition-all ${
                          emp.enabled
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {emp.enabled ? '🔒 Disable' : '🔓 Enable'}
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.code)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== OWNERS TAB ==================== */}
        {activeTab === 'owners' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {language === 'en' ? 'Owner Codes' : 'Κωδικοί Ιδιοκτητών'}
              </h2>
              <button
                onClick={() => setShowAddOwner(!showAddOwner)}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
              >
                {showAddOwner ? '❌ Cancel' : '➕ Add Owner'}
              </button>
            </div>

            {showAddOwner && (
              <div className="mb-6 bg-slate-800 p-6 rounded-lg border-2 border-green-500">
                <h3 className="text-xl font-bold text-white mb-4">
                  {language === 'en' ? 'New Owner' : 'Νέος Ιδιοκτήτης'}
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {language === 'en' ? 'Owner Code' : 'Κωδικός Ιδιοκτήτη'}
                  </label>
                  <input
                    type="text"
                    value={newOwner.code}
                    onChange={(e) => setNewOwner({ ...newOwner, code: e.target.value })}
                    placeholder="D2025"
                    className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-green-500 focus:outline-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    {language === 'en' ? 'Select Boats' : 'Επιλογή Σκαφών'}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {vessels.map((boat) => (
                      <button
                        key={boat.id}
                        onClick={() => toggleBoatSelection(boat.id)}
                        className={`p-3 rounded-lg font-semibold transition-all ${
                          newOwner.boatIds.includes(boat.id)
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                        }`}
                      >
                        {boat.id}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddOwner}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all"
                >
                  ✅ {language === 'en' ? 'Add Owner' : 'Προσθήκη Ιδιοκτήτη'}
                </button>
              </div>
            )}

            <div className="space-y-3">
              {owners.map((owner) => (
                <div
                  key={owner.code}
                  className="bg-slate-800 p-4 rounded-lg border-2 border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-2xl font-bold text-white">{owner.code}</span>
                      <span className="ml-3 px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white">
                        OWNER
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteOwner(owner.code)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-300 mb-2">
                      {language === 'en' ? 'Boats:' : 'Σκάφη:'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {owner.boatIds.map((boatId) => {
                        const boat = vessels.find(b => b.id === boatId);
                        return (
                          <span
                            key={boatId}
                            className="px-3 py-1 bg-blue-700 text-white rounded-lg text-sm font-semibold"
                          >
                            ⚓ {boat?.name || boatId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {owners.length === 0 && (
                <div className="bg-slate-800 p-8 rounded-lg text-center">
                  <div className="text-5xl mb-3">⚓</div>
                  <p className="text-gray-400">
                    {language === 'en' 
                      ? 'No owner codes yet. Click "Add Owner" to create one.' 
                      : 'Δεν υπάρχουν κωδικοί ιδιοκτητών. Πατήστε "Προσθήκη Ιδιοκτήτη".'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== LOGS TAB ==================== */}
        {activeTab === 'logs' && (
          <div>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">
                {language === 'en' ? 'Activity Logs' : 'Ιστορικό Ενεργειών'}
              </h2>
              <div className="flex gap-3">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TECHNICAL">Technical</option>
                  <option value="BOOKING">Booking</option>
                  <option value="ACCOUNTING">Accounting</option>
                </select>
                <button
                  onClick={handleClearLogs}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all"
                >
                  🗑️ Clear Logs
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="bg-slate-800 p-8 rounded-lg text-center">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="text-gray-400">
                    {language === 'en' ? 'No activity logs yet.' : 'Δεν υπάρχουν logs ακόμα.'}
                  </p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const employee = employees.find(e => e.code === log.employeeCode);
                  return (
                    <div
                      key={log.id}
                      className="bg-slate-800 p-4 rounded-lg border border-slate-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getActionIcon(log.action)}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{log.employeeName}</span>
                              {employee && (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${getRoleBadgeColor(employee.role)}`}>
                                  {employee.role}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">
                              {log.action.replace(/_/g, ' ')}
                              {log.bookingCode && ` - Booking: ${log.bookingCode}`}
                              {log.vesselId && ` - Vessel: ${log.vesselId}`}
                            </div>
                            {log.details && (
                              <div className="text-xs text-gray-500 mt-1">{log.details}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(log.timestamp).toLocaleString(language === 'en' ? 'en-GB' : 'el-GR')}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}