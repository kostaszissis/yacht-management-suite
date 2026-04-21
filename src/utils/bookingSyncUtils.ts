/**
 * Two-way sync utility — API-backed (no localStorage, multi-user safe).
 */

const API_BASE = 'https://yachtmanagementsuite.com/api';

export interface SyncedBookingData {
  code: string;
  vesselName: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  chartererFirstName: string;
  chartererLastName: string;
  chartererAddress: string;
  chartererEmail: string;
  chartererPhone: string;
  sameAsSkipper: boolean;
  skipperFirstName: string;
  skipperLastName: string;
  skipperAddress: string;
  skipperEmail: string;
  skipperPhone: string;
  lastUpdatedBy: 'page1' | 'fleetManagement';
  lastUpdatedAt: string;
}

export const saveBookingSync = async (data: Partial<SyncedBookingData>, source: 'page1' | 'fleetManagement'): Promise<void> => {
  const code = data.code || '';
  if (!code) return;
  try {
    const existing = await getBookingSync(code);
    const updated: SyncedBookingData = {
      code: data.code ?? existing?.code ?? '',
      vesselName: data.vesselName ?? existing?.vesselName ?? '',
      startDate: data.startDate ?? existing?.startDate ?? '',
      startTime: data.startTime ?? existing?.startTime ?? '',
      endDate: data.endDate ?? existing?.endDate ?? '',
      endTime: data.endTime ?? existing?.endTime ?? '',
      chartererFirstName: data.chartererFirstName ?? existing?.chartererFirstName ?? '',
      chartererLastName: data.chartererLastName ?? existing?.chartererLastName ?? '',
      chartererAddress: data.chartererAddress ?? existing?.chartererAddress ?? '',
      chartererEmail: data.chartererEmail ?? existing?.chartererEmail ?? '',
      chartererPhone: data.chartererPhone ?? existing?.chartererPhone ?? '',
      sameAsSkipper: data.sameAsSkipper ?? existing?.sameAsSkipper ?? false,
      skipperFirstName: data.skipperFirstName ?? existing?.skipperFirstName ?? '',
      skipperLastName: data.skipperLastName ?? existing?.skipperLastName ?? '',
      skipperAddress: data.skipperAddress ?? existing?.skipperAddress ?? '',
      skipperEmail: data.skipperEmail ?? existing?.skipperEmail ?? '',
      skipperPhone: data.skipperPhone ?? existing?.skipperPhone ?? '',
      lastUpdatedBy: source,
      lastUpdatedAt: new Date().toISOString()
    };
    await fetch(API_BASE + '/bookings.php?action=sync_save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: updated.code, sync_data: updated })
    });
  } catch (e) {}
};

export const getBookingSync = async (code?: string): Promise<SyncedBookingData | null> => {
  if (!code) return null;
  try {
    const res = await fetch(API_BASE + '/bookings.php?action=sync_load&code=' + encodeURIComponent(code));
    if (!res.ok) return null;
    const data = await res.json();
    return (data && typeof data === 'object') ? data : null;
  } catch (e) {
    return null;
  }
};

export const clearBookingSync = async (code?: string): Promise<void> => {
  if (!code) return;
  try {
    await fetch(API_BASE + '/bookings.php?action=sync_clear&code=' + encodeURIComponent(code), {
      method: 'DELETE'
    });
  } catch (e) {}
};

export const hasSyncData = async (code?: string): Promise<boolean> => {
  const sync = await getBookingSync(code);
  return !!(sync && (sync.code || sync.vesselName));
};

export const page1ToSyncFormat = (form: {
  bookingNumber?: string;
  vesselName?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  chartererFirstName?: string;
  chartererLastName?: string;
  chartererAddress?: string;
  chartererEmail?: string;
  chartererPhone?: string;
  sameAsSkipper?: boolean;
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
    chartererFirstName: form.chartererFirstName || '',
    chartererLastName: form.chartererLastName || '',
    chartererAddress: form.chartererAddress || '',
    chartererEmail: form.chartererEmail || '',
    chartererPhone: form.chartererPhone || '',
    sameAsSkipper: form.sameAsSkipper || false,
    skipperFirstName: form.skipperFirstName || '',
    skipperLastName: form.skipperLastName || '',
    skipperAddress: form.skipperAddress || '',
    skipperEmail: form.skipperEmail || '',
    skipperPhone: form.skipperPhone || ''
  };
};

export const syncToPage1Format = (sync: SyncedBookingData | null): {
  bookingNumber: string;
  vesselName: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  chartererFirstName: string;
  chartererLastName: string;
  chartererAddress: string;
  chartererEmail: string;
  chartererPhone: string;
  sameAsSkipper: boolean;
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
    chartererFirstName: sync.chartererFirstName || '',
    chartererLastName: sync.chartererLastName || '',
    chartererAddress: sync.chartererAddress || '',
    chartererEmail: sync.chartererEmail || '',
    chartererPhone: sync.chartererPhone || '',
    sameAsSkipper: sync.sameAsSkipper || false,
    skipperFirstName: sync.skipperFirstName || '',
    skipperLastName: sync.skipperLastName || '',
    skipperAddress: sync.skipperAddress || '',
    skipperEmail: sync.skipperEmail || '',
    skipperPhone: sync.skipperPhone || ''
  };
};

export const fleetToSyncFormat = (
  newCharter: {
    code?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    chartererFirstName?: string;
    chartererLastName?: string;
    chartererAddress?: string;
    chartererEmail?: string;
    chartererPhone?: string;
    sameAsSkipper?: boolean;
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
    chartererFirstName: newCharter.chartererFirstName || '',
    chartererLastName: newCharter.chartererLastName || '',
    chartererAddress: newCharter.chartererAddress || '',
    chartererEmail: newCharter.chartererEmail || '',
    chartererPhone: newCharter.chartererPhone || '',
    sameAsSkipper: newCharter.sameAsSkipper || false,
    skipperFirstName: newCharter.skipperFirstName || '',
    skipperLastName: newCharter.skipperLastName || '',
    skipperAddress: newCharter.skipperAddress || '',
    skipperEmail: newCharter.skipperEmail || '',
    skipperPhone: newCharter.skipperPhone || ''
  };
};

export const syncToFleetFormat = (sync: SyncedBookingData | null): {
  code: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  chartererFirstName: string;
  chartererLastName: string;
  chartererAddress: string;
  chartererEmail: string;
  chartererPhone: string;
  sameAsSkipper: boolean;
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
    chartererFirstName: sync.chartererFirstName || '',
    chartererLastName: sync.chartererLastName || '',
    chartererAddress: sync.chartererAddress || '',
    chartererEmail: sync.chartererEmail || '',
    chartererPhone: sync.chartererPhone || '',
    sameAsSkipper: sync.sameAsSkipper || false,
    skipperFirstName: sync.skipperFirstName || '',
    skipperLastName: sync.skipperLastName || '',
    skipperAddress: sync.skipperAddress || '',
    skipperEmail: sync.skipperEmail || '',
    skipperPhone: sync.skipperPhone || ''
  };
};
