// =================================================================
// PAGE 1 - BOOKING DETAILS & FLEET MANAGEMENT
// PART 1/2: IMPORTS, STATES, FUNCTIONS
// =================================================================

import { useState, useMemo, useRef, useEffect, useContext } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { DataContext } from './App';
import { generateLuxuryPDF } from './utils/LuxuryPDFGenerator';

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

const INITIAL_FLEET = [
  { id: "BOB", name: "Lagoon 42-BOB", type: "Catamaran" },
  { id: "PERLA", name: "Lagoon 46-PERLA", type: "Catamaran" },
  { id: "INFINITY", name: "Bali 4.2-INFINITY", type: "Catamaran" },
  { id: "MARIA1", name: "Jeanneau Sun Odyssey 449-MARIA1", type: "Monohull" },
  { id: "MARIA2", name: "Jeanneau yacht 54-MARIA2", type: "Monohull" },
  { id: "BAR-BAR", name: "Beneteau Oceanis 46.1-BAR-BAR", type: "Monohull" },
  { id: "KALISPERA", name: "Bavaria c42 Cruiser-KALISPERA", type: "Monohull" },
  { id: "VALESIA", name: "Bavaria c42 Cruiser-VALESIA", type: "Monohull" }
];

const FleetService = {
  initialize() {
    const stored = localStorage.getItem(FLEET_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(INITIAL_FLEET));
    }
  },
  
  getBoatsByCategory() {
    const boats = JSON.parse(localStorage.getItem(FLEET_STORAGE_KEY) || '[]') || INITIAL_FLEET;
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

const saveBookingData = (bookingNumber, data) => {
  if (!bookingNumber) return;
  
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    
    if (!bookings[bookingNumber]) {
      bookings[bookingNumber] = {
        lastModified: new Date().toISOString(),
        synced: false
      };
    }
    
    bookings[bookingNumber].bookingData = data;
    bookings[bookingNumber].lastModified = new Date().toISOString();
    bookings[bookingNumber].synced = false;
    
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('currentBooking', bookingNumber);
    
    console.log('💾 Saved booking:', bookingNumber);
  } catch (error) {
    console.error('Error saving booking:', error);
  }
};

const loadBookingData = (bookingNumber) => {
  if (!bookingNumber) return null;
  
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    
    if (bookings[bookingNumber]?.bookingData) {
      console.log('📂 Loaded booking:', bookingNumber);
      return bookings[bookingNumber].bookingData;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading booking:', error);
    return null;
  }
};

const getAllBookings = () => {
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    return Object.keys(bookings).map(bookingNumber => ({
      bookingNumber,
      ...bookings[bookingNumber].bookingData,
      lastModified: bookings[bookingNumber].lastModified,
      synced: bookings[bookingNumber].synced
    }));
  } catch (error) {
    console.error('Error getting all bookings:', error);
    return [];
  }
};

// 🔥 NEW: GET TODAY'S CHECK-OUTS
const getTodayCheckouts = () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const allBookings = getAllBookings();
    
    return allBookings.filter(booking => 
      booking.checkOutDate === today
    );
  } catch (error) {
    console.error('Error getting today checkouts:', error);
    return [];
  }
};

const deleteBooking = (bookingNumber) => {
  try {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    delete bookings[bookingNumber];
    localStorage.setItem('bookings', JSON.stringify(bookings));
    console.log('🗑️ Deleted booking:', bookingNumber);
  } catch (error) {
    console.error('Error deleting booking:', error);
  }
};
export default function Page1() {
  const [lang, setLang] = useState("en");
  const t = I18N[lang];
  const navigate = useNavigate();
  const location = useLocation();
  
  const context = useContext(DataContext);
  const { data: contextData, updateData } = context || {};
  
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
  
  const EMPLOYEE_CODES = {
    "ADMIN2024": { name: "Admin", canEdit: true, canDelete: true, canManageFleet: true, canClearData: true },
    "EMP001": { name: "John", canEdit: true, canDelete: false, canManageFleet: true, canClearData: false },
    "EMP002": { name: "Maria", canEdit: true, canDelete: false, canManageFleet: false, canClearData: false },
    "VIEW123": { name: "Viewer", canEdit: false, canDelete: false, canManageFleet: false, canClearData: false }
  };

  const [currentEmployee, setCurrentEmployee] = useState(null);
  
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
// 🔥 AUTO-LOAD booking from HomePage
  useEffect(() => {
    if (location.state?.bookingCode) {
      const bookingCode = location.state.bookingCode;
      console.log('📂 Loading booking from HomePage:', bookingCode);
      
      const data = loadBookingData(bookingCode);
      if (data) {
        setCurrentBookingNumber(bookingCode);
        setForm(data);
        setMode(data.mode || 'in');
      }
    }
  }, [location.state]);
  // 🔥 CRITICAL FIX: Load data when booking number or mode changes
  useEffect(() => {
    console.log('🔄 Loading data for booking:', currentBookingNumber);
    
    if (currentBookingNumber) {
      const data = loadBookingData(currentBookingNumber);
      if (data) {
        console.log('✅ Data loaded successfully');
        setForm(data);
        // Don't override mode from data - keep current mode
      } else {
        console.log('⚠️ No data found for this booking');
      }
    }
  }, [currentBookingNumber]);
  
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
    const employee = EMPLOYEE_CODES[employeeCode];
    if (employee) {
      setCurrentEmployee(employee);
      setIsEmployee(true);
      setShowLoginModal(false);
      alert(`${lang === 'el' ? 'Καλωσήρθες' : 'Welcome'} ${employee.name}!`);
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
          ? `❌ Δεν μπορείτε να κάνετε Check-out ακόμα!\n\nΗμερομηνία Check-out: ${form.checkOutDate}\nΣημερινή ημερομηνία: ${today.toISOString().split('T')[0]}\n\nΠαρακαλώ περιμένετε μέχρι την ημερομηνία Check-out.`
          : `❌ Cannot do Check-out yet!\n\nCheck-out date: ${form.checkOutDate}\nToday: ${today.toISOString().split('T')[0]}\n\nPlease wait until the check-out date.`;
        
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
      localStorage.removeItem('bookings');
      localStorage.removeItem('currentBooking');
      
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

  // 🔥 NORMALIZE booking number for duplicate check
  const normalizeBookingNumber = (bookingNumber) => {
    if (!bookingNumber) return '';
    
    return bookingNumber
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing spaces
      .replace(/\s+/g, ' ') // Multiple spaces → single space
      .replace(/\bno\.?\s*/gi, '') // Remove "no", "no.", "No", "NO"
      .replace(/\bνο\.?\s*/gi, '') // Remove Greek "νο", "νο.", "ΝΟ"
      .replace(/\bnr\.?\s*/gi, '') // Remove "nr", "nr.", "Nr"
      .replace(/\b#\s*/g, '') // Remove "#"
      .trim(); // Final trim
  };

  const handleChange = (e) => {
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
    }
    
    if (name === 'vesselName' && value) {
      const vesselId = value.toLowerCase()
        .replace(/\s+/g, '-')
        .replace('sun-odyssey', 'so')
        .replace(/\./g, '');
      
      console.log('🔥 PAGE 1: Setting vessel ID:', vesselId);
      localStorage.setItem('selectedVessel', vesselId);
    }
    
    if (name === 'bookingNumber' && value) {
      setCurrentBookingNumber(value);
      
      // 🔥 CHECK: Is this booking number already used?
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      const normalizedValue = normalizeBookingNumber(value);
      
      // Check against all existing bookings (normalized)
      let foundDuplicate = null;
      for (const [existingBookingNumber, bookingData] of Object.entries(bookings)) {
        const normalizedExisting = normalizeBookingNumber(existingBookingNumber);
        
        // If normalized versions match AND it's not the current booking
        if (normalizedExisting === normalizedValue && existingBookingNumber !== currentBookingNumber) {
          foundDuplicate = {
            bookingNumber: existingBookingNumber,
            data: bookingData.bookingData
          };
          break;
        }
      }
      
      if (foundDuplicate) {
        setDuplicateBooking(foundDuplicate);
      } else {
        setDuplicateBooking(null);
      }
    } else if (name === 'bookingNumber' && !value) {
      setDuplicateBooking(null);
    }
    
    setForm(prev => ({ ...prev, [name]: value }));
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

    alert(lang === 'el' ? 'Το προσχέδιο αποθηκεύτηκε!' : 'Draft saved!');
  };

  // 🔥 NEW: Send booking data to Charter Management (Fleet Management)
  const handleSendToCharterManagement = () => {
    if (!validateAndScroll()) return;

    // Save booking first
    const dataToSave = { ...form, mode };
    saveBookingData(currentBookingNumber || form.bookingNumber, dataToSave);

    // Navigate to Fleet Management with pre-filled charter data
    navigate('/fleet-management', {
      state: {
        userType: 'COMPANY',
        isAdmin: true,
        prefillCharter: {
          charterCode: form.bookingNumber,
          vesselName: form.vesselName,
          startDate: form.checkInDate,
          endDate: form.checkOutDate,
          skipperName: `${form.skipperFirstName} ${form.skipperLastName}`.trim(),
          skipperEmail: form.skipperEmail,
          skipperPhone: `${form.phoneCountryCode}${form.skipperPhone}`,
          skipperAddress: form.skipperAddress,
        }
      }
    });

    console.log('📤 Sending booking data to Charter Management');
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

  const validateAndScroll = () => {
    if (!form.bookingNumber) {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(bookingRef);
      alert(lang === 'el' ? 'Παρακαλώ συμπληρώστε τον αριθμό κράτησης!' : 'Please fill in the booking number!');
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
          ? `❌ Μπορείτε να προχωρήσετε μόνο την ημέρα Check-in!\n\nΗμερομηνία Check-in: ${form.checkInDate}\nΣημερινή ημερομηνία: ${today.toISOString().split('T')[0]}`
          : `❌ You can only proceed on Check-in day!\n\nCheck-in date: ${form.checkInDate}\nToday: ${today.toISOString().split('T')[0]}`;
        
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
          ? `❌ Δεν μπορείτε να προχωρήσετε στο Check-out ακόμα!\n\nΗμερομηνία Check-out: ${form.checkOutDate}\nΣημερινή ημερομηνία: ${today.toISOString().split('T')[0]}\n\nΠαρακαλώ περιμένετε μέχρι την ημερομηνία Check-out.`
          : `❌ Cannot proceed with Check-out yet!\n\nCheck-out date: ${form.checkOutDate}\nToday: ${today.toISOString().split('T')[0]}\n\nPlease wait until the check-out date.`;
        
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

  // 🔥 NEW: Get bookings with memoization
  const allBookings = useMemo(() => getAllBookings(), [currentBookingNumber]);
  const todayCheckouts = useMemo(() => getTodayCheckouts(), [currentBookingNumber]);
  
  // 🔥 NEW: Determine which bookings to show
  const displayedBookings = showAllBookings ? allBookings : todayCheckouts;
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
                  disabled={!isEmployee || mode === 'out'}
                  onFocus={() => {
                    if (isEmployee && mode === 'in') {
                      speakLabel(t.bookingNumber);
                      setShowSuggestions(prev => ({ ...prev, bookingNumber: true }));
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(prev => ({ ...prev, bookingNumber: false })), 200);
                  }}
                  className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${
                    duplicateBooking 
                      ? 'border-orange-500 bg-orange-50' 
                      : filledClass(!!form.bookingNumber)
                  } ${!isEmployee || mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                  placeholder={!isEmployee ? 'Employee login required' : mode === 'out' ? 'Read-only' : (lang==='el' ? 'Πληκτρολογήστε αριθμό κράτησης' : 'Enter booking number')} 
                />
                
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
                    onFocus={()=>speakLabel(t.dateOut)} 
                    min={form.checkInDate || undefined}
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
                    onFocus={()=>speakLabel(t.timeOut)}
                    disabled={mode === 'out'}
                    className={`w-full border rounded p-2 mt-2 transition-all duration-300 ${filledClass(!!form.checkOutTime)} ${mode === 'out' ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                  />
                </div>
              </div>
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
                {/* 🔥 NEW: Send to Charter Management */}
                <button
                  type="button"
                  onClick={handleSendToCharterManagement}
                  className="px-5 py-2.5 rounded text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                  title={lang === 'el' ? 'Δημιουργία ναύλου στο Booking Management' : 'Create charter in Booking Management'}>
                  📋 {lang === 'el' ? 'Ναύλος' : 'Charter'}
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
                <input
                  type="password"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmployeeLogin()}
                  className="w-full p-2 border rounded"
                  placeholder={lang === 'el' ? 'Εισάγετε κωδικό' : 'Enter code'}
                  autoFocus
                />
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                {lang === 'el' ? 'Demo κωδικοί:' : 'Demo codes:'}
                <br />• ADMIN2024 (Full access + Clear Data)
                <br />• EMP001 (Edit + Fleet)
                <br />• EMP002 (Edit only)
                <br />• VIEW123 (View only)
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