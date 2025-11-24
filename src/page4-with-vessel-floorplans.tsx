import React, { useState, useRef, useEffect } from "react";
import authService from './authService';
import { saveBookingHybrid } from './services/apiService';
import {
  compressImage,
  getBase64Size,
  compressImageWithLogging,
  compressSignature,
  brand,
  // EMPLOYEE_CODES, // removed - using authService
  uid,
  mid,
  I18N,
  BookingInfoBox,
  TailwindButton,
  PageHeader,
  TopControls,
  ModeDisplay,
  ActionButtons,
  SignatureBox,
  TableSection
} from "./shared-components";

// ========= Page 4 Specific Keys =========
const KITCHEN_KEYS = [
  "electric_fridge",
  "gas_stove_4_heads",
  "dinner_plates",
  "soup_plates",
  "glasses_water",
  "glasses_wine",
  "knives",
  "forks",
  "spoons"
];

const NAV_KEYS = [
  "gps_plotter",
  "vhf_dsc",
  "binoculars",
  "charts"
];

const SAFETY_KEYS = [
  "life_raft",
  "life_jackets",
  "flares",
  "first_aid_kit"
];

const GEN_KEYS = ["generator"];

const DECK_KEYS = [
  "spare_anchor",
  "deck_brush",
  "gangway"
];

const FDECK_KEYS = [
  "lines_20m",
  "lines_50m"
];

const DINGHY_KEYS = [
  "inflatable_dinghy",
  "oars",
  "air_pump"
];

const FENDERS_KEYS = [
  "bow_fenders",
  "stern_fenders"
];

const BOATHOOK_KEYS = ["telescopic_boathook"];

const ITEM_LABELS = {
  electric_fridge: { en: "Electric fridge", el: "Ηλεκτρικό ψυγείο" },
  gas_stove_4_heads: { en: "Gas stove – 4 heads", el: "Εστία αερίου – 4 μάτια" },
  dinner_plates: { en: "Dinner plates", el: "Πιάτα φαγητού" },
  soup_plates: { en: "Soup plates", el: "Πιάτα σούπας" },
  glasses_water: { en: "Glasses of water", el: "Ποτήρια νερού" },
  glasses_wine: { en: "Glasses of wine", el: "Ποτήρια κρασιού" },
  knives: { en: "Knives", el: "Μαχαίρια" },
  forks: { en: "Forks", el: "Πιρούνια" },
  spoons: { en: "Spoons", el: "Κουτάλια" },
  gps_plotter: { en: "GPS - Plotter", el: "GPS - Πλότερ" },
  vhf_dsc: { en: "VHF/DSC", el: "VHF/DSC" },
  binoculars: { en: "Binoculars", el: "Κιάλια" },
  charts: { en: "Charts", el: "Ναυτικοί χάρτες" },
  life_raft: { en: "Life raft", el: "Σωσίβια λέμβος" },
  life_jackets: { en: "Life jackets", el: "Σωσίβια" },
  flares: { en: "Flares", el: "Φωτοβολίδες" },
  first_aid_kit: { en: "First aid kit", el: "Φαρμακείο" },
  generator: { en: "Generator", el: "Γεννήτρια" },
  spare_anchor: { en: "Spare anchor", el: "Εφεδρική άγκυρα" },
  deck_brush: { en: "Deck brush", el: "Βούρτσα καταστρώματος" },
  gangway: { en: "Gangway", el: "Πασαρέλα" },
  lines_20m: { en: "Lines 20m", el: "Σχοινιά 20m" },
  lines_50m: { en: "Lines 50m", el: "Σχοινιά 50m" },
  inflatable_dinghy: { en: "Inflatable dinghy", el: "Φουσκωτή βάρκα" },
  oars: { en: "Oars", el: "Κουπιά" },
  air_pump: { en: "Air pump", el: "Αντλία αέρα" },
  bow_fenders: { en: "Bow fenders", el: "Μπαλόνια πλαϊνά" },
  stern_fenders: { en: "Stern fenders", el: "Μπαλόνια πρύμνης" },
  telescopic_boathook: { en: "Telescopic boat-hook", el: "Τηλεσκοπικός γάντζος" }
};

function getLabel(key, lang) {
  return ITEM_LABELS[key]?.[lang] || key;
}

const VESSELS = [
  { id: 'lagoon-42-bob', name: 'Lagoon 42-BOB', category: 'catamaran' },
  { id: 'lagoon-46-perla', name: 'Lagoon 46-PERLA', category: 'catamaran' },
  { id: 'bali-42-infinity', name: 'Bali 4.2-INFINITY', category: 'catamaran' },
  { id: 'jeanneau-so-449-maria1', name: 'Jeanneau Sun Odyssey 449-MARIA1', category: 'monohull' },
  { id: 'jeanneau-yacht-54-maria2', name: 'Jeanneau yacht 54-MARIA2', category: 'monohull' },
  { id: 'beneteau-oceanis-46-1-bar-bar', name: 'Beneteau Oceanis 46.1-BAR-BAR', category: 'monohull' },
  { id: 'bavaria-c42-kalispera', name: 'Bavaria c42 Cruiser-KALISPERA', category: 'monohull' },
  { id: 'bavaria-c42-valesia', name: 'Bavaria c42 Cruiser-VALESIA', category: 'monohull' }
];

const VESSEL_FLOORPLANS = {
  'lagoon-42-bob': '/images/floorplans/lagoon-42.webp',
  'lagoon-46-perla': '/images/floorplans/lagoon-46.png',
  'bali-42-infinity': '/images/floorplans/bali-4-2-infinity.png',
  'jeanneau-so-449-maria1': '/images/floorplans/jeanneau-449.png',
  'jeanneau-yacht-54-maria2': '/images/floorplans/jeanneau-54.png',
  'beneteau-oceanis-46-1-bar-bar': '/images/floorplans/beneteau-oceanis-46-new.png',
  'bavaria-c42-kalispera': '/images/floorplans/bavaria-c42-cruiser-kalispera.png',
  'bavaria-c42-valesia': '/images/floorplans/bavaria-c42-cruiser-valesia.png'
};

const VESSEL_HOTSPOTS = {
  'lagoon-42-bob': [
    { id: "hs_kitchen", x: 0.4535, y: 0.5945, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.5421, y: 0.6283, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.5491, y: 0.5582, title: "SAFETY", category: "safetyItems" },
    { id: "hs_gen", x: 0.7360, y: 0.4005, title: "GENERATOR", category: "genItems" },
    { id: "hs_deck", x: 0.2465, y: 0.4043, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.7421, y: 0.5957, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.1175, y: 0.4884, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4702, y: 0.1176, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3070, y: 0.2466, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'lagoon-46-perla': [
    { id: "hs_kitchen", x: 0.4338, y: 0.4225, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.5359, y: 0.4063, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.5277, y: 0.5828, title: "SAFETY", category: "safetyItems" },
    { id: "hs_gen", x: 0.6808, y: 0.4553, title: "GENERATOR", category: "genItems" },
    { id: "hs_deck", x: 0.2511, y: 0.5886, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.6778, y: 0.5577, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.1745, y: 0.4901, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4410, y: 0.0672, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.2889, y: 0.2035, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'bali-42-infinity': [
    { id: "hs_kitchen", x: 0.5553, y: 0.5426, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.5650, y: 0.6989, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.3629, y: 0.6930, title: "SAFETY", category: "safetyItems" },
    { id: "hs_gen", x: 0.7156, y: 0.6794, title: "GENERATOR", category: "genItems" },
    { id: "hs_deck", x: 0.2865, y: 0.6012, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.7231, y: 0.5524, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.1435, y: 0.5876, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4779, y: 0.2438, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.4123, y: 0.3063, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'jeanneau-so-449-maria1': [
    { id: "hs_kitchen", x: 0.3718, y: 0.8627, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.4760, y: 0.7257, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.5343, y: 0.8412, title: "SAFETY", category: "safetyItems" },
    { id: "hs_deck", x: 0.1864, y: 0.1512, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.1822, y: 0.3096, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5968, y: 0.2344, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4447, y: 0.4036, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3926, y: 0.2398, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'jeanneau-yacht-54-maria2': [
    { id: "hs_kitchen", x: 0.511393, y: 0.285991, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.40931, y: 0.429192, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.53431, y: 0.403785, title: "SAFETY", category: "safetyItems" },
    { id: "hs_gen", x: 0.208238, y: 0.83468, title: "GENERATOR", category: "genItems" },
    { id: "hs_deck", x: 0.224905, y: 0.867015, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.210321, y: 0.749221, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.648893, y: 0.840315, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.45306, y: 0.66016, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.387405, y: 0.813892, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'beneteau-oceanis-46-1-bar-bar': [
    { id: "hs_kitchen", x: 0.4500, y: 0.5990, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.3786, y: 0.8444, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.5025, y: 0.7677, title: "SAFETY", category: "safetyItems" },
    { id: "hs_gen", x: 0.1200, y: 0.2300, title: "GENERATOR", category: "genItems" },
    { id: "hs_deck", x: 0.2100, y: 0.1400, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.2100, y: 0.3500, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5500, y: 0.2500, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.3500, y: 0.0156, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3700, y: 0.2400, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'bavaria-c42-kalispera': [
    { id: "hs_kitchen", x: 0.3788, y: 0.5919, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.4337, y: 0.6070, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.4870, y: 0.7080, title: "SAFETY", category: "safetyItems" },
    { id: "hs_deck", x: 0.2568, y: 0.1776, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.2583, y: 0.2989, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5602, y: 0.2458, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4062, y: 0.0715, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3361, y: 0.2534, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'bavaria-c42-valesia': [
    { id: "hs_kitchen", x: 0.3879, y: 0.6020, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.4489, y: 0.6247, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.4977, y: 0.7131, title: "SAFETY", category: "safetyItems" },
    { id: "hs_deck", x: 0.2553, y: 0.1776, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.2507, y: 0.2888, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5434, y: 0.2382, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4108, y: 0.0690, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.4047, y: 0.2458, title: "BOAT-HOOK", category: "boathookItems" }
  ]
};

const getHotspotsForVessel = (vesselId) => {
  return VESSEL_HOTSPOTS[vesselId] || VESSEL_HOTSPOTS['lagoon-42-bob'];
};

export default function Page4({ onNavigate }) {
  const [lang, setLang] = useState("en");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mode, setMode] = useState("in");
  const [currentBookingNumber, setCurrentBookingNumber] = useState("");
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [showEmployeeCode, setShowEmployeeCode] = useState(false);
  
  const [items, setItems] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [safetyItems, setSafetyItems] = useState([]);
  const [genItems, setGenItems] = useState([]);
  const [deckItems, setDeckItems] = useState([]);
  const [fdeckItems, setFdeckItems] = useState([]);
  const [dinghyItems, setDinghyItems] = useState([]);
  const [fendersItems, setFendersItems] = useState([]);
  const [boathookItems, setBoathookItems] = useState([]);
  
  const [notes, setNotes] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  
  const [newKitchenItem, setNewKitchenItem] = useState("");
  const [newNavItem, setNewNavItem] = useState("");
  const [newSafetyItem, setNewSafetyItem] = useState("");
  const [newGenItem, setNewGenItem] = useState("");
  const [newDeckItem, setNewDeckItem] = useState("");
  const [newFdeckItem, setNewFdeckItem] = useState("");
  const [newDinghyItem, setNewDinghyItem] = useState("");
  const [newFendersItem, setNewFendersItem] = useState("");
  const [newBoathookItem, setNewBoathookItem] = useState("");
  
  const [showCamera, setShowCamera] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [pendingFlashItemId, setPendingFlashItemId] = useState(null);
  const [zoomUrl, setZoomUrl] = useState(null);
  
  const [selectedVessel, setSelectedVessel] = useState('lagoon-42-bob');
  const [activeSection, setActiveSection] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const t = I18N[lang];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (pendingFlashItemId && activeSection) {
      console.log('🎯 useEffect triggered! Looking for item:', pendingFlashItemId);
      
      setTimeout(() => {
        const row = document.querySelector(`[data-item-id="${pendingFlashItemId}"]`);
        console.log('📍 Found row in useEffect:', row);
        
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.backgroundColor = '#fee2e2';
          setTimeout(() => {
            row.style.backgroundColor = '';
          }, 3000);
        } else {
          console.error('❌ Row still not found! Item ID:', pendingFlashItemId);
        }
        
        setPendingFlashItemId(null);
      }, 100);
    }
  }, [pendingFlashItemId, activeSection]);

  useEffect(() => {
    const currentBooking = localStorage.getItem('currentBooking');
    
    if (currentBooking) {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      
      if (bookings[currentBooking]) {
        setCurrentBookingNumber(currentBooking);
        
        const bookingData = bookings[currentBooking]?.bookingData || {};
        setBookingInfo(bookingData);
        
        const savedMode = bookingData?.mode || 'in';
        setMode(savedMode);
        
        const rawVesselName = bookingData?.vesselName || bookingData?.vessel || '';
        console.log('📍 Raw vessel name:', rawVesselName);
        
        if (rawVesselName) {
          const vesselId = rawVesselName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[()]/g, '')
            .replace(/\./g, '-')
            .replace('4-2', '42')
            .replace('sun-odyssey', 'so')
            .replace('cruiser-', '');
          
          console.log('📍 Converted vessel ID:', vesselId);
          setSelectedVessel(vesselId);
        }
        
        loadDataForMode(currentBooking, savedMode);
        
        console.log(`✅ Page 4 loaded: ${currentBooking}, Mode: ${savedMode}, Vessel: ${rawVesselName}`);
      }
    }
  }, []);

  const loadDataForMode = (bookingNumber, selectedMode) => {
    const storageKey = selectedMode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    let data = bookings[bookingNumber]?.[storageKey] || null;
    
    if (selectedMode === 'out' && !data) {
      const checkInData = bookings[bookingNumber]?.page4DataCheckIn || null;
      if (checkInData) {
        data = JSON.parse(JSON.stringify(checkInData));
        
        ['items', 'navItems', 'safetyItems', 'genItems', 'deckItems', 'fdeckItems', 'dinghyItems', 'fendersItems', 'boathookItems'].forEach(section => {
          if (data[section]) {
            data[section] = data[section].map(item => ({ ...item, out: null }));
          }
        });
        
        data.signatureImage = '';
      }
    }
    
    if (data) {
      setItems(data.items || initItems(KITCHEN_KEYS));
      setNavItems(data.navItems || initItems(NAV_KEYS));
      setSafetyItems(data.safetyItems || initItems(SAFETY_KEYS));
      setGenItems(data.genItems || initItems(GEN_KEYS));
      setDeckItems(data.deckItems || initItems(DECK_KEYS));
      setFdeckItems(data.fdeckItems || initItems(FDECK_KEYS));
      setDinghyItems(data.dinghyItems || initItems(DINGHY_KEYS));
      setFendersItems(data.fendersItems || initItems(FENDERS_KEYS));
      setBoathookItems(data.boathookItems || initItems(BOATHOOK_KEYS));
      setNotes(data.notes || "");
      setSignatureImage(data.signatureImage || "");
    } else {
      setItems(initItems(KITCHEN_KEYS));
      setNavItems(initItems(NAV_KEYS));
      setSafetyItems(initItems(SAFETY_KEYS));
      setGenItems(initItems(GEN_KEYS));
      setDeckItems(initItems(DECK_KEYS));
      setFdeckItems(initItems(FDECK_KEYS));
      setDinghyItems(initItems(DINGHY_KEYS));
      setFendersItems(initItems(FENDERS_KEYS));
      setBoathookItems(initItems(BOATHOOK_KEYS));
      setNotes("");
      setSignatureImage("");
    }
  };

  const initItems = (keys) => keys.map(key => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] }));

  const getSectionData = (category) => {
    const mapping = {
      items: items,
      navItems: navItems,
      safetyItems: safetyItems,
      genItems: genItems,
      deckItems: deckItems,
      fdeckItems: fdeckItems,
      dinghyItems: dinghyItems,
      fendersItems: fendersItems,
      boathookItems: boathookItems
    };
    return mapping[category] || [];
  };

  const getSectionTitle = () => {
    const titles = {
      items: lang === 'el' ? 'ΚΟΥΖΙΝΑ' : 'KITCHEN',
      navItems: lang === 'el' ? 'ΝΑΥΤΙΛΙΑ' : 'NAVIGATION',
      safetyItems: lang === 'el' ? 'ΑΣΦΑΛΕΙΑ' : 'SAFETY',
      genItems: lang === 'el' ? 'ΓΕΝΝΗΤΡΙΑ' : 'GENERATOR',
      deckItems: lang === 'el' ? 'ΚΑΤΑΣΤΡΩΜΑ' : 'DECK',
      fdeckItems: lang === 'el' ? 'ΜΠΡΟΣΤΙΝΟ ΚΑΤΑΣΤΡΩΜΑ' : 'FRONT DECK',
      dinghyItems: lang === 'el' ? 'ΛΕΜΒΟΣ' : 'DINGHY',
      fendersItems: lang === 'el' ? 'ΜΠΑΛΟΝΙΑ' : 'FENDERS',
      boathookItems: lang === 'el' ? 'ΓΑΝΤΖΟΣ' : 'BOAT-HOOK'
    };
    return titles[activeSection] || '';
  };

  const isSectionComplete = (category) => {
    const data = getSectionData(category);
    if (data.length === 0) return false;
    
    if (mode === 'in') {
      return data.every(item => item.inOk);
    } else {
      return data.every(item => item.out === 'ok' || item.out === 'not');
    }
  };

  const setPrice = (section, id, value) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === id ? {...it, price: value} : it));
  };

  const incQty = (section, id) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === id ? {...it, qty: (it.qty || 1) + 1} : it));
  };

  const decQty = (section, id) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === id ? {...it, qty: Math.max(1, (it.qty || 1) - 1)} : it));
  };

  const toggleInOk = (section, id) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === id ? {...it, inOk: !it.inOk} : it));
  };

  const setOut = (section, id, value) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === id ? {...it, out: value} : it));
  };

  const handlers = {
    openCamera: (section, itemId) => {
      setCurrentItemId({ section, itemId });
      setShowCamera(true);
      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.error('Camera error:', err);
          alert(t.cameraError || 'Camera access denied');
        }
      }, 100);
    },
    handleFiles: async (section, itemId, files) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const compressed = await compressImageWithLogging(e.target.result);
        
        const setters = {
          items: setItems,
          navItems: setNavItems,
          safetyItems: setSafetyItems,
          genItems: setGenItems,
          deckItems: setDeckItems,
          fdeckItems: setFdeckItems,
          dinghyItems: setDinghyItems,
          fendersItems: setFendersItems,
          boathookItems: setBoathookItems
        };
        
        setters[section]?.(prev => prev.map(it => it.id === itemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
      };
      reader.readAsDataURL(file);
    },
    openFilePicker: (section, itemId) => {
      setCurrentItemId({ section, itemId });
      fileInputRef.current?.click();
    },
    removeRow: (section, id) => {
      if (window.confirm(t.confirmDelete || "Delete this item?")) {
        const setters = {
          items: setItems,
          navItems: setNavItems,
          safetyItems: setSafetyItems,
          genItems: setGenItems,
          deckItems: setDeckItems,
          fdeckItems: setFdeckItems,
          dinghyItems: setDinghyItems,
          fendersItems: setFendersItems,
          boathookItems: setBoathookItems
        };
        
        setters[section]?.(prev => prev.filter(it => it.id !== id));
      }
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video || !currentItemId) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    const compressed = await compressImageWithLogging(base64);
    
    const { section, itemId } = currentItemId;
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === itemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
    
    const stream = video.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const closeCamera = () => {
    const video = videoRef.current;
    const stream = video?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
    setShowCamera(false);
  };

  const removeMedia = (section, itemId, mediaId) => {
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    setters[section]?.(prev => prev.map(it => it.id === itemId ? {...it, media: it.media.filter(m => m.id !== mediaId)} : it));
  };

  const allItems = [...items, ...navItems, ...safetyItems, ...genItems, ...deckItems, ...fdeckItems, ...dinghyItems, ...fendersItems, ...boathookItems];
  const totalItems = allItems.length;
  let completedItems = 0;
  if (mode === "in") {
    completedItems = allItems.filter((it) => it.inOk).length;
  } else {
    completedItems = allItems.filter((it) => it.out === "ok" || it.out === "not").length;
  }
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const addItem = (section, newItemValue, setNewItemValue) => {
    if (!newItemValue.trim()) {
      alert(lang === 'el' ? 'Εισάγετε όνομα αντικειμένου!' : 'Enter item name!');
      return;
    }
    
    const setters = {
      items: setItems,
      navItems: setNavItems,
      safetyItems: setSafetyItems,
      genItems: setGenItems,
      deckItems: setDeckItems,
      fdeckItems: setFdeckItems,
      dinghyItems: setDinghyItems,
      fendersItems: setFendersItems,
      boathookItems: setBoathookItems
    };
    
    const newKey = newItemValue.trim();
    setters[section]?.(prev => [...prev, {id: uid(), key: newKey, price: "", qty: 1, inOk: false, out: null, media: []}]);
    setNewItemValue("");
  };

  const handleEmployeeLogin = () => {
    const user = authService.login(employeeCode);
    if (user) {
      setIsEmployee(true);
      setCurrentEmployee(user.permissions);
      setShowLoginModal(false);
      setEmployeeCode("");
    } else {
      alert(t.invalidCode || 'Invalid code');
    }
  };

  const handleEmployeeLogout = () => {
    setIsEmployee(false);
    setCurrentEmployee(null);
  };

  const handleSave = async () => {
    if (!isEmployee || !currentEmployee?.canEdit) {
      alert(lang === 'el' ? '🔒 Δεν έχετε δικαίωμα αποθήκευσης!' : '🔒 You do not have permission to save!');
      return;
    }

    const dataToSave = {
      items,
      navItems,
      safetyItems,
      genItems,
      deckItems,
      fdeckItems,
      dinghyItems,
      fendersItems,
      boathookItems,
      notes,
      signatureImage
    };

    // ✅ Save to API using hybrid function
    const modeKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
    try {
      await saveBookingHybrid(currentBookingNumber, {
        [modeKey]: dataToSave
      });

      // Also save to localStorage for backward compatibility
      const storageKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');

      if (bookings[currentBookingNumber]) {
        bookings[currentBookingNumber][storageKey] = dataToSave;
        bookings[currentBookingNumber].lastModified = new Date().toISOString();
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }

      alert(lang === 'el' ? '✅ Αποθηκεύτηκε!' : '✅ Saved!');
    } catch (error) {
      console.error('Error saving:', error);
      alert(lang === 'el' ? '❌ Σφάλμα αποθήκευσης!' : '❌ Save error!');
    }
  };

  const handleClearForm = () => {
    if (!isEmployee || !currentEmployee?.canClearData) {
      alert(lang === 'el' ? '🔒 Δεν έχετε δικαίωμα εκκαθάρισης!' : '🔒 You do not have permission to clear!');
      return;
    }
    
    if (window.confirm(lang === 'el' ? 'Είστε σίγουροι ότι θέλετε να καθαρίσετε τη φόρμα;' : 'Are you sure you want to clear the form?')) {
      setItems(initItems(KITCHEN_KEYS));
      setNavItems(initItems(NAV_KEYS));
      setSafetyItems(initItems(SAFETY_KEYS));
      setGenItems(initItems(GEN_KEYS));
      setDeckItems(initItems(DECK_KEYS));
      setFdeckItems(initItems(FDECK_KEYS));
      setDinghyItems(initItems(DINGHY_KEYS));
      setFendersItems(initItems(FENDERS_KEYS));
      setBoathookItems(initItems(BOATHOOK_KEYS));
      setNotes("");
      setSignatureImage("");
    }
  };

  // 🔥 NEW: handlePDF function
  const handlePDF = () => {
    if (!bookingInfo) {
      alert(lang === 'el' ? 'Δεν υπάρχουν δεδομένα booking!' : 'No booking data available!');
      return;
    }

    try {
      const { generateLuxuryPDF } = require('./utils/LuxuryPDFGenerator');
      
      // Read signature from localStorage
      const signatureKey = `page4_signature_${currentBookingNumber}_${mode}`;
      const actualSignature = localStorage.getItem(signatureKey) || '';
      
      // Get vessel name and floorplan
      const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || selectedVessel;
      const floorplanPath = VESSEL_FLOORPLANS[selectedVessel];
      
      const additionalData = {
        // 9 sections
        kitchen: items,
        navigation: navItems,
        safety: safetyItems,
        generator: genItems,
        deck: deckItems,
        frontDeck: fdeckItems,
        dinghy: dinghyItems,
        fenders: fendersItems,
        boathook: boathookItems,
        
        // Vessel info
        vesselName: vesselName,
        floorplanPath: floorplanPath,
        
        skipperSignature: actualSignature
      };
      
      const pdf = generateLuxuryPDF(
        bookingInfo,
        mode,
        additionalData,
        lang,
        { isPage4: true }
      );
      
      const fileName = `${bookingInfo.bookingNumber || 'booking'}_Page4_${mode}_${Date.now()}.pdf`;
      pdf.save(fileName);
      
      alert(lang === 'el' ? '✅ PDF δημιουργήθηκε!' : '✅ PDF generated!');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(lang === 'el' ? '❌ Σφάλμα δημιουργίας PDF!' : '❌ PDF generation error!');
    }
  };

  const handlePrevious = () => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate('prev');
    }
  };

  const handleNext = async () => {
    if (activeSection) {
      const currentSectionData = getSectionData(activeSection);
      let firstIncompleteItem = null;

      for (const item of currentSectionData) {
        let isIncomplete = false;
        
        if (mode === 'in') {
          isIncomplete = !item.inOk;
        } else {
          isIncomplete = item.out !== 'ok' && item.out !== 'not';
        }
        
        if (isIncomplete) {
          firstIncompleteItem = item;
          break;
        }
      }

      if (firstIncompleteItem) {
        const message = mode === 'in' 
          ? (lang === 'el' ? 'Παρακαλώ ολοκληρώστε όλα τα στοιχεία αυτής της ενότητας!' : 'Please complete all items in this section!')
          : (lang === 'el' ? 'Παρακαλώ ολοκληρώστε το check-out για όλα τα στοιχεία!' : 'Please complete check-out for all items!');
        
        alert(message);
        
        setTimeout(() => {
          const row = document.querySelector(`[data-item-id="${firstIncompleteItem.id}"]`);
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.backgroundColor = '#fee2e2';
            setTimeout(() => {
              row.style.backgroundColor = '';
            }, 3000);
          }
        }, 100);
        
        return;
      }

      setActiveSection(null);
      return;
    }

    const allSections = [
      { name: 'items', data: items },
      { name: 'navItems', data: navItems },
      { name: 'safetyItems', data: safetyItems },
      { name: 'genItems', data: genItems },
      { name: 'deckItems', data: deckItems },
      { name: 'fdeckItems', data: fdeckItems },
      { name: 'dinghyItems', data: dinghyItems },
      { name: 'fendersItems', data: fendersItems },
      { name: 'boathookItems', data: boathookItems }
    ];

    let firstIncompleteItem = null;
    let firstIncompleteSectionName = null;

    for (const section of allSections) {
      for (const item of section.data) {
        let isIncomplete = false;
        
        if (mode === 'in') {
          isIncomplete = !item.inOk;
        } else {
          isIncomplete = item.out !== 'ok' && item.out !== 'not';
        }
        
        if (isIncomplete) {
          firstIncompleteItem = item;
          firstIncompleteSectionName = section.name;
          break;
        }
      }
      if (firstIncompleteItem) break;
    }

    if (firstIncompleteItem) {
      const message = mode === 'in' 
        ? (lang === 'el' ? 'Παρακαλώ ολοκληρώστε όλα τα στοιχεία πριν συνεχίσετε!' : 'Please complete all items before proceeding!')
        : (lang === 'el' ? 'Παρακαλώ ολοκληρώστε το check-out για όλα τα στοιχεία!' : 'Please complete check-out for all items!');
      
      alert(message);
      
      setPendingFlashItemId(firstIncompleteItem.id);
      setActiveSection(firstIncompleteSectionName);
      
      return;
    }

    const dataToSave = {
      items,
      navItems,
      safetyItems,
      genItems,
      deckItems,
      fdeckItems,
      dinghyItems,
      fendersItems,
      boathookItems,
      notes,
      signatureImage
    };

    // ✅ Save to API before navigating
    const modeKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
    try {
      await saveBookingHybrid(currentBookingNumber, {
        [modeKey]: dataToSave
      });

      // Also save to localStorage for backward compatibility
      const storageKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');

      if (bookings[currentBookingNumber]) {
        bookings[currentBookingNumber][storageKey] = dataToSave;
        bookings[currentBookingNumber].lastModified = new Date().toISOString();
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }

      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate('next');
      }
    } catch (error) {
      console.error('Error saving before navigation:', error);
      alert(lang === 'el' ? '❌ Σφάλμα αποθήκευσης!' : '❌ Save error!');
    }
  };

  const allMedia = allItems.reduce((acc, item) => {
    if (item.media && item.media.length > 0) {
      return [...acc, ...item.media.map(m => ({ ...m, itemKey: item.key }))];
    }
    return acc;
  }, []);

  const completedSectionsCount = () => {
    const sections = ['items', 'navItems', 'safetyItems', 'genItems', 'deckItems', 'fdeckItems', 'dinghyItems', 'fendersItems', 'boathookItems'];
    return sections.filter(section => isSectionComplete(section)).length;
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: brand.pageBg }}>
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        
        <BookingInfoBox bookingInfo={bookingInfo} currentBookingNumber={currentBookingNumber} />
        <TailwindButton />
        <PageHeader title={lang === 'el' ? 'ΑΠΟΓΡΑΦΗ ΣΚΑΦΟΥΣ - ΔΙΑΔΡΑΣΤΙΚΟΣ ΧΑΡΤΗΣ' : 'BOAT INVENTORY - INTERACTIVE MAP'} />
        <ModeDisplay mode={mode} t={t} />
        <TopControls 
          isOnline={isOnline}
          lang={lang}
          setLang={setLang}
          isEmployee={isEmployee}
          currentEmployee={currentEmployee}
          onEmployeeLogout={handleEmployeeLogout}
          onEmployeeLogin={() => setShowLoginModal(true)}
          percentage={percentage}
        />

        <input 
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => currentItemId && handlers.handleFiles(currentItemId.section, currentItemId.itemId, e.target.files)}
        />

        {!activeSection ? (
          <div>
            <div className="mb-6 bg-white rounded-xl p-4 border-2" style={{ borderColor: brand.blue }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: brand.black }}>
                  {lang === 'el' ? 'Πρόοδος' : 'Progress'}
                </span>
                <span className="text-sm font-bold" style={{ color: brand.blue }}>
                  {completedSectionsCount()}/9 {lang === 'el' ? 'ενότητες ολοκληρώθηκαν' : 'sections completed'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: (completedSectionsCount() / 9 * 100) + '%' }}
                />
              </div>
            </div>

            <div className="relative bg-white rounded-xl p-4 border-2" style={{ borderColor: brand.blue }}>
              <div className="text-center mb-2 text-sm font-semibold" style={{ color: brand.black }}>
                {lang === 'el' ? 'Κάντε κλικ σε οποιοδήποτε σημείο για να δείτε το inventory' : 'Click on any hotspot to view inventory'}
              </div>
              
              <div className="relative inline-block w-full">
                <div className="relative w-full" style={{ paddingTop: '60%' }}>
                  
                  {!imageError ? (
                    <img 
                      src={VESSEL_FLOORPLANS[selectedVessel]}
                      alt={selectedVessel + ' floorplan'}
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">
                          {lang === 'el' ? 'Το floorplan δεν είναι διαθέσιμο για αυτό το σκάφος' : 'Floorplan not available for this vessel'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">{VESSELS.find(v => v.id === selectedVessel)?.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {getHotspotsForVessel(selectedVessel).map(hotspot => (
                    <button
                      key={hotspot.id}
                      onClick={() => setActiveSection(hotspot.category)}
                      onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                      onMouseLeave={() => setHoveredHotspot(null)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                      style={{ left: (hotspot.x * 100) + '%', top: (hotspot.y * 100) + '%', zIndex: 10 }}
                    >
                      <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                      <span className={isSectionComplete(hotspot.category) 
                        ? "relative inline-flex h-4 w-4 md:h-5 md:w-5 rounded-full bg-green-600 border-2 border-white shadow-lg hover:scale-125 transition-transform" 
                        : "relative inline-flex h-4 w-4 md:h-5 md:w-5 rounded-full bg-red-600 border-2 border-white shadow-lg hover:scale-125 transition-transform"}
                      ></span>
                      
                      {isSectionComplete(hotspot.category) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          ✓
                        </span>
                      )}
                      
                      <span className={hoveredHotspot === hotspot.id 
                        ? 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-bold text-white bg-gray-800 rounded whitespace-nowrap transition-opacity opacity-100' 
                        : 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-bold text-white bg-gray-800 rounded whitespace-nowrap transition-opacity opacity-0 pointer-events-none'}
                      >
                        {hotspot.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setActiveSection(null)} 
                className="px-4 py-2 rounded border flex items-center gap-2 hover:bg-gray-100" 
                style={{ borderColor: brand.black, color: brand.black }}
              >
                ← {lang === 'el' ? 'Πίσω στον Χάρτη' : 'Back to Map'}
              </button>
              <h2 className="text-xl font-bold" style={{ color: brand.black }}>
                {getSectionTitle()}
              </h2>
            </div>

            <TableSection 
              data={getSectionData(activeSection)} 
              t={t} 
              setPrice={(id, value) => setPrice(activeSection, id, value)}
              incQty={(id) => incQty(activeSection, id)}
              decQty={(id) => decQty(activeSection, id)}
              toggleInOk={(id) => toggleInOk(activeSection, id)}
              setOut={(id, value) => setOut(activeSection, id, value)}
              openCamera={(id) => handlers.openCamera(activeSection, id)}
              handleFiles={(id, files) => handlers.handleFiles(activeSection, id, files)}
              openFilePicker={(id) => handlers.openFilePicker(activeSection, id)}
              removeRow={(id) => handlers.removeRow(activeSection, id)}
              mode={mode}
              getLabel={(key) => getLabel(key, lang)}
              isEmployee={isEmployee}
              currentEmployee={currentEmployee}
              newItem={
                activeSection === 'items' ? newKitchenItem :
                activeSection === 'navItems' ? newNavItem :
                activeSection === 'safetyItems' ? newSafetyItem :
                activeSection === 'genItems' ? newGenItem :
                activeSection === 'deckItems' ? newDeckItem :
                activeSection === 'fdeckItems' ? newFdeckItem :
                activeSection === 'dinghyItems' ? newDinghyItem :
                activeSection === 'fendersItems' ? newFendersItem :
                newBoathookItem
              }
              setNewItem={
                activeSection === 'items' ? setNewKitchenItem :
                activeSection === 'navItems' ? setNewNavItem :
                activeSection === 'safetyItems' ? setNewSafetyItem :
                activeSection === 'genItems' ? setNewGenItem :
                activeSection === 'deckItems' ? setNewDeckItem :
                activeSection === 'fdeckItems' ? setNewFdeckItem :
                activeSection === 'dinghyItems' ? setNewDinghyItem :
                activeSection === 'fendersItems' ? setNewFendersItem :
                setNewBoathookItem
              }
              addItem={() => addItem(
                activeSection,
                activeSection === 'items' ? newKitchenItem :
                activeSection === 'navItems' ? newNavItem :
                activeSection === 'safetyItems' ? newSafetyItem :
                activeSection === 'genItems' ? newGenItem :
                activeSection === 'deckItems' ? newDeckItem :
                activeSection === 'fdeckItems' ? newFdeckItem :
                activeSection === 'dinghyItems' ? newDinghyItem :
                activeSection === 'fendersItems' ? newFendersItem :
                newBoathookItem,
                activeSection === 'items' ? setNewKitchenItem :
                activeSection === 'navItems' ? setNewNavItem :
                activeSection === 'safetyItems' ? setNewSafetyItem :
                activeSection === 'genItems' ? setNewGenItem :
                activeSection === 'deckItems' ? setNewDeckItem :
                activeSection === 'fdeckItems' ? setNewFdeckItem :
                activeSection === 'dinghyItems' ? setNewDinghyItem :
                activeSection === 'fendersItems' ? setNewFendersItem :
                setNewBoathookItem
              )}
              sectionTitle={getSectionTitle()}
            />
          </div>
        )}

        <div className="mt-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
          <label className="block font-semibold" style={{ color: brand.black }}>{t.note}</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 w-full border rounded p-3 min-h-[180px] bg-white" 
            placeholder={t.notePH} 
            style={{ borderColor: brand.black, color: brand.black }} 
          />
        </div>

        {allMedia.length > 0 ? (
          <div className="mt-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
            <label className="block font-semibold mb-3" style={{ color: brand.black }}>
              {t.picsTitle}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {allMedia.map((media) => (
                <div key={media.id} className="relative border-2 rounded-lg overflow-hidden" style={{ borderColor: brand.black }}>
                  <img 
                    src={media.url} 
                    alt={getLabel(media.itemKey, lang)}
                    className="w-full h-24 object-cover cursor-pointer"
                    onClick={() => setZoomUrl(media.url)}
                  />
                  <div className="absolute top-1 right-1 flex gap-1">
                    <button 
                      onClick={() => setZoomUrl(media.url)}
                      className="bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
                    >
                      🔍
                    </button>
                    <button 
                      onClick={() => {
                        // Find the correct section and item
                        const sectionMappings = [
                          { section: 'items', data: items },
                          { section: 'navItems', data: navItems },
                          { section: 'safetyItems', data: safetyItems },
                          { section: 'genItems', data: genItems },
                          { section: 'deckItems', data: deckItems },
                          { section: 'fdeckItems', data: fdeckItems },
                          { section: 'dinghyItems', data: dinghyItems },
                          { section: 'fendersItems', data: fendersItems },
                          { section: 'boathookItems', data: boathookItems }
                        ];
                        
                        for (const { section, data } of sectionMappings) {
                          const item = data.find(it => it.key === media.itemKey);
                          if (item) {
                            removeMedia(section, item.id, media.id);
                            break;
                          }
                        }
                      }}
                      className="bg-white rounded-full p-1 shadow-md hover:bg-red-100"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 truncate">
                    {getLabel(media.itemKey, lang)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 border-2 rounded-xl p-4 text-center" style={{ borderColor: brand.blue }}>
            <label className="block font-semibold mb-2" style={{ color: brand.black }}>
              {t.picsTitle}
            </label>
            <p className="text-gray-400 text-sm">
              {lang === 'el' ? 'Δεν έχουν προστεθεί φωτογραφίες ακόμα.' : 'No photos added yet.'}
            </p>
          </div>
        )}

        <SignatureBox 
          brand={brand}
          lang={lang}
          onSignChange={setSignatureImage}
          onImageChange={setSignatureImage}
          initialImage={signatureImage}
          currentBookingNumber={currentBookingNumber}
          mode={mode}
          pageNumber={4}
        />

        <ActionButtons 
          onPrevious={handlePrevious}
          onSave={handleSave}
          onClear={handleClearForm}
          onPDF={handlePDF}
          onNext={handleNext}
          t={t}
        />

      </div>

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              🔒 {lang === 'el' ? 'Είσοδος Υπαλλήλου' : 'Employee Login'}
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
                onClick={() => { setShowLoginModal(false); setEmployeeCode(""); }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
              </button>
              <button 
                onClick={handleEmployeeLogin} 
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {lang === 'el' ? 'Σύνδεση' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4" style={{ color: brand.black }}>Camera</h3>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg mb-4" style={{ maxHeight: '60vh' }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button 
                onClick={capturePhoto} 
                className="flex-1 px-6 py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2" 
                style={{ backgroundColor: brand.blue }}
              >
                📸 {lang === 'el' ? 'Λήψη' : 'Capture'}
              </button>
              <button 
                onClick={closeCamera} 
                className="px-6 py-3 rounded-lg font-semibold border-2"
                style={{ borderColor: brand.black, color: brand.black }}
              >
                {lang === 'el' ? 'Κλείσιμο' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {zoomUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setZoomUrl(null)}>
          <img src={zoomUrl} alt="Zoomed" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
