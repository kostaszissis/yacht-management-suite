/**
 * Two-way sync utility for booking/charter data between Page 1 and Fleet Management
 *
 * Synced fields (Page 1 does NOT have financial fields):
 * - booking number / charter code
 * - vessel name
 * - check-in date (startDate)
 * - check-in time (startTime)
 * - check-out date (endDate)
 * - check-out time (endTime)
 * - skipper first name
 * - skipper last name
 * - skipper address
 * - skipper email
 * - skipper phone
 */

const SYNC_KEY = 'currentBookingData';

// Common booking data interface (shared fields only)
export interface SyncedBookingData {
  code: string;           // booking number / charter code
  vesselName: string;     // vessel name
  startDate: string;      // check-in date
  startTime: string;      // check-in time
  endDate: string;        // check-out date
  endTime: string;        // check-out time
  skipperFirstName: string;
  skipperLastName: string;
  skipperAddress: string;
  skipperEmail: string;
  skipperPhone: string;
  lastUpdatedBy: 'page1' | 'fleetManagement';
  lastUpdatedAt: string;
}

// Save booking data to localStorage
export const saveBookingSync = (data: Partial<SyncedBookingData>, source: 'page1' | 'fleetManagement'): void => {
  try {
    const existing = getBookingSync();
    const updated: SyncedBookingData = {
      code: data.code ?? existing?.code ?? '',
      vesselName: data.vesselName ?? existing?.vesselName ?? '',
      startDate: data.startDate ?? existing?.startDate ?? '',
      startTime: data.startTime ?? existing?.startTime ?? '',
      endDate: data.endDate ?? existing?.endDate ?? '',
      endTime: data.endTime ?? existing?.endTime ?? '',
      skipperFirstName: data.skipperFirstName ?? existing?.skipperFirstName ?? '',
      skipperLastName: data.skipperLastName ?? existing?.skipperLastName ?? '',
      skipperAddress: data.skipperAddress ?? existing?.skipperAddress ?? '',
      skipperEmail: data.skipperEmail ?? existing?.skipperEmail ?? '',
      skipperPhone: data.skipperPhone ?? existing?.skipperPhone ?? '',
      lastUpdatedBy: source,
      lastUpdatedAt: new Date().toISOString()
    };

    localStorage.setItem(SYNC_KEY, JSON.stringify(updated));
    console.log(`📤 Booking sync saved from ${source}:`, updated);
  } catch (e) {
    console.error('Error saving booking sync:', e);
  }
};

// Get booking data from localStorage
export const getBookingSync = (): SyncedBookingData | null => {
  try {
    const data = localStorage.getItem(SYNC_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('📥 Booking sync loaded:', parsed);
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('Error loading booking sync:', e);
    return null;
  }
};

// Clear booking sync data
export const clearBookingSync = (): void => {
  try {
    localStorage.removeItem(SYNC_KEY);
    console.log('🗑️ Booking sync cleared');
  } catch (e) {
    console.error('Error clearing booking sync:', e);
  }
};

// Convert Page 1 form data to sync format
export const page1ToSyncFormat = (form: {
  bookingNumber?: string;
  vesselName?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  skipperFirstName?: string;
  skipperLastName?: string;
  skipperAddress?: string;
  skipperEmail?: string;
  skipperPhone?: string;
}): Partial<SyncedBookingData> => {
  return {
    code: form.bookingNumber || '',
    vesselName: form.vesselName || '',
    startDate: form.checkInDate || '',
    startTime: form.checkInTime || '',
    endDate: form.checkOutDate || '',
    endTime: form.checkOutTime || '',
    skipperFirstName: form.skipperFirstName || '',
    skipperLastName: form.skipperLastName || '',
    skipperAddress: form.skipperAddress || '',
    skipperEmail: form.skipperEmail || '',
    skipperPhone: form.skipperPhone || ''
  };
};

// Convert sync format to Page 1 form data
export const syncToPage1Format = (sync: SyncedBookingData | null): {
  bookingNumber: string;
  vesselName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  skipperFirstName: string;
  skipperLastName: string;
  skipperAddress: string;
  skipperEmail: string;
  skipperPhone: string;
} | null => {
  if (!sync) return null;
  return {
    bookingNumber: sync.code || '',
    vesselName: sync.vesselName || '',
    checkInDate: sync.startDate || '',
    checkInTime: sync.startTime || '',
    checkOutDate: sync.endDate || '',
    checkOutTime: sync.endTime || '',
    skipperFirstName: sync.skipperFirstName || '',
    skipperLastName: sync.skipperLastName || '',
    skipperAddress: sync.skipperAddress || '',
    skipperEmail: sync.skipperEmail || '',
    skipperPhone: sync.skipperPhone || ''
  };
};

// Convert Fleet Management newCharter to sync format
export const fleetToSyncFormat = (
  newCharter: {
    code?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    skipperFirstName?: string;
    skipperLastName?: string;
    skipperAddress?: string;
    skipperEmail?: string;
    skipperPhone?: string;
  },
  vesselName?: string
): Partial<SyncedBookingData> => {
  return {
    code: newCharter.code || '',
    vesselName: vesselName || '',
    startDate: newCharter.startDate || '',
    startTime: newCharter.startTime || '',
    endDate: newCharter.endDate || '',
    endTime: newCharter.endTime || '',
    skipperFirstName: newCharter.skipperFirstName || '',
    skipperLastName: newCharter.skipperLastName || '',
    skipperAddress: newCharter.skipperAddress || '',
    skipperEmail: newCharter.skipperEmail || '',
    skipperPhone: newCharter.skipperPhone || ''
  };
};

// Convert sync format to Fleet Management newCharter fields (partial - doesn't include financial)
export const syncToFleetFormat = (sync: SyncedBookingData | null): {
  code: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  skipperFirstName: string;
  skipperLastName: string;
  skipperAddress: string;
  skipperEmail: string;
  skipperPhone: string;
} | null => {
  if (!sync) return null;
  return {
    code: sync.code || '',
    startDate: sync.startDate || '',
    startTime: sync.startTime || '',
    endDate: sync.endDate || '',
    endTime: sync.endTime || '',
    skipperFirstName: sync.skipperFirstName || '',
    skipperLastName: sync.skipperLastName || '',
    skipperAddress: sync.skipperAddress || '',
    skipperEmail: sync.skipperEmail || '',
    skipperPhone: sync.skipperPhone || ''
  };
};

// Check if sync data exists and has meaningful content
export const hasSyncData = (): boolean => {
  const sync = getBookingSync();
  if (!sync) return false;
  // Consider it has data if at least code or vessel name is filled
  return !!(sync.code || sync.vesselName);
};
