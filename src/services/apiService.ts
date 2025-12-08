// Production API base URL - always use this, even when running locally
const API_BASE = 'https://yachtmanagementsuite.com/api';
const API_URL = API_BASE;
const PAGE1_API_URL = `${API_BASE}/page1.php`;

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
  bookingData?: any;
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
  // 🔥 FIX: Get vessel name from ID for key lookup
  const vesselName = typeof vesselId === 'number' ? VESSEL_NAMES[vesselId] : vesselId;

  // 🔥 FIX: Check ALL possible localStorage key variations
  const keysToCheck = [
    `fleet_${vesselId}_ΝΑΥΛΑ`,                         // By ID (e.g., fleet_7_ΝΑΥΛΑ)
    `fleet_${vesselName}_ΝΑΥΛΑ`,                       // By name exact (e.g., fleet_Perla_ΝΑΥΛΑ)
    `fleet_${vesselName?.toUpperCase()}_ΝΑΥΛΑ`,        // By name UPPER (e.g., fleet_PERLA_ΝΑΥΛΑ)
    `fleet_${vesselName?.toLowerCase()}_ΝΑΥΛΑ`,        // By name lower (e.g., fleet_perla_ΝΑΥΛΑ)
  ].filter(k => k && !k.includes('undefined'));

  // 🔥 FIX: Also scan ALL localStorage keys for any that match this vessel
  const allStorageKeys = Object.keys(localStorage);
  const fleetKeys = allStorageKeys.filter(k => k.startsWith('fleet_') && k.endsWith('_ΝΑΥΛΑ'));

  fleetKeys.forEach(key => {
    const match = key.match(/^fleet_(.+)_ΝΑΥΛΑ$/);
    if (match) {
      const keyVesselId = match[1];
      // Check if this key's vesselId matches our vessel (case-insensitive)
      if (keyVesselId.toLowerCase() === vesselName?.toLowerCase() ||
          keyVesselId.toLowerCase() === String(vesselId).toLowerCase()) {
        if (!keysToCheck.includes(key)) {
          keysToCheck.push(key);
          console.log(`   🔍 getBookingsByVesselHybrid: Added matching key: ${key}`);
        }
      }
    }
  });

  console.log(`🔍 getBookingsByVesselHybrid: vesselId=${vesselId}, vesselName=${vesselName}, keysToCheck:`, keysToCheck);

  let localCharters: any[] = [];

  // 🔥 FIX: Load from ALL matching localStorage keys
  for (const keyToCheck of keysToCheck) {
    try {
      const stored = localStorage.getItem(keyToCheck);
      if (stored) {
        const charters = JSON.parse(stored);
        // Add only if not already in the list (avoid duplicates by code/id)
        charters.forEach((c: any) => {
          const charterKey = c.code || c.id;
          if (charterKey && !localCharters.find(existing => (existing.code || existing.id) === charterKey)) {
            localCharters.push(c);
          }
        });
        console.log(`   ✅ Loaded ${charters.length} charters from ${keyToCheck}`);
      }
    } catch (e) {
      console.warn(`⚠️ Error reading localStorage key ${keyToCheck}:`, e);
    }
  }

  console.log(`📦 Total local charters found: ${localCharters.length}`);

  // 🔥 FIX: Primary key for saving back (use boat ID for consistency with FleetManagement)
  const primaryKey = `fleet_${vesselId}_ΝΑΥΛΑ`;

  // Try to fetch from API
  try {
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

    // 🔥 FIX: Only update localStorage if we have data (don't overwrite with empty)
    if (mergedCharters.length > 0 || localCharters.length === 0) {
      localStorage.setItem(primaryKey, JSON.stringify(mergedCharters));
      console.log(`💾 Saved ${mergedCharters.length} charters to ${primaryKey}`);
    } else {
      console.log(`⚠️ Skipping localStorage save - would overwrite ${localCharters.length} local charters with empty API result`);
    }

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

// =====================================================
// CHAT MESSAGES API
// =====================================================

const CHAT_API_URL = 'https://yachtmanagementsuite.com/api/chat-messages.php';

export interface ChatMessage {
  id?: number;
  chat_id: string;
  booking_code: string;
  vessel_name?: string;
  customer_name?: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  recipient_role: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
  message: string;
  timestamp?: string;
  read_status?: number;
  is_visitor?: number;
}

export interface Chat {
  id?: number;
  chat_id: string;
  booking_code: string;
  vessel_name?: string;
  customer_name?: string;
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
  status?: 'ACTIVE' | 'CLOSED';
  is_visitor?: number;
  messages?: ChatMessage[];
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

/**
 * Get all chats with optional filters
 */
export async function getChats(filters?: {
  category?: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ALL';
  booking_code?: string;
  recipient_role?: string;
  status?: 'ACTIVE' | 'CLOSED';
}): Promise<{ success: boolean; chats: Chat[] }> {
  try {
    const params = new URLSearchParams();
    params.append('action', 'chats');
    if (filters?.category) params.append('category', filters.category);
    if (filters?.booking_code) params.append('booking_code', filters.booking_code);
    if (filters?.recipient_role) params.append('recipient_role', filters.recipient_role);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${CHAT_API_URL}?${params.toString()}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error fetching chats:', error);
    return { success: false, chats: [] };
  }
}

/**
 * Get messages for a specific chat
 */
export async function getChatMessages(chatId: string, since?: string): Promise<{ success: boolean; messages: ChatMessage[] }> {
  try {
    const params = new URLSearchParams();
    params.append('action', 'messages');
    params.append('chat_id', chatId);
    if (since) params.append('since', since);

    const response = await fetch(`${CHAT_API_URL}?${params.toString()}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return { success: false, messages: [] };
  }
}

/**
 * Get unread message count
 */
export async function getChatUnreadCount(filters: {
  booking_code?: string;
  role?: string;
}): Promise<{ success: boolean; unread_count: number }> {
  try {
    const params = new URLSearchParams();
    params.append('action', 'unread');
    if (filters.booking_code) params.append('booking_code', filters.booking_code);
    if (filters.role) params.append('role', filters.role);

    const response = await fetch(`${CHAT_API_URL}?${params.toString()}`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    return { success: false, unread_count: 0 };
  }
}

/**
 * Create a new chat
 */
export async function createChat(data: {
  chat_id?: string;
  booking_code: string;
  vessel_name?: string;
  customer_name?: string;
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
  is_visitor?: number;
}): Promise<{ success: boolean; chat: Chat; existing: boolean }> {
  try {
    const response = await fetch(`${CHAT_API_URL}?action=chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    throw error;
  }
}

/**
 * Send a chat message
 */
export async function sendChatMessage(data: {
  chat_id: string;
  booking_code: string;
  vessel_name?: string;
  customer_name?: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'CUSTOMER' | 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  recipient_role: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING' | 'ADMIN';
  category: 'TECHNICAL' | 'FINANCIAL' | 'BOOKING';
  message: string;
  is_visitor?: number;
}): Promise<{ success: boolean; message: ChatMessage }> {
  try {
    const response = await fetch(`${CHAT_API_URL}?action=message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    throw error;
  }
}

/**
 * Mark messages as read
 */
export async function markChatMessagesRead(chatId: string, reader: string): Promise<{ success: boolean; updated: number }> {
  try {
    const response = await fetch(`${CHAT_API_URL}?action=mark-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, reader })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    return { success: false, updated: 0 };
  }
}

/**
 * Update chat status (ACTIVE/CLOSED)
 */
export async function updateChatStatus(chatId: string, status: 'ACTIVE' | 'CLOSED'): Promise<{ success: boolean; updated: number }> {
  try {
    const response = await fetch(`${CHAT_API_URL}?action=chat-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, status })
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('❌ Error updating chat status:', error);
    return { success: false, updated: 0 };
  }
}

// =====================================================
// 🔥 FIX 31: AUTO-EXPIRE OPTIONS AFTER 6 DAYS
// =====================================================

/**
 * Check for expired options (older than 6 days) and update their status
 * This function should be called on dashboard load and during auto-refresh
 *
 * @returns Array of expired charter codes
 */
export async function checkExpiredOptions(): Promise<string[]> {
  const expiredCharters: string[] = [];
  const now = new Date();
  const EXPIRE_DAYS = 6;

  try {
    console.log('🔍 Checking for expired options...');

    // Get all bookings from all vessels
    const allBookings = await getAllBookingsHybrid();

    for (const vesselId in allBookings) {
      const charters = allBookings[vesselId] || [];

      for (const charter of charters) {
        // Only check "Option" or "Pending" status
        if (charter.status !== 'Option' && charter.status !== 'Pending') {
          continue;
        }

        // Get creation date - use createdAt, created_at, or startDate as fallback
        const createdDateStr = charter.createdAt || charter.created_at || charter.startDate;
        if (!createdDateStr) continue;

        const createdDate = new Date(createdDateStr);
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff >= EXPIRE_DAYS) {
          console.log(`⏰ Option expired: ${charter.code} - ${daysDiff.toFixed(1)} days old`);

          try {
            // Update status to "Expired"
            const updatedCharter = { ...charter, status: 'Expired' };
            await saveBookingHybrid(charter.code, { bookingData: updatedCharter });

            expiredCharters.push(charter.code);
            console.log(`✅ Charter ${charter.code} marked as Expired`);
          } catch (updateError) {
            console.error(`❌ Failed to expire charter ${charter.code}:`, updateError);
          }
        }
      }
    }

    if (expiredCharters.length > 0) {
      console.log(`⚠️ Expired ${expiredCharters.length} option(s):`, expiredCharters);
    } else {
      console.log('✅ No expired options found');
    }

    return expiredCharters;
  } catch (error) {
    console.error('❌ Error checking expired options:', error);
    return [];
  }
}

// =====================================================
// PAGE 1 SPECIFIC API - Booking Details
// =====================================================

/**
 * Page 1 form data interface
 */
export interface Page1FormData {
  bookingNumber: string;
  vesselName?: string;
  vesselId?: string;
  vesselCategory?: string;
  checkInDate?: string;
  checkInTime?: string;
  checkOutDate?: string;
  checkOutTime?: string;
  departurePort?: string;
  arrivalPort?: string;
  skipperFirstName?: string;
  skipperLastName?: string;
  skipperAddress?: string;
  skipperEmail?: string;
  skipperPhone?: string;
  skipperNationality?: string;
  skipperPassport?: string;
  phoneCountryCode?: string;
  mode?: 'in' | 'out';
  status?: string;
  source?: 'page1' | 'fleetManagement';  // 🔥 Track where booking was created
}

/**
 * Get Page 1 booking details from API
 * @param bookingNumber - The booking number to load
 * @returns Page 1 form data or null
 */
export async function getPage1Data(bookingNumber: string): Promise<Page1FormData | null> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE1_API_URL}?booking_number=${encodedBN}`);

    if (!response.ok) {
      console.warn('⚠️ Page 1 API GET failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.bookingDetails) {
      console.log('✅ Page 1 data loaded from API:', bookingNumber);
      return result.bookingDetails;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Page 1 API error:', error);
    return null;
  }
}

/**
 * Save Page 1 booking details to API (POST for new, PUT for update)
 * @param bookingNumber - The booking number
 * @param data - Page 1 form data
 * @param isNew - Whether this is a new booking (POST) or update (PUT)
 */
export async function savePage1Data(
  bookingNumber: string,
  data: Page1FormData,
  isNew: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    const method = isNew ? 'POST' : 'PUT';

    const response = await fetch(PAGE1_API_URL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingNumber,
        ...data
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Page 1 data ${isNew ? 'created' : 'updated'} via API:`, bookingNumber);
      return { success: true, message: result.message };
    }

    // If POST fails with 409 (already exists), try PUT
    if (!result.success && response.status === 409 && isNew) {
      console.log('📝 Booking exists, updating instead...');
      return savePage1Data(bookingNumber, data, false);
    }

    console.warn('⚠️ Page 1 API save failed:', result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn('⚠️ Page 1 API save error:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Delete Page 1 booking data from API
 * @param bookingNumber - The booking number to delete
 */
export async function deletePage1Data(bookingNumber: string): Promise<boolean> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE1_API_URL}?booking_number=${encodedBN}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 1 data deleted from API:', bookingNumber);
      return true;
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Page 1 API delete error:', error);
    return false;
  }
}

/**
 * Hybrid: Load Page 1 data from API, fallback to localStorage
 * @param bookingNumber - The booking number to load
 */
export async function getPage1DataHybrid(bookingNumber: string): Promise<Page1FormData | null> {
  // Try API first
  try {
    const apiData = await getPage1Data(bookingNumber);
    if (apiData) {
      return apiData;
    }
  } catch (error) {
    console.warn('⚠️ Page 1 API failed, trying localStorage...', error);
  }

  // Fallback to localStorage
  try {
    const bookings = localStorage.getItem('bookings');
    if (bookings) {
      const parsed = JSON.parse(bookings);
      const booking = parsed[bookingNumber];
      if (booking?.bookingData) {
        console.log('📂 Page 1 data loaded from localStorage:', bookingNumber);
        return booking.bookingData as Page1FormData;
      }
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save Page 1 data to API and localStorage
 * @param bookingNumber - The booking number
 * @param data - Page 1 form data
 */
export async function savePage1DataHybrid(
  bookingNumber: string,
  data: Page1FormData
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;

  // Save to localStorage immediately (for offline support)
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');

    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = {
        bookingData: data,
        lastModified: new Date().toISOString(),
        synced: false
      };
    } else {
      bookings[bookingNumber].bookingData = data;
      bookings[bookingNumber].lastModified = new Date().toISOString();
      bookings[bookingNumber].synced = false;
    }

    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('currentBooking', bookingNumber);
    console.log('💾 Page 1 saved to localStorage:', bookingNumber);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    // Check if booking exists in API
    const existing = await getPage1Data(bookingNumber);
    const isNew = !existing;

    const result = await savePage1Data(bookingNumber, data, isNew);

    if (result.success) {
      // Mark as synced in localStorage
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingNumber]) {
        bookings[bookingNumber].synced = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}

// =====================================================
// WINTER/TASK CHECKIN API - Per Vessel Data Storage
// =====================================================

/**
 * Generic interface for checkin data
 */
export interface CheckinData {
  vesselId: number;
  vesselName: string;
  category?: string;  // For task category checkins
  sections: any;
  customSections?: any;
  generalNotes?: string;
  lastSaved: string;
}

/**
 * Get checkin data from API
 * @param endpoint - API endpoint (e.g., 'winterization-checkin', 'winter-inventory')
 * @param vesselId - The vessel ID
 * @param category - Optional category for task checkins
 */
export async function getCheckinData(
  endpoint: string,
  vesselId: number,
  category?: string
): Promise<CheckinData | null> {
  try {
    const url = category
      ? `${API_URL}/${endpoint}/${vesselId}?category=${encodeURIComponent(category)}`
      : `${API_URL}/${endpoint}/${vesselId}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ ${endpoint} data loaded from API for vessel ${vesselId}`);
    return result.data || result;
  } catch (error) {
    console.warn(`⚠️ ${endpoint} API GET failed:`, error);
    return null;
  }
}

/**
 * Save checkin data to API
 * @param endpoint - API endpoint
 * @param data - Checkin data to save
 */
export async function saveCheckinData(
  endpoint: string,
  data: CheckinData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${API_URL}/${endpoint}/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success || response.ok) {
      console.log(`✅ ${endpoint} data saved to API for vessel ${data.vesselId}`);
      return { success: true, message: result.message };
    }

    console.warn(`⚠️ ${endpoint} API save failed:`, result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn(`⚠️ ${endpoint} API save error:`, error);
    return { success: false, message: String(error) };
  }
}

/**
 * Hybrid: Get checkin data from API, fallback to localStorage
 */
export async function getCheckinDataHybrid(
  endpoint: string,
  vesselId: number,
  localStorageKey: string,
  category?: string
): Promise<CheckinData | null> {
  // Try API first
  try {
    const apiData = await getCheckinData(endpoint, vesselId, category);
    if (apiData) {
      // Update localStorage with API data
      localStorage.setItem(localStorageKey, JSON.stringify(apiData));
      return apiData;
    }
  } catch (error) {
    console.warn(`⚠️ ${endpoint} API failed, trying localStorage...`, error);
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(localStorageKey);
    if (stored) {
      console.log(`📂 ${endpoint} data loaded from localStorage`);
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save checkin data to API and localStorage
 */
export async function saveCheckinDataHybrid(
  endpoint: string,
  data: CheckinData,
  localStorageKey: string
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;

  // Save to localStorage immediately
  try {
    localStorage.setItem(localStorageKey, JSON.stringify({
      ...data,
      synced: false
    }));
    console.log(`💾 ${endpoint} saved to localStorage`);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    const result = await saveCheckinData(endpoint, data);
    if (result.success) {
      // Mark as synced in localStorage
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.synced = true;
        localStorage.setItem(localStorageKey, JSON.stringify(parsed));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}

// =====================================================
// WINTERIZATION CHECKIN API
// =====================================================

export async function getWinterizationCheckin(vesselId: number): Promise<CheckinData | null> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winterization_${vesselName.replace(/\s+/g, '_').toLowerCase()}_data`;
  return getCheckinDataHybrid('winterization-checkin', vesselId, localKey);
}

export async function saveWinterizationCheckin(vesselId: number, sections: any, customSections: any, generalNotes: string): Promise<{ success: boolean; synced: boolean }> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winterization_${vesselName.replace(/\s+/g, '_').toLowerCase()}_data`;
  return saveCheckinDataHybrid('winterization-checkin', {
    vesselId,
    vesselName,
    sections,
    customSections,
    generalNotes,
    lastSaved: new Date().toISOString()
  }, localKey);
}

// =====================================================
// WINTER MAINTENANCE INVENTORY API
// =====================================================

export async function getWinterInventory(vesselId: number): Promise<CheckinData | null> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_inventory_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return getCheckinDataHybrid('winter-inventory', vesselId, localKey);
}

export async function saveWinterInventory(vesselId: number, sections: any, customSections: any, generalNotes: string): Promise<{ success: boolean; synced: boolean }> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_inventory_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return saveCheckinDataHybrid('winter-inventory', {
    vesselId,
    vesselName,
    sections,
    customSections,
    generalNotes,
    lastSaved: new Date().toISOString()
  }, localKey);
}

// =====================================================
// WINTER SAFETY EQUIPMENT API
// =====================================================

export async function getWinterSafety(vesselId: number): Promise<CheckinData | null> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_safety_equipment_v3_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return getCheckinDataHybrid('safety-equipment', vesselId, localKey);
}

export async function saveWinterSafety(vesselId: number, sections: any, customSections: any, generalNotes: string): Promise<{ success: boolean; synced: boolean }> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_safety_equipment_v3_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return saveCheckinDataHybrid('safety-equipment', {
    vesselId,
    vesselName,
    sections,
    customSections,
    generalNotes,
    lastSaved: new Date().toISOString()
  }, localKey);
}

// =====================================================
// WINTER TAKEOVER API
// =====================================================

export async function getWinterTakeover(vesselId: number): Promise<CheckinData | null> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_take_over_v3_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return getCheckinDataHybrid('winter-takeover', vesselId, localKey);
}

export async function saveWinterTakeover(vesselId: number, sections: any, customSections: any, generalNotes: string): Promise<{ success: boolean; synced: boolean }> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `winter_take_over_v3_${vesselName.replace(/\s+/g, '_').toLowerCase()}`;
  return saveCheckinDataHybrid('winter-takeover', {
    vesselId,
    vesselName,
    sections,
    customSections,
    generalNotes,
    lastSaved: new Date().toISOString()
  }, localKey);
}

// =====================================================
// TASK CATEGORY CHECKIN API
// =====================================================

export async function getTaskCheckin(vesselId: number, category: string): Promise<CheckinData | null> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `task_${category}_${vesselName.replace(/\s+/g, '_').toLowerCase()}_data`;
  return getCheckinDataHybrid('task-checkins', vesselId, localKey, category);
}

export async function saveTaskCheckin(vesselId: number, category: string, sections: any, customSections: any, generalNotes: string): Promise<{ success: boolean; synced: boolean }> {
  const vesselName = VESSEL_NAMES[vesselId] || '';
  const localKey = `task_${category}_${vesselName.replace(/\s+/g, '_').toLowerCase()}_data`;
  return saveCheckinDataHybrid('task-checkins', {
    vesselId,
    vesselName,
    category,
    sections,
    customSections,
    generalNotes,
    lastSaved: new Date().toISOString()
  }, localKey);
}

// =====================================================
// PAGE 2 API - Crew List & Passengers
// =====================================================

const PAGE2_API_URL = `${API_BASE}/page2.php`;

export interface CrewMember {
  firstName?: string;
  lastName?: string;
  nationality?: string;
  passportNumber?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  role?: string;
}

/**
 * Get Page 2 crew data from API
 * @param bookingNumber - The booking number
 */
export async function getPage2Data(bookingNumber: string): Promise<{ crewList: CrewMember[] } | null> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE2_API_URL}?booking_number=${encodedBN}`);

    if (!response.ok) {
      console.warn('⚠️ Page 2 API GET failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.crewList) {
      console.log('✅ Page 2 data loaded from API:', bookingNumber);
      return { crewList: result.crewList };
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Page 2 API error:', error);
    return null;
  }
}

/**
 * Save Page 2 crew data to API
 * @param bookingNumber - The booking number
 * @param crewList - Array of crew members
 */
export async function savePage2Data(
  bookingNumber: string,
  crewList: CrewMember[]
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(PAGE2_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingNumber,
        crewList
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 2 data saved to API:', bookingNumber);
      return { success: true, message: result.message };
    }

    // If POST fails with 409 (already exists), try PUT
    if (response.status === 409) {
      console.log('📝 Page 2 data exists, updating...');
      const putResponse = await fetch(PAGE2_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingNumber, crewList })
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, message: putResult.message };
    }

    console.warn('⚠️ Page 2 API save failed:', result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn('⚠️ Page 2 API save error:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Hybrid: Load Page 2 data from API, fallback to localStorage
 */
export async function getPage2DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  // Try API first
  try {
    const apiData = await getPage2Data(bookingNumber);
    if (apiData) {
      return apiData;
    }
  } catch (error) {
    console.warn('⚠️ Page 2 API failed, trying localStorage...', error);
  }

  // Fallback to localStorage
  try {
    const bookings = localStorage.getItem('bookings');
    if (bookings) {
      const parsed = JSON.parse(bookings);
      const booking = parsed[bookingNumber];
      const key = mode === 'in' ? 'page2DataCheckIn' : 'page2DataCheckOut';
      if (booking?.[key]) {
        console.log('📂 Page 2 data loaded from localStorage:', bookingNumber);
        return booking[key];
      }
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save Page 2 data to API and localStorage
 */
export async function savePage2DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;
  const storageKey = mode === 'in' ? 'page2DataCheckIn' : 'page2DataCheckOut';

  // Save to localStorage immediately
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = { bookingData: {}, lastModified: new Date().toISOString(), synced: false };
    }
    bookings[bookingNumber][storageKey] = data;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    console.log('💾 Page 2 saved to localStorage:', bookingNumber);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    const crewList = data.crewList || data.crew || [];
    const result = await savePage2Data(bookingNumber, crewList);
    if (result.success) {
      // Mark as synced
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingNumber]) {
        bookings[bookingNumber].synced = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}

// =====================================================
// PAGE 3 API - Equipment Checklist
// =====================================================

const PAGE3_API_URL = `${API_BASE}/page3.php`;

export interface Page3EquipmentData {
  checklistData?: any;
  safetyEquipment?: any;
  navigationEquipment?: any;
  galleyEquipment?: any;
  deckEquipment?: any;
  cabinEquipment?: any;
  notes?: string;
  checkedBy?: string;
  checkedAt?: string;
}

/**
 * Get Page 3 equipment data from API
 */
export async function getPage3Data(bookingNumber: string): Promise<Page3EquipmentData | null> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE3_API_URL}?booking_number=${encodedBN}`);

    if (!response.ok) {
      console.warn('⚠️ Page 3 API GET failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.equipmentData) {
      console.log('✅ Page 3 data loaded from API:', bookingNumber);
      return result.equipmentData;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Page 3 API error:', error);
    return null;
  }
}

/**
 * Save Page 3 equipment data to API
 */
export async function savePage3Data(
  bookingNumber: string,
  data: Page3EquipmentData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(PAGE3_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingNumber, ...data })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 3 data saved to API:', bookingNumber);
      return { success: true, message: result.message };
    }

    // If POST fails with 409, try PUT
    if (response.status === 409) {
      console.log('📝 Page 3 data exists, updating...');
      const putResponse = await fetch(PAGE3_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingNumber, ...data })
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, message: putResult.message };
    }

    console.warn('⚠️ Page 3 API save failed:', result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn('⚠️ Page 3 API save error:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Hybrid: Load Page 3 data from API, fallback to localStorage
 */
export async function getPage3DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  // Try API first
  try {
    const apiData = await getPage3Data(bookingNumber);
    if (apiData) {
      return apiData;
    }
  } catch (error) {
    console.warn('⚠️ Page 3 API failed, trying localStorage...', error);
  }

  // Fallback to localStorage
  try {
    const bookings = localStorage.getItem('bookings');
    if (bookings) {
      const parsed = JSON.parse(bookings);
      const booking = parsed[bookingNumber];
      const key = mode === 'in' ? 'page3DataCheckIn' : 'page3DataCheckOut';
      if (booking?.[key]) {
        console.log('📂 Page 3 data loaded from localStorage:', bookingNumber);
        return booking[key];
      }
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save Page 3 data to API and localStorage
 */
export async function savePage3DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;
  const storageKey = mode === 'in' ? 'page3DataCheckIn' : 'page3DataCheckOut';

  // Save to localStorage immediately
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = { bookingData: {}, lastModified: new Date().toISOString(), synced: false };
    }
    bookings[bookingNumber][storageKey] = data;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    console.log('💾 Page 3 saved to localStorage:', bookingNumber);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    const result = await savePage3Data(bookingNumber, data);
    if (result.success) {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingNumber]) {
        bookings[bookingNumber].synced = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}

// =====================================================
// PAGE 4 API - Vessel Inspection
// =====================================================

const PAGE4_API_URL = `${API_BASE}/page4.php`;

export interface Page4InspectionData {
  inspectionType?: string;
  hullCondition?: string;
  deckCondition?: string;
  interiorCondition?: string;
  engineHours?: number;
  fuelLevel?: number;
  waterLevel?: number;
  batteryLevel?: number;
  damagesFound?: any[];
  photos?: any[];
  floorplanAnnotations?: any[];
  inspectorName?: string;
  inspectorSignature?: string;
  inspectionDate?: string;
  notes?: string;
}

/**
 * Get Page 4 inspection data from API
 */
export async function getPage4Data(bookingNumber: string): Promise<Page4InspectionData | null> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE4_API_URL}?booking_number=${encodedBN}`);

    if (!response.ok) {
      console.warn('⚠️ Page 4 API GET failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.inspectionData) {
      console.log('✅ Page 4 data loaded from API:', bookingNumber);
      return result.inspectionData;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Page 4 API error:', error);
    return null;
  }
}

/**
 * Save Page 4 inspection data to API
 */
export async function savePage4Data(
  bookingNumber: string,
  data: Page4InspectionData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(PAGE4_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingNumber, ...data })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 4 data saved to API:', bookingNumber);
      return { success: true, message: result.message };
    }

    // If POST fails with 409, try PUT
    if (response.status === 409) {
      console.log('📝 Page 4 data exists, updating...');
      const putResponse = await fetch(PAGE4_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingNumber, ...data })
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, message: putResult.message };
    }

    console.warn('⚠️ Page 4 API save failed:', result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn('⚠️ Page 4 API save error:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Hybrid: Load Page 4 data from API, fallback to localStorage
 */
export async function getPage4DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  // Try API first
  try {
    const apiData = await getPage4Data(bookingNumber);
    if (apiData) {
      return apiData;
    }
  } catch (error) {
    console.warn('⚠️ Page 4 API failed, trying localStorage...', error);
  }

  // Fallback to localStorage
  try {
    const bookings = localStorage.getItem('bookings');
    if (bookings) {
      const parsed = JSON.parse(bookings);
      const booking = parsed[bookingNumber];
      const key = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
      if (booking?.[key]) {
        console.log('📂 Page 4 data loaded from localStorage:', bookingNumber);
        return booking[key];
      }
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save Page 4 data to API and localStorage
 */
export async function savePage4DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;
  const storageKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';

  // Save to localStorage immediately
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = { bookingData: {}, lastModified: new Date().toISOString(), synced: false };
    }
    bookings[bookingNumber][storageKey] = data;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    console.log('💾 Page 4 saved to localStorage:', bookingNumber);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    const result = await savePage4Data(bookingNumber, data);
    if (result.success) {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingNumber]) {
        bookings[bookingNumber].synced = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}

// =====================================================
// PAGE 5 API - Final Agreement & Signatures
// =====================================================

const PAGE5_API_URL = `${API_BASE}/page5.php`;

export interface Page5AgreementData {
  agreementType?: string;
  termsAccepted?: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  depositMethod?: string;
  damageDeposit?: number;
  fuelCharge?: number;
  otherCharges?: any[];
  totalAmount?: number;
  skipperSignature?: string;
  skipperSignedAt?: string;
  companySignature?: string;
  companySignedAt?: string;
  companyRepresentative?: string;
  pdfGenerated?: boolean;
  pdfUrl?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  notes?: string;
}

/**
 * Get Page 5 agreement data from API
 */
export async function getPage5Data(bookingNumber: string): Promise<Page5AgreementData | null> {
  try {
    const encodedBN = encodeURIComponent(bookingNumber);
    const response = await fetch(`${PAGE5_API_URL}?booking_number=${encodedBN}`);

    if (!response.ok) {
      console.warn('⚠️ Page 5 API GET failed:', response.status);
      return null;
    }

    const result = await response.json();

    if (result.success && result.agreementData) {
      console.log('✅ Page 5 data loaded from API:', bookingNumber);
      return result.agreementData;
    }

    return null;
  } catch (error) {
    console.warn('⚠️ Page 5 API error:', error);
    return null;
  }
}

/**
 * Save Page 5 agreement data to API
 */
export async function savePage5Data(
  bookingNumber: string,
  data: Page5AgreementData
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(PAGE5_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingNumber, ...data })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 5 data saved to API:', bookingNumber);
      return { success: true, message: result.message };
    }

    // If POST fails with 409, try PUT
    if (response.status === 409) {
      console.log('📝 Page 5 data exists, updating...');
      const putResponse = await fetch(PAGE5_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingNumber, ...data })
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, message: putResult.message };
    }

    console.warn('⚠️ Page 5 API save failed:', result.error);
    return { success: false, message: result.error };
  } catch (error) {
    console.warn('⚠️ Page 5 API save error:', error);
    return { success: false, message: String(error) };
  }
}

/**
 * Hybrid: Load Page 5 data from API, fallback to localStorage
 */
export async function getPage5DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  // Try API first
  try {
    const apiData = await getPage5Data(bookingNumber);
    if (apiData) {
      return apiData;
    }
  } catch (error) {
    console.warn('⚠️ Page 5 API failed, trying localStorage...', error);
  }

  // Fallback to localStorage
  try {
    const bookings = localStorage.getItem('bookings');
    if (bookings) {
      const parsed = JSON.parse(bookings);
      const booking = parsed[bookingNumber];
      const key = mode === 'in' ? 'page5DataCheckIn' : 'page5DataCheckOut';
      if (booking?.[key]) {
        console.log('📂 Page 5 data loaded from localStorage:', bookingNumber);
        return booking[key];
      }
    }
  } catch (e) {
    console.warn('⚠️ localStorage fallback error:', e);
  }

  return null;
}

/**
 * Hybrid: Save Page 5 data to API and localStorage
 */
export async function savePage5DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  let synced = false;
  const storageKey = mode === 'in' ? 'page5DataCheckIn' : 'page5DataCheckOut';

  // Save to localStorage immediately
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = { bookingData: {}, lastModified: new Date().toISOString(), synced: false };
    }
    bookings[bookingNumber][storageKey] = data;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    console.log('💾 Page 5 saved to localStorage:', bookingNumber);
  } catch (e) {
    console.warn('⚠️ localStorage save error:', e);
  }

  // Try to save to API
  try {
    const result = await savePage5Data(bookingNumber, data);
    if (result.success) {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingNumber]) {
        bookings[bookingNumber].synced = true;
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }
      synced = true;
    }
  } catch (error) {
    console.warn('⚠️ API sync failed, will retry later:', error);
  }

  return { success: true, synced };
}
