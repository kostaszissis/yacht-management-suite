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
  try {
    const response = await fetch(`${API_URL}/vessels.php`);
    if (!response.ok) throw new Error('Failed to fetch vessels');
    const data = await response.json();
    // API returns { success: true, vessels: [...] }
    if (data.success && data.vessels) {
      return data.vessels;
    }
    // Fallback to hardcoded list if API fails
    return [
      { id: 8, name: 'Bob', type: 'Catamaran', model: 'Lagoon 42' },
      { id: 7, name: 'Perla', type: 'Catamaran', model: 'Lagoon 46' },
      { id: 6, name: 'Infinity', type: 'Catamaran', model: 'Bali 4.2' },
      { id: 1, name: 'Maria 1', type: 'Monohull', model: 'Jeanneau Sun Odyssey 449' },
      { id: 2, name: 'Maria 2', type: 'Monohull', model: 'Jeanneau yacht 54' },
      { id: 4, name: 'Bar Bar', type: 'Monohull', model: 'Beneteau Oceanis 46.1' },
      { id: 5, name: 'Kalispera', type: 'Monohull', model: 'Bavaria c42 Cruiser' },
      { id: 3, name: 'Valesia', type: 'Monohull', model: 'Bavaria c42 Cruiser' },
    ];
  } catch (error) {
    console.error('Error fetching vessels from API, using fallback:', error);
    // Return hardcoded list as fallback
    return [
      { id: 8, name: 'Bob', type: 'Catamaran', model: 'Lagoon 42' },
      { id: 7, name: 'Perla', type: 'Catamaran', model: 'Lagoon 46' },
      { id: 6, name: 'Infinity', type: 'Catamaran', model: 'Bali 4.2' },
      { id: 1, name: 'Maria 1', type: 'Monohull', model: 'Jeanneau Sun Odyssey 449' },
      { id: 2, name: 'Maria 2', type: 'Monohull', model: 'Jeanneau yacht 54' },
      { id: 4, name: 'Bar Bar', type: 'Monohull', model: 'Beneteau Oceanis 46.1' },
      { id: 5, name: 'Kalispera', type: 'Monohull', model: 'Bavaria c42 Cruiser' },
      { id: 3, name: 'Valesia', type: 'Monohull', model: 'Bavaria c42 Cruiser' },
    ];
  }
}

export async function createVessel(vessel: any) {
  const response = await fetch(`${API_URL}/vessels.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vessel)
  });
  if (!response.ok) throw new Error('Failed to create vessel');
  return response.json();
}

export async function updateVessel(id: string, vessel: any) {
  const response = await fetch(`${API_URL}/vessels.php?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vessel)
  });
  if (!response.ok) throw new Error('Failed to update vessel');
  return response.json();
}

export async function deleteVessel(id: string) {
  const response = await fetch(`${API_URL}/vessels.php?id=${id}`, {
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

  const url = `${API_URL}/bookings.php${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
}

/**
 * Get single booking by booking number
 * @param bookingNumber - The booking number
 */
export async function getBooking(bookingNumber: string) {
  const response = await fetch(`${API_URL}/bookings.php?booking_number=${encodeURIComponent(bookingNumber)}`);
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
  const response = await fetch(`${API_URL}/bookings.php`, {
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
  const response = await fetch(`${API_URL}/bookings.php?booking_number=${encodeURIComponent(bookingNumber)}`, {
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
  const response = await fetch(`${API_URL}/bookings.php?booking_number=${encodedBookingNumber}`, {
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
  const response = await fetch(`${API_URL}/bookings.php?booking_number=${encodedBookingNumber}`, {
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
  const response = await fetch(`${API_URL}/bookings.php?booking_number=${encodeURIComponent(bookingNumber)}`, {
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
// 🔥 API ONLY - NO LOCALSTORAGE FOR BOOKINGS
// All devices must see the same data from the database
// =====================================================

/**
 * Get all bookings from API (NO localStorage fallback)
 */
export async function getAllBookings(): Promise<any[]> {
  try {
    console.log('🔄 [API] Fetching all bookings...');
    const response = await fetch(`${API_URL}/bookings.php`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const bookingsObj = data.bookings || {};
    const bookingsList = Array.isArray(bookingsObj)
      ? bookingsObj
      : Object.values(bookingsObj).map((b: any) => b.bookingData || b);

    console.log(`✅ [API] Loaded ${bookingsList.length} bookings from database`);
    return bookingsList;
  } catch (error) {
    console.error('❌ [API] Failed to fetch bookings:', error);
    return []; // Return empty array on error - NO localStorage fallback
  }
}

/**
 * 🔥 VALIDATION: Check if charter party number already exists in API
 * @param charterCode - The charter party number to check
 * @param excludeBookingId - Optional booking ID to exclude (for edit mode)
 * @returns Object with isDuplicate flag and existing booking info if found
 */
export async function checkDuplicateCharterCode(
  charterCode: string,
  excludeBookingId?: string
): Promise<{ isDuplicate: boolean; existingBooking?: any }> {
  try {
    if (!charterCode || !charterCode.trim()) {
      return { isDuplicate: false };
    }

    const codeToCheck = charterCode.trim().toLowerCase();
    console.log('🔍 [API Validation] Checking duplicate charter code:', codeToCheck);

    const allBookings = await getAllBookings();

    // Helper function to normalize charter code for comparison
    const normalizeCode = (code: string): string => {
      if (!code) return '';
      // Remove common prefixes and normalize
      return code.toString().trim().toLowerCase()
        .replace(/^charter\s*party\s*(no\.?|number)?\s*/i, '')
        .replace(/\s+/g, '');
    };

    const normalizedCheck = normalizeCode(codeToCheck);

    for (const booking of allBookings) {
      // Skip the booking being edited
      if (excludeBookingId && (booking.id === excludeBookingId || booking.code === excludeBookingId)) {
        continue;
      }

      const existingCode = booking.code || booking.bookingCode || booking.charterCode || booking.booking_number;
      if (!existingCode) continue;

      const normalizedExisting = normalizeCode(existingCode);

      // Check for match (exact or normalized)
      if (normalizedExisting === normalizedCheck ||
          existingCode.toLowerCase() === codeToCheck) {
        console.log('❌ [API Validation] Found duplicate charter code:', existingCode);
        return { isDuplicate: true, existingBooking: booking };
      }
    }

    console.log('✅ [API Validation] No duplicate charter code found');
    return { isDuplicate: false };
  } catch (error) {
    console.error('❌ [API Validation] Error checking duplicate:', error);
    // On error, return false to not block user (fail-open)
    return { isDuplicate: false };
  }
}

/**
 * 🔥 VALIDATION: Check if vessel has overlapping bookings for given dates
 * @param vesselId - The vessel ID to check
 * @param startDate - Start date of new booking
 * @param endDate - End date of new booking
 * @param excludeBookingId - Optional booking ID to exclude (for edit mode)
 * @returns Object with hasOverlap flag and overlapping booking info if found
 */
export async function checkDateOverlap(
  vesselId: number,
  startDate: string,
  endDate: string,
  excludeBookingId?: string
): Promise<{ hasOverlap: boolean; overlappingBooking?: any }> {
  try {
    if (!vesselId || !startDate || !endDate) {
      return { hasOverlap: false };
    }

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    console.log('🔍 [API Validation] Checking date overlap for vessel:', vesselId, 'dates:', startDate, '-', endDate);

    const allBookings = await getAllBookings();

    // Filter bookings for this vessel
    const vesselBookings = allBookings.filter((booking: any) => {
      const bookingVesselId = booking.vesselId || booking.vessel_id || booking.boatId;
      return bookingVesselId === vesselId || bookingVesselId === String(vesselId);
    });

    console.log(`📦 [API Validation] Found ${vesselBookings.length} bookings for vessel ${vesselId}`);

    for (const booking of vesselBookings) {
      // Skip the booking being edited
      if (excludeBookingId && (booking.id === excludeBookingId || booking.code === excludeBookingId)) {
        continue;
      }

      const existingStart = new Date(booking.startDate || booking.start_date);
      const existingEnd = new Date(booking.endDate || booking.end_date);

      // Check for overlap: (start1 <= end2) AND (end1 >= start2)
      if (newStart <= existingEnd && newEnd >= existingStart) {
        console.log('❌ [API Validation] Found overlapping booking:', booking.code,
          `(${booking.startDate} - ${booking.endDate})`);
        return { hasOverlap: true, overlappingBooking: booking };
      }
    }

    console.log('✅ [API Validation] No date overlap found');
    return { hasOverlap: false };
  } catch (error) {
    console.error('❌ [API Validation] Error checking overlap:', error);
    // On error, return false to not block user (fail-open)
    return { hasOverlap: false };
  }
}

/**
 * Get bookings for a specific vessel from API (NO localStorage fallback)
 */
export async function getBookingsByVessel(vesselId: number | string): Promise<any[]> {
  const vesselName = typeof vesselId === 'number' ? VESSEL_NAMES[vesselId] : vesselId;

  try {
    console.log(`🔄 [API] Fetching bookings for vessel: ${vesselName || vesselId}`);
    const response = await fetch(`${API_URL}/bookings.php?vessel=${encodeURIComponent(vesselName || String(vesselId))}`);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const bookingsObj = data.bookings || {};
    const bookingsList = Array.isArray(bookingsObj)
      ? bookingsObj
      : Object.values(bookingsObj).map((b: any) => b.bookingData || b);

    console.log(`✅ [API] Loaded ${bookingsList.length} bookings for vessel ${vesselName || vesselId}`);
    return bookingsList;
  } catch (error) {
    console.error(`❌ [API] Failed to fetch bookings for vessel ${vesselId}:`, error);
    return []; // Return empty array on error - NO localStorage fallback
  }
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

    // Get all bookings from API
    const allBookings = await getAllBookings();

    for (const charter of allBookings) {
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
          // Update status to "Expired" via API
          const updatedCharter = { ...charter, status: 'Expired' };
          await saveBooking(charter.code, { bookingData: updatedCharter });

          expiredCharters.push(charter.code);
          console.log(`✅ Charter ${charter.code} marked as Expired`);
        } catch (updateError) {
          console.error(`❌ Failed to expire charter ${charter.code}:`, updateError);
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
 * Get Page 1 data from API (NO localStorage)
 * @param bookingNumber - The booking number to load
 */
export async function getPage1DataHybrid(bookingNumber: string): Promise<Page1FormData | null> {
  try {
    const apiData = await getPage1Data(bookingNumber);
    return apiData;
  } catch (error) {
    console.error('❌ Page 1 API failed:', error);
    return null;
  }
}

/**
 * Save Page 1 data to API (NO localStorage)
 * @param bookingNumber - The booking number
 * @param data - Page 1 form data
 */
export async function savePage1DataHybrid(
  bookingNumber: string,
  data: Page1FormData
): Promise<{ success: boolean; synced: boolean }> {
  try {
    // Check if booking exists in API
    const existing = await getPage1Data(bookingNumber);
    const isNew = !existing;

    const result = await savePage1Data(bookingNumber, data, isNew);
    return { success: result.success, synced: result.success };
  } catch (error) {
    console.error('❌ Page 1 API save failed:', error);
    return { success: false, synced: false };
  }
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
      ? `${API_URL}/${endpoint}.php?vessel_id=${vesselId}&category=${encodeURIComponent(category)}`
      : `${API_URL}/${endpoint}.php?vessel_id=${vesselId}`;

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
  const apiUrl = `${API_URL}/${endpoint}.php`;
  console.log(`🔄 API POST to: ${apiUrl}`, { vesselId: data.vesselId, dataKeys: Object.keys(data) });

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    console.log(`📡 API response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API HTTP error: ${response.status}`, errorText);
      return { success: false, message: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    console.log(`📡 API response:`, result);

    if (result.success) {
      console.log(`✅ ${endpoint} data saved to API for vessel ${data.vesselId}`);
      return { success: true, message: result.message };
    }

    console.warn(`⚠️ ${endpoint} API save failed:`, result.error || result);
    return { success: false, message: result.error || 'Unknown error' };
  } catch (error) {
    console.error(`❌ ${endpoint} API save error:`, error);
    return { success: false, message: String(error) };
  }
}

/**
 * Get checkin data from API (NO localStorage)
 */
export async function getCheckinDataHybrid(
  endpoint: string,
  vesselId: number,
  localStorageKey: string,
  category?: string
): Promise<CheckinData | null> {
  try {
    const apiData = await getCheckinData(endpoint, vesselId, category);
    return apiData;
  } catch (error) {
    console.error(`❌ ${endpoint} API failed:`, error);
    return null;
  }
}

/**
 * Save checkin data to API (NO localStorage)
 */
export async function saveCheckinDataHybrid(
  endpoint: string,
  data: CheckinData,
  localStorageKey: string
): Promise<{ success: boolean; synced: boolean }> {
  try {
    const result = await saveCheckinData(endpoint, data);
    return { success: result.success, synced: result.success };
  } catch (error) {
    console.error(`❌ ${endpoint} API save failed:`, error);
    return { success: false, synced: false };
  }
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
 * Get Page 2 data from API (NO localStorage)
 */
export async function getPage2DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  try {
    const response = await fetch(`${PAGE2_API_URL}?booking_number=${encodeURIComponent(bookingNumber)}&mode=${mode}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.checklistData) {
        console.log('✅ Page 2 data loaded from API');
        return result.checklistData;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Page 2 API failed:', error);
    return null;
  }
}

/**
 * Save Page 2 data to API (NO localStorage)
 * 🔥 FIX: Send checklistData directly to API instead of through savePage2Data (which wraps as crewList)
 */
export async function savePage2DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  try {
    // 🔥 FIX: Call API directly with correct structure
    // The API expects { bookingNumber, checklistData, mode } at top level
    const response = await fetch(PAGE2_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingNumber,
        checklistData: data,
        mode: mode
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Page 2 checklist data saved to API:', bookingNumber, mode);
      return { success: true, synced: true };
    }

    // If POST fails with 409 (already exists), try PUT
    if (response.status === 409) {
      console.log('📝 Page 2 data exists, updating via PUT...');
      const putResponse = await fetch(PAGE2_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingNumber,
          checklistData: data,
          mode: mode
        })
      });
      const putResult = await putResponse.json();
      if (putResult.success) {
        console.log('✅ Page 2 checklist data updated via PUT:', bookingNumber, mode);
        return { success: true, synced: true };
      }
    }

    console.warn('⚠️ Page 2 API save failed:', result.error || result.message);
    return { success: false, synced: false };
  } catch (error) {
    console.error('❌ Page 2 API save failed:', error);
    return { success: false, synced: false };
  }
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
 * Get Page 3 data from API (NO localStorage)
 */
export async function getPage3DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  try {
    const response = await fetch(`${PAGE3_API_URL}?booking_number=${encodeURIComponent(bookingNumber)}&mode=${mode}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.checklistData) {
        console.log('✅ Page 3 data loaded from API');
        return result.checklistData;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Page 3 API failed:', error);
    return null;
  }
}

/**
 * Save Page 3 data to API (NO localStorage)
 */
export async function savePage3DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  try {
    const apiData = {
      checklistData: data,
      mode: mode,
      lastSaved: new Date().toISOString()
    };
    const result = await savePage3Data(bookingNumber, apiData);
    return { success: result.success, synced: result.success };
  } catch (error) {
    console.error('❌ Page 3 API save failed:', error);
    return { success: false, synced: false };
  }
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
 * Get Page 4 data from API (NO localStorage)
 */
export async function getPage4DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  try {
    const response = await fetch(`${PAGE4_API_URL}?booking_number=${encodeURIComponent(bookingNumber)}&mode=${mode}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.checklistData) {
        console.log('✅ Page 4 data loaded from API');
        return result.checklistData;
      }
    }
    return null;
  } catch (error) {
    console.error('❌ Page 4 API failed:', error);
    return null;
  }
}

/**
 * Save Page 4 data to API (NO localStorage)
 */
export async function savePage4DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  try {
    const apiData = {
      checklistData: data,
      mode: mode,
      lastSaved: new Date().toISOString()
    };
    const result = await savePage4Data(bookingNumber, apiData as any);
    return { success: result.success, synced: result.success };
  } catch (error) {
    console.error('❌ Page 4 API save failed:', error);
    return { success: false, synced: false };
  }
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
 * Get Page 5 data from API (NO localStorage)
 */
export async function getPage5DataHybrid(bookingNumber: string, mode: 'in' | 'out'): Promise<any | null> {
  try {
    const apiData = await getPage5Data(bookingNumber);
    return apiData;
  } catch (error) {
    console.error('❌ Page 5 API failed:', error);
    return null;
  }
}

/**
 * Save Page 5 data to API (NO localStorage)
 */
export async function savePage5DataHybrid(
  bookingNumber: string,
  data: any,
  mode: 'in' | 'out'
): Promise<{ success: boolean; synced: boolean }> {
  try {
    const result = await savePage5Data(bookingNumber, data);
    return { success: result.success, synced: result.success };
  } catch (error) {
    console.error('❌ Page 5 API save failed:', error);
    return { success: false, synced: false };
  }
}

// =====================================================
// TASKS API - Εργασίες (Work Orders/Tasks)
// =====================================================

const TASKS_API_URL = `${API_BASE}/tasks.php`;

export interface Task {
  id?: number;
  taskCode?: string;
  vesselId: number;
  vesselName?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  completedBy?: string;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
  photos?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all tasks for a vessel
 */
export async function getTasksByVessel(vesselId: number): Promise<Task[]> {
  try {
    const response = await fetch(`${TASKS_API_URL}?vessel_id=${vesselId}`);
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Loaded ${result.tasks?.length || 0} tasks for vessel ${vesselId}`);
      return result.tasks || [];
    }
    return [];
  } catch (error) {
    console.error(`❌ [API] Failed to fetch tasks for vessel ${vesselId}:`, error);
    return [];
  }
}

/**
 * Get all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    const response = await fetch(TASKS_API_URL);
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Loaded ${result.tasks?.length || 0} tasks`);
      return result.tasks || [];
    }
    return [];
  } catch (error) {
    console.error('❌ [API] Failed to fetch tasks:', error);
    return [];
  }
}

/**
 * Save or update a task
 */
export async function saveTask(task: Task): Promise<{ success: boolean; taskCode?: string }> {
  try {
    const method = task.taskCode ? 'PUT' : 'POST';
    const response = await fetch(TASKS_API_URL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Task saved:`, result.task_code);
      return { success: true, taskCode: result.task_code };
    }
    // If POST fails with 409, try PUT
    if (response.status === 409) {
      const putResponse = await fetch(TASKS_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, taskCode: putResult.task_code };
    }
    return { success: false };
  } catch (error) {
    console.error('❌ [API] Failed to save task:', error);
    return { success: false };
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskCode: string): Promise<boolean> {
  try {
    const response = await fetch(`${TASKS_API_URL}?task_code=${encodeURIComponent(taskCode)}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ [API] Failed to delete task:', error);
    return false;
  }
}

/**
 * Migrate tasks from localStorage to API
 * Call this once on app load to preserve existing data
 *
 * IMPORTANT: TaskPage uses `task_categories_${vesselKey}` format
 * where vesselKey is boat name with underscores (e.g., task_categories_bob)
 */
export async function migrateTasksFromLocalStorage(vesselId: number, vesselName: string): Promise<boolean> {
  const migrationKey = `tasks_migrated_${vesselId}`;

  // Check if already migrated
  if (localStorage.getItem(migrationKey)) {
    return true;
  }

  // 🔥 FIX: TaskPage uses vesselName-based key, not vesselId
  const vesselKey = vesselName.replace(/\s+/g, '_').toLowerCase();
  const possibleKeys = [
    `task_categories_${vesselKey}`,           // Primary: task_categories_bob
    `fleet_${vesselId}_ΕΡΓΑΣΙΕΣ`,             // Legacy format 1
    `fleet_${vesselName}_ΕΡΓΑΣΙΕΣ`,           // Legacy format 2
  ];

  let stored: string | null = null;
  let usedKey: string | null = null;

  // Try each possible key
  for (const key of possibleKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      stored = data;
      usedKey = key;
      console.log(`📦 Found task data in localStorage key: ${key}`);
      break;
    }
  }

  if (!stored) {
    // No data to migrate, mark as done
    console.log(`ℹ️ No task data found in localStorage for vessel ${vesselName}`);
    localStorage.setItem(migrationKey, 'true');
    return true;
  }

  try {
    const data = JSON.parse(stored);

    // Handle both array format and categories format
    let tasksToMigrate: any[] = [];

    if (Array.isArray(data)) {
      // Old flat array format
      tasksToMigrate = data;
    } else if (data && typeof data === 'object') {
      // Categories format: extract all items from all categories
      // Format: [{id, name, items: [{id, name, status, comment}]}]
      if (Array.isArray(data)) {
        for (const category of data) {
          if (category.items && Array.isArray(category.items)) {
            for (const item of category.items) {
              tasksToMigrate.push({
                ...item,
                category: category.name,
                categoryId: category.id
              });
            }
          }
        }
      }
    }

    // Also check if data is the categories array directly
    if (tasksToMigrate.length === 0 && Array.isArray(data)) {
      for (const category of data) {
        if (category.items && Array.isArray(category.items)) {
          for (const item of category.items) {
            // Only migrate items that have been updated (have lastUpdatedAt)
            if (item.lastUpdatedAt) {
              tasksToMigrate.push({
                ...item,
                category: category.name,
                categoryId: category.id
              });
            }
          }
        }
      }
    }

    if (tasksToMigrate.length === 0) {
      console.log(`ℹ️ No task items to migrate for vessel ${vesselName}`);
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    console.log(`🔄 Migrating ${tasksToMigrate.length} tasks for vessel ${vesselName} from ${usedKey}...`);

    for (const task of tasksToMigrate) {
      await saveTask({
        taskCode: task.id || task.taskCode || `task_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        vesselId,
        vesselName,
        title: task.name || task.title,
        category: task.category,
        status: task.status === 'OK' ? 'completed' : task.status === '?' ? 'in_progress' : 'pending',
        notes: task.comment || task.notes,
        createdBy: task.lastUpdatedBy || task.createdBy
      });
    }

    console.log(`✅ Migrated ${tasksToMigrate.length} tasks to API`);
    localStorage.setItem(migrationKey, 'true');
    // Keep localStorage data as backup - don't delete
    return true;
  } catch (error) {
    console.error('❌ Failed to migrate tasks:', error);
    return false;
  }
}

// =====================================================
// INVOICES API - Τιμολόγια/Έξοδα (Invoices/Expenses)
// =====================================================

const INVOICES_API_URL = `${API_BASE}/invoices.php`;

export interface Invoice {
  id?: number;
  invoiceCode?: string;
  vesselId: number;
  vesselName?: string;
  invoiceNumber?: string;
  invoiceType?: 'expense' | 'income' | 'credit';
  category?: string;
  description?: string;
  vendor?: string;
  amount: number;
  vatAmount?: number;
  totalAmount?: number;
  currency?: string;
  invoiceDate?: string;
  dueDate?: string;
  paidDate?: string;
  paymentStatus?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paymentMethod?: string;
  referenceNumber?: string;
  charterCode?: string;
  notes?: string;
  attachments?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Get all invoices for a vessel
 */
export async function getInvoicesByVessel(vesselId: number): Promise<Invoice[]> {
  try {
    const response = await fetch(`${INVOICES_API_URL}?vessel_id=${vesselId}`);
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Loaded ${result.invoices?.length || 0} invoices for vessel ${vesselId}`);
      return result.invoices || [];
    }
    return [];
  } catch (error) {
    console.error(`❌ [API] Failed to fetch invoices for vessel ${vesselId}:`, error);
    return [];
  }
}

/**
 * Get all invoices
 */
export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    const response = await fetch(INVOICES_API_URL);
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Loaded ${result.invoices?.length || 0} invoices`);
      return result.invoices || [];
    }
    return [];
  } catch (error) {
    console.error('❌ [API] Failed to fetch invoices:', error);
    return [];
  }
}

/**
 * Save or update an invoice
 */
export async function saveInvoice(invoice: Invoice): Promise<{ success: boolean; invoiceCode?: string }> {
  try {
    const method = invoice.invoiceCode ? 'PUT' : 'POST';
    const response = await fetch(INVOICES_API_URL, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    const result = await response.json();
    if (result.success) {
      console.log(`✅ [API] Invoice saved:`, result.invoice_code);
      return { success: true, invoiceCode: result.invoice_code };
    }
    // If POST fails with 409, try PUT
    if (response.status === 409) {
      const putResponse = await fetch(INVOICES_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice)
      });
      const putResult = await putResponse.json();
      return { success: putResult.success, invoiceCode: putResult.invoice_code };
    }
    return { success: false };
  } catch (error) {
    console.error('❌ [API] Failed to save invoice:', error);
    return { success: false };
  }
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceCode: string): Promise<boolean> {
  try {
    const response = await fetch(`${INVOICES_API_URL}?invoice_code=${encodeURIComponent(invoiceCode)}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ [API] Failed to delete invoice:', error);
    return false;
  }
}

/**
 * Migrate invoices from localStorage to API
 * Call this once on app load to preserve existing data
 */
export async function migrateInvoicesFromLocalStorage(vesselId: number, vesselName: string): Promise<boolean> {
  const migrationKey = `invoices_migrated_${vesselId}`;

  // Check if already migrated
  if (localStorage.getItem(migrationKey)) {
    return true;
  }

  const storageKey = `fleet_${vesselId}_ΤΙΜΟΛΟΓΙΑ`;
  const stored = localStorage.getItem(storageKey);

  if (!stored) {
    // No data to migrate, mark as done
    localStorage.setItem(migrationKey, 'true');
    return true;
  }

  try {
    const invoices = JSON.parse(stored);
    if (!Array.isArray(invoices) || invoices.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return true;
    }

    console.log(`🔄 Migrating ${invoices.length} invoices for vessel ${vesselName}...`);

    for (const invoice of invoices) {
      await saveInvoice({
        ...invoice,
        vesselId,
        vesselName,
        invoiceCode: invoice.id || invoice.invoiceCode
      });
    }

    console.log(`✅ Migrated ${invoices.length} invoices to API`);
    localStorage.setItem(migrationKey, 'true');
    // Optionally clear old localStorage after successful migration
    // localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('❌ Failed to migrate invoices:', error);
    return false;
  }
}

// =====================================================
// VESSELS API - TYPED VERSION
// =====================================================

export interface Vessel {
  id?: number;
  name: string;
  type: string;
  model: string;
  length?: number;
  capacity?: number;
  year?: number;
  created_at?: string;
}

export const getVessel = async (id: number): Promise<Vessel | null> => {
  try {
    const response = await fetch(`${API_URL}/vessels.php?id=${id}`);
    const data = await response.json();
    return data.success ? data.vessel : null;
  } catch (error) {
    console.error('Error fetching vessel:', error);
    return null;
  }
};

// =====================================================
// FLOOR PLAN API
// =====================================================

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  label: string;
  type: string;
  category: string;
}

export interface Floorplan {
  id?: number;
  vessel_id: number;
  background_image: string;
  hotspots: Hotspot[];
  created_at?: string;
  updated_at?: string;
}

export const getFloorplan = async (vesselId: number): Promise<Floorplan | null> => {
  try {
    const response = await fetch(`${API_URL}/floorplans.php?vessel_id=${vesselId}`);
    const data = await response.json();
    return data.success ? data.floorplan : null;
  } catch (error) {
    console.error('Error fetching floorplan:', error);
    return null;
  }
};

export const saveFloorplan = async (floorplan: { vessel_id: number; background_image: string; hotspots: Hotspot[] }): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/floorplans.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floorplan),
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error saving floorplan:', error);
    return false;
  }
};

export const deleteFloorplan = async (vesselId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/floorplans.php?vessel_id=${vesselId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error deleting floorplan:', error);
    return false;
  }
};
