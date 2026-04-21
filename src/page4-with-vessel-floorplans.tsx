import React, { useState, useRef, useEffect, useContext } from "react";
import { useLocation } from 'react-router-dom';
import authService from './authService';
import { savePage4DataHybrid, getPage4DataHybrid, getAllBookings, getFloorplan, getPage1DataHybrid } from './services/apiService';
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

export const ITEM_LABELS = {
  electric_fridge: { en: "Electric fridge", el: "Ηλεκτρικό ψυγείο", it: "frigorifero elettrico", de: "Elektrokühlschrank", ru: "электрический холодильник", fr: "réfrigérateur électrique", ro: "frigider electric", pl: "lodówka elektryczna", he: "מקרר חשמלי", es: "nevera eléctrica" },
  gas_stove_4_heads: { en: "Gas stove – 4 heads", el: "Εστία αερίου – 4 μάτια", it: "fornello a gas 4 fuochi", de: "Gasherd 4 Flammen", ru: "газовая плита 4 конфорки", fr: "cuisinière gaz 4 feux", ro: "aragaz 4 ochiuri", pl: "kuchenka gazowa 4 palniki", he: "כיריים גז 4 להבות", es: "cocina gas 4 fuegos" },
  dinner_plates: { en: "Dinner plates", el: "Πιάτα φαγητού", it: "piatti da portata", de: "Teller", ru: "тарелки обеденные", fr: "assiettes plates", ro: "farfurii", pl: "talerze obiadowe", he: "צלחות ארוחה", es: "platos llanos" },
  soup_plates: { en: "Soup plates", el: "Πιάτα σούπας", it: "piatti fondi", de: "Suppenteller", ru: "тарелки суповые", fr: "assiettes creuses", ro: "farfurii adânci", pl: "talerze głębokie", he: "צלחות מרק", es: "platos hondos" },
  glasses_water: { en: "Glasses of water", el: "Ποτήρια νερού", it: "bicchieri d'acqua", de: "Wassergläser", ru: "стаканы для воды", fr: "verres à eau", ro: "pahare de apă", pl: "szklanki do wody", he: "כוסות מים", es: "vasos de agua" },
  glasses_wine: { en: "Glasses of wine", el: "Ποτήρια κρασιού" },
  knives: { en: "Knives", el: "Μαχαίρια" },
  forks: { en: "Forks", el: "Πιρούνια", it: "forchette", de: "Gabeln", ru: "вилки", fr: "fourchettes", ro: "furculițe", pl: "widelce", he: "מזלגות", es: "tenedores" },
  spoons: { en: "Spoons", el: "Κουτάλια", it: "cucchiai", de: "Löffel", ru: "ложки", fr: "cuillères", ro: "linguri", pl: "łyżki", he: "כפות", es: "cucharas" },
  gps_plotter: { en: "GPS - Plotter", el: "GPS - Πλότερ", it: "GPS - Plotter", de: "GPS - Plotter", ru: "GPS - Плоттер", fr: "GPS - Traceur", ro: "GPS - Plotter", pl: "GPS - Ploter", he: "GPS - פלוטר", es: "GPS - Plotter" },
  vhf_dsc: { en: "VHF/DSC", el: "VHF/DSC", it: "VHF/DSC", de: "VHF/DSC", ru: "VHF/DSC", fr: "VHF/DSC", ro: "VHF/DSC", pl: "VHF/DSC", he: "VHF/DSC", es: "VHF/DSC" },
  binoculars: { en: "Binoculars", el: "Κιάλια", it: "binocolo", de: "Fernglas", ru: "бинокль", fr: "jumelles", ro: "binoclu", pl: "lornetka", he: "משקפת", es: "prismáticos" },
  charts: { en: "Charts", el: "Ναυτικοί χάρτες", it: "carte nautiche", de: "Seekarten", ru: "морские карты", fr: "cartes marines", ro: "hărți nautice", pl: "mapy morskie", he: "מפות ימיות", es: "cartas náuticas" },
  life_raft: { en: "Life raft", el: "Σωσίβια λέμβος", it: "zattera di salvataggio", de: "Rettungsinsel", ru: "спасательный плот", fr: "radeau de sauvetage", ro: "plută de salvare", pl: "tratwa ratunkowa", he: "רפסודת הצלה", es: "balsa salvavidas" },
  life_jackets: { en: "Life jackets", el: "Σωσίβια", it: "giubbotti di salvataggio", de: "Rettungswesten", ru: "спасательные жилеты", fr: "gilets de sauvetage", ro: "veste de salvare", pl: "kamizelki ratunkowe", he: "אפודי הצלה", es: "chalecos salvavidas" },
  flares: { en: "Flares", el: "Φωτοβολίδες", it: "razzi di segnalazione", de: "Signalraketen", ru: "сигнальные ракеты", fr: "fusées de détresse", ro: "rachete de semnalizare", pl: "race sygnalizacyjne", he: "אבוקות מצוקה", es: "bengalas" },
  first_aid_kit: { en: "First aid kit", el: "Φαρμακείο", it: "kit pronto soccorso", de: "Erste-Hilfe-Set", ru: "аптечка", fr: "trousse de secours", ro: "trusă de prim ajutor", pl: "apteczka", he: "ערכת עזרה ראשונה", es: "botiquín" },
  generator: { en: "Generator", el: "Γεννήτρια", it: "generatore", de: "Generator", ru: "генератор", fr: "générateur", ro: "generator", pl: "generator", he: "גנרטור", es: "generador" },
  spare_anchor: { en: "Spare anchor", el: "Εφεδρική άγκυρα", it: "ancora di rispetto", de: "Reserveanker", ru: "запасной якорь", fr: "ancre de rechange", ro: "ancoră de rezervă", pl: "kotwica zapasowa", he: "עוגן חלופי", es: "ancla de repuesto" },
  deck_brush: { en: "Deck brush", el: "Βούρτσα καταστρώματος", it: "spazzola ponte", de: "Deckbürste", ru: "щётка для палубы", fr: "brosse de pont", ro: "perie de punte", pl: "szczotka pokładowa", he: "מברשת סיפון", es: "cepillo de cubierta" },
  gangway: { en: "Gangway", el: "Πασαρέλα", it: "passerella", de: "Gangway", ru: "трап", fr: "passerelle", ro: "pasarelă", pl: "trap", he: "גשר כניסה", es: "pasarela" },
  lines_20m: { en: "Lines 20m", el: "Σχοινιά 20m", it: "cime 20m", de: "Leinen 20m", ru: "лини 20м", fr: "amarres 20m", ro: "parâme 20m", pl: "liny 20m", he: "חבלים 20מ", es: "cabos 20m" },
  lines_50m: { en: "Lines 50m", el: "Σχοινιά 50m", it: "cime 50m", de: "Leinen 50m", ru: "лини 50м", fr: "amarres 50m", ro: "parâme 50m", pl: "liny 50m", he: "חבלים 50מ", es: "cabos 50m" },
  inflatable_dinghy: { en: "Inflatable dinghy", el: "Φουσκωτή βάρκα", it: "gommone gonfiabile", de: "Schlauchboot", ru: "надувная лодка", fr: "annexe gonflable", ro: "barcă gonflabilă", pl: "ponton dmuchany", he: "סירה מתנפחת", es: "bote inflable" },
  oars: { en: "Oars", el: "Κουπιά", it: "remi", de: "Ruder", ru: "вёсла", fr: "rames", ro: "vâsle", pl: "wiosła", he: "משוטים", es: "remos" },
  air_pump: { en: "Air pump", el: "Αντλία αέρα", it: "pompa aria", de: "Luftpumpe", ru: "воздушный насос", fr: "pompe à air", ro: "pompă de aer", pl: "pompka powietrza", he: "משאבת אוויר", es: "bomba de aire" },
  bow_fenders: { en: "Bow fenders", el: "Μπαλόνια πλαϊνά", it: "parabordi prua", de: "Bug-Fender", ru: "носовые кранцы", fr: "pare-battages avant", ro: "apărători prova", pl: "odbijacze dziobowe", he: "פנדרים קידמיים", es: "defensas de proa" },
  stern_fenders: { en: "Stern fenders", el: "Μπαλόνια πρύμνης", it: "parabordi poppa", de: "Heck-Fender", ru: "кормовые кранцы", fr: "pare-battages arrière", ro: "apărători pupa", pl: "odbijacze rufowe", he: "פנדרים אחוריים", es: "defensas de popa" },
  telescopic_boathook: { en: "Telescopic boat-hook", el: "Τηλεσκοπικός γάντζος", it: "mezzo marinaio telescopico", de: "Teleskop-Bootshaken", ru: "телескопический отпорный крюк", fr: "gaffe télescopique", ro: "cange telescopică", pl: "bosak teleskopowy", he: "אנקול טלסקופי", es: "bichero telescópico" }
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

// Floorplan images - using relative path for all environments
// Images must be uploaded to: /var/www/html/images/floorplans/ on the server
const IMAGE_BASE_URL = '/images/floorplans';

const VESSEL_FLOORPLANS: Record<string, string> = {
  'bob': `${IMAGE_BASE_URL}/lagoon-42.webp`,
  'perla': `${IMAGE_BASE_URL}/lagoon-46.png`,
  'infinity': `${IMAGE_BASE_URL}/bali-4-2-infinity.png`,
  'maria 1': `${IMAGE_BASE_URL}/jeanneau-449.png`,
  'maria 2': `${IMAGE_BASE_URL}/jeanneau-54.png`,
  'bar bar': `${IMAGE_BASE_URL}/beneteau-oceanis-46-new.png`,
  'kalispera': `${IMAGE_BASE_URL}/bavaria-c42-cruiser-kalispera.png`,
  'valesia': `${IMAGE_BASE_URL}/bavaria-c42-cruiser-valesia.png`
};

// Map various vessel name formats to simple lowercase names
const VESSEL_NAME_ALIASES: Record<string, string> = {
  'bob': 'bob',
  'lagoon-42-bob': 'bob',
  'lagoon 42': 'bob',
  'perla': 'perla',
  'lagoon-46-perla': 'perla',
  'lagoon 46': 'perla',
  'infinity': 'infinity',
  'bali-42-infinity': 'infinity',
  'bali 4.2': 'infinity',
  'maria1': 'maria 1',
  'maria 1': 'maria 1',
  'jeanneau-so-449-maria1': 'maria 1',
  'maria2': 'maria 2',
  'maria 2': 'maria 2',
  'jeanneau-yacht-54-maria2': 'maria 2',
  'bar-bar': 'bar bar',
  'bar bar': 'bar bar',
  'barbar': 'bar bar',
  'beneteau-oceanis-46-1-bar-bar': 'bar bar',
  'kalispera': 'kalispera',
  'bavaria-c42-kalispera': 'kalispera',
  'valesia': 'valesia',
  'bavaria-c42-valesia': 'valesia'
};

// Map vessel keys to API vessel IDs for floorplan loading
const VESSEL_NAME_TO_ID: Record<string, number> = {
  'bob': 8,
  'perla': 7,
  'infinity': 6,
  'maria 1': 1,
  'maria 2': 2,
  'bar bar': 4,
  'kalispera': 5,
  'valesia': 3
};

const VESSEL_HOTSPOTS = {
  'bob': [
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
  'perla': [
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
  'infinity': [
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
  'maria 1': [
    { id: "hs_kitchen", x: 0.3718, y: 0.8627, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.4760, y: 0.7257, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.5343, y: 0.8412, title: "SAFETY", category: "safetyItems" },
    { id: "hs_deck", x: 0.1864, y: 0.1512, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.1822, y: 0.3096, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5968, y: 0.2344, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4447, y: 0.4036, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3926, y: 0.2398, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'maria 2': [
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
  'bar bar': [
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
  'kalispera': [
    { id: "hs_kitchen", x: 0.3788, y: 0.5919, title: "KITCHEN", category: "items" },
    { id: "hs_nav", x: 0.4337, y: 0.6070, title: "NAVIGATION", category: "navItems" },
    { id: "hs_safety", x: 0.4870, y: 0.7080, title: "SAFETY", category: "safetyItems" },
    { id: "hs_deck", x: 0.2568, y: 0.1776, title: "DECK", category: "deckItems" },
    { id: "hs_fdeck", x: 0.2583, y: 0.2989, title: "FRONT DECK", category: "fdeckItems" },
    { id: "hs_dinghy", x: 0.5602, y: 0.2458, title: "DINGHY", category: "dinghyItems" },
    { id: "hs_fenders", x: 0.4062, y: 0.0715, title: "FENDERS", category: "fendersItems" },
    { id: "hs_boathook", x: 0.3361, y: 0.2534, title: "BOAT-HOOK", category: "boathookItems" }
  ],
  'valesia': [
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

const getHotspotsForVesselFallback = (vesselId) => {
  return VESSEL_HOTSPOTS[vesselId] || VESSEL_HOTSPOTS['bob'];
};

export default function Page4({ onNavigate }) {
  // 🔥 FIX: Use location to detect when page is navigated to
  const location = useLocation();

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
  
  const [selectedVessel, setSelectedVessel] = useState('bob');
  const [activeSection, setActiveSection] = useState(null);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [apiFloorplan, setApiFloorplan] = useState<{ background_image: string; hotspots: any[] } | null>(null);
  const [loadingFloorplan, setLoadingFloorplan] = useState(false);

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

  // Get context data
  const contextData = useContext(DataContext);

  useEffect(() => {
    const loadBookingFromAPI = async () => {
      // Use currentBooking from context or localStorage (UI state)
      const currentBooking = contextData?.bookingNumber || localStorage.getItem('currentBooking');

      if (currentBooking) {
        try {
          // 🔥 FIX: First get vessel from Page 1 API (where it's actually saved)
          const page1Data = await getPage1DataHybrid(currentBooking);
          console.log('📍 Page 1 data loaded:', page1Data);

          // Also fetch booking info from bookings API for other data
          const allBookings = await getAllBookings();
          const booking = allBookings.find((b: any) =>
            b.bookingNumber === currentBooking || b.code === currentBooking
          );

          if (booking || page1Data) {
            setCurrentBookingNumber(currentBooking);

            // 🔥 FIX: Merge booking info, prioritizing Page 1 data (source of truth for vessel/skipper/dates)
            const mergedBookingInfo = {
              ...booking,
              // Override with Page 1 data (where the actual form data is saved)
              vesselName: page1Data?.vesselName || booking?.vesselName || booking?.vessel,
              skipperFirstName: page1Data?.skipperFirstName || booking?.skipperFirstName,
              skipperLastName: page1Data?.skipperLastName || booking?.skipperLastName,
              checkInDate: page1Data?.checkInDate || booking?.checkInDate,
              checkOutDate: page1Data?.checkOutDate || booking?.checkOutDate,
              checkInTime: page1Data?.checkInTime || booking?.checkInTime,
              checkOutTime: page1Data?.checkOutTime || booking?.checkOutTime,
            };
            setBookingInfo(mergedBookingInfo);
            console.log('📍 Merged booking info:', mergedBookingInfo);

            const savedMode = contextData?.mode || booking?.mode || page1Data?.mode || 'in';
            setMode(savedMode);

            // 🔥 FIX: Get vessel name from Page 1 data FIRST (source of truth), then fallback to booking
            const rawVesselName = mergedBookingInfo.vesselName || '';
            console.log('📍 Raw vessel name from Page 1:', rawVesselName);

        if (rawVesselName) {
          const vesselLower = rawVesselName.toLowerCase();
          let vesselKey: string | null = null;

          // Step 1: Try direct match in aliases
          if (VESSEL_NAME_ALIASES[vesselLower]) {
            vesselKey = VESSEL_NAME_ALIASES[vesselLower];
            console.log('📍 Direct alias match:', vesselLower, '→', vesselKey);
          }

          // Step 2: Try partial match by boat nickname
          if (!vesselKey) {
            for (const [alias, key] of Object.entries(VESSEL_NAME_ALIASES)) {
              if (vesselLower.includes(alias)) {
                vesselKey = key;
                console.log('📍 Partial match:', alias, '→', vesselKey);
                break;
              }
            }
          }

          // Step 3: Fallback to default
          if (!vesselKey) {
            console.warn('⚠️ No floorplan found for vessel:', rawVesselName, '- using default');
            vesselKey = 'bob';
          }

          console.log('📍 Final vessel key:', vesselKey);
          console.log('📍 Floorplan URL:', VESSEL_FLOORPLANS[vesselKey]);
            setSelectedVessel(vesselKey);
          }

          loadDataForMode(currentBooking, savedMode);

          console.log(`✅ Page 4 loaded from API: ${currentBooking}, Mode: ${savedMode}, Vessel: ${rawVesselName}`);
          } else {
            console.warn(`⚠️ Booking ${currentBooking} not found in API`);
          }
        } catch (error) {
          console.error('❌ Error loading booking from API:', error);
        }
      }
    };

    loadBookingFromAPI();
  }, [contextData?.bookingNumber, contextData?.mode, location.key]);  // 🔥 FIX: Added location.key to re-run when page is navigated to

  // Load floorplan from API when vessel changes
  useEffect(() => {
    // 🔥 FIX: Reset API floorplan immediately when vessel changes
    // This ensures the local fallback image is used right away while fetching
    setApiFloorplan(null);
    setImageError(false);

    const loadFloorplanFromAPI = async () => {
      const vesselId = VESSEL_NAME_TO_ID[selectedVessel];
      if (!vesselId) {
        console.log('📍 No vessel ID mapping for:', selectedVessel);
        return;
      }

      setLoadingFloorplan(true);
      try {
        console.log('🔄 Loading floorplan from API for vessel ID:', vesselId, 'vessel:', selectedVessel);
        const floorplan = await getFloorplan(vesselId);

        if (floorplan && floorplan.background_image) {
          console.log('✅ Floorplan loaded from API:', floorplan);
          setApiFloorplan({
            background_image: floorplan.background_image,
            hotspots: floorplan.hotspots || []
          });
          setImageError(false);
        } else {
          console.log('📍 No API floorplan, using local fallback for:', selectedVessel);
          // Keep apiFloorplan as null - local VESSEL_FLOORPLANS will be used
        }
      } catch (error) {
        console.error('❌ Error loading floorplan from API:', error);
        // Keep apiFloorplan as null - local VESSEL_FLOORPLANS will be used
      } finally {
        setLoadingFloorplan(false);
      }
    };

    loadFloorplanFromAPI();
  }, [selectedVessel]);

  const loadDataForMode = async (bookingNumber, selectedMode) => {
    // API only - no localStorage fallback
    let data = null;

    // 🔥 FIX: When in check-out mode, first load check-in data to get inOk values
    let checkInData = null;
    if (selectedMode === 'out') {
      try {
        checkInData = await getPage4DataHybrid(bookingNumber, 'in');
        if (checkInData) {
          console.log('✅ Page 4 check-in data loaded for inOk values');
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
      const apiData = await getPage4DataHybrid(bookingNumber, selectedMode);
      if (apiData) {
        console.log('✅ Page 4 data loaded from API');
        data = apiData;
      }
    } catch (error) {
      console.error('❌ Error loading Page 4 data from API:', error);
    }

    if (data) {
      // 🔥 FIX: Merge inOk values from check-in when in check-out mode
      const finalItems = selectedMode === 'out'
        ? mergeInOkData(data.items, checkInData?.items, KITCHEN_KEYS) || initItems(KITCHEN_KEYS)
        : data.items?.length ? data.items : initItems(KITCHEN_KEYS);

      const finalNavItems = selectedMode === 'out'
        ? mergeInOkData(data.navItems, checkInData?.navItems, NAV_KEYS) || initItems(NAV_KEYS)
        : data.navItems?.length ? data.navItems : initItems(NAV_KEYS);

      const finalSafetyItems = selectedMode === 'out'
        ? mergeInOkData(data.safetyItems, checkInData?.safetyItems, SAFETY_KEYS) || initItems(SAFETY_KEYS)
        : data.safetyItems?.length ? data.safetyItems : initItems(SAFETY_KEYS);

      const finalGenItems = selectedMode === 'out'
        ? mergeInOkData(data.genItems, checkInData?.genItems, GEN_KEYS) || initItems(GEN_KEYS)
        : data.genItems?.length ? data.genItems : initItems(GEN_KEYS);

      const finalDeckItems = selectedMode === 'out'
        ? mergeInOkData(data.deckItems, checkInData?.deckItems, DECK_KEYS) || initItems(DECK_KEYS)
        : data.deckItems?.length ? data.deckItems : initItems(DECK_KEYS);

      const finalFdeckItems = selectedMode === 'out'
        ? mergeInOkData(data.fdeckItems, checkInData?.fdeckItems, FDECK_KEYS) || initItems(FDECK_KEYS)
        : data.fdeckItems?.length ? data.fdeckItems : initItems(FDECK_KEYS);

      const finalDinghyItems = selectedMode === 'out'
        ? mergeInOkData(data.dinghyItems, checkInData?.dinghyItems, DINGHY_KEYS) || initItems(DINGHY_KEYS)
        : data.dinghyItems?.length ? data.dinghyItems : initItems(DINGHY_KEYS);

      const finalFendersItems = selectedMode === 'out'
        ? mergeInOkData(data.fendersItems, checkInData?.fendersItems, FENDERS_KEYS) || initItems(FENDERS_KEYS)
        : data.fendersItems?.length ? data.fendersItems : initItems(FENDERS_KEYS);

      const finalBoathookItems = selectedMode === 'out'
        ? mergeInOkData(data.boathookItems, checkInData?.boathookItems, BOATHOOK_KEYS) || initItems(BOATHOOK_KEYS)
        : data.boathookItems?.length ? data.boathookItems : initItems(BOATHOOK_KEYS);

      setItems(finalItems);
      setNavItems(finalNavItems);
      setSafetyItems(finalSafetyItems);
      setGenItems(finalGenItems);
      setDeckItems(finalDeckItems);
      setFdeckItems(finalFdeckItems);
      setDinghyItems(finalDinghyItems);
      setFendersItems(finalFendersItems);
      setBoathookItems(finalBoathookItems);
      setNotes(data.notes || "");
      setSignatureImage(data.signatureImage || "");
    } else if (selectedMode === 'out' && checkInData) {
      // 🔥 FIX: No check-out data yet, but we have check-in data - use it as starting point
      console.log('🔄 Using check-in data as base for check-out');
      setItems(checkInData.items ? checkInData.items.map(item => ({ ...item, out: null })) : initItems(KITCHEN_KEYS));
      setNavItems(checkInData.navItems ? checkInData.navItems.map(item => ({ ...item, out: null })) : initItems(NAV_KEYS));
      setSafetyItems(checkInData.safetyItems ? checkInData.safetyItems.map(item => ({ ...item, out: null })) : initItems(SAFETY_KEYS));
      setGenItems(checkInData.genItems ? checkInData.genItems.map(item => ({ ...item, out: null })) : initItems(GEN_KEYS));
      setDeckItems(checkInData.deckItems ? checkInData.deckItems.map(item => ({ ...item, out: null })) : initItems(DECK_KEYS));
      setFdeckItems(checkInData.fdeckItems ? checkInData.fdeckItems.map(item => ({ ...item, out: null })) : initItems(FDECK_KEYS));
      setDinghyItems(checkInData.dinghyItems ? checkInData.dinghyItems.map(item => ({ ...item, out: null })) : initItems(DINGHY_KEYS));
      setFendersItems(checkInData.fendersItems ? checkInData.fendersItems.map(item => ({ ...item, out: null })) : initItems(FENDERS_KEYS));
      setBoathookItems(checkInData.boathookItems ? checkInData.boathookItems.map(item => ({ ...item, out: null })) : initItems(BOATHOOK_KEYS));
      setNotes("");
      setSignatureImage("");
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

  // Get hotspots - prefer API data, fallback to hardcoded
  const getHotspotsForVessel = (vesselId) => {
    // If API floorplan has hotspots, convert them for display
    if (apiFloorplan && apiFloorplan.hotspots && apiFloorplan.hotspots.length > 0) {
      console.log('📍 Using API hotspots for vessel:', vesselId);
      return apiFloorplan.hotspots.map(h => ({
        id: h.id,
        x: h.x / 100, // API stores as 0-100, convert to 0-1 for positioning
        y: h.y / 100,
        title: h.label || 'ITEM',
        category: h.category || 'items'
      }));
    }
    // Fallback to hardcoded hotspots
    console.log('📍 Using fallback hotspots for vessel:', vesselId);
    return getHotspotsForVesselFallback(vesselId);
  };

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
      items: ({en:'KITCHEN',el:'ΚΟΥΖΙΝΑ',it:'CUCINA',de:'KUCHE',ru:'КУХНЯ',fr:'CUISINE',ro:'BUCATARIE',pl:'KUCHNIA',he:'מטבח',es:'COCINA'})[lang] || 'KITCHEN',
      navItems: ({en:'NAVIGATION',el:'ΝΑΥΤΙΛΙΑ',it:'NAVIGAZIONE',de:'NAVIGATION',ru:'НАВИГАЦИЯ',fr:'NAVIGATION',ro:'NAVIGATIE',pl:'NAWIGACJA',he:'ניווט',es:'NAVEGACION'})[lang] || 'NAVIGATION',
      safetyItems: ({en:'SAFETY',el:'ΑΣΦΑΛΕΙΑ',it:'SICUREZZA',de:'SICHERHEIT',ru:'БЕЗОПАСНОСТЬ',fr:'SECURITE',ro:'SIGURANTA',pl:'BEZPIECZENSTWO',he:'בטיחות',es:'SEGURIDAD'})[lang] || 'SAFETY',
      genItems: ({en:'GENERATOR',el:'ΓΕΝΝΗΤΡΙΑ',it:'GENERATORE',de:'GENERATOR',ru:'ГЕНЕРАТОР',fr:'GENERATEUR',ro:'GENERATOR',pl:'GENERATOR',he:'גנרטור',es:'GENERADOR'})[lang] || 'GENERATOR',
      deckItems: ({en:'DECK',el:'ΚΑΤΑΣΤΡΩΜΑ',it:'PONTE',de:'DECK',ru:'ПАЛУБА',fr:'PONT',ro:'PUNTE',pl:'POKLAD',he:'סיפון',es:'CUBIERTA'})[lang] || 'DECK',
      fdeckItems: ({en:'FRONT DECK',el:'ΜΠΡΟΣΤΙΝΟ ΚΑΤΑΣΤΡΩΜΑ',it:'PONTE ANTERIORE',de:'VORDECK',ru:'НОСОВАЯ ПАЛУБА',fr:'PONT AVANT',ro:'PUNTE FATA',pl:'POKLAD DZIOBOWY',he:'סיפון קדמי',es:'CUBIERTA DELANTERA'})[lang] || 'FRONT DECK',
      dinghyItems: ({en:'DINGHY',el:'ΛΕΜΒΟΣ',it:'TENDER',de:'BEIBOOT',ru:'ТУЗИК',fr:'ANNEXE',ro:'BARCA',pl:'PONTON',he:'סירת גומי',es:'BOTE'})[lang] || 'DINGHY',
      fendersItems: ({en:'FENDERS',el:'ΜΠΑΛΟΝΙΑ',it:'PARABORDI',de:'FENDER',ru:'КРАНЦЫ',fr:'PARE-BATTAGES',ro:'APARATORI',pl:'ODBIJACZE',he:'פנדרים',es:'DEFENSAS'})[lang] || 'FENDERS',
      boathookItems: ({en:'BOAT-HOOK',el:'ΓΑΝΤΖΟΣ',it:'MEZZO MARINAIO',de:'BOOTSHAKEN',ru:'ОТПОРНЫЙ КРЮК',fr:'GAFFE',ro:'CANGE',pl:'BOSAK',he:'אנקול',es:'BICHERO'})[lang] || 'BOAT-HOOK'
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
      alert(t.enterItemName || 'Enter item name!');
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
      alert(t.employeeRequired || '🔒 Employee permissions required!');
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

    // 🔥 Save media to localStorage separately (API may not store large base64 images)
    const allPage4Items = [...items, ...navItems, ...safetyItems, ...genItems, ...deckItems, ...fdeckItems, ...dinghyItems, ...fendersItems, ...boathookItems];
    savePageMedia(currentBookingNumber, mode, 'page4', allPage4Items);

    // ✅ Save to Page 4 API using hybrid function
    try {
      const result = await savePage4DataHybrid(currentBookingNumber, dataToSave, mode);

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
      alert(t.noActiveBooking || '❌ No active booking!');
      return;
    }

    try {
      const { generateLuxuryPDF } = require('./utils/LuxuryPDFGenerator');
      
      // Read signature from localStorage
      const signatureKey = `page4_signature_${currentBookingNumber}_${mode}`;
      const actualSignature = localStorage.getItem(signatureKey) || '';
      
      // Get vessel name and floorplan (prefer API, fallback to hardcoded)
      const vesselName = VESSELS.find(v => v.id === selectedVessel)?.name || selectedVessel;
      const floorplanPath = apiFloorplan?.background_image || VESSEL_FLOORPLANS[selectedVessel];
      
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
      
      alert(t.pdfGenerated || '✅ PDF generated!');
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(t.pdfError || '❌ PDF generation error!');
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
    const toOk = (arr) => arr.map(it => mode === 'in' ? { ...it, inOk: true } : { ...it, out: 'ok' });
    setItems(toOk);
    setNavItems(toOk);
    setSafetyItems(toOk);
    setGenItems(toOk);
    setDeckItems(toOk);
    setFdeckItems(toOk);
    setDinghyItems(toOk);
    setFendersItems(toOk);
    setBoathookItems(toOk);
  };

  const handleNext = async () => {
    if (activeSection) {
      const currentSectionData = getSectionData(activeSection);
      let firstIncompleteItem = null;

      for (const item of currentSectionData) {
        const isIncomplete = mode === 'in'
          ? !item.inOk
          : (item.out !== 'ok' && item.out !== 'not');

        if (isIncomplete) {
          firstIncompleteItem = item;
          break;
        }
      }

      if (firstIncompleteItem) {
        alert(mode === 'in'
          ? (t.completeAllItems || 'Please complete all items!')
          : (t.completeCheckout || 'Please complete check-out!'));

        setTimeout(() => {
          const row = document.querySelector('[data-item-id="' + firstIncompleteItem.id + '"]');
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
        const isIncomplete = mode === 'in'
          ? !item.inOk
          : (item.out !== 'ok' && item.out !== 'not');

        if (isIncomplete) {
          firstIncompleteItem = item;
          firstIncompleteSectionName = section.name;
          break;
        }
      }
      if (firstIncompleteItem) break;
    }

    if (firstIncompleteItem) {
      alert(mode === 'in'
        ? (t.completeAllItems || 'Please complete all items!')
        : (t.completeCheckout || 'Please complete check-out!'));

      setPendingFlashItemId(firstIncompleteItem.id);
      setActiveSection(firstIncompleteSectionName);

      return;
    }

    if (!signatureImage) {
      alert(t.signatureRequired || 'Please provide signature!');
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

    try {
      await savePage4DataHybrid(currentBookingNumber, dataToSave, mode);

      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate('next');
      }
    } catch (error) {
      alert(t.saveError || 'Save error!');
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
          <PageHeader title={t.boatInventoryMap || 'BOAT INVENTORY - INTERACTIVE MAP'} />
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


        <div className="mb-4 text-center">
          <button
            onClick={handleSelectAllOk}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md"
          >
            ✓ {t.selectAllOk || 'SELECT ALL OK'}
          </button>
        </div>
        {!activeSection ? (
          <div>
            <div className="mb-6 bg-white rounded-xl p-4 border-2" style={{ borderColor: brand.blue }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: brand.black }}>
                  {t.progress || 'Progress'}
                </span>
                <span className="text-sm font-bold" style={{ color: brand.blue }}>
                  {completedSectionsCount()}/9 {t.sectionsCompleted || 'sections completed'}
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
                {t.clickHotspot || 'Click on any hotspot to view inventory'}
              </div>
              
              <div className="relative inline-block w-full">
                <div className="relative w-full" style={{ paddingTop: '60%' }}>
                  
                  {!imageError ? (
                    <img
                      src={apiFloorplan?.background_image || VESSEL_FLOORPLANS[selectedVessel] || VESSEL_FLOORPLANS['bob']}
                      alt={selectedVessel + ' floorplan'}
                      className="absolute inset-0 w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        console.error('❌ Floorplan image failed to load:', e.currentTarget.src);
                        setImageError(true);
                      }}
                      onLoad={() => console.log('✅ Floorplan image loaded:', selectedVessel)}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm">
                          {t.floorplanNotAvailable || 'Floorplan not available for this vessel'}
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
                ← {t.backToMap || 'Back to Map'}
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
              {t.noPhotos || 'No photos added yet.'}
            </p>
          </div>
        )}

        {!activeSection && (
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
        )}

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
