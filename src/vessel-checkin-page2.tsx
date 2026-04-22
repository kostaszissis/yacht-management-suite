import React, { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { DataContext } from './App';
import FloatingChatWidget from './FloatingChatWidget';
import authService from './authService';
import { savePage2DataHybrid, getPage2DataHybrid, getPage1DataHybrid } from './services/apiService';
import { savePageMedia, getPageMedia, mergeMediaIntoItems } from './utils/mediaStorage';

// 🔥 IMPORT ΑΠΟ SharedComponents (ΤΑ ΚΟΙΝΑ)
import {
  brand,
  // EMPLOYEE_CODES, // removed - using authService
  I18N,
  uid,
  mid,
  compressSignature,
  compressImageWithLogging,
  saveBookingData,
  loadBookingData,
  BookingInfoBox,
  PageHeader,
  TopControls,
  ModeDisplay,
  formatDate,
  ActionButtons,
  MainsailAgreement,
  SignatureBox,
  TableSection,
  SHOW_BOOKING_INFO_ON_CHECKLIST_PAGES
} from './shared-components';

export const INITIAL_KEYS = [
  "engine", "anchor_windlass", "mainsail", "genoa", "autopilot", "gps_plotter",
  "electricity", "fridge", "gas_oven", "electric_toilet_pump", "fresh_water_pump",
  "bilge_pump", "radio_mp3", "cleanliness", "fuel_water", "fuel_filling",
  "bimini_sprayhood", "bow_thruster", "generator", "electric_winch", "winch",
  "hydraulic_gangway", "ac", "water_maker",
];

export const HULL_KEYS = ["fore", "aft", "port", "starboard"];
export const DINGHY_KEYS = ["dinghy", "outboard", "fuel_jerrycan", "oars", "sea_tap"];

export const ITEM_LABELS = {
  engine: { en: "engine", el: "κινητήρας", it: "motore", de: "Motor", ru: "двигатель", fr: "moteur", ro: "motor", pl: "silnik", he: "מנוע", es: "motor" },
  anchor_windlass: { en: "anchor windlass", el: "εργάτης άγκυρας", it: "verricello ancora", de: "Ankerwinde", ru: "якорная лебёдка", fr: "guindeau", ro: "vinciul de ancoră", pl: "wciągarka kotwiczna", he: "כננת עוגן", es: "molinete de ancla" },
  mainsail: { en: "mainsail", el: "κύριο πανί", it: "randa", de: "Großsegel", ru: "грот", fr: "grand-voile", ro: "vela principală", pl: "grot", he: "מפרש ראשי", es: "vela mayor" },
  genoa: { en: "genoa", el: "τζένοα", it: "genoa", de: "Genua", ru: "генуя", fr: "génois", ro: "genoa", pl: "genua", he: "ג'נואה", es: "génova" },
  autopilot: { en: "autopilot", el: "αυτόματος πιλότος", it: "pilota automatico", de: "Autopilot", ru: "автопилот", fr: "pilote automatique", ro: "pilot automat", pl: "autopilot", he: "טייס אוטומטי", es: "piloto automático" },
  gps_plotter: { en: "gps/gps plotter", el: "GPS / plotter", it: "GPS / plotter", de: "GPS / Plotter", ru: "GPS / плоттер", fr: "GPS / traceur", ro: "GPS / plotter", pl: "GPS / ploter", he: "GPS / פלוטר", es: "GPS / plotter" },
  electricity: { en: "electricity", el: "ηλεκτρικά", it: "elettricità", de: "Elektrik", ru: "электричество", fr: "électricité", ro: "electricitate", pl: "elektryczność", he: "חשמל", es: "electricidad" },
  fridge: { en: "fridge", el: "ψυγείο", it: "frigorifero", de: "Kühlschrank", ru: "холодильник", fr: "réfrigérateur", ro: "frigider", pl: "lodówka", he: "מקרר", es: "nevera" },
  gas_oven: { en: "gas oven", el: "φούρνος γκαζιού", it: "forno a gas", de: "Gasofen", ru: "газовая плита", fr: "four à gaz", ro: "cuptor pe gaz", pl: "kuchenka gazowa", he: "תנור גז", es: "horno de gas" },
  electric_toilet_pump: { en: "electric toilet pump", el: "αντλία τουαλέτας", it: "pompa WC elettrica", de: "elektr. Toilettenpumpe", ru: "электр. насос унитаза", fr: "pompe WC électrique", ro: "pompă electrică de toaletă", pl: "pompa toalety elektr.", he: "משאבת שירותים חשמלית", es: "bomba WC eléctrica" },
  fresh_water_pump: { en: "fresh water pump", el: "αντλία γλυκού νερού", it: "pompa acqua dolce", de: "Frischwasserpumpe", ru: "насос пресной воды", fr: "pompe eau douce", ro: "pompă de apă dulce", pl: "pompa wody słodkiej", he: "משאבת מים מתוקים", es: "bomba de agua dulce" },
  bilge_pump: { en: "bilge pump", el: "αντλία σεντινών", it: "pompa di sentina", de: "Bilgenpumpe", ru: "трюмная помпа", fr: "pompe de cale", ro: "pompă de santină", pl: "pompa zęzowa", he: "משאבת תחתית", es: "bomba de achique" },
  radio_mp3: { en: "radio/mp3 player", el: "ραδιόφωνο / mp3", it: "radio / mp3", de: "Radio / MP3", ru: "радио / mp3", fr: "radio / mp3", ro: "radio / mp3", pl: "radio / mp3", he: "רדיו / mp3", es: "radio / mp3" },
  cleanliness: { en: "cleanliness", el: "καθαριότητα", it: "pulizia", de: "Sauberkeit", ru: "чистота", fr: "propreté", ro: "curățenie", pl: "czystość", he: "ניקיון", es: "limpieza" },
  fuel_water: { en: "fuel-water", el: "καύσιμα / νερό", it: "carburante / acqua", de: "Kraftstoff / Wasser", ru: "топливо / вода", fr: "carburant / eau", ro: "combustibil / apă", pl: "paliwo / woda", he: "דלק / מים", es: "combustible / agua" },
  fuel_filling: { en: "fuel-filling", el: "ανεφοδιασμός καυσίμων", it: "rifornimento", de: "Betankung", ru: "заправка топливом", fr: "ravitaillement", ro: "alimentare cu combustibil", pl: "tankowanie", he: "תדלוק", es: "repostaje" },
  bimini_sprayhood: { en: "bimini sprayhood", el: "bimini / sprayhood", it: "bimini / sprayhood", de: "Bimini / Sprayhood", ru: "бимини / спрейхуд", fr: "bimini / capote", ro: "bimini / sprayhood", pl: "bimini / sprayhood", he: "בימיני / ספרייהוד", es: "bimini / sprayhood" },
  bow_thruster: { en: "bow thruster", el: "προωστήρας πλώρης", it: "elica di prua", de: "Bugstrahlruder", ru: "носовое подруливающее", fr: "propulseur d'étrave", ro: "propulsor de prova", pl: "ster strumieniowy", he: "דחפן חרטום", es: "hélice de proa" },
  generator: { en: "generator", el: "γεννήτρια", it: "generatore", de: "Generator", ru: "генератор", fr: "générateur", ro: "generator", pl: "generator", he: "גנרטור", es: "generador" },
  electric_winch: { en: "electric winch", el: "ηλεκτρικό βίντζι", it: "winch elettrico", de: "elektrische Winsch", ru: "электр. лебёдка", fr: "winch électrique", ro: "vinci electric", pl: "wciągarka elektryczna", he: "כננת חשמלית", es: "winche eléctrico" },
  winch: { en: "winch", el: "βίντζι", it: "winch", de: "Winsch", ru: "лебёдка", fr: "winch", ro: "vinci", pl: "wciągarka", he: "כננת", es: "winche" },
  hydraulic_gangway: { en: "hydraulic gangway", el: "υδραυλική πασαρέλα", it: "passerella idraulica", de: "hydraulische Gangway", ru: "гидравлический трап", fr: "passerelle hydraulique", ro: "pasarelă hidraulică", pl: "trap hydrauliczny", he: "גשר הידראולי", es: "pasarela hidráulica" },
  ac: { en: "a/c", el: "κλιματισμός", it: "aria condizionata", de: "Klimaanlage", ru: "кондиционер", fr: "climatisation", ro: "aer condiționat", pl: "klimatyzacja", he: "מיזוג אוויר", es: "aire acondicionado" },
  water_maker: { en: "water maker", el: "αφαλάτωση", it: "dissalatore", de: "Wassermacher", ru: "опреснитель", fr: "dessalinisateur", ro: "desalinizator", pl: "odsalacz", he: "מתקן התפלה", es: "desalinizadora" },
  fore: { en: "fore", el: "πλώρη", it: "prua", de: "Bug", ru: "нос", fr: "proue", ro: "prova", pl: "dziób", he: "חרטום", es: "proa" },
  aft: { en: "aft", el: "πρύμνη", it: "poppa", de: "Heck", ru: "корма", fr: "poupe", ro: "pupa", pl: "rufa", he: "ירכתיים", es: "popa" },
  port: { en: "port", el: "αριστερά", it: "babordo", de: "Backbord", ru: "левый борт", fr: "bâbord", ro: "babord", pl: "lewa burta", he: "שמאל", es: "babor" },
  starboard: { en: "starboard", el: "δεξιά", it: "tribordo", de: "Steuerbord", ru: "правый борт", fr: "tribord", ro: "tribord", pl: "prawa burta", he: "ימין", es: "estribor" },
  dinghy: { en: "dinghy", el: "λέμβος", it: "tender", de: "Beiboot", ru: "тузик", fr: "annexe", ro: "barcă auxiliară", pl: "ponton", he: "סירת גומי", es: "bote auxiliar" },
  outboard: { en: "outboard", el: "εξωλέμβιος", it: "fuoribordo", de: "Außenborder", ru: "подвесной мотор", fr: "hors-bord", ro: "motor exterior", pl: "silnik zaburtowy", he: "מנוע חיצוני", es: "fueraborda" },
  fuel_jerrycan: { en: "fuel jerrycan", el: "κανίστρα καυσίμου", it: "tanica carburante", de: "Kraftstoffkanister", ru: "канистра для топлива", fr: "jerrycan carburant", ro: "canistră combustibil", pl: "kanister na paliwo", he: "ג'ריקן דלק", es: "bidón de combustible" },
  oars: { en: "oars", el: "κουπιά", it: "remi", de: "Ruder", ru: "вёсла", fr: "rames", ro: "vâsle", pl: "wiosła", he: "משוטים", es: "remos" },
  sea_tap: { en: "sea tap", el: "βάνα θάλασσας", it: "presa a mare", de: "Seeventil", ru: "кингстон", fr: "vanne de mer", ro: "robinet de mare", pl: "zawór denny", he: "ברז ים", es: "grifo de mar" },
};
function DiversReport({ t, onImageChange, initialFile, currentBookingNumber, mode }) {
  const [file, setFile] = useState(initialFile || null);
  const [expanded, setExpanded] = useState(!initialFile);
  const [accepted, setAccepted] = useState(!!initialFile);
  const [zoomUrl, setZoomUrl] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialFile) {
      setFile(initialFile);
      setAccepted(true);
      setExpanded(false);
    }
  }, [initialFile]);

  const pick = () => inputRef.current?.click();
  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      
      const compressed = await compressImageWithLogging(base64);
      const fileData = { name: f.name, type: f.type, url: compressed };
      setFile(fileData);
      setZoomUrl(compressed);
      
      if (currentBookingNumber) {
        const diversKey = `page2_diversReport_${currentBookingNumber}_${mode}`;
        localStorage.setItem(diversKey, JSON.stringify(fileData));
        console.log(`✅ Diver's report uploaded for mode: ${mode}`);
      }
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Error processing image. Please try again.');
    }
  };

  const remove = () => {
    setFile(null);
    setAccepted(false);
    onImageChange(false, null);
    
    if (currentBookingNumber) {
      const diversKey = `page2_diversReport_${currentBookingNumber}_${mode}`;
      const diversImageKey = `page2_diversImageUploaded_${currentBookingNumber}_${mode}`;
      localStorage.removeItem(diversKey);
      localStorage.removeItem(diversImageKey);
    }
  };

  const hasImage = file && accepted;

  const handleZoomOk = () => {
    setZoomUrl(null);
    if (!accepted && file) { 
      setAccepted(true); 
      setExpanded(false); 
      onImageChange(true, file);
      
      if (currentBookingNumber) {
        localStorage.setItem(`page2_diversImageUploaded_${currentBookingNumber}_${mode}`, 'true');
        console.log(`✅ Diver's report accepted for mode: ${mode}`);
      }
    }
  };

  return (
    <div className="rounded-xl p-3 mb-5 mt-4" style={{
      border: `2px solid ${hasImage ? brand.successBorder : brand.blue}`,
      background: hasImage ? brand.successBg : "transparent",
    }}>
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => !accepted && setExpanded(!expanded)}
          className="font-bold underline" style={{ color: brand.black }}>{t.diversTitle}</button>
        <div className="text-xs font-semibold" style={{ color: hasImage ? brand.successBorder : brand.black }}>
          {file ? '✓ 1' : '✗ 0'}
        </div>
      </div>
      {expanded && (
        <div className="mt-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          <div className="flex flex-col gap-1">
            <button type="button" onClick={pick} className="px-3 py-1 rounded border text-xs font-semibold self-start"
              style={{ borderColor: brand.black, color: brand.black }}>{t.diversUpload}</button>
            {!file && <span className="text-xs" style={{ color: "#ef4444" }}>{t.diversFieldRequired}</span>}
          </div>
          {file && (
            <div className="mt-3 inline-block">
              <div className="relative border rounded p-1 bg-white" style={{ borderColor: brand.black, width: "80px" }}>
                <button type="button" onClick={remove}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full border bg-white z-20"
                  style={{ borderColor: brand.black }}>×</button>
                <button type="button" onClick={() => setZoomUrl(file.url)}
                  className="absolute right-1 top-1 px-1 py-0.5 text-[8px] border rounded bg-white z-10"
                  style={{ borderColor: brand.black }}>🔍</button>
                <img src={file.url} alt="diver" className="w-full h-16 object-cover rounded" />
              </div>
            </div>
          )}
        </div>
      )}
      {zoomUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setZoomUrl(null)}>
          <div className="bg-white rounded-xl p-4 w-[95vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 text-base font-semibold">{t.diversTitle}</div>
            <div className="w-full flex items-center justify-center" style={{ height: "80vh" }}>
              <img src={zoomUrl} alt="zoom" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
            <div className="flex justify-end mt-3">
              <button type="button" onClick={handleZoomOk} 
                className="px-3 py-1 rounded border text-sm" 
                style={{ borderColor: brand.black }}>{t.diversOk}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiversAgreement({ t, onAcceptChange, initialValue }) {
  const [accepted, setAccepted] = useState(initialValue || false);
  
  useEffect(() => {
    if (initialValue) {
      setAccepted(true);
    }
  }, [initialValue]);

  const handleAccept = () => { setAccepted(true); onAcceptChange(true); };
  
  return (
    <div className="mb-5">
      <div className="rounded-xl p-4" style={{
        border: `2px solid ${accepted ? brand.successBorder : brand.blue}`,
        background: accepted ? brand.successBg : "transparent",
      }}>
        <div className="font-semibold" style={{ color: brand.black }}>{t.diversAgreementTitle}</div>
        <div className="mt-3 flex items-start gap-3">
          <input type="checkbox" checked={accepted} readOnly className="mt-1" />
          <p className="text-[15px]" style={{ color: brand.black }}>{t.diversAgreementText}</p>
        </div>
        <div className="flex justify-end mt-3">
          <button type="button" onClick={handleAccept} disabled={accepted} 
            className={`px-3 py-1 rounded text-sm text-white ${accepted ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ background: brand.blue }}>{t.ok}</button>
        </div>
      </div>
      {!accepted && (
        <div className="mt-1 inline-block text-xs px-2 py-1 rounded border"
          style={{ color: "#ef4444", borderColor: "#ef4444" }}>{t.diversFieldRequired}</div>
      )}
    </div>
  );
}

export default function Page2({ onNavigate }: { onNavigate?: (direction: 'next' | 'prev') => void }) {
  const [lang, setLang] = useState(sessionStorage.getItem("yacht_lang") || "en");
  const [showLangPopup, setShowLangPopup] = useState(false);

  const LANG_MAP_P2 = [
    { code: 'el', country: 'GR', label: 'Ελληνικά' },
    { code: 'en', country: 'GB', label: 'English' },
    { code: 'it', country: 'IT', label: 'Italiano' },
    { code: 'de', country: 'DE', label: 'Deutsch' },
    { code: 'ru', country: 'RU', label: 'Русский' },
    { code: 'fr', country: 'FR', label: 'Français' },
    { code: 'ro', country: 'RO', label: 'Română' },
    { code: 'pl', country: 'PL', label: 'Polski' },
    { code: 'he', country: 'IL', label: 'עברית' },
    { code: 'es', country: 'ES', label: 'Español' },
  ];

  const flagImgP2 = (countryCode: string) =>
    `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;

  const handleLangChange = (newLang: string) => {
    setLang(newLang);
    sessionStorage.setItem('yacht_lang', newLang);
    setShowLangPopup(false);
  };


  const t = I18N[lang] || I18N.en;
  const navigate = useNavigate();

  const contextData = useContext(DataContext);
  const [currentMode, setCurrentMode] = useState(contextData?.mode || 'in');
  const contextBookingNumber = contextData?.bookingNumber || '';
  const currentBookingNumber = contextBookingNumber || localStorage.getItem('currentBooking') || '';
  
  // 🔥 Reset data if booking number changed
  useEffect(() => {
    const lastBooking = localStorage.getItem('currentBooking');
    if (contextBookingNumber && lastBooking && contextBookingNumber !== lastBooking) {
      console.log(`🔄 Booking changed: ${lastBooking} → ${contextBookingNumber} - RESETTING all data`);
      
      // Clear all state
      setItems(INITIAL_KEYS.map((k) => ({ id: k, inOk: false, inImg: [], out: "", outImg: [] })));
      setHullItems(HULL_KEYS.map((k) => ({ id: k, inOk: false, inImg: [], out: "", outImg: [] })));
      setDinghyItems(DINGHY_KEYS.map((k) => ({ id: k, inOk: false, inImg: [], out: "", outImg: [] })));
      setMainsailAgreed(false);
      setDiversAgreed(false);
      setRemarks("");
      setSignatureDone(false);
      setSignatureImage("");
      setDiversImageUploaded(false);
      setDiversReportFile(null);
      
      // Update localStorage ONLY when changed
      localStorage.setItem('currentBooking', contextBookingNumber);
    } else if (contextBookingNumber && !lastBooking) {
      // First time - set the booking
      localStorage.setItem('currentBooking', contextBookingNumber);
    }
  }, [contextBookingNumber]);

  // Listen for mode changes from Context
  useEffect(() => {
    if (contextData?.mode && contextData.mode !== currentMode) {
      console.log(`🔄 Page2 detected mode change: ${currentMode} → ${contextData.mode}`);
      setCurrentMode(contextData.mode);
    }
  }, [contextData?.mode]);

  // Listen for mode change events
  useEffect(() => {
    const handleModeChange = (e) => {
      console.log(`📢 Page2 received modeChanged event: ${e.detail.mode}`);
      setCurrentMode(e.detail.mode);
    };
    
    window.addEventListener('modeChanged', handleModeChange);
    return () => window.removeEventListener('modeChanged', handleModeChange);
  }, []);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
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

  const [isEmployee, setIsEmployee] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [employeeCode, setEmployeeCode] = useState("");
  const [showEmployeeCode, setShowEmployeeCode] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);

  const [mainsailAgreed, setMainsailAgreed] = useState(false);
  const [diversImageUploaded, setDiversImageUploaded] = useState(false);
  const [diversAgreed, setDiversAgreed] = useState(false);
  const [signatureDone, setSignatureDone] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [remarks, setRemarks] = useState("");
  const [diversReportFile, setDiversReportFile] = useState(null);

  // 🔥 FIX: Store Page 1 data for header display
  const [page1Data, setPage1Data] = useState<any>(null);

  // 🔥 FIX: Load Page 1 data for header
  useEffect(() => {
    const loadPage1Data = async () => {
      if (currentBookingNumber) {
        try {
          const data = await getPage1DataHybrid(currentBookingNumber);
          if (data) {
            console.log('📍 Page 2: Loaded Page 1 data for header:', data);
            setPage1Data(data);
          }
        } catch (error) {
          console.error('❌ Page 2: Failed to load Page 1 data:', error);
        }
      }
    };
    loadPage1Data();
  }, [currentBookingNumber]);

  const mainsailRef = useRef(null);
  const diversReportRef = useRef(null);
  const diversAgreementRef = useRef(null);
  const signatureRef = useRef(null);

  // 🔥 ΧΡΗΣΙΜΟΠΟΙΟΥΜΕ ΑΠΕΥΘΕΙΑΣ ΤΟ currentMode (ΟΧΙ local state!)
  const mode = currentMode;

  const [items, setItems] = useState(
    INITIAL_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] }))
  );
  const [hullItems, setHullItems] = useState(
    HULL_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] }))
  );
  const [dinghyItems, setDinghyItems] = useState(
    DINGHY_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] }))
  );

  // 🔥 BUG 1 FIX: Reset mode-non-specific flags on mode change to prevent Select All carry-over
  // Also reset items.out to null when switching to check-out (load useEffect will populate from storage if exists)
  useEffect(() => {
    setMainsailAgreed(false);
    setDiversAgreed(false);
    setDiversImageUploaded(false);
    setDiversReportFile(null);
    if (mode === 'out') {
      // Reset out field on switch to check-out (inOk inherits from check-in for reference column)
      setItems(prev => prev.map(it => ({ ...it, out: null })));
      setHullItems(prev => prev.map(it => ({ ...it, out: null })));
      setDinghyItems(prev => prev.map(it => ({ ...it, out: null })));
    }
  }, [mode]);

  useEffect(() => {
    console.log(`🚀🚀🚀 SIGNATURE useEffect TRIGGERED! mode=${mode}, booking=${currentBookingNumber}`);

    if (currentBookingNumber) {
      // 🔥 Load from API first, then localStorage fallback
      const loadData = async () => {
        try {
          // 🔥 FIX: When in check-out mode, first load check-in data to get inOk values
          let checkInItems = null;
          let checkInHullItems = null;
          let checkInDinghyItems = null;

          if (mode === 'out') {
            // Load check-in data first to get inOk status
            const checkInData = await getPage2DataHybrid(currentBookingNumber, 'in');
            if (checkInData) {
              checkInItems = checkInData.items;
              checkInHullItems = checkInData.hullItems;
              checkInDinghyItems = checkInData.dinghyItems;
              console.log('✅ Check-in data loaded for inOk values');
            } else {
              // Fallback to localStorage
              const savedCheckIn = loadBookingData(currentBookingNumber, 'in');
              if (savedCheckIn) {
                checkInItems = savedCheckIn.items;
                checkInHullItems = savedCheckIn.hullItems;
                checkInDinghyItems = savedCheckIn.dinghyItems;
              }
            }
          }

          const apiData = await getPage2DataHybrid(currentBookingNumber, mode);

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

            // If only check-in items exist (starting checkout), use them as base — preserve inOk for reference
            if (checkInItemsData) {
              return checkInItemsData.map(item => ({ ...item, out: null }));
            }

            return currentItems;
          };

          if (apiData) {
            console.log('✅ Page 2 data loaded from API');
            const mergedItems = mode === 'out' ? mergeInOkData(apiData.items, checkInItems, INITIAL_KEYS) : apiData.items;
            const mergedHullItems = mode === 'out' ? mergeInOkData(apiData.hullItems, checkInHullItems, HULL_KEYS) : apiData.hullItems;
            const mergedDinghyItems = mode === 'out' ? mergeInOkData(apiData.dinghyItems, checkInDinghyItems, DINGHY_KEYS) : apiData.dinghyItems;

            if (mergedItems) setItems(mergedItems);
            if (mergedHullItems) setHullItems(mergedHullItems);
            if (mergedDinghyItems) setDinghyItems(mergedDinghyItems);
            if (apiData.mainsailAgreed !== undefined) setMainsailAgreed(apiData.mainsailAgreed);
            if (apiData.diversAgreed !== undefined) setDiversAgreed(apiData.diversAgreed);
            if (apiData.remarks !== undefined) setRemarks(apiData.remarks);
          } else {
            // Fallback to localStorage via shared function
            const savedData = loadBookingData(currentBookingNumber, mode);
            if (savedData) {
              const mergedItems = mode === 'out' ? mergeInOkData(savedData.items, checkInItems, INITIAL_KEYS) : savedData.items;
              const mergedHullItems = mode === 'out' ? mergeInOkData(savedData.hullItems, checkInHullItems, HULL_KEYS) : savedData.hullItems;
              const mergedDinghyItems = mode === 'out' ? mergeInOkData(savedData.dinghyItems, checkInDinghyItems, DINGHY_KEYS) : savedData.dinghyItems;

              if (mergedItems) setItems(mergedItems);
              if (mergedHullItems) setHullItems(mergedHullItems);
              if (mergedDinghyItems) setDinghyItems(mergedDinghyItems);
              if (savedData.mainsailAgreed !== undefined) setMainsailAgreed(savedData.mainsailAgreed);
              if (savedData.diversAgreed !== undefined) setDiversAgreed(savedData.diversAgreed);
              if (savedData.remarks !== undefined) setRemarks(savedData.remarks);
            } else if (mode === 'out' && (checkInItems || checkInHullItems || checkInDinghyItems)) {
              // No check-out data yet, but we have check-in data - use it as starting point
              console.log('🔄 Using check-in data as base for check-out');
              // inOk inherits from check-in (for Check-IN read-only reference column)
              if (checkInItems) setItems(checkInItems.map(item => ({ ...item, out: null })));
              if (checkInHullItems) setHullItems(checkInHullItems.map(item => ({ ...item, out: null })));
              if (checkInDinghyItems) setDinghyItems(checkInDinghyItems.map(item => ({ ...item, out: null })));
            }
          }
        } catch (error) {
          console.warn('⚠️ API load failed, using localStorage:', error);
          const savedData = loadBookingData(currentBookingNumber, mode);
          if (savedData) {
            if (savedData.items) setItems(savedData.items);
            if (savedData.hullItems) setHullItems(savedData.hullItems);
            if (savedData.dinghyItems) setDinghyItems(savedData.dinghyItems);
            if (savedData.mainsailAgreed !== undefined) setMainsailAgreed(savedData.mainsailAgreed);
            if (savedData.diversAgreed !== undefined) setDiversAgreed(savedData.diversAgreed);
            if (savedData.remarks !== undefined) setRemarks(savedData.remarks);
          }
        }
      };
      loadData();

      // 🔥 ΣΗΜΑΝΤΙΚΟ: Φορτώνει υπογραφή με το ΣΩΣΤΟ mode
      const signatureKey = `page2_signature_${currentBookingNumber}_${mode}`;
      const savedSignature = localStorage.getItem(signatureKey);

      console.log(`🔍 Loading signature for mode: ${mode}, key: ${signatureKey}`);

      if (savedSignature) {
        console.log(`✅ Signature found for ${mode}`);
        setSignatureImage(savedSignature);
        setSignatureDone(true);
      } else {
        console.log(`❌ No signature found for ${mode} - clearing`);
        setSignatureImage("");
        setSignatureDone(false);
      }

      const diversKey = `page2_diversReport_${currentBookingNumber}_${mode}`;
      const savedDiversReport = localStorage.getItem(diversKey);
      if (savedDiversReport) {
        try {
          const diversData = JSON.parse(savedDiversReport);
          setDiversReportFile(diversData);
          setDiversImageUploaded(true);
        } catch (e) {
          console.error('Error parsing diver report:', e);
        }
      }
    }
  }, [currentBookingNumber, mode]);

  useEffect(() => {
    if (!currentBookingNumber) return;
    
    const autoSaveTimeout = setTimeout(() => {
      const dataToSave = { 
        items, hullItems, dinghyItems, mainsailAgreed, 
        diversAgreed, remarks
      };
      saveBookingData(currentBookingNumber, dataToSave, mode);
      console.log('💾 Auto-saved!');
    }, 2000);

    return () => clearTimeout(autoSaveTimeout);
  }, [items, hullItems, dinghyItems, mainsailAgreed, diversAgreed, remarks, currentBookingNumber, mode]);

  // 🔥 ΔΙΑΓΡΑΦΗΚΕ: Δεν χρειάζεται πια γιατί το mode ΔΕΝ είναι state!

  const [newItem, setNewItem] = useState("");
  const [camForId, setCamForId] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [zoomUrl, setZoomUrl] = useState(null);
  const [pendingFlashItemId, setPendingFlashItemId] = useState(null);
  const [pendingFlashTable, setPendingFlashTable] = useState(null);

  // Flash effect for incomplete item
  useEffect(() => {
    if (pendingFlashItemId && pendingFlashTable) {
      console.log('🎯 useEffect triggered! Looking for item:', pendingFlashItemId, 'in table:', pendingFlashTable);
      
      setTimeout(() => {
        const row = document.querySelector(`[data-item-id="${pendingFlashItemId}"]`);
        console.log('📍 Found row in useEffect:', row);
        
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.style.backgroundColor = '#fee2e2';
          row.style.transition = 'background-color 0.3s';
          setTimeout(() => {
            row.style.backgroundColor = '';
          }, 4000);
        } else {
          console.error('❌ Row not found! Item ID:', pendingFlashItemId);
        }
        
        setPendingFlashItemId(null);
        setPendingFlashTable(null);
      }, 100);
    }
  }, [pendingFlashItemId, pendingFlashTable]);

  const getLabel = (key) => ITEM_LABELS[key]?.[lang] || key;

  const totalItems = items.length + hullItems.length + dinghyItems.length;
  let completedItems = 0;
  if (mode === "in") {
    completedItems = [...items, ...hullItems, ...dinghyItems].filter((it) => it.inOk).length;
  } else {
    completedItems = [...items, ...hullItems, ...dinghyItems].filter((it) => it.out === "ok" || it.out === "not").length;
  }
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const addNewItem = () => {
    if (!newItem.trim()) {
      alert(t.enterItemName || 'Enter item name!');
      return;
    }
    setItems([...items, { id: uid(), key: newItem, price: "", qty: 1, inOk: false, out: null, media: [] }]);
    setNewItem("");
  };

  const setPrice = (id, val) => {
    const set = (prev) => prev.map((it) => (it.id === id ? { ...it, price: val } : it));
    setItems((prev) => set(prev));
    setHullItems((prev) => set(prev));
    setDinghyItems((prev) => set(prev));
  };

  const incQty = (id) => {
    const inc = (prev) => prev.map((it) => (it.id === id ? { ...it, qty: (it.qty || 1) + 1 } : it));
    setItems((prev) => inc(prev));
    setHullItems((prev) => inc(prev));
    setDinghyItems((prev) => inc(prev));
  };

  const decQty = (id) => {
    const dec = (prev) => prev.map((it) => (it.id === id && (it.qty || 1) > 1 ? { ...it, qty: (it.qty || 1) - 1 } : it));
    setItems((prev) => dec(prev));
    setHullItems((prev) => dec(prev));
    setDinghyItems((prev) => dec(prev));
  };

  const toggleInOk = (id) => {
    const toggle = (prev) => prev.map((it) => (it.id === id ? { ...it, inOk: !it.inOk } : it));
    setItems((prev) => toggle(prev));
    setHullItems((prev) => toggle(prev));
    setDinghyItems((prev) => toggle(prev));
  };

  const setOut = (id, val) => {
    const set = (prev) => prev.map((it) => (it.id === id ? { ...it, out: val } : it));
    setItems((prev) => set(prev));
    setHullItems((prev) => set(prev));
    setDinghyItems((prev) => set(prev));
  };
  const openCamera = (id) => {
    setCamForId(id);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Camera error:', err);
        alert(t.cameraError || 'Could not open camera');
      });
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCamForId(null);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      const compressed = await compressImageWithLogging(base64);
      attachMedia(camForId, { mid: mid(), type: 'img', url: compressed });
      closeCamera();
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Error capturing photo. Please try again.');
    }
  };

  const openFilePicker = (id) => {
    setCamForId(id);
    fileInputRef.current?.click();
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !camForId) return;
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          const compressed = await compressImageWithLogging(base64);
          attachMedia(camForId, { mid: mid(), type: 'img', url: compressed });
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing image. Please try again.');
        }
      } else {
        attachMedia(camForId, { mid: mid(), type: 'file', name: file.name });
      }
    }
    e.target.value = '';
    setCamForId(null);
  };

  const attachMedia = (id, mediaObj) => {
    const add = (prev) => prev.map((it) => (it.id === id ? { ...it, media: [...(it.media || []), mediaObj] } : it));
    setItems((prev) => add(prev));
    setHullItems((prev) => add(prev));
    setDinghyItems((prev) => add(prev));
  };

  const removeRow = (id) => {
    if (!isEmployee || !currentEmployee?.canDelete) {
      alert(t.employeeRequired || '🔒 Employee permissions required!');
      return;
    }
    if (!window.confirm(t.deleteItemConfirm || 'Delete item?')) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
    setHullItems((prev) => prev.filter((it) => it.id !== id));
    setDinghyItems((prev) => prev.filter((it) => it.id !== id));
  };

  const mediaCards = [];
  const collectMedia = (arr) => {
    arr.forEach(({ key, media, id }) => {
      (media || []).forEach((m, i) => {
        mediaCards.push({ m, i, key, id });
      });
    });
  };
  collectMedia(items);
  collectMedia(hullItems);
  collectMedia(dinghyItems);

  const removeMedia = (itemId, ref) => {
    const purge = (prev) =>
      prev.map((it) =>
        it.id === itemId ? {
          ...it,
          media: (it.media || []).filter(
            (x) => !((ref?.mid && x?.mid === ref.mid) || (ref?.url && x?.url === ref.url) || (ref?.name && x?.name === ref.name))
          ),
        } : it
      );
    setItems((prev) => purge(prev));
    setHullItems((prev) => purge(prev));
    setDinghyItems((prev) => purge(prev));
  };

  const handleEmployeeLogin = () => {
    const user = authService.login(employeeCode);
    if (user) {
      setCurrentEmployee(user.permissions);
      setIsEmployee(true);
      setShowLoginModal(false);
      setEmployeeCode("");
      alert(`${t.welcomeUser || 'Welcome'} ${user.name}!`);
    } else {
      alert(t.wrongCode || 'Wrong code!');
    }
  };

  const handleEmployeeLogout = () => {
    setIsEmployee(false);
    setCurrentEmployee(null);
    alert(t.loggedOut || 'Logged out!');
  };

  const highlightError = (ref) => {
    if (ref?.current) {
      ref.current.style.backgroundColor = '#fee2e2';
      ref.current.style.transition = 'background-color 0.3s';
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { ref.current.style.backgroundColor = ''; }, 4000);
    }
  };

  const handleSaveDraft = async () => {
    if (!currentBookingNumber) {
      alert(t.noActiveBooking || '❌ No active booking!');
      return;
    }

    const dataToSave = {
      items, hullItems, dinghyItems, mainsailAgreed,
      diversAgreed, remarks
    };

    // ✅ Save to Page 2 API using hybrid function
    try {
      const result = await savePage2DataHybrid(currentBookingNumber, dataToSave, mode);

      // Also save via shared function for backward compatibility
      saveBookingData(currentBookingNumber, dataToSave, mode);

      // 🔥 Save media to localStorage separately (API may not store large base64 images)
      savePageMedia(currentBookingNumber, mode, 'page2', [...items, ...hullItems, ...dinghyItems]);

      if (result.synced) {
        alert(t.draftSavedSynced || '✅ Draft saved and synced!');
      } else {
        alert(t.draftSavedLocally || '✅ Draft saved locally!');
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
      setItems(INITIAL_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] })));
      setHullItems(HULL_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] })));
      setDinghyItems(DINGHY_KEYS.map((key) => ({ id: uid(), key, price: "", qty: 1, inOk: false, out: null, media: [] })));
      setNewItem("");
      setMainsailAgreed(false);
      setDiversImageUploaded(false);
      setDiversAgreed(false);
      setSignatureDone(false);
      setSignatureImage("");
      setRemarks("");
      setDiversReportFile(null);
      
      if (currentBookingNumber) {
        try {
          // Clear signature localStorage (UI state)
          localStorage.removeItem(`page2_signature_${currentBookingNumber}_in`);
          localStorage.removeItem(`page2_signature_${currentBookingNumber}_out`);
          localStorage.removeItem(`page2_signatureDone_${currentBookingNumber}_in`);
          localStorage.removeItem(`page2_signatureDone_${currentBookingNumber}_out`);
          localStorage.removeItem(`page2_diversReport_${currentBookingNumber}_in`);
          localStorage.removeItem(`page2_diversReport_${currentBookingNumber}_out`);
          localStorage.removeItem(`page2_diversImageUploaded_${currentBookingNumber}_in`);
          localStorage.removeItem(`page2_diversImageUploaded_${currentBookingNumber}_out`);
          // Note: Page data is cleared via state reset above - API data will be re-fetched
        } catch (e) {
          console.error('Error clearing data:', e);
        }
      }
      alert(t.fieldsCleared || '✅ All fields cleared!');
    }
  };

  const handleSelectAllOk = () => {
    const confirmed = window.confirm(t.selectAllOkConfirm || 'Under my own responsibility I declare all items are correct. Continue?');
    if (!confirmed) return;
    if (mode === 'in') {
      setItems(prev => prev.map(it => ({ ...it, inOk: true })));
      setHullItems(prev => prev.map(it => ({ ...it, inOk: true })));
      setDinghyItems(prev => prev.map(it => ({ ...it, inOk: true })));
    } else {
      setItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
      setHullItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
      setDinghyItems(prev => prev.map(it => ({ ...it, out: 'ok' })));
    }
    setMainsailAgreed(true);
    setDiversAgreed(true);
    setDiversImageUploaded(true);
    setDiversReportFile("auto-accepted-via-select-all-ok");
  };

  const handleNext = async () => {
    for (const item of items) {
      const hasCheckmark = mode === "in" ? item.inOk : (item.out === "ok" || item.out === "not");
      if (!hasCheckmark) {
        alert(mode === "in"
          ? (t.completeAllItems || 'Please complete all items!')
          : (t.completeCheckout || 'Please complete check-out!'));
        setPendingFlashItemId(item.id);
        setPendingFlashTable('items');
        return;
      }
    }

    if (!mainsailAgreed) {
      highlightError(mainsailRef);
      return;
    }

    for (const item of hullItems) {
      const hasCheckmark = mode === "in" ? item.inOk : (item.out === "ok" || item.out === "not");
      if (!hasCheckmark) {
        alert(mode === "in"
          ? (t.completeAllItems || 'Please complete all items!')
          : (t.completeCheckout || 'Please complete check-out!'));
        setPendingFlashItemId(item.id);
        setPendingFlashTable('hull');
        return;
      }
    }

    if (!diversImageUploaded || !diversReportFile) {
      highlightError(diversReportRef);
      return;
    }

    if (!diversAgreed) {
      highlightError(diversAgreementRef);
      return;
    }

    for (const item of dinghyItems) {
      const hasCheckmark = mode === "in" ? item.inOk : (item.out === "ok" || item.out === "not");
      if (!hasCheckmark) {
        alert(mode === "in"
          ? (t.completeAllItems || 'Please complete all items!')
          : (t.completeCheckout || 'Please complete check-out!'));
        setPendingFlashItemId(item.id);
        setPendingFlashTable('dinghy');
        return;
      }
    }

    if (!signatureDone) {
      highlightError(signatureRef);
      return;
    }

    const dataToSave = {
      items, hullItems, dinghyItems, mainsailAgreed,
      diversAgreed, remarks
    };

    try {
      await savePage2DataHybrid(currentBookingNumber, dataToSave, mode);
      saveBookingData(currentBookingNumber, dataToSave, mode);
      savePageMedia(currentBookingNumber, mode, 'page2', [...items, ...hullItems, ...dinghyItems]);

      if (onNavigate && typeof onNavigate === 'function') {
        onNavigate('next');
      } else {
        navigate('/page5');
      }
    } catch (error) {
      alert(t.saveError || 'Save error!');
    }
  };

  const handlePrevious = () => {
    handleSaveDraft();
    navigate('/page3');
  };


  const handleGeneratePDF = async () => {
    if (!currentBookingNumber) {
      alert(t.noActiveBooking || '❌ No active booking!');
      return;
    }

    const { generateLuxuryPDF } = await import('./utils/LuxuryPDFGenerator');

    // Get booking info from context (API is source of truth)
    const globalBookings = contextData?.globalBookings || [];
    const bookingFromContext = globalBookings.find((b: any) =>
      b.bookingNumber === currentBookingNumber || b.code === currentBookingNumber
    );
    const bookingInfo = bookingFromContext || contextData?.data || {};

    const bookingData = {
      bookingNumber: currentBookingNumber,
      selectedVessel: bookingInfo?.vesselName,
      skipperFirstName: bookingInfo?.skipperFirstName,
      skipperLastName: bookingInfo?.skipperLastName,
      skipperEmail: bookingInfo?.skipperEmail,
      skipperPhone: bookingInfo?.skipperPhone,
      skipperAddress: bookingInfo?.skipperAddress,
      checkInDate: bookingInfo?.checkInDate,
      checkInTime: bookingInfo?.checkInTime,
      checkOutDate: bookingInfo?.checkOutDate,
      checkOutTime: bookingInfo?.checkOutTime
    };

    const equipmentData = items.map(item => ({
      name: getLabel(item.key),
      quantity: item.qty || 1,
      price: item.price || 0,
      checkInOk: item.inOk,
      checkOutOk: item.out === 'ok',
      checkOutNotOk: item.out === 'not'
    }));

    const hullData = hullItems.map(item => ({
      area: getLabel(item.key),
      quantity: item.qty || 1,
      price: item.price || 0,
      checkInOk: item.inOk,
      checkOutOk: item.out === 'ok',
      checkOutNotOk: item.out === 'not'
    }));

    const dinghyData = dinghyItems.map(item => ({
      name: getLabel(item.key),
      quantity: item.qty || 1,
      price: item.price || 0,
      checkInOk: item.inOk,
      checkOutOk: item.out === 'ok',
      checkOutNotOk: item.out === 'not'
    }));

    // 🔥 CORRECTED: Only Check-out has damages, Check-in has pre-existing photos only
    const damages = [];
    if (mode === 'out') {
      [...items, ...hullItems, ...dinghyItems].forEach(item => {
        if (item.out === 'not') {
          damages.push({
            title: getLabel(item.key),
            quantity: item.qty || 1,
            unitPrice: item.price || 0,
            price: (item.qty || 1) * (item.price || 0)
          });
        }
      });
    }

    const photosByItem = {};
    mediaCards.forEach(card => {
      const itemLabel = getLabel(card.key);
      if (!photosByItem[itemLabel]) photosByItem[itemLabel] = [];
      if (card.m?.url) photosByItem[itemLabel].push(card.m.url);
    });

    const additionalData = {
      equipment: equipmentData,
      hull: hullData,
      dinghy: dinghyData,
      damages,
      remarks,
      photos: photosByItem,
      diversReport: diversReportFile,
      agreements: { mainsail: mainsailAgreed, divers: diversAgreed },
      skipperSignature: signatureImage,
      employeeSignature: mode === 'out' ? signatureImage : null
    };

    const doc = generateLuxuryPDF(bookingData, mode, additionalData, lang, { 
      isPage1: false,
      pageType: 'page2' 
    });
    
    doc.save(`Page2_${mode === 'in' ? 'CheckIn' : 'CheckOut'}_${currentBookingNumber}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Get booking info from context (API is source of truth)
  const renderGlobalBookings = contextData?.globalBookings || [];
  const renderBookingFromContext = renderGlobalBookings.find((b: any) =>
    b.bookingNumber === currentBookingNumber || b.code === currentBookingNumber
  );
  // 🔥 FIX: Merge with Page 1 data (source of truth for vessel/skipper/dates)
  const baseBookingInfo = renderBookingFromContext || contextData?.data || {};
  const bookingInfo = {
    ...baseBookingInfo,
    vesselName: page1Data?.vesselName || baseBookingInfo?.vesselName,
    skipperFirstName: page1Data?.skipperFirstName || baseBookingInfo?.skipperFirstName,
    skipperLastName: page1Data?.skipperLastName || baseBookingInfo?.skipperLastName,
    checkInDate: page1Data?.checkInDate || baseBookingInfo?.checkInDate,
    checkOutDate: page1Data?.checkOutDate || baseBookingInfo?.checkOutDate,
  };

  return (
    <div className="min-h-screen p-4" style={{ background: brand.pageBg }}>
      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
      
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        
        {SHOW_BOOKING_INFO_ON_CHECKLIST_PAGES && (
        <div className="mb-6 p-4 rounded-xl border-2" style={{ backgroundColor: brand.successBg, borderColor: brand.successBorder }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600">Booking Number</div>
              <div className="text-lg font-bold">{currentBookingNumber || 'N/A'}</div>
              <div className="text-xs text-gray-600 mt-2">Check-in Date</div>
              <div className="text-base font-semibold">{formatDate(bookingInfo?.checkInDate)}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">Yacht</div>
              <div className="text-lg font-bold">{bookingInfo?.vesselName || 'N/A'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Skipper</div>
              <div className="text-lg font-bold">{bookingInfo?.skipperFirstName || ''} {bookingInfo?.skipperLastName || ''}</div>
              <div className="text-xs text-gray-600 mt-2">Check-out Date</div>
              <div className="text-base font-semibold">{formatDate(bookingInfo?.checkOutDate)}</div>
            </div>
          </div>
        </div>
        )}

        <div className="text-center mb-4">
          <button className="px-6 py-3 rounded-lg font-bold text-white text-lg" style={{ backgroundColor: brand.blue }}>
            TAILWIND YACHTING
          </button>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold text-center" style={{ color: brand.navy }}>{t.title}</h1>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-center">{t.equipmentTitle || "EQUIPMENT INVENTORY"}</h2>
        </div>
        <div className="mb-4 text-center">
          <button
            onClick={handleSelectAllOk}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md"
          >
            ✓ {t.selectAllOk || 'SELECT ALL OK'}
          </button>
        </div>


        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 rounded text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
            <button onClick={() => setShowLangPopup(!showLangPopup)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={flagImgP2(LANG_MAP_P2.find(l => l.code === lang)?.country || "GB")} alt="" style={{width: "24px", height: "18px"}} /> {lang.toUpperCase()}
              </button>
              {showLangPopup && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setShowLangPopup(false)}>
                  <div style={{
                    background: 'white', borderRadius: '16px', padding: '24px',
                    maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                  }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', color: '#1e293b' }}>
                      Select Language
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {LANG_MAP_P2.map(({ code, country, label }) => (
                        <button key={code} onClick={() => handleLangChange(code)}
                          style={{
                            padding: '12px 8px', borderRadius: '10px', border: 'none',
                            background: lang === code ? 'linear-gradient(135deg, #0c4a6e, #0ea5e9)' : '#f1f5f9',
                            color: lang === code ? 'white' : '#334155',
                            fontSize: '15px', fontWeight: lang === code ? 700 : 500,
                            cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '8px'
                          }}>
                          <img src={flagImgP2(country)} alt="" style={{width: "24px", height: "18px", borderRadius: "2px"}} /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            {isEmployee ? (
              <button onClick={handleEmployeeLogout} className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: "#FF6B35", color: "white" }}>
                🔓 {currentEmployee?.name} - Logout
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: "#FF6B35", color: "white" }}>
                🔒 Employee Login
              </button>
            )}
          </div>
          <div className="text-sm font-semibold" style={{ color: brand.black }}>
            Progress: {percentage}%
          </div>
        </div>

        <div className="mb-4">
          <div className="text-base font-semibold" style={{ color: brand.black }}>
            {t.mode}: <span style={{ color: mode === "in" ? brand.blue : brand.pink, fontSize: '17px' }}>
              {mode === "in" ? t.checkIn : t.checkOut}
            </span>
          </div>
        </div>

        <TableSection 
          data={items} 
          t={t} 
          setPrice={setPrice} 
          incQty={incQty} 
          decQty={decQty} 
          toggleInOk={toggleInOk} 
          setOut={setOut}
          openCamera={openCamera} 
          handleFiles={handleFiles} 
          openFilePicker={openFilePicker} 
          removeRow={removeRow}
          mode={mode} 
          getLabel={getLabel} 
          isEmployee={isEmployee} 
          currentEmployee={currentEmployee}
          newItem={newItem}
          setNewItem={setNewItem}
          addItem={addNewItem}
          sectionTitle={t.equipmentTitle || "EQUIPMENT INVENTORY"} 
        />

        <div ref={mainsailRef}>
          <MainsailAgreement t={t} onAcceptChange={setMainsailAgreed} initialValue={mainsailAgreed} />
        </div>

        <TableSection 
          data={hullItems} 
          t={t} 
          setPrice={setPrice} 
          incQty={incQty} 
          decQty={decQty} 
          toggleInOk={toggleInOk} 
          setOut={setOut}
          openCamera={openCamera} 
          handleFiles={handleFiles} 
          openFilePicker={openFilePicker} 
          removeRow={removeRow}
          mode={mode} 
          getLabel={getLabel} 
          isEmployee={isEmployee} 
          currentEmployee={currentEmployee}
          newItem=""
          setNewItem={() => {}}
          addItem={() => {}}
          sectionTitle={t.hullTitle || "HULL"}
        />

        <div ref={diversReportRef}>
          <DiversReport t={t} onImageChange={(uploaded, fileData) => { 
            setDiversImageUploaded(uploaded); 
            setDiversReportFile(fileData); 
          }} initialFile={diversReportFile} currentBookingNumber={currentBookingNumber} mode={mode} />
        </div>

        <div ref={diversAgreementRef}>
          <DiversAgreement t={t} onAcceptChange={setDiversAgreed} initialValue={diversAgreed} />
        </div>

        <TableSection 
          data={dinghyItems} 
          t={t} 
          setPrice={setPrice} 
          incQty={incQty} 
          decQty={decQty} 
          toggleInOk={toggleInOk} 
          setOut={setOut}
          openCamera={openCamera} 
          handleFiles={handleFiles} 
          openFilePicker={openFilePicker} 
          removeRow={removeRow}
          mode={mode} 
          getLabel={getLabel} 
          isEmployee={isEmployee} 
          currentEmployee={currentEmployee}
          newItem=""
          setNewItem={() => {}}
          addItem={() => {}}
          sectionTitle={t.dinghyTitle || "DINGHY AND OUTBOARD ENGINE"}
        />

        <div className="mt-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
          <label className="block font-semibold" style={{ color: brand.black }}>{t.note}</label>
          <textarea 
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="mt-2 w-full border rounded p-3 min-h-[180px] bg-white" 
            placeholder={t.notePH}
            style={{ borderColor: brand.black, color: brand.black }} 
          />
        </div>

        <div className="mt-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
          <label className="block font-semibold" style={{ color: brand.black }}>{t.picsTitle}</label>
          {mediaCards.length ? (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {mediaCards.map(({ m, i, key, id }) => (
                <div key={`${id}-${i}`} className="relative border rounded p-1 text-xs" style={{ borderColor: brand.black }}>
                  {m.type === "img" ? (
                    <>
                      <img src={m.url} alt={`pic-${i}`} className="w-full h-24 object-cover rounded" />
                      <button type="button" onClick={() => setZoomUrl(m.url)}
                        className="absolute right-1 top-1 px-2 py-0.5 text-[10px] border rounded bg-white"
                        style={{ borderColor: brand.black }}>🔍</button>
                    </>
                  ) : <span>{m.name || "file"}</span>}
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMedia(id, m); }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full border text-[10px] z-10"
                    style={{ background: "#fff", borderColor: brand.black, color: brand.black }} title={t.remove}>×</button>
                  <div className="mt-1 truncate" title={ITEM_LABELS[key]?.[lang] || key}>
                    {ITEM_LABELS[key]?.[lang] || key}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm" style={{ color: brand.black }}>
              {lang === "el" ? "Δεν έχουν προστεθεί αρχεία ακόμη." : "No files added yet."}
            </div>
          )}
        </div>

        {zoomUrl && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setZoomUrl(null)}>
            <div className="bg-white rounded-xl p-4 w-[95vw] max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 text-base font-semibold">{t.picsTitle}</div>
              <div className="w-full flex items-center justify-center" style={{ height: "80vh" }}>
                <img src={zoomUrl} alt="zoom" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div className="flex justify-end mt-3">
                <button type="button" onClick={() => setZoomUrl(null)} className="px-3 py-1 rounded border text-sm"
                  style={{ borderColor: brand.black }}>{t.ok || "OK"}</button>
              </div>
            </div>
          </div>
        )}

        <div ref={signatureRef} className="mt-8">
          <SignatureBox key={mode + '-' + currentBookingNumber} brand={brand} lang={lang} onSignChange={setSignatureDone} onImageChange={setSignatureImage} initialImage={null} currentBookingNumber={currentBookingNumber} mode={mode} />
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button type="button" onClick={handlePrevious}
            className="px-5 py-2.5 rounded transition-colors font-semibold"
            style={{ background: "#6B7280", color: "#fff" }}>
            ← {t.prev}
          </button>
          
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleSaveDraft}
              className="px-5 py-2.5 rounded transition-colors font-semibold"
              style={{ background: "#4B5563", color: "#fff" }}>
              {t.save}
            </button>
            <button type="button" onClick={handleClearForm}
              className="px-5 py-2.5 rounded border-2 transition-colors font-semibold bg-white"
              style={{ borderColor: brand.blue, color: brand.blue }}>
              {t.clear}
            </button>
            <button type="button" onClick={handleGeneratePDF}
              className="px-5 py-2.5 rounded font-semibold transition-colors shadow-md"
              style={{ background: "#DC2626", color: "#fff" }}>
              📄 {t.pdf}
            </button>
            <button type="button" onClick={handleNext}
              className="px-5 py-2.5 rounded font-semibold transition-colors shadow-md"
              style={{ background: brand.blue, color: "#fff" }}>
              {t.next} →
            </button>
          </div>
        </div>
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

      {camForId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-4 w-[90vw] max-w-md" style={{ color: brand.black }}>
            <div className="font-semibold mb-2">{t.camera}</div>
            <video ref={videoRef} autoPlay playsInline className="w-full rounded" />
            <div className="flex gap-2 mt-3 justify-end">
              <button className="px-3 py-2 rounded border" style={{ borderColor: brand.black }} onClick={capturePhoto}>
                📸 Capture
              </button>
              <button className="px-3 py-2 rounded border" style={{ borderColor: brand.black }} onClick={closeCamera}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}