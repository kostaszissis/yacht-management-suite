// =================================================================
// MEDIA STORAGE UTILITY
// =================================================================
// Stores photos/media in localStorage separately from API data
// This is needed because base64 images are too large for the API
// =================================================================

const MEDIA_STORAGE_KEY = 'checkin_media_storage';

interface MediaItem {
  mid?: string;
  type: string;
  url?: string;
  data?: string;
  name?: string;
}

interface ItemMedia {
  itemKey: string;
  media: MediaItem[];
}

interface PageMedia {
  [itemKey: string]: MediaItem[];
}

interface BookingMedia {
  page2?: PageMedia;
  page3?: PageMedia;
  page4?: PageMedia;
}

interface MediaStorage {
  [bookingNumber: string]: {
    in?: BookingMedia;
    out?: BookingMedia;
  };
}

// Get all media storage
function getMediaStorage(): MediaStorage {
  try {
    const stored = localStorage.getItem(MEDIA_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading media storage:', error);
    return {};
  }
}

// Save all media storage
function saveMediaStorage(storage: MediaStorage): void {
  try {
    localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error('Error saving media storage:', error);
    // If localStorage is full, try to clear old bookings
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old media');
      clearOldMedia();
    }
  }
}

// Clear old media (keep only last 10 bookings)
function clearOldMedia(): void {
  try {
    const storage = getMediaStorage();
    const bookings = Object.keys(storage);
    if (bookings.length > 10) {
      const toRemove = bookings.slice(0, bookings.length - 10);
      toRemove.forEach(key => delete storage[key]);
      localStorage.setItem(MEDIA_STORAGE_KEY, JSON.stringify(storage));
    }
  } catch (error) {
    console.error('Error clearing old media:', error);
  }
}

// Save media for items on a specific page
export function savePageMedia(
  bookingNumber: string,
  mode: 'in' | 'out',
  page: 'page2' | 'page3' | 'page4',
  items: any[]
): void {
  try {
    const storage = getMediaStorage();

    // Initialize structure if needed
    if (!storage[bookingNumber]) storage[bookingNumber] = {};
    if (!storage[bookingNumber][mode]) storage[bookingNumber][mode] = {};
    if (!storage[bookingNumber][mode]![page]) storage[bookingNumber][mode]![page] = {};

    // Save media for each item that has it
    items.forEach(item => {
      if (item.media && item.media.length > 0) {
        const itemKey = item.key || item.id;
        storage[bookingNumber][mode]![page]![itemKey] = item.media;
        console.log(`📷 Saved ${item.media.length} photos for ${itemKey} (${page}/${mode})`);
      }
    });

    saveMediaStorage(storage);
  } catch (error) {
    console.error('Error saving page media:', error);
  }
}

// Get media for items on a specific page
export function getPageMedia(
  bookingNumber: string,
  mode: 'in' | 'out',
  page: 'page2' | 'page3' | 'page4'
): PageMedia {
  try {
    const storage = getMediaStorage();
    return storage[bookingNumber]?.[mode]?.[page] || {};
  } catch (error) {
    console.error('Error getting page media:', error);
    return {};
  }
}

// Merge media into items array
export function mergeMediaIntoItems(items: any[], pageMedia: PageMedia): any[] {
  if (!items || !pageMedia) return items;

  return items.map(item => {
    const itemKey = item.key || item.id;
    const savedMedia = pageMedia[itemKey];
    if (savedMedia && savedMedia.length > 0) {
      console.log(`📷 Merged ${savedMedia.length} photos for ${itemKey}`);
      return { ...item, media: savedMedia };
    }
    return item;
  });
}

// Get all media for a booking (all pages, specific mode)
export function getAllBookingMedia(
  bookingNumber: string,
  mode: 'in' | 'out'
): BookingMedia {
  try {
    const storage = getMediaStorage();
    return storage[bookingNumber]?.[mode] || {};
  } catch (error) {
    console.error('Error getting booking media:', error);
    return {};
  }
}

// Clear media for a booking
export function clearBookingMedia(bookingNumber: string): void {
  try {
    const storage = getMediaStorage();
    delete storage[bookingNumber];
    saveMediaStorage(storage);
    console.log(`🗑️ Cleared media for booking ${bookingNumber}`);
  } catch (error) {
    console.error('Error clearing booking media:', error);
  }
}

// Debug: Log all stored media info
export function debugMediaStorage(): void {
  const storage = getMediaStorage();
  console.log('📷 Media Storage Debug:');
  Object.keys(storage).forEach(booking => {
    console.log(`  Booking ${booking}:`);
    ['in', 'out'].forEach(mode => {
      const modeData = storage[booking][mode as 'in' | 'out'];
      if (modeData) {
        ['page2', 'page3', 'page4'].forEach(page => {
          const pageData = modeData[page as 'page2' | 'page3' | 'page4'];
          if (pageData) {
            const itemCount = Object.keys(pageData).length;
            const photoCount = Object.values(pageData).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`    ${mode}/${page}: ${itemCount} items, ${photoCount} photos`);
          }
        });
      }
    });
  });
}

export default {
  savePageMedia,
  getPageMedia,
  mergeMediaIntoItems,
  getAllBookingMedia,
  clearBookingMedia,
  debugMediaStorage
};
