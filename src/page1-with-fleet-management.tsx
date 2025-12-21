// =================================================================
// PAGE 1 - BOOKING DETAILS & FLEET MANAGEMENT
// PART 1/2: IMPORTS, STATES, FUNCTIONS
// =================================================================

import { useState, useMemo, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { DataContext } from './App';
import { generateLuxuryPDF } from './utils/LuxuryPDFGenerator';
import authService from './authService';
import { getVessels, getBookings, getBooking, getPage1DataHybrid, savePage1DataHybrid, Page1FormData, checkDuplicateCharterCode, checkDateOverlap } from './services/apiService';
import { saveBookingSync, getBookingSync, syncToPage1Format, page1ToSyncFormat } from './utils/bookingSyncUtils';

// 🔥 SIGNATURE COMPRESSION FUNCTION
const compressSignature = (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxWidth = 400;
      const maxHeight = 200;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressed = canvas.toDataURL('image/png', 0.7);
      resolve(compressed);
    };
    img.src = base64Image;
  });
};

const I18N = {
  en: {
    title: "CHECK-IN / CHECK-OUT REPORT",
    bookingNumber: "1. BOOKING NUMBER",
    vesselSection: "2. Vessel Selection",
    category: "Category",
    vessel: "Vessel",
    dateIn: "3. Date of Check-in",
    timeIn: "Time of Check-in",
    dateOut: "4. Date of Check-out",
    timeOut: "Time of Check-out",
    firstName: "5. Skipper's First Name",
    lastName: "Skipper's Last Name",
    address: "6. Skipper's Address",
    email: "7. Skipper's Email Address",
    phone: "8. Skipper's Mobile Number",
    selectCategory: "-- Select Category --",
    selectVessel: "-- Select Vessel --",
    selectCatFirst: "Select category first",
    cat: "Catamaran",
    mono: "Monohull",
    selected: "Selected:",
    recentEntries: "Recent entries:",
    back: "Back",
    saveDraft: "Save draft",
    clear: "Clear",
    pdf: "PDF",
    next: "Next",
    checkin: "Check-in",
    checkout: "Check-out",
    mode: "Mode:",
    clearAllData: "Clear All Data",
    confirmClearAll: "⚠️ WARNING: This will delete ALL check-in/check-out data from localStorage. Are you sure?",
    allDataCleared: "All data cleared successfully!",
    selectBooking: "Select Booking:",
    createNewBooking: "+ Create New Booking",
    activeBooking: "Active Booking:",
    recentBookings: "Recent Bookings:",
    noBookings: "No bookings yet",
    bookingInfo: "Booking Information",
    notSet: "[Not set]",
    notSelected: "[Not selected]",
    status: "Status:",
    synced: "Synced",
    offline: "Offline",
    syncing: "Syncing...",
    todayCheckouts: "Today's Check-outs",
    vesselsCheckingOut: "vessels checking out today",
    showAllBookings: "Show All Bookings",
    totalBookings: "total",
  },
  el: {
    title: "ΑΝΑΦΟΡΑ ΕΠΙΒΙΒΑΣΗΣ / ΑΠΟΒΙΒΑΣΗΣ",
    bookingNumber: "1. ΑΡΙΘΜΟΣ ΚΡΑΤΗΣΗΣ",
    vesselSection: "2. Επιλογή Σκάφους",
    category: "Κατηγορία",
    vessel: "Σκάφος",
    dateIn: "3. Ημερομηνία Επιβίβασης",
    timeIn: "Ώρα Επιβίβασης",
    dateOut: "4. Ημερομηνία Αποβίβασης",
    timeOut: "Ώρα Αποβίβασης",
    firstName: "5. Όνομα Κυβερνήτη",
    lastName: "Επώνυμο Κυβερνήτη",
    address: "6. Διεύθυνση Κυβερνήτη",
    email: "7. Email Κυβερνήτη",
    phone: "8. Κινητό Κυβερνήτη",
    selectCategory: "-- Επιλέξτε Κατηγορία --",
    selectVessel: "-- Επιλέξτε Σκάφος --",
    selectCatFirst: "Πρώτα επιλέξτε κατηγορία",
    cat: "Καταμαράν",
    mono: "Μονόχαλ",
    selected: "Επιλογή:",
    recentEntries: "Πρόσφατες καταχωρήσεις:",
    back: "Πίσω",
    saveDraft: "Αποθήκευση",
    clear: "Καθαρισμός",
    pdf: "PDF",
    next: "Επόμενο",
    checkin: "Επιβίβαση",
    checkout: "Αποβίβαση",
    mode: "Λειτουργία:",
    clearAllData: "Διαγραφή Όλων των Δεδομένων",
    confirmClearAll: "⚠️ ΠΡΟΣΟΧΗ: Θα διαγραφούν ΟΛΑ τα δεδομένα check-in/check-out από το localStorage. Είστε σίγουροι;",
    allDataCleared: "Όλα τα δεδομένα διαγράφηκαν επιτυχώς!",
    selectBooking: "Επιλογή Κράτησης:",
    createNewBooking: "+ Νέα Κράτηση",
    activeBooking: "Ενεργή Κράτηση:",
    recentBookings: "Πρόσφατες Κρατήσεις:",
    noBookings: "Δεν υπάρχουν κρατήσεις",
    bookingInfo: "Πληροφορίες Κράτησης",
    notSet: "[Δεν έχει οριστεί]",
    notSelected: "[Δεν έχει επιλεγεί]",
    status: "Κατάσταση:",
    synced: "Συγχρονισμένο",
    offline: "Εκτός σύνδεσης",
    syncing: "Συγχρονίζεται...",
    todayCheckouts: "Σημερινές Αποβιβάσεις",
    vesselsCheckingOut: "σκάφη αποβιβάζονται σήμερα",
    showAllBookings: "Όλες οι Κρατήσεις",
    totalBookings: "σύνολο",
  },
};

// 🔥 SHARED FLEET SERVICE
const FLEET_STORAGE_KEY = 'app_fleet_vessels';

const FleetService = {
  async initialize() {
    try {
      const vessels = await getVessels();
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(vessels));
      console.log('✅ Fleet initialized from API:', vessels.length, 'boats');
    } catch (error) {
      console.error('Error loading fleet from API:', error);
    }
  },

  getBoatsByCategory() {
    const boats = JSON.parse(localStorage.getItem(FLEET_STORAGE_KEY) || '[]');
    const grouped = {};
    boats.forEach(boat => {
      if (!grouped[boat.type]) grouped[boat.type] = [];
      grouped[boat.type].push(boat.name);
    });
    return grouped;
  }
};

FleetService.initialize();
const COUNTRY_CODES = [
  { code: "+30", country: "GR", flag: "🇬🇷" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
];

const stripNumber = (s) => String(s || '').replace(/^\s*\d+\.?\s*/, "");
const isFilled = (v) => (typeof v === 'string' ? v.trim().length > 0 : !!v);

// 🔥 FORMAT DATE: YYYY-MM-DD → DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  // If already in DD/MM/YYYY format, return as is
  if (dateStr.includes('/')) return dateStr;
  
  // Convert YYYY-MM-DD → DD/MM/YYYY
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateStr;
};

const saveBookingData = async (bookingNumber: string, data: any) => {
  if (!bookingNumber) return;

  try {
    // ✅ Use Page 1 specific API - saves to /api/page1.php AND localStorage
    // 🔥 Always mark as source: 'page1' so Fleet Management can identify it
    const result = await savePage1DataHybrid(bookingNumber, {
      bookingNumber,
      vesselName: data.vesselName,
      vesselId: data.vesselId,
      vesselCategory: data.vesselCategory,
      checkInDate: data.checkInDate,
      checkInTime: data.checkInTime,
      checkOutDate: data.checkOutDate,
      checkOutTime: data.checkOutTime,
      skipperFirstName: data.skipperFirstName,
      skipperLastName: data.skipperLastName,
      skipperAddress: data.skipperAddress,
      skipperEmail: data.skipperEmail,
      skipperPhone: data.skipperPhone,
      phoneCountryCode: data.phoneCountryCode,
      mode: data.mode,
      status: data.status || 'Draft',
      source: 'page1'  // 🔥 Mark as coming from Page 1 check-in
    } as Page1FormData);

    console.log('📝 PAGE 1: Saving with source=page1, status=', data.status || 'Draft');

    localStorage.setItem('currentBooking', bookingNumber);
    console.log('💾 Saved booking to API:', bookingNumber, result.synced ? '(synced)' : '(failed)');
  } catch (error) {
    console.error('❌ Error saving booking to API:', error);
  }
};

const loadBookingData = async (bookingNumber: string) => {
  if (!bookingNumber) return null;

  try {
    // ✅ Load from API only
    const data = await getPage1DataHybrid(bookingNumber);
    if (data) {
      console.log('📂 Loaded booking from API:', bookingNumber);
      return data;
    }

    // Also try the general booking API
    const booking = await getBooking(bookingNumber);
    if (booking?.bookingData) {
      console.log('📂 Loaded booking from general API:', bookingNumber);
      return booking.bookingData;
    }

    return null;
  } catch (error) {
    console.error('❌ Error loading booking from API:', error);
    return null;
  }
};

// Get all bookings from API (returns empty for sync calls - use async version)
const getAllBookingsSync = (): any[] => {
  // No localStorage - must use async API calls
  console.warn('⚠️ getAllBookingsSync called - use async version instead');
  return [];
};

// Get all bookings from API
const getAllBookingsFromAPI = async () => {
  try {
    const bookings = await getBookings();
    if (!bookings || typeof bookings !== 'object') return [];

    return Object.keys(bookings).map(bookingNumber => ({
      bookingNumber,
      ...(bookings[bookingNumber]?.bookingData || {}),
      lastModified: bookings[bookingNumber]?.lastModified
    }));
  } catch (error) {
    console.error('Error getting all bookings from API:', error);
    return [];
  }
};

// Get today's check-outs (returns empty for sync - use context data)
const getTodayCheckoutsSync = (): any[] => {
  console.warn('⚠️ getTodayCheckoutsSync called - use context data instead');
  return [];
};

const getTodayCheckouts = getTodayCheckoutsSync;
export default function Page1() {
  const [lang, setLang] = useState("en");
  const t = I18N[lang];
  const navigate = useNavigate();
  const location = useLocation();
  
  const context = useContext(DataContext);
  const { data: contextData, updateData, globalBookings, isRefreshing: globalIsRefreshing, refreshBookings } = context || {};
  
  const [currentBookingNumber, setCurrentBookingNumber] = useState(() => {
    return localStorage.getItem('currentBooking') || '';
  });
  
  const [mode, setMode] = useState(() => {
    if (currentBookingNumber) {
      const data = loadBookingData(currentBookingNumber);
      return data?.mode || 'in';
    }
    return 'in';
  });
  
  const [networkStatus, setNetworkStatus] = useState(
    navigator.onLine ? 'online' : 'offline'
  );
  
  const [showBookingSelector, setShowBookingSelector] = useState(false);
  
  // 🔥 NEW: Filter state for booking selector
  const [showAllBookings, setShowAllBookings] = useState(false);
  
  // 🔥 NEW: Duplicate booking warning
  const [duplicateBooking, setDuplicateBooking] = useState(null);
  const bookingInputRef = useRef(null);
  
  const speakLabel = (text) => {
    console.log('Label:', text);
  };

  const speak = (text) => {
    console.log('Speaking:', text);
  };
  
  const [isEmployee, setIsEmployee] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [showEmployeeCode, setShowEmployeeCode] = useState(false);

  // EMPLOYEE_CODES removed - now using authService

  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Refresh counter for re-fetching from API
  const [refreshCounter, setRefreshCounter] = useState(0);

  const bookingRef = useRef(null);
  const vesselRef = useRef(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);
  const nameRef = useRef(null);
  const addressRef = useRef(null);
  const contactRef = useRef(null);

  const [form, setForm] = useState({
    bookingNumber: "",
    vesselCategory: "",
    vesselName: "",
    vesselId: "",
    checkInDate: "",
    checkInTime: "",
    checkOutDate: "",
    checkOutTime: "",
    skipperFirstName: "",
    skipperLastName: "",
    skipperAddress: "",
    skipperEmail: "",
    skipperPhone: "",
    phoneCountryCode: "+30",
    status: "Draft",  // 🔥 Page 1 bookings always start as Draft
  });

  // 🔥 NEW: Track unsaved changes to prevent data loss
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedForm, setLastSavedForm] = useState<string>('');

  // 🔥 Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Έχετε μη αποθηκευμένες αλλαγές. Είστε σίγουροι ότι θέλετε να φύγετε;';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 🔥 Track form changes to detect unsaved changes
  useEffect(() => {
    const currentFormString = JSON.stringify(form);
    if (lastSavedForm && currentFormString !== lastSavedForm) {
      setHasUnsavedChanges(true);
    }
  }, [form, lastSavedForm]);

  // 🔥 AUTO-SAVE: Save form automatically after 3 seconds of no changes
  useEffect(() => {
    // Only auto-save if we have a booking number and vessel selected
    if (!form.bookingNumber || !form.vesselId) return;

    const autoSaveTimer = setTimeout(() => {
      if (hasUnsavedChanges) {
        console.log('💾 AUTO-SAVE triggered for booking:', form.bookingNumber);
        const dataToSave = { ...form, mode };
        saveBookingData(form.bookingNumber, dataToSave);
        setLastSavedForm(JSON.stringify(form));
        setHasUnsavedChanges(false);
      }
    }, 3000); // Auto-save after 3 seconds of no changes

    return () => clearTimeout(autoSaveTimer);
  }, [form, hasUnsavedChanges, mode]);

  const [history, setHistory] = useState({
    bookingNumbers: [],
    firstNames: [],
    lastNames: [],
    addresses: [],
    emails: [],
    phones: [],
  });

  const [showSuggestions, setShowSuggestions] = useState({
    bookingNumber: false,
    firstName: false,
    lastName: false,
    address: false,
    email: false,
    phone: false,
  });

  const [fleet, setFleet] = useState(() => FleetService.getBoatsByCategory());
  const [showFleet, setShowFleet] = useState(false);
  const [catName, setCatName] = useState("");
  const [vesselCat, setVesselCat] = useState("");
  const [vesselName, setVesselName] = useState("");

  // 🔥 NEW: Validation error states
  const [bookingCodeError, setBookingCodeError] = useState('');
  const [doubleBookingError, setDoubleBookingError] = useState('');

  // 🔥 Helper: Find category for a vessel name from fleet
  const findCategoryForVessel = (vesselName: string, fleetData: any) => {
    if (!vesselName || !fleetData) return null;
    const vesselLower = vesselName.toLowerCase();

    for (const [category, vessels] of Object.entries(fleetData)) {
      if (Array.isArray(vessels)) {
        for (const v of vessels) {
          // Check if vessel name matches (case-insensitive)
          if (v.toLowerCase() === vesselLower ||
              vesselLower.includes(v.toLowerCase()) ||
              v.toLowerCase().includes(vesselLower)) {
            console.log('📍 Found category for vessel:', vesselName, '→', category);
            return { category, vesselName: v }; // Return exact vessel name from fleet
          }
        }
      }
    }
    return null;
  };

// 🔥 AUTO-LOAD booking from HomePage
  useEffect(() => {
    if (location.state?.bookingCode) {
      const bookingCode = location.state.bookingCode;
      console.log('📂 Loading booking from HomePage:', bookingCode);

      const loadData = async () => {
        const data = await loadBookingData(bookingCode);
        if (data) {
          setCurrentBookingNumber(bookingCode);
          let formData = { ...data, status: data.status || 'Draft' };

          // 🔥 AUTO-POPULATE: Find category for vessel if missing
          if (formData.vesselName && !formData.vesselCategory) {
            const match = findCategoryForVessel(formData.vesselName, fleet);
            if (match) {
              formData.vesselCategory = match.category;
              formData.vesselName = match.vesselName;
              console.log('📍 Auto-populated category from HomePage:', match.category);
            }
          }

          setForm(formData);  // 🔥 Default to Draft
          setLastSavedForm(JSON.stringify(formData));  // 🔥 Mark as saved
          setHasUnsavedChanges(false);
          setMode(data.mode || 'in');
        }
      };
      loadData();
    }
  }, [location.state, fleet]);

  // 🔥 CRITICAL FIX: Load data when booking number or mode changes
  useEffect(() => {
    console.log('🔄 Loading data for booking:', currentBookingNumber);

    if (currentBookingNumber) {
      const loadData = async () => {
        const data = await loadBookingData(currentBookingNumber);
        if (data) {
          console.log('✅ Data loaded successfully');
          let formData = { ...data, status: data.status || 'Draft' };

          // 🔥 AUTO-POPULATE: If vesselName exists but category is missing/wrong, find the correct category
          if (formData.vesselName && !formData.vesselCategory) {
            const match = findCategoryForVessel(formData.vesselName, fleet);
            if (match) {
              formData.vesselCategory = match.category;
              formData.vesselName = match.vesselName; // Use exact name from fleet
              console.log('📍 Auto-populated category:', match.category, 'for vessel:', match.vesselName);
            }
          }
          // Also check if category exists but vessel isn't in that category's list
          else if (formData.vesselName && formData.vesselCategory) {
            const categoryVessels = fleet?.[formData.vesselCategory] || [];
            const vesselInCategory = categoryVessels.some(
              (v: string) => v.toLowerCase() === formData.vesselName.toLowerCase()
            );
            if (!vesselInCategory) {
              // Vessel not in specified category, try to find correct category
              const match = findCategoryForVessel(formData.vesselName, fleet);
              if (match) {
                formData.vesselCategory = match.category;
                formData.vesselName = match.vesselName;
                console.log('📍 Corrected category:', match.category, 'for vessel:', match.vesselName);
              }
            }
          }

          setForm(formData);  // 🔥 Default to Draft
          setLastSavedForm(JSON.stringify(formData));  // 🔥 Mark as saved
          setHasUnsavedChanges(false);
          // Don't override mode from data - keep current mode
        } else {
          console.log('⚠️ No data found for this booking');
        }
      };
      loadData();
    }
  }, [currentBookingNumber, fleet]);
  
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('online');
      console.log('🌐 Online');
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
      console.log('📴 Offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🔥 TWO-WAY SYNC: Load sync data from Fleet Management on mount
  useEffect(() => {
    const syncData = getBookingSync();
    if (syncData && syncData.lastUpdatedBy === 'fleetManagement') {
      const page1Data = syncToPage1Format(syncData);
      if (page1Data) {
        console.log('📥 PAGE 1: Loading sync data from Fleet Management:', page1Data);
        // Only populate fields that are empty in current form
        setForm(prev => ({
          ...prev,
          bookingNumber: prev.bookingNumber || page1Data.bookingNumber,
          vesselName: prev.vesselName || page1Data.vesselName,
          checkInDate: prev.checkInDate || page1Data.checkInDate,
          checkInTime: prev.checkInTime || page1Data.checkInTime,
          checkOutDate: prev.checkOutDate || page1Data.checkOutDate,
          checkOutTime: prev.checkOutTime || page1Data.checkOutTime,
          skipperFirstName: prev.skipperFirstName || page1Data.skipperFirstName,
          skipperLastName: prev.skipperLastName || page1Data.skipperLastName,
          skipperAddress: prev.skipperAddress || page1Data.skipperAddress,
          skipperEmail: prev.skipperEmail || page1Data.skipperEmail,
          skipperPhone: prev.skipperPhone || page1Data.skipperPhone,
        }));
      }
    }
  }, []);

  // 🔥 TWO-WAY SYNC: Save form data to sync storage whenever it changes
  useEffect(() => {
    // Debug: Log exactly what we're trying to save
    console.log('🔄 PAGE1 SYNC - Form values:', {
      bookingNumber: form.bookingNumber,
      vesselName: form.vesselName,
      checkInDate: form.checkInDate,
      checkOutDate: form.checkOutDate,
      skipperFirstName: form.skipperFirstName,
      skipperLastName: form.skipperLastName
    });

    // Only save if we have meaningful data
    if (form.bookingNumber || form.vesselName || form.checkInDate) {
      const syncData = page1ToSyncFormat(form);
      console.log('🔄 PAGE1 SYNC - Converted syncData:', syncData);
      saveBookingSync(syncData, 'page1');
    }
  }, [form.bookingNumber, form.vesselName, form.checkInDate, form.checkInTime,
      form.checkOutDate, form.checkOutTime, form.skipperFirstName, form.skipperLastName,
      form.skipperAddress, form.skipperEmail, form.skipperPhone]);

  useEffect(() => {
    const newHistory = { ...history };
    let hasChanges = false;

    if (form.bookingNumber && !history.bookingNumbers.includes(form.bookingNumber)) {
      newHistory.bookingNumbers = [form.bookingNumber, ...history.bookingNumbers].slice(0, 20);
      hasChanges = true;
    }
    if (form.skipperFirstName && !history.firstNames.includes(form.skipperFirstName)) {
      newHistory.firstNames = [form.skipperFirstName, ...history.firstNames].slice(0, 20);
      hasChanges = true;
    }
    if (form.skipperLastName && !history.lastNames.includes(form.skipperLastName)) {
      newHistory.lastNames = [form.skipperLastName, ...history.lastNames].slice(0, 20);
      hasChanges = true;
    }
    if (form.skipperAddress && !history.addresses.includes(form.skipperAddress)) {
      newHistory.addresses = [form.skipperAddress, ...history.addresses].slice(0, 20);
      hasChanges = true;
    }
    if (form.skipperEmail && !history.emails.includes(form.skipperEmail)) {
      newHistory.emails = [form.skipperEmail, ...history.emails].slice(0, 20);
      hasChanges = true;
    }
    if (form.skipperPhone && !history.phones.includes(form.skipperPhone)) {
      newHistory.phones = [form.skipperPhone, ...history.phones].slice(0, 20);
      hasChanges = true;
    }

    if (hasChanges) {
      setHistory(newHistory);
    }
  }, [form, history]);

  const handleEmployeeLogin = () => {
    const user = authService.login(employeeCode);
    if (user) {
      setCurrentEmployee(user.permissions);
      setIsEmployee(true);
      setShowLoginModal(false);
      alert(`${lang === 'el' ? 'Καλωσήρθες' : 'Welcome'} ${user.name}!`);
      setEmployeeCode("");
    } else {
      alert(lang === 'el' ? 'Λάθος κωδικός!' : 'Wrong code!');
      setEmployeeCode("");
    }
  };
  
  const handleEmployeeLogout = () => {
    setIsEmployee(false);
    setCurrentEmployee(null);
    alert(lang === 'el' ? 'Αποσυνδεθήκατε!' : 'Logged out!');
  };

  const handleToggleMode = () => {
    const newMode = mode === 'in' ? 'out' : 'in';
    
    // 🔥 CHECK: Don't allow Check-out if checkout date is in the future
    if (newMode === 'out' && form.checkOutDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkoutDate = new Date(form.checkOutDate);
      checkoutDate.setHours(0, 0, 0, 0);
      
      if (checkoutDate > today) {
        const message = lang === 'el'
          ? `❌ Δεν μπορείτε να κάνετε Check-out ακόμα!\n\nΗμερομηνία Check-out: ${formatDate(form.checkOutDate)}\nΣημερινή ημερομηνία: ${formatDate(today.toISOString().split('T')[0])}\n\nΠαρακαλώ περιμένετε μέχρι την ημερομηνία Check-out.`
          : `❌ Cannot do Check-out yet!\n\nCheck-out date: ${formatDate(form.checkOutDate)}\nToday: ${formatDate(today.toISOString().split('T')[0])}\n\nPlease wait until the check-out date.`;

        alert(message);
        return; // Don't change mode
      }
    }
    
    setMode(newMode);
    
    const updatedForm = { ...form, mode: newMode };
    setForm(updatedForm);
    
    if (currentBookingNumber) {
      saveBookingData(currentBookingNumber, updatedForm);
    }
    
    if (updateData) {
      updateData({ mode: newMode });
    }
    
    window.dispatchEvent(new CustomEvent('modeChanged', { 
      detail: { mode: newMode } 
    }));
    
    console.log('🔄 Mode changed to:', newMode);
  };

  const handleSelectBooking = (bookingNumber) => {
    setCurrentBookingNumber(bookingNumber);
    const data = loadBookingData(bookingNumber);
    
    if (data) {
      setForm(data);
      setMode(data.mode || 'in');
    }
    
    setShowBookingSelector(false);
    setShowAllBookings(false);
    console.log('✅ Switched to booking:', bookingNumber);
  };
  
  const handleCreateNewBooking = () => {
    if (!isEmployee) {
      alert(lang === 'el' ? 'Απαιτείται σύνδεση υπαλλήλου!' : 'Employee login required!');
      return;
    }
    
    // Clear current booking
    setCurrentBookingNumber('');
    localStorage.removeItem('currentBooking');
    
    // Clear form
    setForm({
      bookingNumber: "",
      vesselCategory: "",
      vesselName: "",
      checkInDate: "",
      checkInTime: "",
      checkOutDate: "",
      checkOutTime: "",
      skipperFirstName: "",
      skipperLastName: "",
      skipperAddress: "",
      skipperEmail: "",
      skipperPhone: "",
      phoneCountryCode: "+30",
    });
    
    // Reset mode to check-in
    setMode('in');
    
    // 🔥 UPDATE CONTEXT: Clear booking number
    if (updateData) {
      updateData({ 
        bookingNumber: '',
        mode: 'in'
      });
    }
    
    // Dispatch event to clear all pages
    window.dispatchEvent(new CustomEvent('bookingChanged', { 
      detail: { bookingNumber: '' } 
    }));
    
    // Clear duplicate warning
    setDuplicateBooking(null);
    
    setShowBookingSelector(false);
    setShowAllBookings(false);
    
    // 🔥 AUTO-FOCUS στο booking number field
    setTimeout(() => {
      bookingInputRef.current?.focus();
    }, 100);
    
    console.log('🆕 New booking created - all data cleared');
  };

  const handleClearAllData = () => {
    if (!currentEmployee?.canClearData) {
      alert(lang === 'el' ? 'Δεν έχετε δικαίωμα!' : 'No permission!');
      return;
    }
    
    if (window.confirm(t.confirmClearAll)) {
      // Clear state only - no localStorage for bookings
      setCurrentBookingNumber('');
      setForm({
        bookingNumber: "",
        vesselCategory: "",
        vesselName: "",
        checkInDate: "",
        checkInTime: "",
        checkOutDate: "",
        checkOutTime: "",
        skipperFirstName: "",
        skipperLastName: "",
        skipperAddress: "",
        skipperEmail: "",
        skipperPhone: "",
        phoneCountryCode: "+30",
      });
      setMode('in');
      setDuplicateBooking(null);
      
      if (updateData) {
        updateData({ bookingNumber: '', mode: 'in' });
      }
      
      alert(t.allDataCleared);
      console.log('🗑️ All data cleared');
    }
  };

  // 🔥 NEW: Load existing booking from duplicate warning
  const handleLoadExistingBooking = () => {
    if (!duplicateBooking) return;
    
    const { bookingNumber, data } = duplicateBooking;
    
    setCurrentBookingNumber(bookingNumber);
    setForm(data);
    setMode(data.mode || 'in');
    setDuplicateBooking(null);
    
    // Update context
    if (updateData) {
      updateData({ 
        bookingNumber: bookingNumber,
        mode: data.mode || 'in'
      });
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('bookingChanged', { 
      detail: { bookingNumber: bookingNumber } 
    }));
    
    console.log('✅ Loaded existing booking:', bookingNumber);
    
    alert(lang === 'el' 
      ? `✅ Φορτώθηκε το υπάρχον booking: ${bookingNumber}` 
      : `✅ Loaded existing booking: ${bookingNumber}`);
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (mode === 'out' && name !== 'mode') {
      return;
    }

    if (name === 'checkOutDate' && value) {
      if (form.checkInDate && value < form.checkInDate) {
        alert(lang === 'el' ?
          'Η ημερομηνία Check-out δεν μπορεί να είναι πριν από το Check-in!' :
          'Check-out date cannot be before Check-in date!');
        return;
      }
      // Check double booking when checkout date changes
      if (form.vesselName && form.checkInDate && value) {
        await checkDoubleBooking(form.vesselName, form.checkInDate, value);
      }
    }

    if (name === 'checkInDate' && value) {
      if (form.checkOutDate && value > form.checkOutDate) {
        setForm(prev => ({
          ...prev,
          [name]: value,
          checkOutDate: '',
          checkOutTime: ''
        }));
        alert(lang === 'el' ?
          'Το Check-out επαναφέρθηκε γιατί ήταν πριν το νέο Check-in!' :
          'Check-out was reset because it was before the new Check-in!');
        return;
      }
      // Check double booking when checkin date changes
      if (form.vesselName && value && form.checkOutDate) {
        await checkDoubleBooking(form.vesselName, value, form.checkOutDate);
      }
    }

    if (name === 'vesselName' && value) {
      // 🔥 FIX: Use vesselName directly (not transformed) for localStorage key matching
      // AdminDashboard checks: fleet_{boat.name}_ΝΑΥΛΑ, fleet_{UPPER}_ΝΑΥΛΑ, fleet_{lower}_ΝΑΥΛΑ
      // So we should save with the exact vesselName to ensure matching
      const vesselId = value; // Use exact vessel name for storage key matching

      console.log('🔥 PAGE 1: Setting vessel ID:', vesselId);
      console.log('🔥 PAGE 1: Storage key will be: fleet_' + vesselId + '_ΝΑΥΛΑ');
      localStorage.setItem('selectedVessel', vesselId);

      // 🔥 FIX: Also set vesselId in form so saveToFleetManagementStorage receives it
      setForm(prev => ({
        ...prev,
        [name]: value,
        vesselId: vesselId
      }));

      // Check double booking when vessel changes
      if (value && form.checkInDate && form.checkOutDate) {
        await checkDoubleBooking(value, form.checkInDate, form.checkOutDate);
      }

      return; // Don't call setForm again below
    }

    if (name === 'bookingNumber' && value) {
      setCurrentBookingNumber(value);

      // 🔥 Check if booking number exists in API (API is source of truth)
      if (value.trim()) {
        await checkDuplicateBookingCode(value.trim());
      }
    } else if (name === 'bookingNumber' && !value) {
      setDuplicateBooking(null);
      setBookingCodeError('');
    }

    setForm(prev => ({ ...prev, [name]: value }));
  };

  // 🔥 API VALIDATION: Check if booking code already exists (uses imported checkDuplicateCharterCode)
  const checkDuplicateBookingCode = async (code: string) => {
    if (!code || !code.trim()) {
      setBookingCodeError('');
      return;
    }

    try {
      const excludeId = currentBookingNumber || form.bookingNumber;
      const result = await checkDuplicateCharterCode(code, excludeId);

      if (result.isDuplicate) {
        setBookingCodeError(lang === 'el' ?
          'Αυτός ο αριθμός ναύλου υπάρχει ήδη' :
          'This charter party number already exists');
      } else {
        setBookingCodeError('');
      }
    } catch (error) {
      console.error('Error checking duplicate booking code:', error);
    }
  };

  // 🔥 API VALIDATION: Check if vessel is already booked for overlapping dates (uses imported checkDateOverlap)
  const checkDoubleBooking = async (vessel: string, startDate: string, endDate: string) => {
    if (!vessel || !startDate || !endDate) {
      setDoubleBookingError('');
      return;
    }

    try {
      // Get vessels from API or localStorage
      let vesselsList: any[] = [];
      try {
        vesselsList = await getVessels();
      } catch {
        // Fallback to localStorage
        const stored = localStorage.getItem(FLEET_STORAGE_KEY);
        if (stored) {
          vesselsList = JSON.parse(stored);
        }
      }

      // Find vessel ID from name
      const vesselObj = vesselsList.find((v: any) =>
        v.name?.toLowerCase() === vessel.toLowerCase()
      );

      if (!vesselObj) {
        console.log('Vessel not found for overlap check:', vessel);
        setDoubleBookingError('');
        return;
      }

      const excludeId = currentBookingNumber || form.bookingNumber;
      const result = await checkDateOverlap(vesselObj.id, startDate, endDate, excludeId);

      if (result.hasOverlap) {
        setDoubleBookingError(lang === 'el' ?
          'Το σκάφος έχει ήδη κράτηση για αυτές τις ημερομηνίες' :
          'This vessel already has a booking for these dates');
      } else {
        setDoubleBookingError('');
      }
    } catch (error) {
      console.error('Error checking double booking:', error);
    }
  };

  const getFilteredSuggestions = (fieldName, value) => {
    const fieldMap = {
      bookingNumber: history.bookingNumbers,
      skipperFirstName: history.firstNames,
      skipperLastName: history.lastNames,
      skipperAddress: history.addresses,
      skipperEmail: history.emails,
      skipperPhone: history.phones,
    };
    
    const suggestions = fieldMap[fieldName] || [];
    
    if (!value || value.length === 0) {
      return suggestions;
    }
    
    return suggestions.filter(item => 
      item.toLowerCase().includes(value.toLowerCase())
    );
  };

  const brand = {
    black: "#000000",
    blue: "#3B82F6",
    successBorder: "#22c55e",
    successBg: "#d1fae5",
    pageBg: "#eae8dc",
  };
  
  const filledClass = (ok) => ok ? "border-green-500 bg-green-50" : "border-blue-400 bg-white";

  const bookingComplete = isFilled(form.bookingNumber);
  const vesselComplete = isFilled(form.vesselCategory) && isFilled(form.vesselName);
  const datesInComplete = isFilled(form.checkInDate) && isFilled(form.checkInTime);
  const datesOutComplete = isFilled(form.checkOutDate) && isFilled(form.checkOutTime);
  const skipperNameComplete = isFilled(form.skipperFirstName) && isFilled(form.skipperLastName);
  const addressComplete = isFilled(form.skipperAddress);
  const contactComplete = isFilled(form.skipperEmail) && isFilled(form.skipperPhone);

  const handleSaveDraft = () => {
    if (!currentBookingNumber || !form.bookingNumber) {
      alert(lang === 'el' ? 'Παρακαλώ εισάγετε αριθμό κράτησης!' : 'Please enter booking number!');
      return;
    }

    const dataToSave = { ...form, mode };
    saveBookingData(currentBookingNumber || form.bookingNumber, dataToSave);

    // 🔥 Mark as saved - clear unsaved changes flag
    setLastSavedForm(JSON.stringify(form));
    setHasUnsavedChanges(false);

    alert(lang === 'el' ? 'Το προσχέδιο αποθηκεύτηκε!' : 'Draft saved!');
  };

  const handleClearForm = () => {
    if (window.confirm(lang === 'el' ? 'Είστε σίγουροι ότι θέλετε να διαγράψετε όλα τα πεδία;' : 'Are you sure you want to clear all fields?')) {
      setForm({
        bookingNumber: "",
        vesselCategory: "",
        vesselName: "",
        checkInDate: "",
        checkInTime: "",
        checkOutDate: "",
        checkOutTime: "",
        skipperFirstName: "",
        skipperLastName: "",
        skipperAddress: "",
        skipperEmail: "",
        skipperPhone: "",
        phoneCountryCode: "+30",
      });
      setCurrentBookingNumber('');
      localStorage.removeItem('selectedVessel');
    }
  };

  const highlightElement = (ref) => {
    if (ref && ref.current) {
      ref.current.classList.add('validation-error');
      setTimeout(() => {
        if (ref.current) {
          ref.current.classList.remove('validation-error');
        }
      }, 3000);
    }
  };

  // Handle Enter key to move to next input field
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Get all form inputs and selects
      const form = e.target.form;
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea'));
      const currentIndex = inputs.indexOf(e.target);

      if (currentIndex < inputs.length - 1) {
        // Focus next input
        inputs[currentIndex + 1].focus();
      } else {
        // Last input - trigger save button
        const saveButton = form.querySelector('button[type="button"]');
        if (saveButton) saveButton.click();
      }
    }
  };

  const validateAndScroll = () => {
    if (!form.bookingNumber) {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(bookingRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε τον αριθμό κράτησης!' : 'Please fill in the booking number!');
      return false;
    }

    // 🔥 NEW: Check for duplicate booking code
    if (bookingCodeError) {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(bookingRef);
      alert(bookingCodeError);
      return false;
    }

    if (!form.vesselCategory || !form.vesselName) {
      vesselRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(vesselRef);
      alert(lang === 'el' ? 'Παρακαλώ επιλέξτε σκάφος!' : 'Please select a vessel!');
      return false;
    }
    
    if (!form.checkInDate || !form.checkInTime) {
      checkInRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(checkInRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε ημερομηνία και ώρα επιβίβασης!' : 'Please fill in check-in date and time!');
      return false;
    }
    
    if (!form.checkOutDate || !form.checkOutTime) {
      checkOutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(checkOutRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε ημερομηνία και ώρα αποβίβασης!' : 'Please fill in check-out date and time!');
      return false;
    }
    
    // 🔥 CHECK: Check-out date must be >= Check-in date
    if (form.checkInDate && form.checkOutDate) {
      const checkInDate = new Date(form.checkInDate);
      const checkOutDate = new Date(form.checkOutDate);

      if (checkOutDate < checkInDate) {
        checkOutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightElement(checkOutRef);
        alert(lang === 'el'
          ? '❌ Η ημερομηνία αποβίβασης δεν μπορεί να είναι πριν από την ημερομηνία επιβίβασης!'
          : '❌ Check-out date cannot be before check-in date!');
        return false;
      }
    }

    // 🔥 NEW: Check for double booking
    if (doubleBookingError) {
      checkInRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(checkInRef);
      alert(doubleBookingError);
      return false;
    }

    if (!form.skipperFirstName || !form.skipperLastName) {
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(nameRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε το όνομα και επώνυμο του κυβερνήτη!' : 'Please fill in skipper\'s name!');
      return false;
    }
    
    if (!form.skipperAddress) {
      addressRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(addressRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε τη διεύθυνση του κυβερνήτη!' : 'Please fill in skipper\'s address!');
      return false;
    }
    
    if (!form.skipperEmail || !form.skipperPhone) {
      contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(contactRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε email και τηλέφωνο!' : 'Please fill in email and phone!');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateAndScroll()) return;
    
    // 🔥 CHECK: Can only proceed on check-in day
    if (mode === 'in' && form.checkInDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkInDate = new Date(form.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      
      if (checkInDate.getTime() !== today.getTime()) {
        const message = lang === 'el'
          ? `❌ Μπορείτε να προχωρήσετε μόνο την ημέρα Check-in!\n\nΗμερομηνία Check-in: ${formatDate(form.checkInDate)}\nΣημερινή ημερομηνία: ${formatDate(today.toISOString().split('T')[0])}`
          : `❌ You can only proceed on Check-in day!\n\nCheck-in date: ${formatDate(form.checkInDate)}\nToday: ${formatDate(today.toISOString().split('T')[0])}`;
        
        alert(message);
        return;
      }
    }
    
    // 🔥 CHECK: Don't allow Check-out if checkout date is in the future
    if (mode === 'out' && form.checkOutDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const checkoutDate = new Date(form.checkOutDate);
      checkoutDate.setHours(0, 0, 0, 0);
      
      if (checkoutDate > today) {
        const message = lang === 'el'
          ? `❌ Δεν μπορείτε να προχωρήσετε στο Check-out ακόμα!\n\nΗμερομηνία Check-out: ${formatDate(form.checkOutDate)}\nΣημερινή ημερομηνία: ${formatDate(today.toISOString().split('T')[0])}\n\nΠαρακαλώ περιμένετε μέχρι την ημερομηνία Check-out.`
          : `❌ Cannot proceed with Check-out yet!\n\nCheck-out date: ${formatDate(form.checkOutDate)}\nToday: ${formatDate(today.toISOString().split('T')[0])}\n\nPlease wait until the check-out date.`;
        
        alert(message);
        return; // Don't navigate
      }
    }
    
    const bookingNum = currentBookingNumber || form.bookingNumber;
    const dataToSave = { ...form, mode };
    saveBookingData(bookingNum, dataToSave);
    
    // 🔥 CRITICAL: Set currentBookingNumber if it's a new booking
    if (!currentBookingNumber && form.bookingNumber) {
      setCurrentBookingNumber(form.bookingNumber);
    }
    
    // 🔥 UPDATE CONTEXT with booking number and mode
    if (updateData) {
      updateData({ 
        bookingNumber: bookingNum,
        mode: mode 
      });
    }
    
    navigate('/page2');
  };

  const generatePDF = () => {
    if (!validateAndScroll()) {
      return;
    }

    try {
      const bookingData = {
        bookingNumber: form.bookingNumber,
        vesselName: `${form.vesselCategory} - ${form.vesselName}`,
        selectedVessel: form.vesselName,
        skipperFirstName: form.skipperFirstName,
        skipperLastName: form.skipperLastName,
        skipperEmail: form.skipperEmail,
        skipperPhone: `${form.phoneCountryCode} ${form.skipperPhone}`,
        skipperAddress: form.skipperAddress,
        checkInDate: form.checkInDate,
        checkInTime: form.checkInTime,
        checkOutDate: form.checkOutDate,
        checkOutTime: form.checkOutTime,
      };

      const pdf = generateLuxuryPDF(
        bookingData,
        mode,
        {},
        lang,
        { isPage1: true }
      );

      const fileName = `Page1_Booking_${form.bookingNumber}_${Date.now()}.pdf`;
      pdf.save(fileName);

      console.log('✅ PDF generated successfully!');
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      alert('Error generating PDF. Check console for details.');
    }
  };

  const handleCountryCodeChange = (newCode) => {
    setForm({ ...form, phoneCountryCode: newCode });
    if (newCode === "+30") setLang("el");
    else if (newCode === "+44" || newCode === "+1") setLang("en");
  };

  const SuggestionItem = ({ suggestion, fieldName }) => (
    <div 
      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b"
      onMouseDown={(e) => {
        e.preventDefault();
        setForm(prev => ({ ...prev, [fieldName]: suggestion }));
        setShowSuggestions({
          bookingNumber: false,
          firstName: false,
          lastName: false,
          address: false,
          email: false,
          phone: false,
        });
      }}
    >
      {suggestion}
    </div>
  );

  // 🔥 UPDATED: Use global bookings from App.tsx context (auto-refreshes every 3 minutes)
  const allBookings = globalBookings || [];
  const isLoadingBookings = globalIsRefreshing || false;

  // 🔥 Listen for global refresh events (triggered by App.tsx auto-refresh)
  useEffect(() => {
    const handleGlobalRefresh = (e: CustomEvent) => {
      console.log('🔄 Page 1: Received global bookings refresh', e.detail?.bookings?.length, 'bookings');
    };

    window.addEventListener('globalBookingsRefreshed', handleGlobalRefresh as EventListener);
    return () => window.removeEventListener('globalBookingsRefreshed', handleGlobalRefresh as EventListener);
  }, []);

  // Refresh from API when counter changes
  useEffect(() => {
    if (refreshCounter > 0 && refreshBookings) {
      console.log('🔄 Page 1: Refreshing from API');
      refreshBookings();
    }
  }, [refreshCounter, refreshBookings]);

  // 🔥 Compute today's checkouts from API-loaded bookings
  const todayCheckouts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return allBookings.filter(booking => booking?.checkOutDate === today);
  }, [allBookings]);

  // 🔥 NEW: Determine which bookings to show (ensure it's always an array)
  const displayedBookings = Array.isArray(showAllBookings ? allBookings : todayCheckouts)
    ? (showAllBookings ? allBookings : todayCheckouts)
    : [];
  return (
    <>
      <style>{`
        .validation-error {
          animation: errorPulse 3s;
          border-color: #ef4444 !important;
          background-color: #fee2e2 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3) !important;
        }
        @keyframes errorPulse {
          0%, 100% { 
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.3);
          }
          50% { 
            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.2);
          }
        }
      `}</style>
      
      <div className="min-h-screen p-6" style={{ background: brand.pageBg }}>
        <div className="max-w-3xl mx-auto bg-sky-100 shadow rounded-2xl p-6 border-2" style={{ borderColor: brand.black }}>
          
          <div className="bg-white border-2 border-blue-500 rounded-xl p-4 mb-6">
            <div className="text-center mb-4">
              <div className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xl mb-3">
                TAILWIND YACHTING
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                📍 Leukosias 37, Alimos | 📧 info@tailwindyachting.com | 📞 +30 697 819 6009
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border-t border-blue-200 pt-3">
              <div>
                <span className="font-semibold text-gray-700">📋 {t.bookingNumber.replace('1. ', '')}:</span>{" "}
                <span className="text-blue-700 font-medium">
                  {form.bookingNumber || <em className="text-gray-400">{t.notSet}</em>}
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">🚤 {t.vessel}:</span>{" "}
                <span className="text-blue-700 font-medium">
                  {form.vesselName 
                    ? `${form.vesselCategory} - ${form.vesselName}` 
                    : <em className="text-gray-400">{t.notSelected}</em>
                  }
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">📅 Check-in:</span>{" "}
                <span className="text-blue-700 font-medium">
                  {form.checkInDate && form.checkInTime
                    ? `${formatDate(form.checkInDate)} ${form.checkInTime}`
                    : <em className="text-gray-400">{t.notSet}</em>
                  }
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">🏁 Check-out:</span>{" "}
                <span className="text-blue-700 font-medium">
                  {form.checkOutDate && form.checkOutTime
                    ? `${formatDate(form.checkOutDate)} ${form.checkOutTime}`
                    : <em className="text-gray-400">{t.notSet}</em>
                  }
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">{t.mode}</span>{" "}
                <span className={mode === 'in' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                  {mode === 'in' ? `✅ ${t.checkin}` : `🚪 ${t.checkout}`}
                </span>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">{t.status}</span>{" "}
                <span className={
                  networkStatus === 'online' ? 'text-green-600' : 'text-orange-600'
                }>
                  {networkStatus === 'online' ? `✅ ${t.synced}` : `📴 ${t.offline}`}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="bg-white border-2 border-blue-400 rounded-xl p-4">
              <label className="block font-semibold mb-2 text-gray-700">
                {t.selectBooking}
              </label>
              
              <button
                onClick={() => setShowBookingSelector(true)}
                className="w-full px-4 py-3 rounded-lg border-2 border-blue-400 bg-white text-left hover:bg-blue-50 transition-all duration-200 flex items-center justify-between"
              >
                <span className="font-medium text-blue-700">
                  {currentBookingNumber 
                    ? `${currentBookingNumber} - ${form.vesselName || 'No vessel'} - ${formatDate(form.checkInDate) || 'No date'}`
                    : t.noBookings
                  }
                </span>
                <span className="text-blue-500">▼</span>
              </button>
              
              {isEmployee && (
                <button
                  onClick={handleCreateNewBooking}
                  className="w-full mt-2 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-all duration-200 font-medium"
                >
                  {t.createNewBooking}
                </button>
              )}
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={handleToggleMode}
                className={`px-6 py-3 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  mode === 'in' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {mode === 'in' ? '✅ CHECK-IN MODE' : '🚪 CHECK-OUT MODE'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setLang("en")} 
                className={`px-3 py-1 rounded border ${lang === "en" ? "bg-blue-500 text-white" : "bg-white text-blue-500"}`}>
                🇬🇧 EN
              </button>
              <button type="button" onClick={() => setLang("el")} 
                className={`px-3 py-1 rounded border ${lang === "el" ? "bg-blue-500 text-white" : "bg-white text-blue-500"}`}>
                🇬🇷 GR
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {isEmployee ? (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded flex items-center gap-2">
                    <span>👤</span>
                    <span className="font-semibold">{currentEmployee?.name}</span>
                    <span className="text-xs">
                      {currentEmployee?.canEdit ? '✏️' : ''}
                      {currentEmployee?.canDelete ? '🗑️' : ''}
                      {currentEmployee?.canManageFleet ? '⚓' : ''}
                    </span>
                  </span>
                  <button 
                    onClick={handleEmployeeLogout}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                    {lang === 'el' ? 'Έξοδος' : 'Logout'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-2">
                  🔐 {lang === 'el' ? 'Είσοδος Υπαλλήλου' : 'Employee Login'}
                </button>
              )}
            </div>
          </div>

          {isEmployee && currentEmployee?.canClearData && (
            <div className="mb-6">
              <button
                onClick={handleClearAllData}
                className="w-full px-4 py-3 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-all duration-300 shadow-lg border-2 border-red-800"
              >
                🗑️ {t.clearAllData}
              </button>
            </div>
          )}

          <div className="space-y-6 text-lg" style={{ color: brand.black }}>
            
            <div ref={bookingRef} className="border-2 rounded-xl p-4 relative transition-all duration-300" 
              style={{ 
                borderColor: bookingComplete ? brand.successBorder : brand.blue, 
                background: bookingComplete ? brand.successBg : 'transparent' 
              }}>
              <label className="block font-semibold cursor-pointer">
                {t.bookingNumber} <span className="text-red-500">*</span>
                {!isEmployee && <span className="ml-2 text-sm bg-orange-500 text-white px-2 py-1 rounded">Employee Login Required</span>}
                {mode === 'out' && <span className="ml-2 text-sm bg-gray-500 text-white px-2 py-1 rounded">🔒 Read-only in check-out</span>}
              </label>
              <div className="relative">
                <input
                  ref={bookingInputRef}
                  aria-label={stripNumber(t.bookingNumber)}
                  name="bookingNumber"
                  value={form.bookingNumber}
                  onChange={handleChange}
                  onKeyDown={handleFormKeyDown}
                  disabled={!isEmployee || mode === 'out'}
                  onFocus={() => {
                    if (isEmployee && mode === 'in') {
                      speakLabel(t.bookingNumber);
                      setShowSuggestions(prev => ({ ...prev, bookingNumber: true }));
                    }
                  }}
                  onBlur={() => {
                    if (form.bookingNumber && form.bookingNumber.trim()) {
                      checkDuplicateBookingCode(form.bookingNumber.trim());
                    }
                    setTimeout(() => setShowSuggestions(prev => ({ ...prev, bookingNumber: false })), 200);
                  }}
                  className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${
                    bookingCodeError || duplicateBooking
                      ? 'border-red-500 bg-red-50'
                      : filledClass(!!form.bookingNumber)
                  } ${!isEmployee || mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder={!isEmployee ? 'Employee login required' : mode === 'out' ? 'Read-only' : (lang==='el' ? 'Πληκτρολογήστε αριθμό κράτησης' : 'Enter booking number')}
                />

                {/* 🔥 NEW: BOOKING CODE ERROR */}
                {bookingCodeError && (
                  <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">❌</span>
                      <p className="font-bold text-red-800">{bookingCodeError}</p>
                    </div>
                  </div>
                )}

                {/* 🔥 DUPLICATE WARNING */}
                {duplicateBooking && (
                  <div className="mt-3 p-4 bg-orange-100 border-2 border-orange-500 rounded-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="font-bold text-orange-800 mb-2">
                          {lang === 'el' 
                            ? `Το booking "${duplicateBooking.bookingNumber}" υπάρχει ήδη!` 
                            : `Booking "${duplicateBooking.bookingNumber}" already exists!`}
                        </p>
                        <div className="text-sm text-orange-700 mb-3 space-y-1">
                          <p>🚢 {duplicateBooking.data.vesselCategory} - {duplicateBooking.data.vesselName}</p>
                          <p>📅 {duplicateBooking.data.checkInDate} → {duplicateBooking.data.checkOutDate}</p>
                          <p>👤 {duplicateBooking.data.skipperFirstName} {duplicateBooking.data.skipperLastName}</p>
                        </div>
                        <button
                          onClick={handleLoadExistingBooking}
                          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded transition-all"
                        >
                          {lang === 'el' 
                            ? '📂 Άνοιγμα υπάρχοντος booking' 
                            : '📂 Load existing booking'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {showSuggestions.bookingNumber && isEmployee && mode === 'in' && !duplicateBooking && (
                  <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                    <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                    {getFilteredSuggestions('bookingNumber', form.bookingNumber).map((s, i) => (
                      <SuggestionItem key={i} suggestion={s} fieldName="bookingNumber" />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div ref={vesselRef} className="border-2 rounded-xl p-4 space-y-3 transition-all duration-300" 
              style={{ 
                borderColor: vesselComplete ? brand.successBorder : brand.blue, 
                background: vesselComplete ? brand.successBg : 'transparent' 
              }}>
              <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.vesselSection)}>
                {t.vesselSection} <span className="text-red-500">*</span>
                {!isEmployee && <span className="ml-2 text-sm bg-orange-500 text-white px-2 py-1 rounded">Employee Login Required</span>}
                {mode === 'out' && <span className="ml-2 text-sm bg-gray-500 text-white px-2 py-1 rounded">🔒 Read-only</span>}
              </label>
              <div className="text-sm mt-1">
                {currentEmployee?.canManageFleet ? (
                  <button type="button" onClick={() => setShowFleet(true)} className="underline text-blue-600">
                    {lang === 'el' ? 'Διαχείριση στόλου (προσθήκη κατηγοριών/σκαφών)' : 'Manage fleet (add categories/vessels)'}
                  </button>
                ) : isEmployee ? (
                  <span className="text-gray-500">
                    {lang === 'el' ? '🔒 Δεν έχετε δικαίωμα διαχείρισης στόλου' : '🔒 No fleet management permission'}
                  </span>
                ) : (
                  <span className="text-orange-500">
                    {lang === 'el' ? '🔐 Απαιτείται σύνδεση υπαλλήλου' : '🔐 Employee login required'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm block mb-1">{t.category}</span>
                  <select
                    aria-label={t.category}
                    name="vesselCategory"
                    value={form.vesselCategory}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, vesselCategory: val, vesselName: "" });
                      if (val === 'Catamaran') speak(I18N[lang].cat);
                      if (val === 'Monohull') speak(I18N[lang].mono);
                    }}
                    onKeyDown={handleFormKeyDown}
                    onFocus={()=>speakLabel(t.category)}
                    disabled={!isEmployee || mode === 'out'}
                    className={`w-full border rounded p-2 transition-all duration-300 ${filledClass(!!form.vesselCategory)} ${!isEmployee || mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                    <option value="">{t.selectCategory}</option>
                    {Object.keys(fleet||{}).map(c=> (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <span className="text-sm block mb-1">{t.vessel}</span>
                  <select
                    aria-label={t.vessel}
                    name="vesselName"
                    value={form.vesselName}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    onFocus={()=>speakLabel(t.vessel)}
                    className={`w-full border rounded p-2 transition-all duration-300 ${filledClass(!!form.vesselName)} ${!isEmployee || mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    disabled={!form.vesselCategory || !isEmployee || mode === 'out'}>
                    <option value="">{form.vesselCategory ? t.selectVessel : t.selectCatFirst}</option>
                    {(fleet?.[form.vesselCategory]||[]).map(v => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
              </div>
              {form.vesselName && (
                <div className="text-sm bg-blue-50 p-2 rounded">
                  {t.selected} <span className="font-medium">{form.vesselCategory} — {form.vesselName}</span>
                </div>
              )}
            </div>

            <div ref={checkInRef} className="border-2 rounded-xl p-4 transition-all duration-300" 
              style={{ 
                borderColor: datesInComplete ? brand.successBorder : brand.blue, 
                background: datesInComplete ? brand.successBg : 'transparent' 
              }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.dateIn)}>
                    {t.dateIn} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    type="date"
                    name="checkInDate"
                    value={form.checkInDate}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    min={new Date().toISOString().split('T')[0]}
                    onFocus={()=>speakLabel(t.dateIn)}
                    disabled={mode === 'out'}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.checkInDate)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.timeIn)}>
                    {t.timeIn} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    type="time"
                    name="checkInTime"
                    value={form.checkInTime}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    onFocus={()=>speakLabel(t.timeIn)}
                    disabled={mode === 'out'}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.checkInTime)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            </div>

            <div ref={checkOutRef} className="border-2 rounded-xl p-4 transition-all duration-300" 
              style={{ 
                borderColor: datesOutComplete ? brand.successBorder : brand.blue, 
                background: datesOutComplete ? brand.successBg : 'transparent' 
              }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.dateOut)}>
                    {t.dateOut} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    type="date"
                    name="checkOutDate"
                    value={form.checkOutDate}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    min={form.checkInDate || new Date().toISOString().split('T')[0]}
                    onFocus={()=>speakLabel(t.dateOut)}
                    disabled={mode === 'out'}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.checkOutDate)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.timeOut)}>
                    {t.timeOut} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    type="time"
                    name="checkOutTime"
                    value={form.checkOutTime}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    onFocus={()=>speakLabel(t.timeOut)}
                    disabled={mode === 'out'}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.checkOutTime)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* 🔥 NEW: DOUBLE BOOKING ERROR */}
              {doubleBookingError && (
                <div className="mt-3 p-3 bg-red-100 border-2 border-red-500 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❌</span>
                    <p className="font-bold text-red-800">{doubleBookingError}</p>
                  </div>
                </div>
              )}
            </div>

            <div ref={nameRef} className="border-2 rounded-xl p-4 transition-all duration-300" 
              style={{ 
                borderColor: skipperNameComplete ? brand.successBorder : brand.blue, 
                background: skipperNameComplete ? brand.successBg : 'transparent' 
              }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.firstName)}>
                    {t.firstName} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    name="skipperFirstName"
                    value={form.skipperFirstName}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    disabled={mode === 'out'}
                    onFocus={() => {
                      speakLabel(t.firstName);
                      if (mode === 'in') setShowSuggestions({ ...showSuggestions, firstName: true });
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions({ ...showSuggestions, firstName: false }), 200);
                    }}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.skipperFirstName)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder={lang==='el' ? 'Όνομα' : 'First Name'}
                  />
                  {showSuggestions.firstName && mode === 'in' && (
                    <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                      <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                      {getFilteredSuggestions('skipperFirstName', form.skipperFirstName).map((s, i) => (
                        <SuggestionItem key={i} suggestion={s} fieldName="skipperFirstName" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.lastName)}>
                    {t.lastName} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    name="skipperLastName"
                    value={form.skipperLastName}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    disabled={mode === 'out'}
                    onFocus={() => {
                      speakLabel(t.lastName);
                      if (mode === 'in') setShowSuggestions({ ...showSuggestions, lastName: true });
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions({ ...showSuggestions, lastName: false }), 200);
                    }}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.skipperLastName)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder={lang==='el' ? 'Επώνυμο' : 'Last Name'}
                  />
                  {showSuggestions.lastName && mode === 'in' && (
                    <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                      <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                      {getFilteredSuggestions('skipperLastName', form.skipperLastName).map((s, i) => (
                        <SuggestionItem key={i} suggestion={s} fieldName="skipperLastName" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div ref={addressRef} className="border-2 rounded-xl p-4 relative transition-all duration-300" 
              style={{ 
                borderColor: addressComplete ? brand.successBorder : brand.blue, 
                background: addressComplete ? brand.successBg : 'transparent' 
              }}>
              <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.address)}>
                {t.address} <span className="text-red-500">*</span>
                {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
              </label>
              <input
                name="skipperAddress"
                value={form.skipperAddress}
                onChange={handleChange}
                onKeyDown={handleFormKeyDown}
                disabled={mode === 'out'}
                onFocus={() => {
                  speakLabel(t.address);
                  if (mode === 'in') setShowSuggestions({ ...showSuggestions, address: true });
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions({ ...showSuggestions, address: false }), 200);
                }}
                className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.skipperAddress)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder={lang==='el' ? 'Διεύθυνση' : 'Address'}
              />
              {showSuggestions.address && mode === 'in' && (
                <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                  <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                  {getFilteredSuggestions('skipperAddress', form.skipperAddress).map((s, i) => (
                    <SuggestionItem key={i} suggestion={s} fieldName="skipperAddress" />
                  ))}
                </div>
              )}
            </div>

            <div ref={contactRef} className="border-2 rounded-xl p-4 transition-all duration-300" 
              style={{ 
                borderColor: contactComplete ? brand.successBorder : brand.blue, 
                background: contactComplete ? brand.successBg : 'transparent' 
              }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block font-semibold cursor-pointer" onClick={()=>speakLabel(t.email)}>
                    {t.email} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <input
                    type="email"
                    name="skipperEmail"
                    value={form.skipperEmail}
                    onChange={handleChange}
                    onKeyDown={handleFormKeyDown}
                    disabled={mode === 'out'}
                    onFocus={() => {
                      speakLabel(t.email);
                      if (mode === 'in') setShowSuggestions({ ...showSuggestions, email: true });
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSuggestions({ ...showSuggestions, email: false }), 200);
                    }}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.skipperEmail)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="email@example.com"
                  />
                  {showSuggestions.email && mode === 'in' && (
                    <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                      <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                      {getFilteredSuggestions('skipperEmail', form.skipperEmail).map((s, i) => (
                        <SuggestionItem key={i} suggestion={s} fieldName="skipperEmail" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block font-semibold cursor-pointer mb-2" onClick={()=>speakLabel(t.phone)}>
                    {t.phone} <span className="text-red-500">*</span>
                    {mode === 'out' && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-1 rounded">🔒</span>}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.phoneCountryCode}
                      onChange={(e) => handleCountryCodeChange(e.target.value)}
                      onKeyDown={handleFormKeyDown}
                      disabled={mode === 'out'}
                      className={`border border-blue-400 rounded p-2 bg-white ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      style={{ width: "120px" }}
                    >
                      {COUNTRY_CODES.map(({ code, country, flag }) => (
                        <option key={`${country}-${code}`} value={code}>
                          {flag} {code}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1 relative">
                      <input
                        type="tel"
                        name="skipperPhone"
                        value={form.skipperPhone}
                        onChange={handleChange}
                        onKeyDown={handleFormKeyDown}
                        disabled={mode === 'out'}
                        onFocus={() => {
                          speakLabel(t.phone);
                          if (mode === 'in') setShowSuggestions({ ...showSuggestions, phone: true });
                        }}
                        onBlur={() => {
                          setTimeout(() => setShowSuggestions({ ...showSuggestions, phone: false }), 200);
                        }}
                        className={`w-full border rounded p-2 transition-all duration-300 ${filledClass(!!form.skipperPhone)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder={lang==='el' ? '69XXXXXXXX' : 'Phone number'}
                      />
                      {showSuggestions.phone && mode === 'in' && (
                        <div className="absolute z-10 w-full bg-white border border-blue-400 rounded mt-1 max-h-40 overflow-y-auto shadow-lg">
                          <div className="text-xs font-semibold px-3 py-2 bg-gray-100">{t.recentEntries}</div>
                          {getFilteredSuggestions('skipperPhone', form.skipperPhone).map((s, i) => (
                            <SuggestionItem key={i} suggestion={s} fieldName="skipperPhone" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Back Button - Left */}
              <button 
                type="button" 
                onClick={() => navigate('/')}
                className="px-5 py-2.5 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
                                ← {t.back}
🏠 {lang === 'el' ? 'Αρχική' : 'Home'}
              </button>

              {/* Right Side Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-5 py-2.5 rounded text-sm font-medium bg-gray-600 text-white hover:bg-gray-700">
                  {t.saveDraft}
                </button>
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-5 py-2.5 rounded text-sm font-medium border-2 border-blue-500 bg-white text-blue-500 hover:bg-blue-50">
                  {t.clear}
                </button>
                <button
                  type="button"
                  onClick={generatePDF}
                  className="px-5 py-2.5 rounded text-sm font-medium bg-red-500 text-white hover:bg-red-600">
                  📄 {t.pdf}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded text-sm font-medium bg-blue-500 text-white hover:bg-blue-600">
                  {t.next} →
                </button>
              </div>
            </div>
          </div>
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">
                🔐 {lang === 'el' ? 'Είσοδος Υπαλλήλου' : 'Employee Login'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  {lang === 'el' ? 'Κωδικός Υπαλλήλου:' : 'Employee Code:'}
                </label>
                <div className="relative">
                  <input
                    type={showEmployeeCode ? "text" : "password"}
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEmployeeLogin()}
                    className="w-full p-2 pr-10 border rounded"
                    placeholder={lang === 'el' ? 'Εισάγετε κωδικό υπαλλήλου' : 'Enter employee code'}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmployeeCode(!showEmployeeCode)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-xl text-gray-600 hover:text-blue-600"
                  >
                    {showEmployeeCode ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setEmployeeCode("");
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                  {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
                </button>
                <button
                  onClick={handleEmployeeLogin}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  {lang === 'el' ? 'Σύνδεση' : 'Login'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBookingSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{t.selectBooking}</h3>
                <button className="text-2xl hover:text-red-500" onClick={()=>{setShowBookingSelector(false); setShowAllBookings(false);}}>×</button>
              </div>

              {/* 🔥 TODAY'S CHECK-OUTS HEADER */}
              {!showAllBookings && todayCheckouts.length > 0 && (
                <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-400 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-blue-700 text-lg">
                        📅 {t.todayCheckouts}
                      </div>
                      <div className="text-sm text-blue-600">
                        🚤 {todayCheckouts.length} {t.vesselsCheckingOut}
                      </div>
                    </div>
                    <div className="text-3xl">
                      {new Date().toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB')}
                    </div>
                  </div>
                </div>
              )}

              {displayedBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-4">
                    {showAllBookings ? t.noBookings : (lang === 'el' ? 'Δεν υπάρχουν check-outs σήμερα' : 'No check-outs today')}
                  </p>
                  {isEmployee && (
                    <button
                      onClick={handleCreateNewBooking}
                      className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                    >
                      {t.createNewBooking}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedBookings.map((booking) => (
                    <div
                      key={booking.bookingNumber}
                      onClick={() => handleSelectBooking(booking.bookingNumber)}
                      className={`p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition-all ${
                        booking.bookingNumber === currentBookingNumber
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-lg text-blue-700">
                            📋 {booking.bookingNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            🚤 {booking.vesselCategory} - {booking.vesselName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            📅 {formatDate(booking.checkInDate)} {booking.checkInTime} → {formatDate(booking.checkOutDate)} {booking.checkOutTime}
                          </div>
                          {booking.skipperFirstName && (
                            <div className="text-xs text-gray-600 mt-1">
                              👤 {booking.skipperFirstName} {booking.skipperLastName}
                            </div>
                          )}
                        </div>
                        {booking.bookingNumber === currentBookingNumber && (
                          <div className="text-green-600 font-bold text-2xl">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 🔥 TOGGLE BUTTON */}
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowAllBookings(!showAllBookings)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-600 text-white hover:bg-gray-700 font-medium transition-all"
                >
                  {showAllBookings 
                    ? `📅 ${t.todayCheckouts}` 
                    : `📋 ${t.showAllBookings} (${allBookings.length} ${t.totalBookings})`
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        {showFleet && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{color: brand.black}}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{lang==='el' ? 'Διαχείριση Στόλου' : 'Manage Fleet'}</h3>
                <button className="text-2xl hover:text-red-500" onClick={()=>setShowFleet(false)}>×</button>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-1">
                  {lang==='el' ? 'Νέα κατηγορία' : 'New category'}
                </label>
                <div className="flex gap-2">
                  <input 
                    value={catName} 
                    onChange={e=>setCatName(e.target.value)} 
                    className="flex-1 border rounded p-2" 
                    placeholder={lang==='el' ? 'π.χ. Trimaran' : 'e.g. Trimaran'} 
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                    onClick={() => { 
                      const name = (catName||'').trim(); 
                      if(!name) return; 
                      if (!fleet[name]) setFleet({...fleet, [name]: []}); 
                      setCatName(''); 
                    }}>
                    {lang==='el' ? 'Προσθήκη' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-semibold mb-1">
                  {lang==='el' ? 'Νέο σκάφος σε κατηγορία' : 'New vessel in category'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select 
                    value={vesselCat} 
                    onChange={e=>setVesselCat(e.target.value)} 
                    className="border rounded p-2">
                    <option value="">{lang==='el' ? 'Επιλέξτε κατηγορία' : 'Select category'}</option>
                    {Object.keys(fleet||{}).map(c=> <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input 
                    value={vesselName} 
                    onChange={e=>setVesselName(e.target.value)} 
                    className="border rounded p-2" 
                    placeholder={lang==='el' ? 'όνομα σκάφους' : 'Vessel name'} 
                  />
                  <button 
                    type="button" 
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                    onClick={() => { 
                      const c = (vesselCat||'').trim(); 
                      const v = (vesselName||'').trim(); 
                      if(!c||!v) return; 
                      const list = (fleet[c]||[]).slice(); 
                      if(!list.includes(v)) list.push(v); 
                      setFleet({...fleet, [c]: list}); 
                      setVesselName(''); 
                    }}>
                    {lang==='el' ? 'Προσθήκη' : 'Add'}
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-auto border rounded p-3">
                {Object.keys(fleet||{}).length === 0 && (
                  <div className="text-sm text-gray-500">
                    {lang==='el' ? 'Δεν υπάρχουν κατηγορίες.' : 'No categories yet.'}
                  </div>
                )}
                {Object.entries(fleet||{}).map(([c, arr]) => (
                  <div key={c} className="mb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{c}</h4>
                      <button 
                        className="text-sm text-red-500 underline" 
                        onClick={() => { 
                          const copy = {...fleet}; 
                          delete copy[c]; 
                          setFleet(copy); 
                          if (form.vesselCategory===c) setForm({...form, vesselCategory:'', vesselName:''}); 
                        }}>
                        {lang==='el' ? 'Διαγραφή κατηγορίας' : 'Delete category'}
                      </button>
                    </div>
                    <ul className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-1">
                      {(arr||[]).map(v => (
                        <li key={v} className="flex items-center justify-between border rounded px-2 py-1 bg-gray-50">
                          <span className="text-sm">{v}</span>
                          <button 
                            className="text-xs text-red-500 underline ml-2" 
                            onClick={() => { 
                              const list = (fleet[c]||[]).filter(x=>x!==v); 
                              setFleet({...fleet, [c]: list}); 
                              if (form.vesselName===v) setForm({...form, vesselName:''}); 
                            }}>
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}