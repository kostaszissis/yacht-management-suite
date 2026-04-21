import React, { useState, useRef, useEffect, useContext } from "react";
import FloatingChatWidget from './FloatingChatWidget';
import authService from './authService';
import { savePage3DataHybrid, getPage3DataHybrid, getAllBookings, getPage1DataHybrid } from './services/apiService';
import { savePageMedia } from './utils/mediaStorage';
import { DataContext } from './App';
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
  saveBookingData,
  loadBookingData,
  savePage3Data,
  loadPage3Data,
  BookingInfoBox,
  TailwindButton,
  PageHeader,
  TopControls,
  ModeDisplay,
  ActionButtons,
  SignatureBox,
  TableSection
} from "./shared-components";

// ========= Page 3 Specific Keys =========
const SAFETY_KEYS = [
  "lifejackets",
  "flares",
  "first_aid",
  "fire_extinguisher",
  "liferaft",
  "fog_horn",
  "toolkit"
];

const CABIN_KEYS = [
  "bed_linen",
  "pillows_cases",
  "blankets",
  "bath_towels",
  "tea_towels",
  "wc_mats",
  "hatch_large",
  "hatch_toilet",
  "hatch_cabin",
  "toilet_clogging"
];

const OPTIONAL_KEYS = [
  "spinnaker",
  "snorkeling_gear",
  "fishing_equipment",
  "bbq_grill",
  "stand_up_paddle",
  "kayak",
  "control_gangway",
  "control_tv",
  "wifi_router",
  "card_sd_gps",
  "feet_for_saloon",
  "mattress",
  "espresso_machine",
  "ice_maker",
  "sea_scooter"
];

export const ITEM_LABELS = {
  lifejackets: { en: "lifejackets", el: "σωσίβια", it: "giubbotti di salvataggio", de: "Rettungswesten", ru: "спасательные жилеты", fr: "gilets de sauvetage", ro: "veste de salvare", pl: "kamizelki ratunkowe", he: "אפודי הצלה", es: "chalecos salvavidas" },
  flares: { en: "flares", el: "βοήθεια κινδύνου (flares)", it: "razzi di segnalazione", de: "Signalraketen", ru: "сигнальные ракеты", fr: "fusées de détresse", ro: "rachete de semnalizare", pl: "race sygnalizacyjne", he: "אבוקות מצוקה", es: "bengalas" },
  first_aid: { en: "first aid kit", el: "φαρμακείο", it: "kit pronto soccorso", de: "Erste-Hilfe-Set", ru: "аптечка", fr: "trousse de secours", ro: "trusă de prim ajutor", pl: "apteczka", he: "ערכת עזרה ראשונה", es: "botiquín" },
  fire_extinguisher: { en: "fire extinguisher", el: "πυροσβεστήρας", it: "estintore", de: "Feuerlöscher", ru: "огнетушитель", fr: "extincteur", ro: "stingător", pl: "gaśnica", he: "מטף כיבוי", es: "extintor" },
  liferaft: { en: "liferaft", el: "σωστική σχεδία", it: "zattera di salvataggio", de: "Rettungsinsel", ru: "спасательный плот", fr: "radeau de sauvetage", ro: "plută de salvare", pl: "tratwa ratunkowa", he: "רפסודת הצלה", es: "balsa salvavidas" },
  fog_horn: { en: "fog horn", el: "κόρνα ομίχλης", it: "corno da nebbia", de: "Nebelhorn", ru: "туманный горн", fr: "corne de brume", ro: "corn de ceață", pl: "sygnał mgłowy", he: "צופר ערפל", es: "bocina de niebla" },
  toolkit: { en: "toolkit", el: "εργαλεία", it: "cassetta attrezzi", de: "Werkzeugkasten", ru: "набор инструментов", fr: "boîte à outils", ro: "trusă de scule", pl: "zestaw narzędzi", he: "ארגז כלים", es: "caja de herramientas" },
  bed_linen: { en: "Bed linen for all cabins", el: "Κλινοσκεπάσματα για όλες τις καμπίνες", it: "biancheria da letto", de: "Bettwäsche", ru: "постельное бельё", fr: "linge de lit", ro: "lenjerie de pat", pl: "pościel", he: "מצעים", es: "ropa de cama" },
  pillows_cases: { en: "Pillows and Pillow cases", el: "Μαξιλάρια και μαξιλαροθήκες", it: "cuscini e federe", de: "Kissen und Bezüge", ru: "подушки и наволочки", fr: "oreillers et taies", ro: "perne și fețe de pernă", pl: "poduszki i poszewki", he: "כריות וציפיות", es: "almohadas y fundas" },
  blankets: { en: "Blankets", el: "Κουβέρτες", it: "coperte", de: "Decken", ru: "одеяла", fr: "couvertures", ro: "pături", pl: "koce", he: "שמיכות", es: "mantas" },
  bath_towels: { en: "Bath towels per person", el: "Πετσέτες μπάνιου ανά άτομο", it: "asciugamani da bagno", de: "Badetücher", ru: "банные полотенца", fr: "serviettes de bain", ro: "prosoape de baie", pl: "ręczniki kąpielowe", he: "מגבות אמבטיה", es: "toallas de baño" },
  tea_towels: { en: "Tea towels", el: "Πετσέτες κουζίνας", it: "strofinacci", de: "Geschirrtücher", ru: "кухонные полотенца", fr: "torchons", ro: "prosoape de bucătărie", pl: "ścierki kuchenne", he: "מגבות מטבח", es: "paños de cocina" },
  wc_mats: { en: "WC mats", el: "Χαλάκια WC", it: "tappetini WC", de: "WC-Matten", ru: "коврики WC", fr: "tapis WC", ro: "covorașe WC", pl: "maty WC", he: "שטיחוני שירותים", es: "alfombrillas WC" },
  hatch_large: { en: "Hatch Large", el: "Hatch μεγάλα", it: "oblò grande", de: "große Luke", ru: "большой люк", fr: "écoutille grande", ro: "trapă mare", pl: "luk duży", he: "פתח גדול", es: "escotilla grande" },
  hatch_toilet: { en: "Hatch Toilet", el: "Hatch τουαλέτας", it: "oblò WC", de: "Toiletten-Luke", ru: "люк туалета", fr: "hublot WC", ro: "trapă toaletă", pl: "luk toalety", he: "פתח שירותים", es: "escotilla WC" },
  hatch_cabin: { en: "Hatch Cabin", el: "Hatch καμπίνας", it: "oblò cabina", de: "Kabinen-Luke", ru: "люк каюты", fr: "hublot cabine", ro: "trapă cabină", pl: "luk kabiny", he: "פתח תא", es: "escotilla camarote" },
  toilet_clogging: { en: "Toilet Clogging", el: "Βούλωμα τουαλέτας", it: "intasamento WC", de: "Toilettenverstopfung", ru: "засор унитаза", fr: "bouchage WC", ro: "înfundare toaletă", pl: "zatkanie toalety", he: "סתימת שירותים", es: "atasco WC" },
  spinnaker: { en: "Spinnaker", el: "Μπαλόνι (Spinnaker)", it: "spinnaker", de: "Spinnaker", ru: "спинакер", fr: "spinnaker", ro: "spinnaker", pl: "spinnaker", he: "ספינקר", es: "spinnaker" },
  snorkeling_gear: { en: "Snorkeling gear", el: "Εξοπλισμός snorkeling", it: "attrezzatura snorkeling", de: "Schnorchelausrüstung", ru: "снаряжение для снорклинга", fr: "équipement de snorkeling", ro: "echipament snorkeling", pl: "sprzęt do snorkelingu", he: "ציוד שנורקלינג", es: "equipo de snorkel" },
  fishing_equipment: { en: "Fishing equipment", el: "Εξοπλισμός ψαρέματος", it: "attrezzatura da pesca", de: "Angelausrüstung", ru: "рыболовное снаряжение", fr: "matériel de pêche", ro: "echipament de pescuit", pl: "sprzęt wędkarski", he: "ציוד דיג", es: "equipo de pesca" },
  bbq_grill: { en: "BBQ Grill", el: "Ψησταριά BBQ", it: "griglia BBQ", de: "BBQ-Grill", ru: "гриль BBQ", fr: "barbecue", ro: "grătar BBQ", pl: "grill BBQ", he: "גריל BBQ", es: "parrilla BBQ" },
  stand_up_paddle: { en: "Stand-up paddle", el: "SUP board", it: "SUP board", de: "SUP Board", ru: "SUP доска", fr: "paddle SUP", ro: "SUP board", pl: "deska SUP", he: "סאפ", es: "tabla SUP" },
  kayak: { en: "Kayak", el: "Καγιάκ", it: "kayak", de: "Kajak", ru: "каяк", fr: "kayak", ro: "caiac", pl: "kajak", he: "קיאק", es: "kayak" },
  control_gangway: { en: "Control Gangway", el: "Χειριστήριο πασαρέλας", it: "comando passerella", de: "Gangway-Steuerung", ru: "управление трапом", fr: "commande passerelle", ro: "comandă pasarelă", pl: "sterowanie trapem", he: "שלט פסרלה", es: "control pasarela" },
  control_tv: { en: "Control TV", el: "Χειριστήριο τηλεόρασης", it: "telecomando TV", de: "TV-Fernbedienung", ru: "пульт ТВ", fr: "télécommande TV", ro: "telecomandă TV", pl: "pilot TV", he: "שלט טלוויזיה", es: "control TV" },
  wifi_router: { en: "Wi-Fi Router", el: "Wi-Fi Router", it: "Wi-Fi Router", de: "Wi-Fi Router", ru: "Wi-Fi роутер", fr: "routeur Wi-Fi", ro: "router Wi-Fi", pl: "router Wi-Fi", he: "נתב Wi-Fi", es: "router Wi-Fi" },
  card_sd_gps: { en: "Card SD GPS Maker", el: "Κάρτα SD GPS Maker", it: "scheda SD GPS", de: "SD-Karte GPS", ru: "SD карта GPS", fr: "carte SD GPS", ro: "card SD GPS", pl: "karta SD GPS", he: "כרטיס SD GPS", es: "tarjeta SD GPS" },
  feet_for_saloon: { en: "Feet for Saloon", el: "Πόδια για σαλόνι", it: "piedini per salone", de: "Füße für Salon", ru: "ножки для салона", fr: "pieds pour salon", ro: "picioare pentru salon", pl: "nóżki do salonu", he: "רגליות לסלון", es: "patas para salón" },
  mattress: { en: "Mattress", el: "Στρώμα", it: "materasso", de: "Matratze", ru: "матрас", fr: "matelas", ro: "saltea", pl: "materac", he: "מזרן", es: "colchón" },
  espresso_machine: { en: "Espresso Machine", el: "Μηχανή Espresso", it: "macchina espresso", de: "Espressomaschine", ru: "кофемашина", fr: "machine à espresso", ro: "espressor", pl: "ekspres do kawy", he: "מכונת אספרסו", es: "cafetera espresso" },
  ice_maker: { en: "Ice Maker", el: "Παγομηχανή", it: "fabbricatore di ghiaccio", de: "Eismaschine", ru: "льдогенератор", fr: "machine à glaçons", ro: "aparat de gheață", pl: "kostkarka do lodu", he: "מכונת קרח", es: "máquina de hielo" },
  sea_scooter: { en: "Sea Scooter", el: "Θαλάσσιο σκούτερ", it: "scooter marino", de: "Unterwasser-Scooter", ru: "морской скутер", fr: "scooter sous-marin", ro: "scuter marin", pl: "skuter morski", he: "קטנוע ים", es: "scooter marino" }
};

function getLabel(key, lang) {
  return ITEM_LABELS[key]?.[lang] || key;
}

// ========= Main Page3 Component =========
export default function Page3({ onNavigate }) {
  const [lang, setLang] = useState(sessionStorage.getItem("yacht_lang") || "en");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mode, setMode] = useState("in");
  const [currentBookingNumber, setCurrentBookingNumber] = useState("");
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isEmployee, setIsEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [showEmployeeCode, setShowEmployeeCode] = useState(false);
  
  const [safetyItems, setSafetyItems] = useState([]);
  const [cabinItems, setCabinItems] = useState([]);
  const [optionalItems, setOptionalItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [signatureImage, setSignatureImage] = useState("");
  
  const [newSafetyItem, setNewSafetyItem] = useState("");
  const [newCabinItem, setNewCabinItem] = useState("");
  const [newOptionalItem, setNewOptionalItem] = useState("");
  
  const [toiletWarningAccepted, setToiletWarningAccepted] = useState(false);
  
  const [showCamera, setShowCamera] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [zoomUrl, setZoomUrl] = useState(null);
  
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

  // Get context data
  const contextData = useContext(DataContext);

  useEffect(() => {
    const loadBookingFromAPI = async () => {
      // Use currentBooking from localStorage (UI state) or context
      const currentBooking = contextData?.bookingNumber || localStorage.getItem('currentBooking');

      if (currentBooking) {
        try {
          // 🔥 FIX: First get vessel/skipper data from Page 1 API (source of truth)
          const page1Data = await getPage1DataHybrid(currentBooking);
          console.log('📍 Page 3: Loaded Page 1 data:', page1Data);

          // Fetch booking info from API
          const allBookings = await getAllBookings();
          const booking = allBookings.find((b: any) =>
            b.bookingNumber === currentBooking || b.code === currentBooking
          );

          if (booking || page1Data) {
            setCurrentBookingNumber(currentBooking);

            // 🔥 FIX: Merge booking info, prioritizing Page 1 data (source of truth for vessel/skipper/dates)
            const mergedBookingInfo = {
              ...booking,
              vesselName: page1Data?.vesselName || booking?.vesselName || booking?.vessel,
              skipperFirstName: page1Data?.skipperFirstName || booking?.skipperFirstName,
              skipperLastName: page1Data?.skipperLastName || booking?.skipperLastName,
              checkInDate: page1Data?.checkInDate || booking?.checkInDate,
              checkOutDate: page1Data?.checkOutDate || booking?.checkOutDate,
            };
            setBookingInfo(mergedBookingInfo);

            const savedMode = contextData?.mode || booking?.mode || page1Data?.mode || 'in';
            setMode(savedMode);
            loadDataForMode(currentBooking, savedMode);

            console.log(`✅ Loaded booking from API: ${currentBooking}, Mode: ${savedMode}`);
          } else {
            console.warn(`⚠️ Booking ${currentBooking} not found in API`);
          }
        } catch (error) {
          console.error('❌ Error loading booking from API:', error);
        }
      } else {
        console.warn('⚠️ No current booking set');
      }
    };

    loadBookingFromAPI();
  }, [contextData?.bookingNumber, contextData?.mode]);

  const loadDataForMode = async (bookingNumber, selectedMode) => {
    // 🔥 Try API first, then localStorage fallback
    let loaded = null;

    // 🔥 FIX: When in check-out mode, first load check-in data to get inOk values
    let checkInSafetyItems = null;
    let checkInCabinItems = null;
    let checkInOptionalItems = null;

    if (selectedMode === 'out') {
      try {
        const checkInData = await getPage3DataHybrid(bookingNumber, 'in');
        if (checkInData) {
          checkInSafetyItems = checkInData.safetyItems;
          checkInCabinItems = checkInData.cabinItems;
          checkInOptionalItems = checkInData.optionalItems;
          console.log('✅ Page 3 check-in data loaded for inOk values');
        }
      } catch (error) {
        console.warn('⚠️ Failed to load check-in data for inOk merge:', error);
      }
    }

    // Helper function to merge inOk from check-in data with current mode data
    const mergeInOkData = (currentItems, checkInItemsData, defaultKeys) => {
      if (!currentItems && !checkInItemsData) return null;

      // If we have current mode items, merge inOk from check-in
      if (currentItems && checkInItemsData) {
        return currentItems.map(item => {
          const checkInItem = checkInItemsData.find(ci => ci.key === item.key);
          return { ...item, inOk: checkInItem?.inOk || item.inOk || false };
        });
      }

      // If only check-in items exist (starting checkout), use them as base
      if (checkInItemsData) {
        return checkInItemsData.map(item => ({ ...item, out: null }));
      }

      return currentItems;
    };

    try {
      const apiData = await getPage3DataHybrid(bookingNumber, selectedMode);
      if (apiData) {
        console.log('✅ Page 3 data loaded from API');
        loaded = apiData;
      }
    } catch (error) {
      console.warn('⚠️ API load failed, using localStorage:', error);
    }

    // Fallback to localStorage
    if (!loaded) {
      loaded = loadPage3Data(bookingNumber, selectedMode);
    }

    if (loaded) {
      // 🔥 MIGRATION: Προσθήκη νέων cabin items αν λείπουν
      const existingCabinKeys = (loaded.cabinItems || []).map(item => item.key);
      const missingCabinKeys = CABIN_KEYS.filter(key => !existingCabinKeys.includes(key));

      let migratedCabinItems = loaded.cabinItems || [];

      if (missingCabinKeys.length > 0) {
        console.log('🔄 MIGRATION: Adding missing cabin items:', missingCabinKeys);
        const newItems = missingCabinKeys.map(key => ({
          id: uid(),
          key,
          price: "",
          qty: 1,
          inOk: false,
          out: null,
          media: []
        }));
        migratedCabinItems = [...migratedCabinItems, ...newItems];
      }

      // 🔥 FIX: Merge inOk values from check-in when in check-out mode
      const finalSafetyItems = selectedMode === 'out'
        ? mergeInOkData(loaded.safetyItems, checkInSafetyItems, SAFETY_KEYS) || initItems(SAFETY_KEYS)
        : loaded.safetyItems || initItems(SAFETY_KEYS);

      const finalCabinItems = selectedMode === 'out'
        ? mergeInOkData(migratedCabinItems, checkInCabinItems, CABIN_KEYS) || initItems(CABIN_KEYS)
        : migratedCabinItems;

      const finalOptionalItems = selectedMode === 'out'
        ? mergeInOkData(loaded.optionalItems, checkInOptionalItems, OPTIONAL_KEYS) || initItems(OPTIONAL_KEYS)
        : loaded.optionalItems || initItems(OPTIONAL_KEYS);

      setSafetyItems(finalSafetyItems);
      setCabinItems(finalCabinItems);
      setOptionalItems(finalOptionalItems);
      setNotes(loaded.notes || "");
      setSignatureImage(loaded.signature || "");
      setToiletWarningAccepted(loaded.toiletWarningAccepted || false);
    } else if (selectedMode === 'out' && (checkInSafetyItems || checkInCabinItems || checkInOptionalItems)) {
      // 🔥 FIX: No check-out data yet, but we have check-in data - use it as starting point
      console.log('🔄 Using check-in data as base for check-out');
      setSafetyItems(checkInSafetyItems ? checkInSafetyItems.map(item => ({ ...item, out: null })) : initItems(SAFETY_KEYS));
      setCabinItems(checkInCabinItems ? checkInCabinItems.map(item => ({ ...item, out: null })) : initItems(CABIN_KEYS));
      setOptionalItems(checkInOptionalItems ? checkInOptionalItems.map(item => ({ ...item, out: null })) : initItems(OPTIONAL_KEYS));
      setNotes("");
      setSignatureImage("");
      setToiletWarningAccepted(false);
    } else {
      setSafetyItems(initItems(SAFETY_KEYS));
      setCabinItems(initItems(CABIN_KEYS));
      setOptionalItems(initItems(OPTIONAL_KEYS));
      setNotes("");
      setSignatureImage("");
      setToiletWarningAccepted(false);
    }
  };

  const initItems = (keys) => keys.map(key => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] }));

  const setPrice = (id, value) => {
    setSafetyItems(prev => prev.map(it => it.id === id ? {...it, price: value} : it));
    setCabinItems(prev => prev.map(it => it.id === id ? {...it, price: value} : it));
    setOptionalItems(prev => prev.map(it => it.id === id ? {...it, price: value} : it));
  };

  const incQty = (id) => {
    setSafetyItems(prev => prev.map(it => it.id === id ? {...it, qty: (it.qty || 1) + 1} : it));
    setCabinItems(prev => prev.map(it => it.id === id ? {...it, qty: (it.qty || 1) + 1} : it));
    setOptionalItems(prev => prev.map(it => it.id === id ? {...it, qty: (it.qty || 1) + 1} : it));
  };

  const decQty = (id) => {
    setSafetyItems(prev => prev.map(it => it.id === id ? {...it, qty: Math.max(1, (it.qty || 1) - 1)} : it));
    setCabinItems(prev => prev.map(it => it.id === id ? {...it, qty: Math.max(1, (it.qty || 1) - 1)} : it));
    setOptionalItems(prev => prev.map(it => it.id === id ? {...it, qty: Math.max(1, (it.qty || 1) - 1)} : it));
  };

  const toggleInOk = (id) => {
    // 🔥 Check-in mode: Μόνο μαρκάρισμα (ΟΧΙ ξεμαρκάρισμα)
    // Check-out mode: Κανονικό toggle
    if (mode === 'in') {
      setSafetyItems(prev => prev.map(it => it.id === id ? {...it, inOk: true} : it));
      setCabinItems(prev => prev.map(it => it.id === id ? {...it, inOk: true} : it));
      setOptionalItems(prev => prev.map(it => it.id === id ? {...it, inOk: true} : it));
    } else {
      setSafetyItems(prev => prev.map(it => it.id === id ? {...it, inOk: !it.inOk} : it));
      setCabinItems(prev => prev.map(it => it.id === id ? {...it, inOk: !it.inOk} : it));
      setOptionalItems(prev => prev.map(it => it.id === id ? {...it, inOk: !it.inOk} : it));
    }
  };

  const setOut = (id, value) => {
    setSafetyItems(prev => prev.map(it => it.id === id ? {...it, out: value} : it));
    setCabinItems(prev => prev.map(it => it.id === id ? {...it, out: value} : it));
    setOptionalItems(prev => prev.map(it => it.id === id ? {...it, out: value} : it));
  };

  const handlers = {
    openCamera: (itemId) => {
      setCurrentItemId(itemId);
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
    handleFiles: async (itemId, files) => {
      const file = files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        const compressed = await compressImageWithLogging(e.target.result);
        setSafetyItems(prev => prev.map(it => it.id === itemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
        setCabinItems(prev => prev.map(it => it.id === itemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
        setOptionalItems(prev => prev.map(it => it.id === itemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
      };
      reader.readAsDataURL(file);
    },
    openFilePicker: (itemId) => {
      setCurrentItemId(itemId);
      fileInputRef.current?.click();
    },
    removeRow: (id) => {
      if (window.confirm(t.confirmDelete || "Delete this item?")) {
        setSafetyItems(prev => prev.filter(it => it.id !== id));
        setCabinItems(prev => prev.filter(it => it.id !== id));
        setOptionalItems(prev => prev.filter(it => it.id !== id));
      }
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    const compressed = await compressImageWithLogging(base64);
    
    setSafetyItems(prev => prev.map(it => it.id === currentItemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
    setCabinItems(prev => prev.map(it => it.id === currentItemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
    setOptionalItems(prev => prev.map(it => it.id === currentItemId ? {...it, media: [...(it.media || []), { id: mid(), url: compressed }]} : it));
    
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

  const removeMedia = (itemId, mediaId) => {
    setSafetyItems(prev => prev.map(it => it.id === itemId ? {...it, media: it.media.filter(m => m.id !== mediaId)} : it));
    setCabinItems(prev => prev.map(it => it.id === itemId ? {...it, media: it.media.filter(m => m.id !== mediaId)} : it));
    setOptionalItems(prev => prev.map(it => it.id === itemId ? {...it, media: it.media.filter(m => m.id !== mediaId)} : it));
  };

  // 🔥 Percentage: Μόνο SAFETY & CABIN (ΟΧΙ OPTIONAL)
  const requiredItems = [...safetyItems, ...cabinItems];
  const totalItems = requiredItems.length;
  let completedItems = 0;
  if (mode === "in") {
    completedItems = requiredItems.filter((it) => it.inOk).length;
  } else {
    completedItems = requiredItems.filter((it) => it.out === "ok" || it.out === "not").length;
  }
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // 🔥 allItems για media (όλα τα items)
  const allItems = [...safetyItems, ...cabinItems, ...optionalItems];

  const addSafetyItem = () => {
    if (!newSafetyItem.trim()) {
      alert(t.enterItemName || 'Enter item name!');
      return;
    }
    const newKey = newSafetyItem.trim();
    setSafetyItems(prev => [...prev, {id: uid(), key: newKey, price: "", qty: 1, inOk: false, out: null, media: []}]);
    setNewSafetyItem("");
  };

  const addCabinItem = () => {
    if (!newCabinItem.trim()) {
      alert(t.enterItemName || 'Enter item name!');
      return;
    }
    const newKey = newCabinItem.trim();
        setCabinItems(prev => [...prev, {id: uid(), key: newKey, price: "", qty: 1, inOk: false, out: null, media: []}]);
    setNewCabinItem("");
  };

  const addOptionalItem = () => {
    if (!newOptionalItem.trim()) {
      alert(t.enterItemName || 'Enter item name!');
      return;
    }
    const newKey = newOptionalItem.trim();
    setOptionalItems(prev => [...prev, {id: uid(), key: newKey, price: "", qty: 1, inOk: false, out: null, media: []}]);
    setNewOptionalItem("");
  };

  const handleEmployeeLogin = () => {
    const user = authService.login(employeeCode);
    if (user) {
      setIsEmployee(true);
      setCurrentEmployee(user.permissions);
      setShowLoginModal(false);
      setEmployeeCode("");
    } else {
      alert(t.invalidCode);
    }
  };

  const handleEmployeeLogout = () => {
    setIsEmployee(false);
    setCurrentEmployee(null);
  };

  const highlightError = (id) => {
    const row = document.getElementById(`row-${id}`);
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      row.style.backgroundColor = '#fee2e2';
      row.style.transition = 'background-color 0.3s';
      setTimeout(() => {
        row.style.backgroundColor = '';
      }, 3000);
    }
  };

  const handleSave = async () => {
    if (!isEmployee || !currentEmployee?.canEdit) {
      alert(t.employeeRequired || '🔒 Employee permissions required!');
      return;
    }

    const dataToSave = {
      safetyItems,
      cabinItems,
      optionalItems,
      notes,
      signature: signatureImage,
      toiletWarningAccepted
    };

    // ✅ Save to Page 3 API using hybrid function
    try {
      const result = await savePage3DataHybrid(currentBookingNumber, dataToSave, mode);

      // Also save via shared function for backward compatibility
      savePage3Data(currentBookingNumber, dataToSave, mode);

      // 🔥 Save media to localStorage separately (API may not store large base64 images)
      savePageMedia(currentBookingNumber, mode, 'page3', [...safetyItems, ...cabinItems, ...optionalItems]);

      if (result.synced) {
        alert(t.draftSavedSynced || '✅ Saved and synced!');
      } else {
        alert(t.draftSavedLocally || '✅ Saved locally!');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert(t.saveError || '❌ Save error!');
    }
  };

  const handleClearForm = () => {
    if (!isEmployee || !currentEmployee?.canClearData) {
      alert(t.adminRequired || '🔒 ADMIN permissions required!');
      return;
    }
    if (window.confirm(t.clearFieldsConfirm || 'Are you sure you want to clear all fields?')) {
      setSafetyItems(initItems(SAFETY_KEYS));
      setCabinItems(initItems(CABIN_KEYS));
      setOptionalItems(initItems(OPTIONAL_KEYS));
      setNotes("");
      setSignatureImage("");
      setToiletWarningAccepted(false);
    }
  };

  const handlePrevious = () => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate('prev');
    }
  };

  const handleSelectAllOk = () => {
    const confirmed = window.confirm(t.selectAllOkConfirm || 'Under my own responsibility I declare all items are correct. Continue?');
    if (!confirmed) return;
    if (mode === 'in') {
      setSafetyItems(prev => prev.map(it => ({ ...it, inOk: true })));
      setCabinItems(prev => prev.map(it => ({ ...it, inOk: true })));
      setOptionalItems(prev => prev.map(it => ({ ...it, inOk: true })));
    } else {
      setSafetyItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
      setCabinItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
      setOptionalItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
    }
    setToiletWarningAccepted(true);
  };

  const handleNext = async () => {
    const safetyIncomplete = safetyItems.filter(item =>
      mode === 'in' ? !item.inOk : (item.out !== 'ok' && item.out !== 'not')
    );
    if (safetyIncomplete.length > 0) {
      const firstIncomplete = safetyIncomplete[0];
      highlightError(firstIncomplete.id);
      alert((t.pleaseComplete || 'Please complete:') + ' ' + getLabel(firstIncomplete.key, lang));
      return;
    }

    const cabinIncomplete = cabinItems.filter(item =>
      mode === 'in' ? !item.inOk : (item.out !== 'ok' && item.out !== 'not')
    );
    if (cabinIncomplete.length > 0) {
      const firstIncomplete = cabinIncomplete[0];
      highlightError(firstIncomplete.id);
      alert((t.pleaseComplete || 'Please complete:') + ' ' + getLabel(firstIncomplete.key, lang));
      return;
    }

    const optionalIncomplete = optionalItems.filter(item =>
      mode === 'in' ? !item.inOk : (item.out !== 'ok' && item.out !== 'not')
    );
    if (optionalIncomplete.length > 0) {
      const firstIncomplete = optionalIncomplete[0];
      highlightError(firstIncomplete.id);
      alert((t.pleaseComplete || 'Please complete:') + ' ' + getLabel(firstIncomplete.key, lang));
      return;
    }

    if (!toiletWarningAccepted) {
      alert(t.toiletAcceptRequired || 'Please accept the toilet clogging notice!');
      const warningBox = document.getElementById('toilet-warning-box');
      if (warningBox) {
        warningBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        warningBox.style.backgroundColor = '#fee2e2';
        warningBox.style.transition = 'background-color 0.3s';
        setTimeout(() => {
          warningBox.style.backgroundColor = '';
        }, 3000);
      }
      return;
    }

    if (!signatureImage) {
      alert(t.signatureRequired || 'Please provide signature!');
      return;
    }

    const dataToSave = {
      safetyItems,
      cabinItems,
      optionalItems,
      notes,
      signature: signatureImage,
      toiletWarningAccepted
    };

    try {
      await savePage3DataHybrid(currentBookingNumber, dataToSave, mode);
      savePage3Data(currentBookingNumber, dataToSave, mode);

      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate('next');
      }
    } catch (error) {
      alert(t.saveError || 'Save error!');
    }
  };

  const handlePDF = () => {
    if (!bookingInfo) {
      alert(t.noActiveBooking || '❌ No active booking!');
      return;
    }

    try {
      // Import PDF generator
      const { generateLuxuryPDF } = require('./utils/LuxuryPDFGenerator');
      
      // 🔥 Read signature with CORRECT key format
      const signatureKey = `page3_signature_${currentBookingNumber}_${mode}`;
      const actualSignature = localStorage.getItem(signatureKey) || '';
      
      console.log('📝 Signature from localStorage:', {
        key: signatureKey,
        type: typeof actualSignature,
        length: actualSignature?.length,
        startsWithData: typeof actualSignature === 'string' && actualSignature.startsWith('data:')
      });
      
      // 🔥 Pass data με τον ΙΔΙΟ τρόπο που περνάει η Σελίδα 2
      const additionalData = {
        safety: safetyItems,
        cabin: cabinItems,
        optional: optionalItems,
        toiletWarningAccepted: toiletWarningAccepted,
        skipperSignature: actualSignature  // Use actual signature from localStorage
      };
      
      const pdf = generateLuxuryPDF(
        bookingInfo, 
        mode, 
        additionalData, 
        lang, 
        { isPage3: true }
      );
      
      const fileName = `${bookingInfo.bookingNumber || 'booking'}_Page3_${mode}_${Date.now()}.pdf`;
      pdf.save(fileName);
      
      alert(t.pdfGenerated || '✅ PDF generated!');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(t.pdfError || '❌ PDF generation error!');
    }
  };

  // Get all media from all items
  const allMedia = allItems.reduce((acc, item) => {
    if (item.media && item.media.length > 0) {
      return [...acc, ...item.media.map(m => ({ ...m, itemKey: item.key }))];
    }
    return acc;
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: brand.pageBg }}>
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        
        <BookingInfoBox bookingInfo={bookingInfo} currentBookingNumber={currentBookingNumber} />
        <TailwindButton />
        <PageHeader title={t.title} />
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
          onChange={(e) => handlers.handleFiles(currentItemId, e.target.files)}
        />


        <div className="mb-4 text-center">
          <button
            onClick={handleSelectAllOk}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md"
          >
            ✓ {t.selectAllOk || 'SELECT ALL OK'}
          </button>
        </div>

        <TableSection 
          data={safetyItems} 
          t={t} 
          setPrice={setPrice}
          incQty={incQty}
          decQty={decQty}
          toggleInOk={toggleInOk}
          setOut={setOut}
          openCamera={handlers.openCamera}
          handleFiles={handlers.handleFiles}
          openFilePicker={handlers.openFilePicker}
          removeRow={handlers.removeRow}
          mode={mode}
          getLabel={(key) => getLabel(key, lang)}
          isEmployee={isEmployee}
          currentEmployee={currentEmployee}
          newItem={newSafetyItem}
          setNewItem={setNewSafetyItem}
          addItem={addSafetyItem}
          sectionTitle={t.safetyTitle}
        />

        <TableSection 
          data={cabinItems} 
          t={t} 
          setPrice={setPrice}
          incQty={incQty}
          decQty={decQty}
          toggleInOk={toggleInOk}
          setOut={setOut}
          openCamera={handlers.openCamera}
          handleFiles={handlers.handleFiles}
          openFilePicker={handlers.openFilePicker}
          removeRow={handlers.removeRow}
          mode={mode}
          getLabel={(key) => getLabel(key, lang)}
          isEmployee={isEmployee}
          currentEmployee={currentEmployee}
          newItem={newCabinItem}
          setNewItem={setNewCabinItem}
          addItem={addCabinItem}
          sectionTitle={t.cabinTitle}
        />

        <TableSection 
          data={optionalItems} 
          t={t} 
          setPrice={setPrice}
          incQty={incQty}
          decQty={decQty}
          toggleInOk={toggleInOk}
          setOut={setOut}
          openCamera={handlers.openCamera}
          handleFiles={handlers.handleFiles}
          openFilePicker={handlers.openFilePicker}
          removeRow={handlers.removeRow}
          mode={mode}
          getLabel={(key) => getLabel(key, lang)}
          isEmployee={isEmployee}
          currentEmployee={currentEmployee}
          newItem={newOptionalItem}
          setNewItem={setNewOptionalItem}
          addItem={addOptionalItem}
          sectionTitle={t.optionalTitle}
        />

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

        {/* PHOTO GALLERY - ALWAYS SHOW BOX */}
        <div className="mt-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
          <label className="block font-semibold mb-3" style={{ color: brand.black }}>
            {t.picsTitle}
          </label>
          
          {allMedia.length > 0 ? (
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
                          { data: safetyItems, key: 'safety' },
                          { data: cabinItems, key: 'cabin' },
                          { data: optionalItems, key: 'optional' }
                        ];
                        
                        for (const { data } of sectionMappings) {
                          const item = data.find(it => it.key === media.itemKey);
                          if (item) {
                            removeMedia(item.id, media.id);
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
          ) : (
            <div className="mt-2 text-sm text-gray-600" style={{ color: brand.black }}>
              {t.noPhotos || 'No photos added yet.'}
            </div>
          )}
        </div>

        {/* 🔥 TOILET CLOGGING WARNING BOX */}
        <div 
          id="toilet-warning-box"
          className="border-2 border-orange-500 rounded-xl p-6 bg-orange-50 mb-6"
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-orange-800 mb-3">
                    {t.toiletNoticeTitle || 'TOILET CLOGGING NOTICE'}
              </h3>
              <div className="text-sm text-orange-900 space-y-2 mb-4">
                <p>
                  {t.toiletText1 || 'In case the deposit has been paid with damage waiver (non-refundable), no charge applies for toilet clogging.'}
                </p>
                <p>
                  {t.toiletText2 || 'If check-in is completed and no damage or toilet clogging is detected, the company and base have no responsibility after check-in.'}
                </p>
              </div>
              
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-orange-400 hover:bg-orange-100 transition-all">
                <input 
                  type="checkbox" 
                  checked={toiletWarningAccepted}
                  onChange={(e) => {
                    // 🔥 Μόνο μαρκάρισμα - ΟΧΙ ξεμαρκάρισμα!
                    if (e.target.checked) {
                      setToiletWarningAccepted(true);
                    }
                  }}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="font-semibold text-orange-900">
                    {t.toiletAccept || '✓ I understand and accept'}
                </span>
              </label>
            </div>
          </div>
        </div>

        <SignatureBox 
          brand={brand}
          lang={lang}
          onSignChange={setSignatureImage}
          onImageChange={setSignatureImage}
          initialImage={signatureImage}
          currentBookingNumber={currentBookingNumber}
          mode={mode}
          pageNumber={3}
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
              <button onClick={() => { setShowLoginModal(false); setEmployeeCode(""); }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">
                {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
              </button>
              <button onClick={handleEmployeeLogin} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
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

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}