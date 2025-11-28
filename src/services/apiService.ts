const API_URL = 'https://yachtmanagementsuite.com/api';

// 🔥 FIX 17: Vessel ID to Name mapping for API calls
const VESSEL_NAMES: { [key: number]: string } = {
  1: 'Maria 1',
  2: 'Maria 2',
  3: 'Valesia',
  4: 'Bar Bar',
  5: 'Kalispera',
  6: 'Infinity',
  7: 'Perla',
  8: 'Bob'
};

// =====================================================
// VESSELS API
// =====================================================
export async function getVessels() {
  const response = await fetch(`${API_URL}/vessels`);
  if (!response.ok) throw new Error('Failed to fetch vessels');
  return response.json();
}

export async function createVessel(vessel: any) {
  const response = await fetch(`${API_URL}/vessels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vessel)
  });
  if (!response.ok) throw new Error('Failed to create vessel');
  return response.json();
}

export async function updateVessel(id: string, vessel: any) {
  const response = await fetch(`${API_URL}/vessels/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vessel)
  });
  if (!response.ok) throw new Error('Failed to update vessel');
  return response.json();
}

export async function deleteVessel(id: string) {
  const response = await fetch(`${API_URL}/vessels/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete vessel');
  return response.json();
}

// =====================================================
// BOOKINGS API
// =====================================================

/**
 * Get all bookings with optional filters
 * @param filters - Optional filters: vessel, startDate, endDate, limit, offset
 */
export async function getBookings(filters?: {
  vessel?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.vessel) params.append('vessel', filters.vessel);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());

  const url = `${API_URL}/bookings${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

/**
 * Get single booking by booking number
 * @param bookingNumber - The booking number
 */
export async function getBooking(bookingNumber: string) {
  const response = await fetch(`${API_URL}/bookings/${bookingNumber}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch booking');
  }
  return response.json();
}

/**
 * Create new booking
 * @param booking - Booking data object
 */
export async function createBooking(booking: {
  bookingNumber: string;
  bookingData: any;
  page2DataCheckIn?: any;
  page2DataCheckOut?: any;
  page3DataCheckIn?: any;
  page3DataCheckOut?: any;
  page4DataCheckIn?: any;
  page4DataCheckOut?: any;
}) {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  if (!response.ok) {
    if (response.status === 409) throw new Error('Booking already exists');
    throw new Error('Failed to create booking');
  }
  return response.json();
}

/**
 * Update existing booking
 * @param bookingNumber - The booking number
 * @param updates - Partial booking data to update
 */
export async function updateBooking(
  bookingNumber: string,
  updates: {
    bookingData?: any;
    page2DataCheckIn?: any;
    page2DataCheckOut?: any;
    page3DataCheckIn?: any;
    page3DataCheckOut?: any;
    page4DataCheckIn?: any;
    page4DataCheckOut?: any;
    synced?: boolean;
  }
) {
  const response = await fetch(`${API_URL}/bookings/${bookingNumber}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Booking not found');
    throw new Error('Failed to update booking');
  }
  return response.json();
}

/**
 * Update charter status
 * @param bookingNumber - The booking number/code
 * @param status - New status (Option, Reservation, Confirmed, Cancelled, etc.)
 */
export async function updateCharterStatus(
  bookingNumber: string,
  status: string
) {
  console.log('📋 updateCharterStatus called:', { bookingNumber, status });

  const existing = await getBooking(bookingNumber);
  if (!existing) {
    throw new Error('Booking not found');
  }

  const updatedBookingData = {
    ...(existing.bookingData || existing),
    status,
    updatedAt: new Date().toISOString()
  };

  const encodedBookingNumber = encodeURIComponent(bookingNumber);
  const response = await fetch(`${API_URL}/bookings/${encodedBookingNumber}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingData: updatedBookingData })
  });

  console.log('📋 API response status:', response.status);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Booking not found');
    throw new Error('Failed to update status');
  }
  return response.json();
}

/**
 * 🔥 FIX 26: Update charter crew members
 * @param bookingNumber - The booking number/code
 * @param crewMembers - Array of crew member objects
 */
export async function updateCharterCrew(
  bookingNumber: string,
  crewMembers: Array<{
    name: string;
    passport: string;
    dateOfBirth?: string;
    nationality?: string;
  }>
) {
  console.log('👥 Saving crew to API...', { bookingNumber, crewMembers });

  const response = await fetch(`${API_URL}/update-charter-crew.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingNumber,
      crewMembers
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save crew members');
  }

  console.log('✅ Crew saved successfully');
  return response.json();
}

/**
 * 🔥 Load charter crew members from API
 * @param bookingNumber - The booking number/code
 * @returns Array of crew members or null if not found
 */
export async function loadCharterCrew(bookingNumber: string) {
  console.log('👥 Loading crew from API...', { bookingNumber });

  try {
    const booking = await getBooking(bookingNumber);
    if (booking && booking.bookingData?.crewMembers) {
      console.log('✅ Crew loaded successfully:', booking.bookingData.crewMembers);
      return booking.bookingData.crewMembers;
    }
    console.log('ℹ️ No crew members found for booking');
    return null;
  } catch (error) {
    console.error('❌ Error loading crew:', error);
    return null;
  }
}

/**
 * Update charter payments
 * @param bookingNumber - The booking number/code
 * @param payments - Array of payment objects {date, amount}
 * @param paymentStatus - Payment status (Pending, Partial, Paid)
 */
export async function updateCharterPayments(
  bookingNumber: string,
  payments: Array<{date: string, amount: number}>,
  paymentStatus: string
) {
  console.log('💰 updateCharterPayments called:', { bookingNumber, payments, paymentStatus });

  // First get the existing booking
  const existing = await getBooking(bookingNumber);
  console.log('💰 Existing booking:', existing);
  if (!existing) {
    throw new Error('Booking not found');
  }

  // Update the bookingData with payments
  const updatedBookingData = {
    ...(existing.bookingData || existing),
    payments,
    paymentStatus,
    updatedAt: new Date().toISOString()
  };
  console.log('💰 Updated bookingData:', updatedBookingData);

  // 🔥 FIX 21: Encode booking number for URL (handles spaces in "CHARTER PARTY NO 2")
  const encodedBookingNumber = encodeURIComponent(bookingNumber);
  const response = await fetch(`${API_URL}/bookings/${encodedBookingNumber}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingData: updatedBookingData })
  });

  console.log('💰 API response status:', response.status);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Booking not found');
    throw new Error('Failed to update payments');
  }
  return response.json();
}

/**
 * Delete booking
 * @param bookingNumber - The booking number
 */
export async function deleteBooking(bookingNumber: string) {
  const response = await fetch(`${API_URL}/bookings/${bookingNumber}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('Booking not found');
    throw new Error('Failed to delete booking');
  }
  return response.json();
}

/**
 * Save or update booking (upsert)
 * Checks if booking exists, creates or updates accordingly
 */
export async function saveBooking(
  bookingNumber: string,
  data: {
    bookingData?: any;
    page2DataCheckIn?: any;
    page2DataCheckOut?: any;
    page3DataCheckIn?: any;
    page3DataCheckOut?: any;
    page4DataCheckIn?: any;
    page4DataCheckOut?: any;
  }
) {
  try {
    // Try to get existing booking
    const existing = await getBooking(bookingNumber);

    if (existing) {
      // Update existing
      return await updateBooking(bookingNumber, data);
    } else {
      // Create new
      return await createBooking({
        bookingNumber,
        ...data
      });
    }
  } catch (error) {
    console.error('Error saving booking:', error);
    throw error;
  }
}

// =====================================================
// HYBRID APPROACH - API FIRST, LOCALSTORAGE FALLBACK
// =====================================================

/**
 * Hybrid: Get all bookings from API, fallback to localStorage
 */
export async function getBookingsHybrid() {
  try {
    const response = await getBookings();
    console.log('✅ Bookings loaded from API');
    return response.bookings || {};
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage fallback', error);
    const bookings = localStorage.getItem('bookings');
    return bookings ? JSON.parse(bookings) : {};
  }
}

/**
 * Hybrid: Get single booking from API, fallback to localStorage
 */
export async function getBookingHybrid(bookingNumber: string) {
  try {
    const booking = await getBooking(bookingNumber);
    if (booking) {
      console.log('✅ Booking loaded from API:', bookingNumber);
      return booking;
    }
  } catch (error) {
    console.warn('⚠️ API failed for booking, using localStorage fallback', error);
  }

  // Fallback to localStorage
  const bookings = localStorage.getItem('bookings');
  if (bookings) {
    const parsed = JSON.parse(bookings);
    return parsed[bookingNumber] || null;
  }
  return null;
}

/**
 * Hybrid: Save booking to API first, then sync to localStorage
 */
export async function saveBookingHybrid(
  bookingNumber: string,
  data: {
    bookingData?: any;
    page2DataCheckIn?: any;
    page2DataCheckOut?: any;
    page3DataCheckIn?: any;
    page3DataCheckOut?: any;
    page4DataCheckIn?: any;
    page4DataCheckOut?: any;
  }
) {
  // Save to localStorage immediately for offline support
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');

  if (!bookings[bookingNumber]) {
    bookings[bookingNumber] = {
      bookingData: data.bookingData || {},
      page2DataCheckIn: data.page2DataCheckIn || null,
      page2DataCheckOut: data.page2DataCheckOut || null,
      page3DataCheckIn: data.page3DataCheckIn || null,
      page3DataCheckOut: data.page3DataCheckOut || null,
      page4DataCheckIn: data.page4DataCheckIn || null,
      page4DataCheckOut: data.page4DataCheckOut || null,
      lastModified: new Date().toISOString(),
      synced: false
    };
  } else {
    // Merge data
    if (data.bookingData) bookings[bookingNumber].bookingData = data.bookingData;
    if (data.page2DataCheckIn) bookings[bookingNumber].page2DataCheckIn = data.page2DataCheckIn;
    if (data.page2DataCheckOut) bookings[bookingNumber].page2DataCheckOut = data.page2DataCheckOut;
    if (data.page3DataCheckIn) bookings[bookingNumber].page3DataCheckIn = data.page3DataCheckIn;
    if (data.page3DataCheckOut) bookings[bookingNumber].page3DataCheckOut = data.page3DataCheckOut;
    if (data.page4DataCheckIn) bookings[bookingNumber].page4DataCheckIn = data.page4DataCheckIn;
    if (data.page4DataCheckOut) bookings[bookingNumber].page4DataCheckOut = data.page4DataCheckOut;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
  }

  localStorage.setItem('bookings', JSON.stringify(bookings));
  console.log('💾 Booking saved to localStorage:', bookingNumber);

  // Try to save to API
  try {
    const result = await saveBooking(bookingNumber, data);

    // Mark as synced
    bookings[bookingNumber].synced = true;
    localStorage.setItem('bookings', JSON.stringify(bookings));

    console.log('✅ Booking synced to API:', bookingNumber);
    return result;
  } catch (error) {
    console.warn('⚠️ Failed to sync to API, will retry later', error);
    return bookings[bookingNumber];
  }
}

/**
 * Hybrid: Delete booking from API and localStorage
 */
export async function deleteBookingHybrid(bookingNumber: string) {
  // Delete from localStorage
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  delete bookings[bookingNumber];
  localStorage.setItem('bookings', JSON.stringify(bookings));
  console.log('💾 Booking deleted from localStorage:', bookingNumber);

  // Try to delete from API
  try {
    await deleteBooking(bookingNumber);
    console.log('✅ Booking deleted from API:', bookingNumber);
  } catch (error) {
    console.warn('⚠️ Failed to delete from API', error);
  }
}

/**
 * Hybrid: Get bookings for a specific vessel from API, merge with localStorage
 * @param vesselId - The vessel ID to fetch bookings for
 */
export async function getBookingsByVesselHybrid(vesselId: number | string): Promise<any[]> {
  const localKey = `fleet_${vesselId}_ΝΑΥΛΑ`;
  let localCharters: any[] = [];

  // Load from localStorage first
  try {
    const stored = localStorage.getItem(localKey);
    if (stored) {
      localCharters = JSON.parse(stored);
    }
  } catch (e) {
    console.warn('⚠️ Error reading localStorage:', e);
  }

  // Try to fetch from API
  try {
    // 🔥 FIX 17: Convert vessel ID to name for API call
    const vesselName = typeof vesselId === 'number' ? VESSEL_NAMES[vesselId] : vesselId;
    console.log(`🔍 API Call: vesselId=${vesselId}, vesselName=${vesselName}`);
    const response = await fetch(`${API_URL}/bookings?vessel=${encodeURIComponent(vesselName || String(vesselId))}`);
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    // 🔥 FIX: API returns bookings as OBJECT {code: data}, convert to array
    const bookingsObj = data.bookings || {};
    const apiCharters = Array.isArray(bookingsObj)
      ? bookingsObj
      : Object.values(bookingsObj).map((b: any) => b.bookingData || b);

    console.log(`✅ Loaded ${apiCharters.length} charters from API for vessel ${vesselId}`);

    // Merge API data with localStorage (API takes priority for same booking code)
    const mergedCharters = mergeCharters(apiCharters, localCharters);

    // Update localStorage with merged data
    localStorage.setItem(localKey, JSON.stringify(mergedCharters));

    return mergedCharters;
  } catch (error) {
    console.warn(`⚠️ API failed for vessel ${vesselId}, using localStorage fallback:`, error);
    return localCharters;
  }
}

/**
 * Hybrid: Get ALL bookings from API, organized by vessel, merged with localStorage
 */
export async function getAllBookingsHybrid(): Promise<{ [vesselId: string]: any[] }> {
  const result: { [vesselId: string]: any[] } = {};

  // Try to fetch all bookings from API
  try {
    const response = await fetch(`${API_URL}/bookings`);
    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    // 🔥 FIX: API returns bookings as OBJECT {code: data}, convert to array
    const bookingsObj = data.bookings || {};
    const apiBookings = Array.isArray(bookingsObj)
      ? bookingsObj
      : Object.values(bookingsObj);

    console.log(`✅ Loaded ${apiBookings.length} total bookings from API`);

    // Group by vesselId
    for (const booking of apiBookings) {
      const bookingData = (booking as any).bookingData || booking;
      const vesselId = bookingData?.vesselId || (booking as any).vesselId;
      if (vesselId) {
        if (!result[vesselId]) result[vesselId] = [];
        result[vesselId].push(bookingData);
      }
    }

    // Merge with localStorage for each vessel
    const allLocalStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('fleet_') && k.endsWith('_ΝΑΥΛΑ'));
    for (const key of allLocalStorageKeys) {
      const vesselIdMatch = key.match(/fleet_(.+)_ΝΑΥΛΑ/);
      if (vesselIdMatch) {
        const vesselId = vesselIdMatch[1];
        try {
          const localCharters = JSON.parse(localStorage.getItem(key) || '[]');
          const apiCharters = result[vesselId] || [];
          result[vesselId] = mergeCharters(apiCharters, localCharters);
          // Update localStorage
          localStorage.setItem(key, JSON.stringify(result[vesselId]));
        } catch (e) {
          console.warn(`Error merging for ${key}:`, e);
        }
      }
    }

    return result;
  } catch (error) {
    console.warn('⚠️ API failed, loading all from localStorage:', error);

    // Fallback: load all from localStorage
    const allLocalStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('fleet_') && k.endsWith('_ΝΑΥΛΑ'));
    for (const key of allLocalStorageKeys) {
      const vesselIdMatch = key.match(/fleet_(.+)_ΝΑΥΛΑ/);
      if (vesselIdMatch) {
        const vesselId = vesselIdMatch[1];
        try {
          result[vesselId] = JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
          console.warn(`Error reading ${key}:`, e);
        }
      }
    }

    return result;
  }
}

/**
 * Helper: Merge API charters with local charters (API takes priority for same code/id)
 */
function mergeCharters(apiCharters: any[], localCharters: any[]): any[] {
  const merged = new Map<string, any>();

  // Add local charters first
  for (const charter of localCharters) {
    const key = charter.code || charter.id;
    if (key) merged.set(key, charter);
  }

  // Override with API charters (they have priority)
  for (const charter of apiCharters) {
    const key = charter.code || charter.id;
    if (key) {
      const existing = merged.get(key);
      if (existing) {
        // Merge: API data takes priority, but keep local payments if API doesn't have them
        const mergedCharter = { ...existing, ...charter };
        // 🔥 FIX 21: Preserve payments - use API payments if available, otherwise keep local
        if (charter.payments && charter.payments.length > 0) {
          mergedCharter.payments = charter.payments;
          mergedCharter.paymentStatus = charter.paymentStatus;
        } else if (existing.payments && existing.payments.length > 0) {
          mergedCharter.payments = existing.payments;
          mergedCharter.paymentStatus = existing.paymentStatus;
        }
        merged.set(key, mergedCharter);
      } else {
        merged.set(key, charter);
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * Sync all unsynced bookings to API
 */
export async function syncUnsyncedBookings() {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  const unsyncedBookings = Object.entries(bookings).filter(
    ([_, booking]: [string, any]) => !booking.synced
  );

  if (unsyncedBookings.length === 0) {
    console.log('✅ All bookings are synced');
    return { success: 0, failed: 0 };
  }

  console.log(`🔄 Syncing ${unsyncedBookings.length} unsynced bookings...`);

  let success = 0;
  let failed = 0;

  for (const [bookingNumber, booking] of unsyncedBookings) {
    try {
      await saveBooking(bookingNumber as string, {
        bookingData: (booking as any).bookingData,
        page2DataCheckIn: (booking as any).page2DataCheckIn,
        page2DataCheckOut: (booking as any).page2DataCheckOut,
        page3DataCheckIn: (booking as any).page3DataCheckIn,
        page3DataCheckOut: (booking as any).page3DataCheckOut,
        page4DataCheckIn: (booking as any).page4DataCheckIn,
        page4DataCheckOut: (booking as any).page4DataCheckOut
      });

      // Mark as synced
      (booking as any).synced = true;
      success++;
      console.log('✅ Synced:', bookingNumber);
    } catch (error) {
      console.error('❌ Failed to sync:', bookingNumber, error);
      failed++;
    }
  }

  // Update localStorage with synced status
  localStorage.setItem('bookings', JSON.stringify(bookings));

  console.log(`✅ Sync complete: ${success} succeeded, ${failed} failed`);
  return { success, failed };
}
