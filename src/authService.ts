// =================================================================
// AUTHENTICATION SERVICE
// Centralized authentication and authorization system
// =================================================================

import { codeMatches } from './utils/searchUtils';

// Employee Codes Structure
export interface EmployeeCode {
  code: string;
  name: string;
  role: 'ADMIN' | 'TECHNICAL' | 'BOOKING' | 'ACCOUNTING';
  canEdit: boolean;
  canDelete: boolean;
  canManageFleet: boolean;
  canClearData: boolean;
  canManageCodes: boolean;
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  canDoCheckInOut: boolean;
  canManageTasks: boolean;
  enabled: boolean;
}

// Owner Code Structure
export interface OwnerCode {
  code: string;
  boatIds: string[];
  enabled: boolean;
  // 🔥 FIX 38: Owner details for charter emails
  ownerName?: string;
  ownerEmail?: string;
  ownerCompany?: string;
  ownerTaxId?: string;
  ownerPhone?: string;
  ownerAddress?: string;
}

// Activity Log Structure
export interface ActivityLog {
  id: string;
  timestamp: string;
  employeeCode: string;
  employeeName: string;
  action: 'CHECK_IN' | 'CHECK_OUT' | 'TASK_ADDED' | 'TASK_UPDATED' | 'BOOKING_CREATED' | 'BOOKING_UPDATED';
  bookingCode?: string;
  vesselId?: string;
  details?: string;
}

// Storage Keys
const EMPLOYEE_CODES_KEY = 'auth_employee_codes';
const OWNER_CODES_KEY = 'auth_owner_codes';
const ACTIVITY_LOGS_KEY = 'auth_activity_logs';
const CURRENT_USER_KEY = 'auth_current_user';

// Default Employee Codes
const DEFAULT_EMPLOYEE_CODES: EmployeeCode[] = [
  {
    code: 'ADMIN2025',
    name: 'Administrator',
    role: 'ADMIN',
    canEdit: true,
    canDelete: true,
    canManageFleet: true,
    canClearData: true,
    canManageCodes: true,
    canViewFinancials: true,
    canEditFinancials: true,
    canDoCheckInOut: true,
    canManageTasks: true,
    enabled: true
  },
  {
    code: 'TEC001!VASILIS',
    name: 'Vasilis',
    role: 'TECHNICAL',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: true,
    canManageTasks: true,
    enabled: true
  },
  {
    code: 'TEC002!GIANNIS',
    name: 'Giannis',
    role: 'TECHNICAL',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: true,
    canManageTasks: true,
    enabled: true
  },
  {
    code: 'TEC003!MARINIA',
    name: 'Marinia',
    role: 'TECHNICAL',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: true,
    canManageTasks: true,
    enabled: true
  },
  {
    code: 'CHECKIN2025',
    name: 'Check-in Check-out',
    role: 'TECHNICAL',
    canEdit: false,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: true,
    canManageTasks: false,
    enabled: true
  },
  {
    code: 'BOOK001!4628',
    name: 'Booking Manager',
    role: 'BOOKING',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: false,
    canManageTasks: false,
    enabled: true
  },
  {
    code: 'ACC001!KOSTAS',
    name: 'Kostas',
    role: 'ACCOUNTING',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: true,
    canEditFinancials: true,
    canDoCheckInOut: false,
    canManageTasks: false,
    enabled: true
  },
  {
    code: 'ACC002!MARIA',
    name: 'Maria',
    role: 'ACCOUNTING',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: true,
    canEditFinancials: true,
    canDoCheckInOut: false,
    canManageTasks: false,
    enabled: true
  }
];

// =================================================================
// INITIALIZATION
// =================================================================

export const initializeAuth = () => {
  // Initialize employee codes if not exists
  const existingCodes = localStorage.getItem(EMPLOYEE_CODES_KEY);
  if (!existingCodes) {
    localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(DEFAULT_EMPLOYEE_CODES));
    console.log('✅ Employee codes initialized');
  } else {
    // 🔧 FIX: Check if CHECKIN2025 exists, if not force update with defaults
    try {
      const parsed = JSON.parse(existingCodes);
      const hasCheckin2025 = parsed.find((emp: EmployeeCode) => emp.code === 'CHECKIN2025');

      if (!hasCheckin2025) {
        console.log('⚠️ CHECKIN2025 missing! Force updating employee codes...');
        localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(DEFAULT_EMPLOYEE_CODES));
        console.log('✅ Employee codes updated with CHECKIN2025');
      }
    } catch (error) {
      console.error('Error checking employee codes, reinitializing...', error);
      localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(DEFAULT_EMPLOYEE_CODES));
    }
  }

  // Initialize activity logs if not exists
  const existingLogs = localStorage.getItem(ACTIVITY_LOGS_KEY);
  if (!existingLogs) {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify([]));
    console.log('✅ Activity logs initialized');
  }
};

// =================================================================
// EMPLOYEE CODES MANAGEMENT
// =================================================================

export const getAllEmployeeCodes = (): EmployeeCode[] => {
  try {
    const stored = localStorage.getItem(EMPLOYEE_CODES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_EMPLOYEE_CODES;
  } catch (error) {
    console.error('Error loading employee codes:', error);
    return DEFAULT_EMPLOYEE_CODES;
  }
};

export const getEmployeeByCode = (code: string): EmployeeCode | null => {
  const codes = getAllEmployeeCodes();
  return codes.find(emp => codeMatches(emp.code, code) && emp.enabled) || null;
};

export const addEmployeeCode = (employee: Omit<EmployeeCode, 'enabled'>): boolean => {
  try {
    const codes = getAllEmployeeCodes();

    // Check if code already exists (case-insensitive)
    if (codes.find(emp => codeMatches(emp.code, employee.code))) {
      throw new Error('Employee code already exists');
    }
    
    codes.push({ ...employee, enabled: true });
    localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(codes));
    console.log('✅ Employee code added:', employee.code);
    return true;
  } catch (error) {
    console.error('Error adding employee code:', error);
    return false;
  }
};

export const updateEmployeeCode = (code: string, updates: Partial<EmployeeCode>): boolean => {
  try {
    const codes = getAllEmployeeCodes();
    const index = codes.findIndex(emp => codeMatches(emp.code, code));

    if (index === -1) {
      throw new Error('Employee code not found');
    }
    
    codes[index] = { ...codes[index], ...updates };
    localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(codes));
    console.log('✅ Employee code updated:', code);
    return true;
  } catch (error) {
    console.error('Error updating employee code:', error);
    return false;
  }
};

export const deleteEmployeeCode = (code: string): boolean => {
  try {
    const codes = getAllEmployeeCodes();
    const filtered = codes.filter(emp => !codeMatches(emp.code, code));
    localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(filtered));
    console.log('✅ Employee code deleted:', code);
    return true;
  } catch (error) {
    console.error('Error deleting employee code:', error);
    return false;
  }
};

export const toggleEmployeeCode = (code: string): boolean => {
  try {
    const codes = getAllEmployeeCodes();
    const index = codes.findIndex(emp => codeMatches(emp.code, code));

    if (index === -1) {
      throw new Error('Employee code not found');
    }
    
    codes[index].enabled = !codes[index].enabled;
    localStorage.setItem(EMPLOYEE_CODES_KEY, JSON.stringify(codes));
    console.log('✅ Employee code toggled:', code, codes[index].enabled);
    return true;
  } catch (error) {
    console.error('Error toggling employee code:', error);
    return false;
  }
};

// =================================================================
// OWNER CODES MANAGEMENT
// =================================================================

export const getAllOwnerCodes = (): OwnerCode[] => {
  try {
    const stored = localStorage.getItem(OWNER_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading owner codes:', error);
    return [];
  }
};

export const getOwnerByCode = (code: string): OwnerCode | null => {
  const codes = getAllOwnerCodes();
  return codes.find(owner => codeMatches(owner.code, code) && owner.enabled) || null;
};

// 🔥 FIX 38: Get owner details by boat ID for charter emails
export const getOwnerByBoatId = (boatId: string | number): OwnerCode | null => {
  const codes = getAllOwnerCodes();
  const boatIdStr = String(boatId);
  return codes.find(owner => owner.enabled && owner.boatIds.some(id => String(id) === boatIdStr)) || null;
};

export const addOwnerCode = (owner: Omit<OwnerCode, 'enabled'>): boolean => {
  try {
    const codes = getAllOwnerCodes();

    // Check if code already exists (case-insensitive)
    if (codes.find(o => codeMatches(o.code, owner.code))) {
      throw new Error('Owner code already exists');
    }
    
    codes.push({ ...owner, enabled: true });
    localStorage.setItem(OWNER_CODES_KEY, JSON.stringify(codes));
    console.log('✅ Owner code added:', owner.code);
    return true;
  } catch (error) {
    console.error('Error adding owner code:', error);
    return false;
  }
};

export const updateOwnerCode = (code: string, updates: Partial<OwnerCode>): boolean => {
  try {
    const codes = getAllOwnerCodes();
    const index = codes.findIndex(owner => codeMatches(owner.code, code));

    if (index === -1) {
      throw new Error('Owner code not found');
    }
    
    codes[index] = { ...codes[index], ...updates };
    localStorage.setItem(OWNER_CODES_KEY, JSON.stringify(codes));
    console.log('✅ Owner code updated:', code);
    return true;
  } catch (error) {
    console.error('Error updating owner code:', error);
    return false;
  }
};

export const deleteOwnerCode = (code: string): boolean => {
  try {
    const codes = getAllOwnerCodes();
    const filtered = codes.filter(owner => !codeMatches(owner.code, code));
    localStorage.setItem(OWNER_CODES_KEY, JSON.stringify(filtered));
    console.log('✅ Owner code deleted:', code);
    return true;
  } catch (error) {
    console.error('Error deleting owner code:', error);
    return false;
  }
};

// =================================================================
// AUTHENTICATION
// =================================================================

export interface CurrentUser {
  code: string;
  name: string;
  role: 'ADMIN' | 'TECHNICAL' | 'BOOKING' | 'ACCOUNTING' | 'OWNER';
  permissions: EmployeeCode | null;
  boatIds?: string[];
  loginTime: string;
}

export const login = (code: string): CurrentUser | null => {
  try {
    // Check if it's an employee code
    const employee = getEmployeeByCode(code);
    if (employee) {
      const user: CurrentUser = {
        code: employee.code,
        name: employee.name,
        role: employee.role,
        permissions: employee,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      console.log('✅ Employee logged in:', employee.name);
      return user;
    }
    
    // Check if it's an owner code
    const owner = getOwnerByCode(code);
    if (owner) {
      const user: CurrentUser = {
        code: owner.code,
        name: `Owner ${owner.code}`,
        role: 'OWNER',
        permissions: null,
        boatIds: owner.boatIds,
        loginTime: new Date().toISOString()
      };
      
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      console.log('✅ Owner logged in:', owner.code);
      return user;
    }
    
    console.log('❌ Invalid code:', code);
    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
};

export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
  console.log('✅ User logged out');
};

export const getCurrentUser = (): CurrentUser | null => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const isLoggedIn = (): boolean => {
  return getCurrentUser() !== null;
};

// =================================================================
// PERMISSION CHECKS
// =================================================================

export const canEdit = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canEdit || false;
};

export const canDelete = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canDelete || false;
};

export const canManageFleet = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canManageFleet || false;
};

export const canClearData = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canClearData || false;
};

export const canManageCodes = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canManageCodes || false;
};

export const canViewFinancials = (): boolean => {
  const user = getCurrentUser();
  if (user?.role === 'OWNER') return true; // Owners can view their financials
  return user?.permissions?.canViewFinancials || false;
};

export const canEditFinancials = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canEditFinancials || false;
};

export const canDoCheckInOut = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canDoCheckInOut || false;
};

export const canManageTasks = (): boolean => {
  const user = getCurrentUser();
  return user?.permissions?.canManageTasks || false;
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

export const isOwner = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'OWNER';
};

export const isTechnical = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'TECHNICAL';
};

export const isBooking = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'BOOKING';
};

export const isAccounting = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ACCOUNTING';
};

export const getOwnerBoatIds = (): string[] => {
  const user = getCurrentUser();
  return user?.boatIds || [];
};

// =================================================================
// ACTIVITY LOGGING
// =================================================================

export const logActivity = (
  action: ActivityLog['action'],
  bookingCode?: string,
  vesselId?: string,
  details?: string
): void => {
  try {
    const user = getCurrentUser();
    if (!user) return;
    
    const log: ActivityLog = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      employeeCode: user.code,
      employeeName: user.name,
      action,
      bookingCode,
      vesselId,
      details
    };
    
    const logs = getAllActivityLogs();
    logs.unshift(log); // Add to beginning
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs));
    console.log('✅ Activity logged:', action);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getAllActivityLogs = (): ActivityLog[] => {
  try {
    const stored = localStorage.getItem(ACTIVITY_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading activity logs:', error);
    return [];
  }
};

export const getActivityLogsByEmployee = (employeeCode: string): ActivityLog[] => {
  const logs = getAllActivityLogs();
  return logs.filter(log => codeMatches(log.employeeCode, employeeCode));
};

export const getActivityLogsByBooking = (bookingCode: string): ActivityLog[] => {
  const logs = getAllActivityLogs();
  return logs.filter(log => log.bookingCode && codeMatches(log.bookingCode, bookingCode));
};

export const clearActivityLogs = (): boolean => {
  try {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify([]));
    console.log('✅ Activity logs cleared');
    return true;
  } catch (error) {
    console.error('Error clearing activity logs:', error);
    return false;
  }
};

// =================================================================
// EXPORT ALL
// =================================================================

export default {
  // Initialization
  initializeAuth,
  
  // Employee Codes
  getAllEmployeeCodes,
  getEmployeeByCode,
  addEmployeeCode,
  updateEmployeeCode,
  deleteEmployeeCode,
  toggleEmployeeCode,
  
  // Owner Codes
  getAllOwnerCodes,
  getOwnerByCode,
  getOwnerByBoatId,
  addOwnerCode,
  updateOwnerCode,
  deleteOwnerCode,
  
  // Authentication
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  
  // Permission Checks
  canEdit,
  canDelete,
  canManageFleet,
  canClearData,
  canManageCodes,
  canViewFinancials,
  canEditFinancials,
  canDoCheckInOut,
  canManageTasks,
  isAdmin,
  isOwner,
  isTechnical,
  isBooking,
  isAccounting,
  getOwnerBoatIds,
  
  // Activity Logging
  logActivity,
  getAllActivityLogs,
  getActivityLogsByEmployee,
  getActivityLogsByBooking,
  clearActivityLogs
};