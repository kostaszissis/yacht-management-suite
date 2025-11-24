const API_URL = 'https://yachtmanagementsuite.com/api';

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
