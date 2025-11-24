// =================================================================
// PAGE 5 - FINAL CORRECT VERSION - PART 1 OF 4
// =================================================================
// IMPORTS, CONSTANTS, AND HELPER FUNCTIONS
// =================================================================
// ✅ ALL FIXES INCLUDED:
// 1. Single Skipper Signature (removed duplicate)
// 2. Employee Login Box with locks
// 3. Payment Authorization WITHOUT signature box
// 4. Employee signature ULTRA FIX with 3 attempts
// =================================================================

import React, { useState, useRef, useEffect } from "react";
import { generateLuxuryPDF } from './utils/LuxuryPDFGenerator';
import { sendCheckInEmail, sendCheckOutEmail } from './services/emailService';
import authService from './authService';
import FloatingChatWidget from './FloatingChatWidget';

import {
  brand,
  I18N,
  uid,
  compressSignature,
  compressImageWithLogging,
  saveBookingData,
  loadBookingData,
  BookingInfoBox,
  PageHeader,
  TopControls,
  ModeDisplay,
  ActionButtons
} from './shared-components';

// =================================================================
// CONSTANTS
// =================================================================

// EMPLOYEE_CODES removed - now using authService

// EmailJS Config moved to emailService.ts

const ITEM_LABELS = {
  engine: { en: "engine", el: "κινητήρας" },
  anchor_windlass: { en: "anchor windlass", el: "εργάτης άγκυρας" },
  mainsail: { en: "mainsail", el: "κύριο πανί" },
  genoa: { en: "genoa", el: "τζένοα" },
  autopilot: { en: "autopilot", el: "αυτόματος πιλότος" },
  gps_plotter: { en: "gps/gps plotter", el: "GPS / plotter" },
  electricity: { en: "electricity", el: "ηλεκτρικά" },
  fridge: { en: "fridge", el: "ψυγείο" },
  gas_oven: { en: "gas oven", el: "φούρνος γκαζιού" },
  electric_toilet_pump: { en: "electric toilet pump", el: "αντλία τουαλέτας" },
  fresh_water_pump: { en: "fresh water pump", el: "αντλία γλυκού νερού" },
  bilge_pump: { en: "bilge pump", el: "αντλία σεντινών" },
  radio_mp3: { en: "radio/mp3 player", el: "ραδιόφωνο / mp3" },
  cleanliness: { en: "cleanliness", el: "καθαριότητα" },
  fuel_water: { en: "fuel-water", el: "καύσιμα / νερό" },
  fuel_filling: { en: "fuel-filling", el: "ανεφοδιασμός καυσίμων" },
  bimini_sprayhood: { en: "bimini sprayhood", el: "bimini / sprayhood" },
  bow_thruster: { en: "bow thruster", el: "προωστήρας πλώρης" },
  generator: { en: "generator", el: "γεννήτρια" },
  electric_winch: { en: "electric winch", el: "ηλεκτρικό βίντζι" },
  winch: { en: "winch", el: "βίντζι" },
  hydraulic_gangway: { en: "hydraulic gangway", el: "υδραυλική πασαρέλα" },
  ac: { en: "a/c", el: "κλιματισμός" },
  water_maker: { en: "water maker", el: "αφαλάτωση" },
  fore: { en: "fore", el: "πλώρη" },
  aft: { en: "aft", el: "πρύμνη" },
  port: { en: "port", el: "αριστερά" },
  starboard: { en: "starboard", el: "δεξιά" },
  dinghy: { en: "dinghy", el: "λέμβος" },
  outboard: { en: "outboard", el: "εξωλέμβιος" },
  fuel_jerrycan: { en: "fuel jerrycan", el: "κανίστρα καυσίμου" },
  oars: { en: "oars", el: "κουπιά" },
  sea_tap: { en: "sea tap", el: "βάνα θάλασσας" },
  lifejackets: { en: "lifejackets", el: "σωσίβια" },
  flares: { en: "flares", el: "βοήθεια κινδύνου (flares)" },
  first_aid: { en: "first aid kit", el: "φαρμακείο" },
  fire_extinguisher: { en: "fire extinguisher", el: "πυροσβεστήρας" },
  liferaft: { en: "liferaft", el: "σωστική σχεδία" },
  fog_horn: { en: "fog horn", el: "κόρνα ομίχλης" },
  toolkit: { en: "toolkit", el: "εργαλεία" },
  bed_linen: { en: "Bed linen for all cabins", el: "Κλινοσκεπάσματα για όλες τις καμπίνες" },
  pillows_cases: { en: "Pillows and Pillow cases", el: "Μαξιλάρια και μαξιλαροθήκες" },
  blankets: { en: "Blankets", el: "Κουβέρτες" },
  bath_towels: { en: "Bath towels per person", el: "Πετσέτες μπάνιου ανά άτομο" },
  tea_towels: { en: "Tea towels", el: "Πετσέτες κουζίνας" },
  wc_mats: { en: "WC mats", el: "Χαλάκια WC" },
  hatch_large: { en: "Hatch Large", el: "Hatch μεγάλα" },
  hatch_toilet: { en: "Hatch Toilet", el: "Hatch τουαλέτας" },
  hatch_cabin: { en: "Hatch Cabin", el: "Hatch καμπίνας" },
  toilet_clogging: { en: "Toilet Clogging", el: "Βούλωμα τουαλέτας" },
  spinnaker: { en: "Spinnaker", el: "Μπαλόνι (Spinnaker)" },
  snorkeling_gear: { en: "Snorkeling gear", el: "Εξοπλισμός snorkeling" },
  fishing_equipment: { en: "Fishing equipment", el: "Εξοπλισμός ψαρέματος" },
  bbq_grill: { en: "BBQ Grill", el: "Ψησταριά BBQ" },
  stand_up_paddle: { en: "Stand-up paddle", el: "SUP board" },
  kayak: { en: "Kayak", el: "Καγιάκ" },
  control_gangway: { en: "Control Gangway", el: "Χειριστήριο πασαρέλας" },
  control_tv: { en: "Control TV", el: "Χειριστήριο τηλεόρασης" },
  wifi_router: { en: "Wi-Fi Router", el: "Wi-Fi Router" },
  card_sd_gps: { en: "Card SD GPS Maker", el: "Κάρτα SD GPS Maker" },
  feet_for_saloon: { en: "Feet for Saloon", el: "Πόδια για σαλόνι" },
  mattress: { en: "Mattress", el: "Στρώμα" },
  espresso_machine: { en: "Espresso Machine", el: "Μηχανή Espresso" },
  ice_maker: { en: "Ice Maker", el: "Παγομηχανή" },
  sea_scooter: { en: "Sea Scooter", el: "Θαλάσσιο σκούτερ" },
  electric_fridge: { en: "Electric fridge", el: "Ηλεκτρικό ψυγείο" },
  gas_stove_4_heads: { en: "Gas stove - 4 heads", el: "Εστία αερίου - 4 μάτια" },
  dinner_plates: { en: "Dinner plates", el: "Πιάτα φαγητού" },
  soup_plates: { en: "Soup plates", el: "Πιάτα σούπας" },
  glasses_water: { en: "Glasses of water", el: "Ποτήρια νερού" },
  glasses_wine: { en: "Glasses of wine", el: "Ποτήρια κρασιού" },
  knives: { en: "Knives", el: "Μαχαίρια" },
  forks: { en: "Forks", el: "Πιρούνια" },
  spoons: { en: "Spoons", el: "Κουτάλια" },
  vhf_dsc: { en: "VHF/DSC", el: "VHF/DSC" },
  binoculars: { en: "Binoculars", el: "Κιάλια" },
  charts: { en: "Charts", el: "Ναυτικοί χάρτες" },
  life_raft: { en: "Life raft", el: "Σωσίβια λέμβος" },
  life_jackets: { en: "Life jackets", el: "Σωσίβια" },
  first_aid_kit: { en: "First aid kit", el: "Φαρμακείο" },
  spare_anchor: { en: "Spare anchor", el: "Εφεδρική άγκυρα" },
  deck_brush: { en: "Deck brush", el: "Βούρτσα καταστρώματος" },
  gangway: { en: "Gangway", el: "Πασαρέλα" },
  lines_20m: { en: "Lines 20m", el: "Σχοινιά 20m" },
  lines_50m: { en: "Lines 50m", el: "Σχοινιά 50m" },
  inflatable_dinghy: { en: "Inflatable dinghy", el: "Φουσκωτή βάρκα" },
  air_pump: { en: "Air pump", el: "Αντλία αέρα" },
  bow_fenders: { en: "Bow fenders", el: "Μπαλόνια πλώρης" },
  stern_fenders: { en: "Stern fenders", el: "Μπαλόνια πρύμνης" },
  telescopic_boathook: { en: "Telescopic boat-hook", el: "Τηλεσκοπικός γάντζος" }
};

const Page5_I18N = {
  en: {
    ...I18N.en,
    pageTitle: "CHECK-IN/OUT COMPLETION",
    checkInMode: "✅ Check-in Mode",
    checkOutMode: "🚪 Check-out Mode",
    termsTitle: "Terms & Conditions",
    termsText: "I have read and agree to the check-in ",
    termsLink: "terms and conditions",
    privacyTitle: "Privacy Policy Consent",
    privacyText: "I agree with the ",
    privacyLink: "privacy policy & consent",
    privacyText2: " to give my personal details for use by Tailwind Yachting.",
    returnTitle: "Return Condition Acknowledgement",
    returnText: "I confirm the yacht will be returned with all listed equipment. Any damages or missing items may be charged according to the price list.",
    warningTitle: "⚠️ IMPORTANT NOTICE - MANDATORY READING",
    warningCollapsed: "⚠️ IMPORTANT - CLICK TO READ (MANDATORY)",
    warningTextPart1: "If check-in is completed by the company's specialized staff, signed by the customer and the check-in manager, and no damage or clogging is detected on the yacht ",
    warningTextHighlight: "(if there is any damage, the base manager is obliged to report it so that the customer knows, writes it in the comments and takes a photo)",
    warningTextPart2: " or toilet clogging, the company and the base have no responsibility after check-in.",
    warningTextPart3: "Upon return, the customer must pay for any damage without any excuse. The customer is responsible for any damage that occurs after check-in. They must take care of the yacht and return it in the condition they received it.",
    warningTextPart4: "Thank you in advance.",
    warningAccept: "✓ I have read and understand",
    paymentAuthTitle: "Payment Authorization",
    paymentAuthText: "The customer authorizes us to charge the pre-authorized amount on their card for any damages incurred.",
    paymentAuthAccept: "✓ I authorize payment",
    completeInventory: "COMPLETE INVENTORY",
    damageInventory: "DAMAGE REPORT",
    damageRate: "Rate (if damaged)",
    unitPrice: "Unit Price",
    totalPrice: "Total",
    totalWithVAT: "TOTAL WITH VAT",
    notesTitle: "Additional Remarks",
    notesPlaceholder: "Write any remarks below and inform our base staff...",
    skipperSignatureTitle: "Skipper's Signature",
    employeeSignatureTitle: "Employee's Signature",
    employeeCodeRequired: "⚠️ Employee Code Required",
    employeeCodeNeeded: "⚠️ Employee code required!",
    signatureRequired: "Signature required",
    save: "Save draft",
    clear: "Clear",
    pdf: "PDF",
    back: "Back",
    submit: "Submit",
    ok: "OK - I CONFIRM",
    fieldRequired: "Field required",
    emailSent: "Confirmation emails sent successfully!",
    emailError: "Error sending email. Please try again.",
    checkInComplete: "Check-in completed successfully!",
    pdfGenerated: "PDF generated successfully!",
    dataSaved: "Data saved automatically!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  el: {
    ...I18N.el,
    pageTitle: "ΟΛΟΚΛΗΡΩΣΗ CHECK-IN/OUT",
    checkInMode: "✅ Λειτουργία Check-in",
    checkOutMode: "🚪 Λειτουργία Check-out",
    termsTitle: "Όροι & Προϋποθέσεις",
    termsText: "Έχω διαβάσει και συμφωνώ με τους ",
    termsLink: "όρους και προϋποθέσεις",
    privacyTitle: "Συγκατάθεση Πολιτικής Απορρήτου",
    privacyText: "Συμφωνώ με την ",
    privacyLink: "πολιτική απορρήτου & συναίνεση",
    privacyText2: " και συναινώ στη χρήση των προσωπικών μου στοιχείων από την Tailwind Yachting.",
    returnTitle: "Αναγνώριση Κατάστασης Επιστροφής",
    returnText: "Επιβεβαιώνω ότι το σκάφος θα επιστραφεί με όλον τον καταγεγραμμένο εξοπλισμό. Τυχόν ζημιές ή ελλείψεις μπορεί να χρεωθούν σύμφωνα με τον τιμοκατάλογο.",
    warningTitle: "⚠️ ΣΗΜΑΝΤΙΚΗ ΕΙΔΟΠΟΙΗΣΗ - ΥΠΟΧΡΕΩΤΙΚΗ ΑΝΑΓΝΩΣΗ",
    warningCollapsed: "⚠️ ΣΗΜΑΝΤΙΚΟ - ΚΛΙΚ ΓΙΑ ΑΝΑΓΝΩΣΗ (ΥΠΟΧΡΕΩΤΙΚΟ)",
    warningTextPart1: "Εάν γίνει check-in από το εξειδικευμένο προσωπικό της εταιρίας, υπογράψει ο πελάτης και ο υπεύθυνος του check-in, και δεν διαπιστωθεί καμία ζημιά στο σκάφος ",
    warningTextHighlight: "(εάν υπάρχει κάποια ζημιά υποχρεούται να το πει ο υπεύθυνος της βάσης ώστε ο πελάτης να το γνωρίζει, να το γράψει στα σχόλια και να βγάλει φωτογραφία)",
    warningTextPart2: " ή βούλωμα στην τουαλέτα, η εταιρία και η βάση δεν έχουν καμία ευθύνη μετά το check-in.",
    warningTextPart3: "Ο πελάτης στην επιστροφή θα πρέπει να πληρώσει την ζημιά χωρίς καμία δικαιολογία. Ο πελάτης είναι υπεύθυνος για οποιαδήποτε ζημιά γίνει μετά το check-in. Θα πρέπει να φροντίζει το σκάφος και να το παραδώσει στην κατάσταση που το πήρε.",
    warningTextPart4: "Ευχαριστούμε εκ των προτέρων.",
    warningAccept: "✓ Έχω διαβάσει και κατανοώ",
    paymentAuthTitle: "Εξουσιοδότηση Πληρωμής",
    paymentAuthText: "Ο πελάτης με την συναίνεσή του μας επιτρέπει να πάρουμε χρήματα από την προεγγραφή που έχει γίνει στην κάρτα του για ζημιές που έχει κάνει.",
    paymentAuthAccept: "✓ Εξουσιοδοτώ την πληρωμή",
    completeInventory: "ΠΛΗΡΗΣ ΑΠΟΓΡΑΦΗ",
    damageInventory: "ΑΝΑΦΟΡΑ ΖΗΜΙΩΝ",
    damageRate: "Τιμή (αν καταστραφεί)",
    unitPrice: "Τιμή Μονάδας",
    totalPrice: "Σύνολο",
    totalWithVAT: "ΣΥΝΟΛΟ ΜΕ ΦΠΑ",
    notesTitle: "Επιπλέον Παρατηρήσεις",
    notesPlaceholder: "Γράψτε παρατηρήσεις και ενημερώστε το προσωπικό της βάσης...",
    skipperSignatureTitle: "Υπογραφή Κυβερνήτη",
    employeeSignatureTitle: "Υπογραφή Υπαλλήλου",
    employeeCodeRequired: "⚠️ Απαιτείται Κωδικός Υπαλλήλου",
    employeeCodeNeeded: "⚠️ Χρειάζεται κωδικός υπαλλήλου!",
    signatureRequired: "Υποχρεωτική υπογραφή",
    save: "Αποθήκευση",
    clear: "Καθαρισμός",
    pdf: "PDF",
    back: "Πίσω",
    submit: "Υποβολή",
    ok: "OK - ΕΠΙΒΕΒΑΙΩΝΩ",
    fieldRequired: "Υποχρεωτικό πεδίο",
    emailSent: "Τα emails επιβεβαίωσης στάλθηκαν επιτυχώς!",
    emailError: "Σφάλμα αποστολής email. Παρακαλώ δοκιμάστε ξανά.",
    checkInComplete: "Το Check-in ολοκληρώθηκε επιτυχώς!",
    pdfGenerated: "Το PDF δημιουργήθηκε επιτυχώς!",
    dataSaved: "Τα δεδομένα αποθηκεύτηκαν αυτόματα!",
    footerAddress: "Λευκωσίας 37, Άλιμος",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Τηλ: +30 6978196009"
  }
};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function getItemLabel(key, lang = 'en') {
  return ITEM_LABELS[key]?.[lang] || key;
}

function getAllItems(lang = 'en') {
  const allItems = [];
  try {
    const currentBooking = localStorage.getItem('currentBooking');
    if (!currentBooking) return allItems;
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    
    const pageSections = [
      { page: 'page2DataCheckIn', sections: ['items', 'hullItems', 'dinghyItems'], pageLabel: 'Page 2' },
      { page: 'page3DataCheckIn', sections: ['safetyItems', 'cabinItems', 'optionalItems'], pageLabel: 'Page 3' },
      { page: 'page4DataCheckIn', sections: ['items', 'navItems', 'safetyItems', 'genItems', 'deckItems', 'fdeckItems', 'dinghyItems', 'fendersItems', 'boathookItems'], pageLabel: 'Page 4' }
    ];
    
    pageSections.forEach(({ page, sections, pageLabel }) => {
      const checkInData = bookings[currentBooking]?.[page] || {};
      const checkOutPage = page.replace('CheckIn', 'CheckOut');
      const checkOutData = bookings[currentBooking]?.[checkOutPage] || {};
      
      sections.forEach(sectionKey => {
        const itemsIn = checkInData[sectionKey] || [];
        const itemsOut = checkOutData[sectionKey] || [];
        
        const itemMap = new Map();
        
        itemsIn.forEach(item => {
          const itemId = item.id || `${sectionKey}-${item.key}`;
          itemMap.set(itemId, {
            key: item.key,
            name: getItemLabel(item.key, lang),
            inOk: item.inOk,
            qty: item.qty || 1,
            price: item.price || 0,
            section: sectionKey,
            page: pageLabel,
            media: item.media || []
          });
        });
        
        itemsOut.forEach(item => {
          const itemId = item.id || `${sectionKey}-${item.key}`;
          if (itemMap.has(itemId)) {
            itemMap.get(itemId).out = item.out;
            if (item.media && item.media.length > 0) {
              itemMap.get(itemId).media = [...(itemMap.get(itemId).media || []), ...item.media];
            }
          } else {
            itemMap.set(itemId, {
              key: item.key,
              name: getItemLabel(item.key, lang),
              inOk: false,
              out: item.out,
              qty: item.qty || 1,
              price: item.price || 0,
              section: sectionKey,
              page: pageLabel,
              media: item.media || []
            });
          }
        });
        
        itemMap.forEach(item => allItems.push(item));
      });
    });
  } catch (e) {
    console.error('Error loading all items:', e);
  }
  return allItems;
}

function getDamagePhotos(mode) {
  if (mode !== 'out') return {};
  
  try {
    const currentBooking = localStorage.getItem('currentBooking');
    if (!currentBooking) return {};
    
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[currentBooking]) return {};
    
    const allPhotos = {};
    const checkOutPages = ['page2DataCheckOut', 'page3DataCheckOut', 'page4DataCheckOut'];
    const sections = ['items', 'hullItems', 'dinghyItems', 'safetyItems', 'cabinItems', 'optionalItems', 
                      'navItems', 'genItems', 'deckItems', 'fdeckItems', 'fendersItems', 'boathookItems'];
    
    checkOutPages.forEach(page => {
      const pageData = bookings[currentBooking]?.[page] || {};
      sections.forEach(section => {
        const items = pageData[section];
        if (Array.isArray(items)) {
          items.forEach(item => {
            if (item.out === 'not' && item?.media?.length) {
              const label = getItemLabel(item.key, 'en');
              if (!allPhotos[label]) allPhotos[label] = [];
              item.media.forEach(m => {
                if (m?.url) {
                  allPhotos[label].push(m.url);
                }
              });
            }
          });
        }
      });
    });
    
    return allPhotos;
  } catch (e) {
    console.error('Error loading damage photos:', e);
    return {};
  }
}

function getAllPhotos() {
  try {
    const currentBooking = localStorage.getItem('currentBooking');
    if (!currentBooking) return {};
    
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
    if (!bookings[currentBooking]) return {};
    
    const allPhotos = {};
    const PAGES = ['page2DataCheckIn', 'page2DataCheckOut', 'page3DataCheckIn', 'page3DataCheckOut', 'page4DataCheckIn', 'page4DataCheckOut'];
    const SECTIONS = ['items', 'hullItems', 'dinghyItems', 'safetyItems', 'cabinItems', 'optionalItems', 'navItems', 'genItems', 'deckItems', 'fdeckItems', 'fendersItems', 'boathookItems'];
    const seenUrls = new Set();
    
    PAGES.forEach(page => {
      const pageData = bookings[currentBooking]?.[page] || {};
      SECTIONS.forEach(section => {
        const items = pageData[section];
        if (Array.isArray(items)) {
          items.forEach(item => {
            if (item?.media?.length) {
              const label = getItemLabel(item.key, 'en');
              if (!allPhotos[label]) allPhotos[label] = [];
              item.media.forEach(m => {
                if (m?.url && !seenUrls.has(m.url)) {
                  allPhotos[label].push(m.url);
                  seenUrls.add(m.url);
                }
              });
            }
          });
        }
      });
    });
    
    return allPhotos;
  } catch (e) {
    console.error('Error loading photos:', e);
    return {};
  }
}

async function sendEmailWithPDF(bookingData, pdfBlob, mode, lang) {
  const t = Page5_I18N[lang] || Page5_I18N.en;
  try {
    const customerEmail = bookingData.skipperEmail || '';

    // Use the centralized email service
    if (mode === 'in') {
      return await sendCheckInEmail(customerEmail, bookingData, pdfBlob);
    } else {
      return await sendCheckOutEmail(customerEmail, bookingData, pdfBlob);
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error };
  }
}

// =================================================================
// END OF PART 1
// Continue with PART 2 (UI Components)
// =================================================================
// =================================================================
// PAGE 5 - FINAL CORRECT VERSION - PART 2 OF 4
// =================================================================
// UI COMPONENTS - ALL CORRECT
// =================================================================
// PASTE THIS AFTER PART 1
// =================================================================

// =================================================================
// SIGNATURE BOX COMPONENT
// =================================================================
const SignatureBox = ({ 
  brand, 
  lang, 
  title, 
  onSignChange, 
  onImageChange, 
  initialImage, 
  currentBookingNumber, 
  mode, 
  pageNumber,
  disabled = false,
  highlightError = false
}) => {
  const canvasRef = useRef(null);
  const [signed, setSigned] = useState(!!initialImage);

  useEffect(() => {
    setSigned(!!initialImage);
  }, [initialImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (initialImage) {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setSigned(true);
        if (onSignChange) onSignChange(true);
      };
      img.src = initialImage;
    }

    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    const getCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return {
        x: (touch.clientX - rect.left) * (canvas.width / rect.width),
        y: (touch.clientY - rect.top) * (canvas.height / rect.height)
      };
    };

    const startDrawing = (e) => {
      if (disabled) return;
      drawing = true;
      const coords = getCoordinates(e);
      lastX = coords.x;
      lastY = coords.y;
    };

    const draw = (e) => {
      if (!drawing || disabled) return;
      e.preventDefault();
      
      const coords = getCoordinates(e);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      
      lastX = coords.x;
      lastY = coords.y;
      
      if (!signed) {
        setSigned(true);
        if (onSignChange) onSignChange(true);
      }
    };

    const stopDrawing = () => {
      if (!drawing) return;
      drawing = false;
      
      if (onImageChange) {
        const imageData = canvas.toDataURL('image/png');
        onImageChange(imageData);
      }
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [disabled, onSignChange, onImageChange, initialImage, signed]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    if (onSignChange) onSignChange(false);
    if (onImageChange) onImageChange(null);
  };

  const t = lang === 'el' ? {
    clear: 'Καθαρισμός',
    signatureRequired: 'Απαιτείται υπογραφή'
  } : {
    clear: 'Clear',
    signatureRequired: 'Signature required'
  };

  return (
    <div 
      className="border-2 rounded-xl p-4 mt-4 transition-all duration-500" 
      style={{ 
        borderColor: highlightError ? brand.errorBorder : (signed ? brand.successBorder : brand.blue), 
        background: highlightError ? brand.errorBg : (signed ? brand.successBg : "#ffffff"),
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      <label className="block font-semibold mb-2" style={{ color: brand.black }}>
        {title} *
      </label>
      <div style={{
        border: "2px solid",
        borderColor: signed ? brand.successBorder : brand.black,
        background: signed ? brand.successBg : "#ffffff",
        borderRadius: 12,
        padding: 8
      }}>
        <canvas 
          ref={canvasRef} 
          width={860} 
          height={200} 
          className="w-full h-[200px] cursor-crosshair"
          style={{ background: signed ? brand.successBg : '#ffffff', touchAction: 'none', transition: 'background 0.3s ease' }}
        />
      </div>
      <div className="flex justify-between items-center mt-2">
        {!signed && (
          <div className="text-sm" style={{ color: brand.errorBorder }}>
            {t.signatureRequired}
          </div>
        )}
        <button 
          type="button" 
          onClick={clearSignature} 
          className="px-3 py-1 rounded border ml-auto" 
          style={{ borderColor: brand.black }}
          disabled={disabled}
        >
          {t.clear}
        </button>
      </div>
    </div>
  );
};

// =================================================================
// WARNING MODAL
// =================================================================
function WarningNoticeModal({ isOpen, onClose, onAccept, t, accepted }) {
  const [localAccepted, setLocalAccepted] = useState(accepted);
  
  if (!isOpen) return null;
  
  const handleAccept = () => {
    if (localAccepted) {
      onAccept();
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-10 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <div className="flex items-center gap-5 mb-8 pb-6 border-b-4" style={{ borderColor: '#d97706' }}>
          <span className="text-5xl">⚠️</span>
          <h3 className="text-2xl font-bold" style={{ color: '#d97706' }}>{t.warningTitle}</h3>
        </div>
        <div className="mb-10 leading-relaxed space-y-6" style={{ color: brand.black }}>
          <p className="text-lg">
            {t.warningTextPart1}
            <span className="font-bold text-xl block my-4 p-4 rounded" style={{ color: 'red', background: '#fee2e2' }}>
              {t.warningTextHighlight}
            </span>
            {t.warningTextPart2}
          </p>
          <p className="text-lg font-semibold bg-yellow-50 p-4 rounded">{t.warningTextPart3}</p>
          <p className="text-base font-bold text-center mt-6">{t.warningTextPart4}</p>
        </div>
        <div className="border-t-4 pt-8" style={{ borderColor: '#d97706' }}>
          <label className="flex items-center gap-5 cursor-pointer mb-6 p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <input 
              type="checkbox" 
              checked={localAccepted} 
              onChange={(e) => setLocalAccepted(e.target.checked)}
              className="w-6 h-6 cursor-pointer" 
            />
            <span className="font-bold text-lg" style={{ color: brand.black }}>{t.warningAccept}</span>
          </label>
          <button 
            onClick={handleAccept}
            disabled={!localAccepted}
            className="w-full px-10 py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105" 
            style={{ background: localAccepted ? brand.blue : '#9ca3af' }}
          >
            {t.ok}
          </button>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// AGREEMENT BOX
// =================================================================
function AgreementBox({ title, text, link, text2, accepted, setAccepted, t, required = false, id, highlightError }) {
  return (
    <div id={id} className="mb-4">
      <div 
        className="rounded-xl p-4 transition-all duration-500" 
        style={{ 
          border: `2px solid ${highlightError ? brand.errorBorder : (accepted ? brand.successBorder : brand.blue)}`, 
          background: highlightError ? brand.errorBg : (accepted ? brand.successBg : "transparent") 
        }}
      >
        <div className="font-semibold" style={{ color: brand.black }}>
          {title} {required && "*"}
        </div>
        <div className="mt-3 flex items-start gap-3">
          <input 
            type="checkbox" 
            checked={accepted} 
            onChange={() => {
              if (!accepted) {
                setAccepted(true);
              }
            }}
            className="mt-1 cursor-pointer" 
          />
          <p className="text-[15px]" style={{ color: brand.black }}>
            {text}
            {link && (
              <button 
                type="button" 
                className="underline font-bold" 
                style={{ color: "red" }} 
                onClick={() => alert("Opening " + link + "...")}
              >
                {link}
              </button>
            )}
            {text2 && text2}
          </p>
        </div>
        <div className="flex justify-end mt-3">
          <button 
            type="button" 
            onClick={() => setAccepted(true)} 
            disabled={accepted} 
            className="px-3 py-1 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ background: brand.blue }}
          >
            {t.ok}
          </button>
        </div>
      </div>
      {required && !accepted && (
        <div className="mt-1 inline-block text-xs px-2 py-1 rounded border" style={{ color: "#ef4444", borderColor: "#ef4444" }}>
          {t.fieldRequired}
        </div>
      )}
    </div>
  );
}

// =================================================================
// DAMAGE INVENTORY (CHECK-OUT) - WITH PAGE COLUMN
// =================================================================
function DamageInventory({ items, t, lang }) {
  if (items.length === 0) return null;
  
  let totalAmount = 0;
  items.forEach(item => {
    const qty = item.qty || 1;
    const unitPrice = parseFloat(item.price) || 0;
    totalAmount += qty * unitPrice;
  });
  
  return (
    <div className="mb-6">
      <div className="rounded-xl border-2 p-4" style={{ borderColor: brand.blue, background: "#fff5f5" }}>
        <h3 className="font-bold text-xl mb-4 text-center" style={{ color: '#dc2626' }}>
          {t.damageInventory}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: brand.black }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: '#dc2626', backgroundColor: '#fee2e2' }}>
                <th className="text-left p-2 font-bold">Page</th>
                <th className="text-left p-2 font-bold">Item</th>
                <th className="text-center p-2 font-bold">Qty</th>
                <th className="text-right p-2 font-bold">{t.unitPrice}</th>
                <th className="text-right p-2 font-bold">{t.totalPrice}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = item.qty || 1;
                const unitPrice = parseFloat(item.price) || 0;
                const total = qty * unitPrice;
                
                return (
                  <tr key={idx} className="border-t" style={{ borderColor: '#fee2e2' }}>
                    <td className="p-2 text-xs text-gray-600">{item.page}</td>
                    <td className="p-2 font-semibold" style={{ color: brand.black }}>{item.name}</td>
                    <td className="p-2 text-center font-bold">{qty}</td>
                    <td className="p-2 text-right" style={{ color: brand.grey }}>€{unitPrice.toFixed(2)}</td>
                    <td className="p-2 text-right font-bold" style={{ color: '#dc2626' }}>€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#dc2626' }}>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold" style={{ color: brand.black }}>{t.totalWithVAT}:</span>
            <span className="text-2xl font-bold" style={{ color: '#dc2626' }}>€{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// COMPLETE INVENTORY (CHECK-IN)
// =================================================================
function CompleteInventory({ allItems, t, mode }) {
  if (allItems.length === 0) return null;
  let currentPage = '';
  let currentSection = '';
  
  return (
    <div className="mb-6">
      <div className="rounded-xl border-2 p-4" style={{ borderColor: brand.blue, background: "#f0f9ff" }}>
        <h3 className="font-bold text-xl mb-4 text-center" style={{ color: brand.navy }}>
          {t.completeInventory}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: brand.black }}>
            <thead>
              <tr className="border-b-2" style={{ borderColor: brand.navy, backgroundColor: '#e0f2fe' }}>
                <th className="text-left p-2 font-bold">Page</th>
                <th className="text-left p-2 font-bold">Item</th>
                <th className="text-center p-2 font-bold">Qty</th>
                <th className="text-center p-2 font-bold">{mode === 'in' ? 'Check-in' : 'Check-out'}</th>
                <th className="text-right p-2 font-bold">{t.damageRate}</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, idx) => {
                const showSectionHeader = item.page !== currentPage || item.section !== currentSection;
                if (showSectionHeader) {
                  currentPage = item.page;
                  currentSection = item.section;
                }
                const status = mode === 'in' 
                  ? (item.inOk ? '✓' : '✗')
                  : (item.out === 'ok' ? '✓' : item.out === 'not' ? '✗' : item.out === 'missing' ? '✗' : '-');
                const statusColor = status.includes('✓') ? brand.successText : '#ef4444';
                
                return (
                  <React.Fragment key={idx}>
                    {showSectionHeader && (
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <td colSpan="5" className="p-2 font-bold text-xs" style={{ color: brand.navy }}>
                          {item.page} - {item.section}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t" style={{ borderColor: '#e2e8f0' }}>
                      <td className="p-2 text-xs text-gray-600">{item.page}</td>
                      <td className="p-2 font-semibold" style={{ color: brand.black }}>{item.name}</td>
                      <td className="p-2 text-center font-bold">{item.qty}</td>
                      <td className="p-2 text-center font-bold" style={{ color: statusColor }}>{status}</td>
                      <td className="p-2 text-right font-semibold" style={{ color: brand.grey }}>
                        €{(parseFloat(item.price) || 0).toFixed(2)}
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =================================================================
// 🔒 EMPLOYEE SIGNATURE WITH LOGIN - LOCKED VERSION
// =================================================================
function EmployeeSignatureWithLogin({ 
  brand, 
  t, 
  signed, 
  setSigned, 
  canvasRef, 
  highlightError, 
  title,
  isEmployee,
  currentEmployee,
  onImageChange,
  onLoginClick
}) {
  
  useEffect(() => {
    if (!isEmployee || !canvasRef.current) return;
    
    const currentBooking = localStorage.getItem('currentBooking');
    const mode = localStorage.getItem('currentMode') || 'in';
    
    if (!currentBooking) return;
    
    const signatureKey = `page5_employee_signature_${currentBooking}_${mode}`;
    const saved = localStorage.getItem(signatureKey);
    
    if (saved) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setSigned(true);
      };
      img.src = saved;
    }
  }, [isEmployee, canvasRef, setSigned]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isEmployee) return;
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let x = 0, y = 0;
    
    const rect = () => canvas.getBoundingClientRect();
    const getPoint = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      return { 
        x: touch.clientX - rect().left, 
        y: touch.clientY - rect().top 
      };
    };
    
    const startDrawing = (e) => {
      if (!isEmployee) return;
      drawing = true;
      const point = getPoint(e);
      x = point.x;
      y = point.y;
      setSigned(true);
    };
    
    const draw = (e) => {
      if (!drawing || !isEmployee) return;
      const point = getPoint(e);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      x = point.x;
      y = point.y;
    };
    
    const stopDrawing = () => {
      drawing = false;
      if (canvas && isEmployee) {
        const imageData = canvas.toDataURL('image/png');
        
        const currentBooking = localStorage.getItem('currentBooking');
        const mode = localStorage.getItem('currentMode') || 'in';
        if (currentBooking) {
          const signatureKey = `page5_employee_signature_${currentBooking}_${mode}`;
          localStorage.setItem(signatureKey, imageData);
          console.log('✅ Employee signature saved to localStorage');
        }
        
        if (onImageChange) {
          onImageChange(imageData);
        }
      }
    };
    
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("touchstart", startDrawing, { passive: true });
    canvas.addEventListener("touchmove", draw, { passive: true });
    canvas.addEventListener("touchend", stopDrawing);
    
    return () => {
      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      window.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("touchstart", startDrawing);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDrawing);
    };
  }, [setSigned, canvasRef, isEmployee, onImageChange]);
  
  const clearSignature = () => {
    if (!isEmployee) {
      alert(t.employeeCodeNeeded);
      if (onLoginClick) onLoginClick();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    
    const currentBooking = localStorage.getItem('currentBooking');
    const mode = localStorage.getItem('currentMode') || 'in';
    if (currentBooking) {
      const signatureKey = `page5_employee_signature_${currentBooking}_${mode}`;
      localStorage.removeItem(signatureKey);
    }
  };
  
  return (
    <div 
      className="border-2 rounded-xl p-4 mt-4 transition-all duration-500 relative" 
      style={{ 
        borderColor: highlightError ? brand.errorBorder : (signed ? brand.successBorder : brand.blue), 
        background: highlightError ? brand.errorBg : (signed ? brand.successBg : "#ffffff") 
      }}
    >
      {!isEmployee && (
        <div
          onClick={onLoginClick}
          className="absolute inset-0 bg-red-50 bg-opacity-90 rounded-xl flex items-center justify-center cursor-pointer z-10 hover:bg-opacity-95 transition-all"
        >
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border-3" style={{ borderColor: '#ef4444' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔒</div>
            <div className="font-bold text-xl mb-2" style={{ color: '#ef4444' }}>
              {t.employeeCodeRequired}
            </div>
            <div className="text-sm" style={{ color: '#991b1b' }}>
              {t.lang === 'el' ? 'Κλικ για σύνδεση' : 'Click to login'}
            </div>
          </div>
        </div>
      )}
      
      <label className="block font-semibold mb-2" style={{ color: brand.black }}>
        {title} * {isEmployee && currentEmployee && <span className="text-sm font-normal">({currentEmployee.name})</span>}
      </label>
      
      <div style={{
        border: "2px solid",
        borderColor: signed ? brand.successBorder : brand.black,
        background: signed ? brand.successBg : "#ffffff",
        borderRadius: 12,
        padding: 8,
        opacity: isEmployee ? 1 : 0.5,
        pointerEvents: isEmployee ? 'auto' : 'none'
      }}>
        <canvas 
          ref={canvasRef} 
          width={860} 
          height={200} 
          className="w-full h-[200px] cursor-crosshair"
          style={{ background: signed ? brand.successBg : '#ffffff', touchAction: 'none', transition: 'background 0.3s ease' }}
        />
      </div>
      
      <div className="flex justify-between items-center mt-2">
        {!signed && (
          <div className="text-sm" style={{ color: brand.errorBorder }}>
            {t.signatureRequired}
          </div>
        )}
        <button 
          type="button" 
          onClick={clearSignature} 
          className="px-3 py-1 rounded border ml-auto" 
          style={{ 
            borderColor: brand.black,
            opacity: isEmployee ? 1 : 0.5,
            cursor: isEmployee ? 'pointer' : 'not-allowed'
          }}
        >
          {t.clear}
        </button>
      </div>
    </div>
  );
}

// =================================================================
// END OF PART 2
// Continue with PART 3 (Main Component State & Logic)
// =================================================================
// =================================================================
// PAGE 5 - FINAL CORRECT VERSION - PART 3 OF 4
// =================================================================
// MAIN COMPONENT - STATE & LOGIC WITH ULTRA EMPLOYEE SIGNATURE FIX
// =================================================================
// 🔥🔥🔥 THIS IS THE CRITICAL PART! 🔥🔥🔥
// =================================================================
// PASTE THIS AFTER PART 2
// =================================================================

export default function Page5({ onNavigate }) {
  const [mode, setMode] = useState('in');
  const isCheckIn = mode === 'in';
  const isCheckOut = mode === 'out';
  const [currentBookingNumber, setCurrentBookingNumber] = useState('');
  
  // Refs
  const returnRef = useRef(null);
  const termsRef = useRef(null);
  const privacyRef = useRef(null);
  const warningRef = useRef(null);
  const paymentAuthRef = useRef(null);
  const skipperSignatureRef = useRef(null);
  const employeeSignatureRef = useRef(null);
  const skipperCanvasRef = useRef(null);
  const employeeCanvasRef = useRef(null);
  const employeeLoginRef = useRef(null);
  
  const [lang, setLang] = useState(() => {
    try {
      const currentBooking = localStorage.getItem('currentBooking');
      if (!currentBooking) return "en";
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      return bookings[currentBooking]?.bookingData?.language || "en";
    } catch {
      return "en";
    }
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // 🔒 EMPLOYEE STATE
  const [isEmployee, setIsEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  
  const t = Page5_I18N[lang] || Page5_I18N.en;
  const [allItems, setAllItems] = useState([]);
  const [damageItems, setDamageItems] = useState([]);
  const [allPhotos, setAllPhotos] = useState({});
  const [bookingData, setBookingData] = useState({});
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [returnAccepted, setReturnAccepted] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState(false);
  const [paymentAuthAccepted, setPaymentAuthAccepted] = useState(false);
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [skipperSigned, setSkipperSigned] = useState(false);
  const [employeeSigned, setEmployeeSigned] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [employeeSignatureImage, setEmployeeSignatureImage] = useState("");
  const [paymentAuthSignatureImage, setPaymentAuthSignatureImage] = useState("");
  
  const [highlightReturn, setHighlightReturn] = useState(false);
  const [highlightTerms, setHighlightTerms] = useState(false);
  const [highlightPrivacy, setHighlightPrivacy] = useState(false);
  const [highlightWarning, setHighlightWarning] = useState(false);
  const [highlightPaymentAuth, setHighlightPaymentAuth] = useState(false);
  const [highlightSkipperSignature, setHighlightSkipperSignature] = useState(false);
  const [highlightEmployeeSignature, setHighlightEmployeeSignature] = useState(false);
  
  const areButtonsLocked = !isEmployee;
  
  const percentage = (() => {
    let completed = 0;
    let total = isCheckOut ? 7 : 6;
    
    if (returnAccepted) completed++;
    if (termsAccepted) completed++;
    if (privacyAccepted) completed++;
    if (warningAccepted) completed++;
    if (skipperSigned) completed++;
    
    if (isCheckIn) {
      total = 6;
      if (employeeSigned && isEmployee) completed++;
    }
    
    if (isCheckOut) {
      total = 7;
      if (paymentAuthAccepted) completed++;
    }
    
    return Math.round((completed / total) * 100);
  })();
  
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
  
  const handleEmployeeLogin = () => {
    setShowLoginModal(true);
  };
  
  const handleEmployeeLogout = () => {
    setIsEmployee(false);
    setCurrentEmployee(null);
    sessionStorage.removeItem('currentEmployee');
  };
  
  useEffect(() => {
    try {
      const currentBooking = localStorage.getItem('currentBooking');
      if (!currentBooking) return;
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      const savedMode = bookings[currentBooking]?.bookingData?.mode || 'in';
      setMode(savedMode);
      localStorage.setItem('currentMode', savedMode);
      
      const employeeSession = sessionStorage.getItem('currentEmployee');
      if (employeeSession) {
        const employee = JSON.parse(employeeSession);
        setIsEmployee(true);
        setCurrentEmployee(employee);
      }
    } catch (e) {
      console.error('Error loading mode:', e);
    }
  }, []);
  
  useEffect(() => {
    const loadData = () => {
      const items = getAllItems(lang);
      setAllItems(items);
      
      if (mode === 'out') {
        const damaged = items.filter(item => item.out === 'not');
        setDamageItems(damaged);
        const damagePhotos = getDamagePhotos(mode);
        setAllPhotos(damagePhotos);
      } else {
        const photos = getAllPhotos();
        setAllPhotos(photos);
      }
      
      try {
        const currentBooking = localStorage.getItem('currentBooking');
        if (!currentBooking) return;
        setCurrentBookingNumber(currentBooking);
        const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
        const data = bookings[currentBooking]?.bookingData || {};
        setBookingData(data);
        
        const storageKey = mode === 'in' ? `page5DataCheckIn_${currentBooking}` : `page5DataCheckOut_${currentBooking}`;
        const savedPage5Data = localStorage.getItem(storageKey);
        
        if (savedPage5Data) {
          try {
            const parsed = JSON.parse(savedPage5Data);
            setTermsAccepted(parsed.termsAccepted || false);
            setPrivacyAccepted(parsed.privacyAccepted || false);
            setReturnAccepted(parsed.returnAccepted || false);
            setWarningAccepted(parsed.warningAccepted || false);
            setPaymentAuthAccepted(parsed.paymentAuthAccepted || false);
            setNotes(parsed.notes || '');
            setSkipperSigned(!!parsed.skipperSignatureData);
            setEmployeeSigned(!!parsed.employeeSignatureData);
            setSignatureImage(parsed.skipperSignatureData || '');
            setEmployeeSignatureImage(parsed.employeeSignatureData || '');
            setPaymentAuthSignatureImage(parsed.paymentAuthSignatureData || '');
          } catch (e) {
            console.error('Error loading saved Page 5 data:', e);
          }
        } else {
          setTermsAccepted(false);
          setPrivacyAccepted(false);
          setReturnAccepted(false);
          setWarningAccepted(false);
          setPaymentAuthAccepted(false);
          setNotes('');
          setSkipperSigned(false);
          setEmployeeSigned(false);
          setSignatureImage('');
          setEmployeeSignatureImage('');
          setPaymentAuthSignatureImage('');
        }
      } catch (e) {
        console.error("Error loading booking data:", e);
      }
    };
    loadData();
    window.addEventListener('focus', loadData);
    window.addEventListener('pageshow', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
      window.removeEventListener('pageshow', loadData);
    };
  }, [lang, mode]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const page5Data = {
        termsAccepted,
        privacyAccepted,
        returnAccepted,
        warningAccepted,
        paymentAuthAccepted,
        notes,
        skipperSignature: skipperSigned,
        employeeSignature: employeeSigned,
        skipperSignatureData: signatureImage,
        employeeSignatureData: employeeSignatureImage,
        paymentAuthSignatureData: paymentAuthSignatureImage,
        employeeName: currentEmployee?.name || '',
        timestamp: new Date().toISOString()
      };
      const storageKey = mode === 'in' ? `page5DataCheckIn_${currentBookingNumber}` : `page5DataCheckOut_${currentBookingNumber}`;
      if (currentBookingNumber) {
        localStorage.setItem(storageKey, JSON.stringify(page5Data));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [termsAccepted, privacyAccepted, returnAccepted, warningAccepted, paymentAuthAccepted, notes, skipperSigned, employeeSigned, signatureImage, employeeSignatureImage, paymentAuthSignatureImage, currentEmployee, mode, currentBookingNumber]);
  
  const handleSaveDraft = () => {
    alert(t.dataSaved);
  };
  
  const validateForm = () => {
    setHighlightReturn(false);
    setHighlightTerms(false);
    setHighlightPrivacy(false);
    setHighlightWarning(false);
    setHighlightPaymentAuth(false);
    setHighlightSkipperSignature(false);
    setHighlightEmployeeSignature(false);
    
    if (!returnAccepted) {
      setHighlightReturn(true);
      returnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightReturn(false), 3000);
      return false;
    }
    
    if (!termsAccepted) {
      setHighlightTerms(true);
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightTerms(false), 3000);
      return false;
    }
    
    if (!privacyAccepted) {
      setHighlightPrivacy(true);
      privacyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightPrivacy(false), 3000);
      return false;
    }
    
    if (!warningAccepted) {
      setHighlightWarning(true);
      warningRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightWarning(false), 3000);
      return false;
    }
    
    if (!skipperSigned) {
      setHighlightSkipperSignature(true);
      skipperSignatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightSkipperSignature(false), 3000);
      return false;
    }
    
    if (isCheckIn && (!employeeSigned || !isEmployee)) {
      setHighlightEmployeeSignature(true);
      employeeSignatureRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightEmployeeSignature(false), 3000);
      return false;
    }
    
    if (isCheckOut && !paymentAuthAccepted) {
      setHighlightPaymentAuth(true);
      paymentAuthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setHighlightPaymentAuth(false), 3000);
      return false;
    }
    
    return true;
  };
  
  // =================================================================
  // 🔥🔥🔥 ULTRA FIXED handleGeneratePDF - 3 ATTEMPTS! 🔥🔥🔥
  // =================================================================
  const handleGeneratePDF = async () => {
    if (!isEmployee) {
      alert(t.employeeCodeNeeded);
      handleEmployeeLogin();
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      console.log('🔍 ===== PDF GENERATION START =====');
      console.log('🔍 Mode:', mode);
      console.log('🔍 IsCheckIn:', isCheckIn);
      console.log('🔍 currentBookingNumber:', currentBookingNumber);
      
      const skipperSignatureData = signatureImage || null;
      console.log('🔍 Skipper signature:', skipperSignatureData ? 'HAS DATA' : 'NO DATA');
      
      // 🔥 GET EMPLOYEE SIGNATURE - MULTIPLE ATTEMPTS! (FOR BOTH CHECK-IN AND CHECK-OUT!)
      let employeeSignatureData = null;
      
      // 🔥 ALWAYS GET EMPLOYEE SIGNATURE (not just check-in!)
      console.log('🔥 Getting employee signature for mode:', mode);
        
        // ATTEMPT 1: From canvas REF
        if (employeeCanvasRef && employeeCanvasRef.current) {
          try {
            const canvas = employeeCanvasRef.current;
            console.log('🔍 Canvas found:', canvas.width, 'x', canvas.height);
            
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            let hasDrawing = false;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i + 3] > 0) {
                hasDrawing = true;
                break;
              }
            }
            
            if (hasDrawing) {
              const canvasDataURL = canvas.toDataURL('image/png');
              console.log('🔍 Canvas has drawing - length:', canvasDataURL.length);
              employeeSignatureData = await compressSignature(canvasDataURL);
              console.log('✅ ATTEMPT 1 SUCCESS - Got signature from canvas!');
            } else {
              console.log('⚠️ ATTEMPT 1 FAILED - Canvas is empty');
            }
          } catch (e) {
            console.error('❌ ATTEMPT 1 ERROR:', e);
          }
        } else {
          console.log('⚠️ ATTEMPT 1 SKIPPED - No canvas ref');
        }
        
        // ATTEMPT 2: From localStorage
        if (!employeeSignatureData && currentBookingNumber) {
          const signatureKey = `page5_employee_signature_${currentBookingNumber}_${mode}`;
          console.log('🔍 ATTEMPT 2 - Looking in localStorage for key:', signatureKey);
          const saved = localStorage.getItem(signatureKey);
          if (saved && saved.length > 100) {
            employeeSignatureData = saved;
            console.log('✅ ATTEMPT 2 SUCCESS - Got signature from localStorage! Length:', saved.length);
          } else {
            console.log('⚠️ ATTEMPT 2 FAILED - No signature in localStorage');
          }
        }
        
        // ATTEMPT 3: From state variable
        if (!employeeSignatureData && employeeSignatureImage) {
          console.log('🔍 ATTEMPT 3 - Using state variable');
          if (employeeSignatureImage.length > 100) {
            employeeSignatureData = employeeSignatureImage;
            console.log('✅ ATTEMPT 3 SUCCESS - Got signature from state! Length:', employeeSignatureImage.length);
          } else {
            console.log('⚠️ ATTEMPT 3 FAILED - State variable too short');
          }
        }
        
        if (employeeSignatureData) {
          console.log('🔥🔥🔥 FINAL: Employee signature captured! Length:', employeeSignatureData.length);
        } else {
          console.log('❌❌❌ FINAL: NO EMPLOYEE SIGNATURE!');
        }
      
      const page5OnlyData = {
        agreements: {
          terms: termsAccepted,
          privacy: privacyAccepted,
          return: returnAccepted,
          warning: warningAccepted,
          paymentAuth: isCheckOut ? paymentAuthAccepted : false
        },
        warningAccepted: warningAccepted,
        paymentAuthAccepted: isCheckOut ? paymentAuthAccepted : false,
        notes: notes,
        skipperSignature: skipperSignatureData,
        employeeSignature: employeeSignatureData,
        allItems: isCheckIn ? allItems : damageItems,
        photos: allPhotos,
        timestamp: new Date().toISOString()
      };
      
      console.log('📦 Data to PDF Generator:');
      console.log('   - skipperSignature:', page5OnlyData.skipperSignature ? 'YES' : 'NO');
      console.log('   - employeeSignature:', page5OnlyData.employeeSignature ? 'YES' : 'NO');
      
      const pdfDoc = generateLuxuryPDF(bookingData, mode, page5OnlyData, lang, { isPage5: true });
      
      if (pdfDoc) {
        const fileName = `${mode === 'in' ? 'check-in' : 'check-out'}-page5-${bookingData.bookingNumber || 'draft'}-${Date.now()}.pdf`;
        pdfDoc.save(fileName);
        alert(t.pdfGenerated);
      }
    } catch (error) {
      console.error('❌ PDF generation error:', error);
      alert('Error generating PDF: ' + error.message);
    }
  };
  
  const handleSubmit = async () => {
    if (!isEmployee) {
      alert(t.employeeCodeNeeded);
      handleEmployeeLogin();
      return;
    }
    
    if (!validateForm()) return;
    
    try {
      let skipperSignatureData = null;
      if (skipperSigned && skipperCanvasRef.current) {
        try {
          skipperSignatureData = await compressSignature(skipperCanvasRef.current.toDataURL('image/png'));
        } catch (e) {
          console.error("❌ Error compressing skipper signature:", e);
        }
      }
      
      // 🔥 SAME LOGIC AS PDF GENERATION - FOR ALL MODES!
      let employeeSignatureData = null;
      
      // Get employee signature for both check-in and check-out
      if (employeeCanvasRef && employeeCanvasRef.current) {
          try {
            const canvas = employeeCanvasRef.current;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imageData.data;
            
            let hasDrawing = false;
            for (let i = 0; i < pixels.length; i += 4) {
              if (pixels[i + 3] > 0) {
                hasDrawing = true;
                break;
              }
            }
            
            if (hasDrawing) {
              const canvasDataURL = canvas.toDataURL('image/png');
              employeeSignatureData = await compressSignature(canvasDataURL);
            }
          } catch (e) {
            console.error('❌ Canvas error:', e);
          }
        }
        
        if (!employeeSignatureData && currentBookingNumber) {
          const signatureKey = `page5_employee_signature_${currentBookingNumber}_${mode}`;
          const saved = localStorage.getItem(signatureKey);
          if (saved && saved.length > 100) {
            employeeSignatureData = saved;
          }
        }
        
        if (!employeeSignatureData && employeeSignatureImage && employeeSignatureImage.length > 100) {
          employeeSignatureData = employeeSignatureImage;
        }
      
      const page5AdditionalData = {
        agreements: {
          terms: termsAccepted,
          privacy: privacyAccepted,
          return: returnAccepted,
          warning: warningAccepted,
          paymentAuth: isCheckOut ? paymentAuthAccepted : false
        },
        warningAccepted: warningAccepted,
        paymentAuthAccepted: isCheckOut ? paymentAuthAccepted : false,
        notes: notes,
        skipperSignature: skipperSignatureData,
        employeeSignature: employeeSignatureData,
        allItems: isCheckIn ? allItems : damageItems,
        photos: allPhotos,
        timestamp: new Date().toISOString()
      };
      
      const pdfDoc = generateLuxuryPDF(bookingData, mode, page5AdditionalData, lang, { isPage5: true });
      if (!pdfDoc) {
        alert('Error generating PDF!');
        return;
      }
      
      const pdfBlob = pdfDoc.output('blob');
      const emailResult = await sendEmailWithPDF(bookingData, pdfBlob, mode, lang);
      
      if (emailResult.success) {
        alert(t.emailSent + '\n' + t.checkInComplete);
      } else {
        alert(t.emailError);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      alert('Error submitting form!');
    }
  };
  
  const handlePrevious = () => {
    if (onNavigate && typeof onNavigate === 'function') {
      onNavigate('prev');
    }
  };

// =================================================================
// END OF PART 3 - Continue with PART 4 (JSX RENDER)
// =================================================================
// =================================================================
// =================================================================
// PAGE 5 - FINAL CORRECT VERSION - PART 4 OF 4 (FINAL!)
// =================================================================
// JSX RENDER - COMPLETE & CORRECT
// =================================================================
// ✅ Single Skipper Signature
// ✅ Payment Auth WITHOUT signature box
// ✅ All syntax correct
// PASTE THIS AFTER PART 3 - CONTINUING THE Page5 FUNCTION
// =================================================================

  // JSX RENDER STARTS HERE
  return (
    <div className="min-h-screen p-6" style={{ background: brand.pageBg }}>
      <div className="max-w-6xl mx-auto bg-white shadow rounded-2xl p-6" style={{ border: `1px solid ${brand.black}` }}>
        <BookingInfoBox 
          bookingInfo={{
            bookingNumber: bookingData.bookingNumber || localStorage.getItem('currentBooking') || "N/A",
            vesselName: bookingData.vesselName || bookingData.selectedVessel || "N/A",
            skipperFirstName: bookingData.skipperFirstName || bookingData.bookerName || "N/A",
            skipperLastName: bookingData.skipperLastName || "",
            checkInDate: bookingData.checkInDate || "N/A",
            checkOutDate: bookingData.checkOutDate || "N/A"
          }}
          currentBookingNumber={bookingData.bookingNumber || localStorage.getItem('currentBooking') || "N/A"}
        />
        
        <div className="flex justify-center mb-6">
          <div className="h-16 px-6 rounded flex items-center justify-center font-bold text-xl" style={{ backgroundColor: brand.blue, color: 'white' }}>
            TAILWIND YACHTING
          </div>
        </div>
        
        <PageHeader title={t.pageTitle} />
        
        <div className="mb-4">
          <div className="text-base font-semibold" style={{ color: brand.black }}>
            Mode: <span style={{ color: mode === "in" ? brand.blue : brand.pink, fontSize: '17px' }}>
              {mode === "in" ? "Check-in" : "Check-out"}
            </span>
          </div>
        </div>
        
        <TopControls
          isOnline={isOnline}
          lang={lang}
          setLang={setLang}
          isEmployee={isEmployee}
          currentEmployee={currentEmployee}
          onEmployeeLogout={handleEmployeeLogout}
          onEmployeeLogin={handleEmployeeLogin}
          percentage={percentage}
        />

        {/* 🔒 EMPLOYEE LOGIN BOX */}
        <div 
          ref={employeeLoginRef}
          className="mb-6 p-6 rounded-xl border-3"
          style={{
            backgroundColor: isEmployee ? brand.successBg : '#fff3cd',
            borderColor: isEmployee ? brand.successBorder : '#ffc107'
          }}
        >
          {!isEmployee ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ fontSize: '32px' }}>🔒</span>
                <h3 className="text-2xl font-bold" style={{ color: '#856404' }}>
                  {t.employeeCodeRequired}
                </h3>
              </div>
              
              <p className="mb-4 text-base" style={{ color: '#856404' }}>
                {lang === 'el' 
                  ? 'Απαιτείται κωδικός υπαλλήλου για να ξεκλειδώσετε την υπογραφή, το PDF και το Submit.'
                  : 'Employee code required to unlock signature, PDF, and Submit.'}
              </p>

              <button
                onClick={handleEmployeeLogin}
                className="w-full px-6 py-4 rounded-xl font-bold text-white text-lg hover:scale-105 transition-all"
                style={{ backgroundColor: brand.blue }}
              >
                🔐 {lang === 'el' ? 'Σύνδεση Υπαλλήλου' : 'Employee Login'}
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span style={{ fontSize: '48px' }}>✅</span>
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: brand.successText }}>
                    {currentEmployee.name}
                  </h3>
                  <p className="text-base" style={{ color: brand.successText }}>
                    {lang === 'el' ? 'Συνδεδεμένος' : 'Logged in'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleEmployeeLogout}
                className="px-6 py-3 rounded-xl font-bold border-2 hover:bg-white transition-all"
                style={{ 
                  borderColor: brand.successBorder, 
                  color: brand.successText,
                  backgroundColor: 'transparent'
                }}
              >
                {lang === 'el' ? 'Αποσύνδεση' : 'Logout'}
              </button>
            </div>
          )}
        </div>
        
        {/* AGREEMENTS */}
        <div ref={returnRef}>
          <AgreementBox
            id="return-agreement"
            title={t.returnTitle}
            text={t.returnText}
            link=""
            accepted={returnAccepted}
            setAccepted={setReturnAccepted}
            t={t}
            required={true}
            highlightError={highlightReturn}
          />
        </div>
        
        <div ref={termsRef}>
          <AgreementBox
            id="terms-agreement"
            title={t.termsTitle}
            text={t.termsText}
            link={t.termsLink}
            text2="."
            accepted={termsAccepted}
            setAccepted={setTermsAccepted}
            t={t}
            required={true}
            highlightError={highlightTerms}
          />
        </div>
        
        <div ref={privacyRef}>
          <AgreementBox
            id="privacy-agreement"
            title={t.privacyTitle}
            text={t.privacyText}
            link={t.privacyLink}
            text2={t.privacyText2}
            accepted={privacyAccepted}
            setAccepted={setPrivacyAccepted}
            t={t}
            required={true}
            highlightError={highlightPrivacy}
          />
        </div>
        
        {/* WARNING NOTICE */}
        <div ref={warningRef}>
          <div 
            className="mb-4 rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl animate-pulse" 
            style={{ 
              border: `4px solid ${highlightWarning ? brand.errorBorder : (warningAccepted ? brand.successBorder : '#d97706')}`,
              background: highlightWarning ? brand.errorBg : (warningAccepted ? brand.successBg : 'linear-gradient(135deg, #fff3cd 0%, #fef3c7 100%)')
            }}
            onClick={() => setShowWarningModal(true)}
          >
            <div className="flex items-center gap-6">
              <span className="text-7xl animate-bounce">⚠️</span>
              <div className="flex-1">
                <div className="font-bold text-3xl mb-2" style={{ color: '#d97706' }}>
                  {t.warningCollapsed}
                </div>
                <div className="text-xl font-bold mt-3 bg-white p-3 rounded-lg shadow-inner" style={{ color: '#dc2626' }}>
                  {lang === 'el' ? '🔴 ΥΠΟΧΡΕΩΤΙΚΗ ΑΝΑΓΝΩΣΗ - ΚΛΙΚ ΕΔΩ!' : '🔴 MANDATORY READING - CLICK HERE!'}
                </div>
              </div>
              {warningAccepted && (
                <div className="text-6xl" style={{ color: brand.successBorder }}>
                  ✓
                </div>
              )}
            </div>
          </div>
          {!warningAccepted && (
            <div className="mb-4 inline-block text-base px-4 py-2 rounded-lg border-2 font-bold animate-pulse"
              style={{ color: "#ef4444", borderColor: "#ef4444", background: '#fee2e2' }}>
              ⚠️ {t.fieldRequired} - {lang === 'el' ? 'ΠΡΕΠΕΙ ΝΑ ΔΙΑΒΑΣΤΕΙ!' : 'MUST BE READ!'}
            </div>
          )}
        </div>
        
        <WarningNoticeModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          onAccept={() => setWarningAccepted(true)}
          t={t}
          accepted={warningAccepted}
        />
        
        {/* CHECK-IN: Complete Inventory */}
        {isCheckIn && <CompleteInventory allItems={allItems} t={t} mode={mode} />}
        
        {/* CHECK-OUT: Damage Inventory */}
        {isCheckOut && <DamageInventory items={damageItems} t={t} lang={lang} />}
        
        {/* PHOTOS */}
        {Object.keys(allPhotos).length > 0 && (
          <div className="mb-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue, background: "#f0f9ff" }}>
            <h3 className="font-bold text-xl mb-4 text-center" style={{ color: brand.navy }}>
              {isCheckOut 
                ? (lang === 'el' ? '📸 ΦΩΤΟΓΡΑΦΙΕΣ ΖΗΜΙΩΝ' : '📸 DAMAGE PHOTOS')
                : (lang === 'el' ? '📸 ΦΩΤΟΓΡΑΦΙΕΣ' : '📸 PHOTOS')
              }
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {Object.entries(allPhotos).map(([itemKey, photos]) => {
                const photoArray = Array.isArray(photos) ? photos : [photos];
                return photoArray.map((photo, idx) => {
                  if (!photo) return null;
                  return (
                    <div key={`${itemKey}-${idx}`} className="border rounded-lg p-1 bg-white overflow-hidden" style={{ borderColor: brand.blue }}>
                      <img 
                        src={photo} 
                        alt={`${itemKey} ${idx + 1}`} 
                        className="w-full h-24 object-cover rounded"
                      />
                      <p className="text-xs mt-1 text-center font-semibold truncate" style={{ color: brand.grey }}>
                        {itemKey}
                      </p>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        )}
        
        {/* NOTES */}
        <div className="mb-6 border-2 rounded-xl p-4" style={{ borderColor: brand.blue }}>
          <label className="block font-semibold mb-2" style={{ color: brand.black }}>
            {t.notesTitle}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded p-3 min-h-[180px] bg-white"
            placeholder={t.notesPlaceholder}
            style={{ borderColor: brand.black, color: brand.black }}
          />
        </div>

        {/* ✅ PAYMENT AUTHORIZATION (CHECK-OUT ONLY) - BEFORE SIGNATURES! */}
        {isCheckOut && (
          <div ref={paymentAuthRef} className="mt-6">
            <div 
              className="border-2 rounded-xl p-6 transition-all duration-500"
              style={{
                borderColor: highlightPaymentAuth ? brand.errorBorder : (paymentAuthAccepted ? brand.successBorder : brand.blue),
                background: highlightPaymentAuth ? brand.errorBg : (paymentAuthAccepted ? brand.successBg : '#f0f9ff')
              }}
            >
              <h3 className="font-bold text-xl mb-4" style={{ color: brand.navy }}>
                {t.paymentAuthTitle} *
              </h3>
              <p className="text-base mb-4" style={{ color: brand.black }}>
                {t.paymentAuthText}
              </p>
              
              {/* ✅ ONLY CHECKBOX - NO SIGNATURE BOX HERE! */}
              <label className="flex items-center gap-3 cursor-pointer p-4 bg-white rounded-lg border-2 hover:bg-gray-50 transition-colors"
                     style={{ borderColor: paymentAuthAccepted ? brand.successBorder : brand.blue }}>
                <input 
                  type="checkbox" 
                  checked={paymentAuthAccepted}
                  onChange={() => {
                    if (!paymentAuthAccepted) {
                      setPaymentAuthAccepted(true);
                    }
                  }}
                  className="w-5 h-5 cursor-pointer"
                />
                <span className="font-semibold" style={{ color: brand.black }}>
                  {t.paymentAuthAccept}
                </span>
              </label>
              
              {/* ✅ NOTE: The skipper signature below covers this authorization */}
              <p className="text-sm mt-3 text-center italic" style={{ color: brand.grey }}>
                {lang === 'el' 
                  ? '* Η υπογραφή του κυβερνήτη παρακάτω καλύπτει και αυτήν την εξουσιοδότηση'
                  : '* The skipper signature below covers this authorization'}
              </p>
            </div>
          </div>
        )}

        {/* ✅ SINGLE SKIPPER SIGNATURE (THE ONLY ONE!) */}
        <div ref={skipperSignatureRef}>
          <SignatureBox 
            brand={brand}
            lang={lang}
            onSignChange={setSkipperSigned}
            onImageChange={(img) => {
              setSignatureImage(img);
              const timer = setTimeout(() => {
                const storageKey = mode === 'in' ? `page5DataCheckIn_${currentBookingNumber}` : `page5DataCheckOut_${currentBookingNumber}`;
                const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
                existingData.skipperSignatureData = img;
                existingData.skipperSignature = !!img;
                localStorage.setItem(storageKey, JSON.stringify(existingData));
              }, 500);
              return () => clearTimeout(timer);
            }}
            initialImage={signatureImage}
            currentBookingNumber={currentBookingNumber}
            mode={mode}
            pageNumber={5}
            title={t.skipperSignatureTitle}
            highlightError={highlightSkipperSignature}
          />
        </div>
        
        {/* 🔒 EMPLOYEE SIGNATURE WITH LOCK */}
        <div ref={employeeSignatureRef}>
          <EmployeeSignatureWithLogin 
            brand={brand}
            t={{...t, lang}}
            signed={employeeSigned}
            setSigned={setEmployeeSigned}
            canvasRef={employeeCanvasRef}
            onImageChange={(img) => {
              setEmployeeSignatureImage(img);
              const timer = setTimeout(() => {
                const storageKey = mode === 'in' ? `page5DataCheckIn_${currentBookingNumber}` : `page5DataCheckOut_${currentBookingNumber}`;
                const existingData = JSON.parse(localStorage.getItem(storageKey) || '{}');
                existingData.employeeSignatureData = img;
                existingData.employeeSignature = !!img;
                localStorage.setItem(storageKey, JSON.stringify(existingData));
              }, 500);
              return () => clearTimeout(timer);
            }}
            highlightError={highlightEmployeeSignature}
            title={t.employeeSignatureTitle}
            isEmployee={isEmployee}
            currentEmployee={currentEmployee}
            onLoginClick={() => {
              handleEmployeeLogin();
              setTimeout(() => {
                employeeLoginRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }}
          />
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button 
            type="button" 
            onClick={handlePrevious} 
            className="px-4 py-2 rounded font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors"
          >
            ← {t.back}
          </button>
          <div className="flex flex-wrap gap-3">
            <button 
              type="button" 
              onClick={handleSaveDraft} 
              className="px-4 py-2 rounded transition-colors bg-gray-500 text-white hover:bg-gray-600"
            >
              {t.save}
            </button>
            {/* 🔒 PDF BUTTON WITH LOCK */}
            <button 
              type="button" 
              onClick={handleGeneratePDF} 
              disabled={areButtonsLocked}
              className="px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105" 
              style={{ background: areButtonsLocked ? '#9ca3af' : '#dc2626', color: '#fff' }}
              title={areButtonsLocked ? (lang === 'el' ? 'Χρειάζεται κωδικός υπαλλήλου' : 'Employee code required') : ''}
            >
              {areButtonsLocked ? '🔒' : '📄'} {t.pdf}
            </button>
            {/* 🔒 SUBMIT BUTTON WITH LOCK */}
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={areButtonsLocked}
              className="px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              style={{ background: areButtonsLocked ? '#9ca3af' : brand.blue, color: '#fff' }}
              title={areButtonsLocked ? (lang === 'el' ? 'Χρειάζεται κωδικός υπαλλήλου' : 'Employee code required') : ''}
            >
              {areButtonsLocked ? '🔒' : '✓'} {t.submit}
            </button>
          </div>
        </div>
        
        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t text-center text-sm" style={{ color: '#6b7280' }}>
          <div>{t.footerAddress}</div>
          <div className="mt-1">{t.footerWebsite}</div>
          <div className="mt-1">{t.footerPhone}</div>
          <div className="mt-1">
            info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com
          </div>
        </div>
      </div>

      {/* EMPLOYEE LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLoginModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🔒</span>
              <h3 className="text-xl font-bold" style={{ color: brand.black }}>
                {lang === 'el' ? 'Σύνδεση Υπαλλήλου' : 'Employee Login'}
              </h3>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2" style={{ color: brand.black }}>
                {lang === 'el' ? 'Κωδικός Υπαλλήλου:' : 'Employee Code:'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="employee-code-input"
                  type={showEmployeePassword ? "text" : "password"}
                  placeholder={lang === 'el' ? 'Εισάγετε κωδικό υπαλλήλου' : 'Enter employee code'}
                  autoFocus
                  className="w-full px-3 py-2 border-2 rounded"
                  style={{ borderColor: brand.black, paddingRight: '40px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const code = e.target.value.trim();
                      if (!code) {
                        alert(lang === 'el' ? 'Παρακαλώ εισάγετε κωδικό' : 'Please enter a code');
                        return;
                      }
                      const user = authService.login(code);
                      if (user) {
                        setIsEmployee(true);
                        setCurrentEmployee(user.permissions);
                        setShowLoginModal(false);
                        sessionStorage.setItem('currentEmployee', JSON.stringify(user));
                      } else {
                        alert(lang === 'el' ? 'Λάθος κωδικός' : 'Invalid code');
                        e.target.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: brand.black
                  }}
                >
                  {showEmployeePassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowLoginModal(false)} 
                className="px-6 py-2 rounded border hover:bg-gray-50 transition-colors" 
                style={{ borderColor: brand.black, color: brand.black }}
              >
                {lang === 'el' ? 'Ακύρωση' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('employee-code-input');
                  const code = input?.value.trim();
                  if (!code) {
                    alert(lang === 'el' ? 'Παρακαλώ εισάγετε κωδικό' : 'Please enter a code');
                    return;
                  }
                  const user = authService.login(code);
                  if (user) {
                    setIsEmployee(true);
                    setCurrentEmployee(user.permissions);
                    setShowLoginModal(false);
                    sessionStorage.setItem('currentEmployee', JSON.stringify(user));
                  } else {
                    alert(lang === 'el' ? 'Λάθος κωδικός' : 'Invalid code');
                    if (input) input.value = '';
                  }
                }}
                className="px-6 py-2 rounded text-white hover:bg-blue-600 transition-colors font-semibold" 
                style={{ background: brand.blue }}
              >
                {lang === 'el' ? 'Σύνδεση' : 'Login'}
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

// =================================================================
// END OF PART 4 - THE COMPLETE PAGE 5!
// =================================================================
// TO COMBINE ALL PARTS INTO ONE FILE:
// 1. Create new Page5.jsx
// 2. Copy PART 1 (imports, constants, helpers)
// 3. Copy PART 2 (UI components)
// 4. Copy PART 3 (main component + state + handlers)
// 5. Copy PART 4 (JSX render)
// =================================================================
// ✅ ALL FIXES APPLIED:
// - Single Skipper Signature (removed duplicate)
// - Employee Login Box (yellow → green)
// - Employee Signature Lock
// - PDF & Submit Button Locks
// - Payment Authorization WITHOUT signature box
// - All syntax errors fixed
// =================================================================
// DEMO CODES: ADMIN2024, EMP001, EMP002, VIEW123
// =================================================================