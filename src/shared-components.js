import React, { useState, useRef, useEffect } from "react";
import { useSignatureTouch } from "./utils/useSignatureTouch";

export const LANG_MAP = [
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

export const flagImg = (countryCode) =>
  `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;

// 🔥 FEATURE FLAG — όταν false, το Booking Info block κρύβεται στις σελίδες 2/3/4 (σελίδες 1 + 5 δεν επηρεάζονται)
// Για άλλο deployment/πελάτη, γύρνα σε true χωρίς άλλη αλλαγή.
export const SHOW_BOOKING_INFO_ON_CHECKLIST_PAGES = false;

// 🔥 FEATURE FLAG — όταν false, η READ-ONLY Check-IN reference column κρύβεται στο check-out
// Για άλλο deployment/πελάτη, γύρνα σε true χωρίς άλλη αλλαγή.
export const SHOW_CHECKIN_REFERENCE_IN_CHECKOUT = true;



// 🔥 FORMAT DATE: YYYY-MM-DD → DD/MM/YYYY
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  // If already in DD/MM/YYYY format, return as is
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  // Convert YYYY-MM-DD → DD/MM/YYYY
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }
  // Try to parse as date and format
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}
  return dateStr;
};

export const compressSignature = (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxWidth = 400;
      const maxHeight = 100;
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

// 🔧 IMAGE COMPRESSION
export function compressImage(base64String, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64String;
  });
}

export function getBase64Size(base64String) {
  const base64Length = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (base64Length * 3) / 4;
  return Math.round(sizeInBytes / 1024);
}

export async function compressImageWithLogging(base64String, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  const originalSize = getBase64Size(base64String);
  console.log(`📸 Original image size: ${originalSize}KB`);
  const compressed = await compressImage(base64String, maxWidth, maxHeight, quality);
  const compressedSize = getBase64Size(compressed);
  const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);
  console.log(`✅ Compressed image size: ${compressedSize}KB (${reduction}% reduction)`);
  return compressed;
}

// 🎨 BRAND COLORS
export const brand = {
  black: "#000000",
  blue: "#3B82F6",
  pink: "#d11b65",
  successBorder: "#22c55e",
  successBg: "#d1fae5",
  successText: "#166534",
  pageBg: "#eae8dc",
  navy: "#0B1D51",
  gold: "#C6A664",
  white: "#FFFFFF",
};

// 👥 EMPLOYEE CODES - DEPRECATED - Use authService instead
// export const EMPLOYEE_CODES = { ... };

// 🔧 UID & MID
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const mid = () => "m_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

// 🌍 I18N TRANSLATIONS
export const I18N = {
  en: { boatInventoryMap: "BOAT INVENTORY - INTERACTIVE MAP", progress: "Progress", sectionsCompleted: "sections completed", clickHotspot: "Click on any hotspot to view inventory", floorplanNotAvailable: "Floorplan not available for this vessel", backToMap: "Back to Map", toiletNoticeTitle: "TOILET CLOGGING NOTICE", toiletText1: "In case the deposit has been paid with damage waiver (non-refundable), no charge applies for toilet clogging.", toiletText2: "If check-in is completed and no damage or toilet clogging is detected, the company and base have no responsibility after check-in.", toiletAccept: "✓ I understand and accept", toiletAcceptRequired: "⚠ Please accept the toilet clogging notice!", pleaseComplete: "⚠ Please complete:", noPhotos: "No photos added yet.", pdfGenerated: "✅ PDF generated!", pdfError: "❌ PDF generation error!", bookingNumber: "Booking Number", yachtLabel: "Yacht", skipperLabel: "Skipper", checkinDate: "Check-in Date", checkoutDate: "Check-out Date", skipperSignatureTitle: "Skipper's Signature *", employeeSignatureTitle: "Employee's Signature *", enterItemName: "Enter item name!", equipmentTitle: "EQUIPMENT INVENTORY", selectAllOk: "SELECT ALL OK", selectAllOkConfirm: "Under my own responsibility I declare that all items are correct. If anything is not right, the company is not responsible. Do you want to continue?",
    title: "ACCEPTANCE / DELIVERY STATEMENT",
    hullTitle: "HULL INSPECTION & DECK",
    dinghyTitle: "DINGHY AND OUTBOARD ENGINE",
    safetyTitle: "SAFETY EQUIPMENT",
    cabinTitle: "CABIN INVENTORY",
    optionalTitle: "OPTIONAL EQUIPMENT",
    mode: "Mode",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Add item",
    newItemPlaceholder: "New item name",
    newItemPH: "New item name",
    price: "Price",
    qty: "Qty",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NOT OK",
    camera: "Camera",
    attach: "Attach",
    note: "If any of the above is not OK, write the reason below and inform the base staff",
    notePH: "Write comments / issues here...",
    picsTitle: "If any of the above is not OK, then take pictures",
    remove: "Delete",
    save: "Save",
    clear: "Clear",
    next: "Next",
    prev: "Back",
    pdf: "PDF",
    home: "Home",
    mainsailGenoaTitle: "Mainsail & Genoa*",
    mainsailGenoaDesc: "Please read the following information about sails and equipment.",
    mainsailGenoaText: "I have read the information for Mainsail & Genoa.",
    mainsailGenoaLink: "Mainsail & Genoa Equipment.",
    mainsailGenoaOk: "OK",
    diversTitle: "Diver's Report*",
    diversUpload: "Upload image",
    diversRequired: "Required",
    diversOk: "OK",
    diversFieldRequired: "Field required",
    diversAgreementTitle: "Diver's report acceptance*",
    diversAgreementText: "I have read the diver's report above and confirm that I agree and accept it. I also know that I have the right to request an additional inspection by the diver during check-in at my own expense. Only certified and professional divers are allowed to dive in the base marina.",
    ok: "OK",
    employeeLogin: "Employee Login",
    logout: "Logout",
    ca_title: "Charter Agreement & Documents",
    ca_booking: "Booking",
    ca_lastUpdated: "Last updated",
    ca_updating: "Updating...",
    ca_noBookingFound: "No Booking Found",
    ca_backToHome: "Back to Home",
    ca_noBookingMsg: "No booking data found for this session.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Download your personalized boarding pass with all check-in details.",
    ca_download: "Download",
    ca_preview: "Preview",
    ca_meetingLocation: "Meeting location: Marina Alimos - Charter Village Box A47",
    ca_contact: "Contact: Ms Maria Mazaraki (+30 6978196009)",
    ca_documents: "Documents",
    ca_documentsDesc: "Auto-generate your Charter Party and Crew List as Word documents.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Crew List (DOCX)",
    ca_financialSummary: "Financial Summary",
    ca_charterAmountNet: "Charter Amount (NET):",
    ca_vat12: "VAT (12%):",
    ca_totalWithVat: "TOTAL (with VAT):",
    ca_depositRequired: "Deposit Required:",
    ca_paymentInfo: "Charter amount and deposit are payable as per the charter contract.",
    ca_pdfFormat: "Format: PDF (with all details pre-filled)",
    ca_printSign: "Print and sign before check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Fill Charter Party Details Online",
    ca_fillLatinOnly: "Fill your details directly in the app (Latin characters only)",
    ca_close: "Close",
    ca_fillNow: "Fill Now",
    ca_charterPartySubmitted: "Charter Party Submitted",
    ca_legallyBinding: "LEGALLY BINDING",
    ca_submittedBy: "Submitted by:",
    ca_submittedOn: "Submitted on:",
    ca_lastModified: "Last modified:",
    ca_submittedNotice: "This Charter Party has been digitally signed and submitted. It is legally binding.",
    ca_firstName: "First Name",
    ca_lastName: "Last Name",
    ca_address: "Address",
    ca_idCard: "ID Card",
    ca_passport: "Passport",
    ca_idCardNumber: "ID Card Number",
    ca_passportNumber: "Passport Number",
    ca_taxNumberAfm: "Tax Number (AFM)",
    ca_taxOfficeDoy: "Tax Office (DOY)",
    ca_phone: "Phone",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "I am also the Skipper",
    ca_chartererSignature: "Charterer Signature",
    ca_digitallySigned: "Digitally signed",
    ca_clear: "Clear",
    ca_skipperDetailsDiff: "Skipper Details (different person)",
    ca_skipperFullName: "Skipper Full Name",
    ca_skipperSignature: "Skipper Signature",
    ca_crewList: "Crew List",
    ca_fillCrewOnline: "Fill Crew Details Online",
    ca_fillCrewDesc: "Add crew members details. All fields in Latin characters only.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Crew Member",
    ca_fullName: "Full Name",
    ca_passportNum: "Passport Number",
    ca_dateOfBirth: "Date of Birth",
    ca_nationality: "Nationality",
    ca_phoneShort: "Phone",
    ca_addCrewMember: "Add Crew Member",
    ca_skipperLicense: "Skipper License",
    ca_skipperLicenseDesc: "Upload a clear photo or scan of the skipper license.",
    ca_remove: "Remove",
    ca_addAnotherLicense: "Add Another License",
    ca_takePhoto: "Take Photo",
    ca_useCamera: "Use camera",
    ca_uploadFile: "Upload File",
    ca_chooseGallery: "Choose from gallery",
    ca_orDragDrop: "or drag and drop",
    ca_charterPartyScanTitle: "Charter Party (Signed Scan)",
    ca_charterPartyScanDesc: "Upload the signed Charter Party document.",
    ca_crewListScanTitle: "Crew List (Signed Scan)",
    ca_crewListScanDesc: "Upload the signed Crew List document.",
    ca_docUploaded: "Document uploaded",
    ca_pdfWordImg: "PDF, Word or image",
    ca_submitAllDocs: "Submit All Documents",
    ca_alertNoBookingData: "No booking data found.",
    ca_alertUploadLicense: "Please upload the Skipper License.",
    ca_alertFillFields: "Please fill in the following:",
    ca_selectLanguage: "Select Language",
    ca_idOrPassportNum: "ID/Passport Number",
    ca_skipperNameLabel: "Skipper Name",
    ca_alertCompleteForm: "Please complete and submit the online Charter Party form first.\n\nSign the form and click Submit to continue.",
    ca_alertFillCrewAll: "Please fill in all crew member details.",
    ca_alertFillFieldsMulti: "Please fill in the following Charter Party fields:\n\n- ",
    ca_submitSuccess: "Charter Agreement documents submitted successfully.",
    ca_errorSaving: "Error saving data. Please try again.",
    ca_alertEnterCode: "Please enter your booking code from the home page first.",
    ca_boardingPassDesc2: "Your boarding pass with all details and meeting location",
    ca_charterDocsDesc: "Download your charter documents pre-filled with your booking details",
    ca_charterAgreementDesc: "The official charter agreement for your sailing trip",
    ca_crewListOfficialDesc: "Passenger list required by port authorities before departure",
    ca_fiscalNote: "* These amounts are automatically calculated and reflect the final payment details in your charter agreement.",
    ca_toModifyNote: "To modify, please contact the charter office.",
    ca_fillCrewInApp: "Fill the crew list directly in the app",
    ca_uploadSignedCP: "Upload the signed charter party document",
    ca_uploadSignedCL: "Upload the signed crew list document",
    ca_alertNoBookingExcl: "No booking data found.",
    ca_inviteTitle: "Invite Crew / Skipper via Email",
    ca_inviteDesc: "Send a secure link to each crew member or skipper. They fill in their details (always in English) and their data is automatically added to your Crew List and Charter Party documents.",
    ca_sendInvitation: "Send Invitation",
    ca_sending: "Sending...",
    ca_sentInvitations: "Sent Invitations",
    ca_pending: "Pending",
    ca_submittedShort: "Submitted",
    ca_resend: "Resend",
    ca_deleteBtn: "Delete",
    ca_copyLink: "Copy Link",
    ca_linkCopied: "Link copied",
    ca_invitationSentTo: "Invitation sent to",
    ca_emailRequired: "Email required",
    ca_noBookingCodeMsg: "No booking code",
    ca_invitationResent: "Invitation resent",
    ca_resendFailed: "Resend failed",
    ca_deleteConfirm: "Delete this pending invitation?",
  },
  el: { boatInventoryMap: "ΑΠΟΓΡΑΦΗ ΣΚΑΦΟΥΣ - ΔΙΑΔΡΑΣΤΙΚΟΣ ΧΑΡΤΗΣ", progress: "Πρόοδος", sectionsCompleted: "ενότητες ολοκληρώθηκαν", clickHotspot: "Κάντε κλικ σε οποιοδήποτε σημείο για να δείτε το inventory", floorplanNotAvailable: "Το floorplan δεν είναι διαθέσιμο για αυτό το σκάφος", backToMap: "Πίσω στον Χάρτη", toiletNoticeTitle: "ΕΙΔΟΠΟΙΗΣΗ ΓΙΑ ΒΟΥΛΩΜΑ ΤΟΥΑΛΕΤΑΣ", toiletText1: "Σε περίπτωση που έχει πληρωθεί η εγγύηση με damage waiver (μη επιστρεπτέα), δεν ισχύει πληρωμή για το βούλωμα της τουαλέτας.", toiletText2: "Εάν γίνει check-in και δεν διαπιστωθεί καμία ζημιά ή βούλωμα στην τουαλέτα, η εταιρία και η βάση δεν έχουν καμία ευθύνη μετά το check-in.", toiletAccept: "✓ Κατανοώ και αποδέχομαι", toiletAcceptRequired: "⚠ Παρακαλώ αποδεχτείτε την ειδοποίηση για το βούλωμα τουαλέτας!", pleaseComplete: "⚠ Παρακαλώ ολοκληρώστε το:", noPhotos: "Δεν έχουν προστεθεί φωτογραφίες ακόμη.", pdfGenerated: "✅ PDF δημιουργήθηκε!", pdfError: "❌ Σφάλμα δημιουργίας PDF!", bookingNumber: "Αριθμός Ναύλου", yachtLabel: "Σκάφος", skipperLabel: "Κυβερνήτης", checkinDate: "Ημερομηνία Check-in", checkoutDate: "Ημερομηνία Check-out", skipperSignatureTitle: "Υπογραφή Κυβερνήτη *", employeeSignatureTitle: "Υπογραφή Υπαλλήλου *", enterItemName: "Εισάγετε όνομα αντικειμένου!", equipmentTitle: "ΑΠΟΓΡΑΦΗ ΕΞΟΠΛΙΣΜΟΥ", selectAllOk: "ΕΠΙΛΟΓΗ ΟΛΩΝ ΩΣ ΣΩΣΤΑ", selectAllOkConfirm: "Με δική μου ευθύνη δηλώνω ότι όλα τα στοιχεία είναι σωστά. Αν κάτι δεν είναι σωστό, η εταιρεία δεν ευθύνεται. Θέλετε να συνεχίσετε;",
    title: "ΔΗΛΩΣΗ ΠΑΡΑΛΑΒΗΣ / ΠΑΡΑΔΟΣΗΣ",
    hullTitle: "ΕΠΙΘΕΩΡΗΣΗ ΣΚΑΦΟΥΣ & ΚΑΤΑΣΤΡΩΜΑΤΟΣ",
    dinghyTitle: "ΛΕΜΒΟΣ ΚΑΙ ΕΞΩΛΕΜΒΙΟΣ",
    safetyTitle: "ΕΞΟΠΛΙΣΜΟΣ ΑΣΦΑΛΕΙΑΣ",
    cabinTitle: "ΑΠΟΓΡΑΦΗ ΚΑΜΠΙΝΑΣ",
    optionalTitle: "ΠΡΟΑΙΡΕΤΙΚΟΣ ΕΞΟΠΛΙΣΜΟΣ",
    mode: "Λειτουργία",
    checkIn: "Επιβίβαση",
    checkOut: "Αποβίβαση",
    addItem: "Προσθήκη",
    newItemPlaceholder: "Νέο στοιχείο",
    newItemPH: "Όνομα νέου στοιχείου",
    price: "Τιμή",
    qty: "Ποσ.",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out ΟΧΙ OK",
    camera: "Κάμερα",
    attach: "Επισύναψη",
    note: "Αν κάποιο από τα παραπάνω δεν είναι ΟΚ, γράψτε τον λόγο παρακάτω και ενημερώστε το προσωπικό της βάσης",
    notePH: "Γράψτε σχόλια / ζητήματα εδώ...",
    picsTitle: "Αν κάποιο από τα παραπάνω δεν είναι OK, τότε βγάλτε φωτογραφίες",
    remove: "Διαγραφή",
    save: "Αποθήκευση",
    clear: "Καθαρισμός",
    next: "Επόμενο",
    prev: "Πίσω",
    pdf: "PDF",
    home: "Αρχική",
    mainsailGenoaTitle: "Κύριο Πανί & Γένουα*",
    mainsailGenoaDesc: "Παρακαλούμε διαβάστε τις παρακάτω πληροφορίες για τα πανιά και τον εξοπλισμό.",
    mainsailGenoaText: "Έχω διαβάσει τις πληροφορίες για το Κύριο Πανί & τη Γένουα.",
    mainsailGenoaLink: "Εξοπλισμός Κύριου Πανιού & Γένουας.",
    mainsailGenoaOk: "OK",
    diversTitle: "Αναφορά Δύτη*",
    diversUpload: "Ανέβασμα εικόνας",
    diversRequired: "Υποχρεωτικό",
    diversOk: "OK",
    diversFieldRequired: "Υποχρεωτικό πεδίο",
    diversAgreementTitle: "Αποδοχή αναφοράς δύτη*",
    diversAgreementText: "Έχω διαβάσει την παραπάνω αναφορά του δύτη και επιβεβαιώνω ότι τη συμφωνώ και την αποδέχομαι. Επίσης γνωρίζω ότι έχω το δικαίωμα να ζητήσω πρόσθετη επιθεώρηση από τον δύτη κατά το check-in με δικά μου έξοδα. Μόνο πιστοποιημένοι και επαγγελματίες δύτες επιτρέπονται να βουτήξουν στη μαρίνα της βάσης.",
    ok: "OK",
    employeeLogin: "Σύνδεση Υπαλλήλου",
    logout: "Αποσύνδεση",
    ca_title: "Ναυλοσύμφωνο & Έγγραφα",
    ca_booking: "Κράτηση",
    ca_lastUpdated: "Τελ. ενημέρωση",
    ca_updating: "Ανανέωση...",
    ca_noBookingFound: "Δεν Βρέθηκε Κράτηση",
    ca_backToHome: "Πίσω στην Αρχική",
    ca_noBookingMsg: "Δεν βρέθηκαν στοιχεία κράτησης για αυτή τη συνεδρία.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Κατεβάστε το προσωπικό boarding pass με όλες τις λεπτομέρειες check-in.",
    ca_download: "Λήψη",
    ca_preview: "Προεπισκόπηση",
    ca_meetingLocation: "Σημείο συνάντησης: Marina Alimos - Charter Village Box A47",
    ca_contact: "Επικοινωνία: Κα. Μαρία Μαζαράκη (+30 6978196009)",
    ca_documents: "Έγγραφα",
    ca_documentsDesc: "Αυτόματη δημιουργία Ναυλοσυμφώνου και Λίστας Πληρώματος σε Word.",
    ca_charterPartyDocx: "Ναυλοσύμφωνο (DOCX)",
    ca_crewListDocx: "Λίστα Πληρώματος (DOCX)",
    ca_financialSummary: "Οικονομικά Στοιχεία",
    ca_charterAmountNet: "Ποσό Ναύλου (ΚΑΘΑΡΟ):",
    ca_vat12: "ΦΠΑ (12%):",
    ca_totalWithVat: "ΣΥΝΟΛΟ (με ΦΠΑ):",
    ca_depositRequired: "Απαιτούμενη Προκαταβολή:",
    ca_paymentInfo: "Το ποσό ναύλωσης και η προκαταβολή καταβάλλονται βάσει του συμβολαίου.",
    ca_pdfFormat: "Μορφή: PDF (με όλα τα στοιχεία προ-συμπληρωμένα)",
    ca_printSign: "Τυπώστε και υπογράψτε πριν το check-in",
    ca_charterParty: "Ναυλοσύμφωνο",
    ca_fillCharterPartyOnline: "Συμπλήρωση Στοιχείων Ναυλοσυμφώνου",
    ca_fillLatinOnly: "Συμπληρώστε τα στοιχεία απευθείας στο app (λατινικοί χαρακτήρες μόνο)",
    ca_close: "Κλείσιμο",
    ca_fillNow: "Συμπλήρωση",
    ca_charterPartySubmitted: "Ναυλοσύμφωνο Υποβλήθηκε",
    ca_legallyBinding: "ΝΟΜΙΚΑ ΔΕΣΜΕΥΤΙΚΟ",
    ca_submittedBy: "Υποβλήθηκε από:",
    ca_submittedOn: "Ημερομηνία υποβολής:",
    ca_lastModified: "Τελευταία τροποποίηση:",
    ca_submittedNotice: "Το Ναυλοσύμφωνο έχει υπογραφεί ψηφιακά και υποβληθεί. Είναι νομικά δεσμευτικό.",
    ca_firstName: "Όνομα",
    ca_lastName: "Επίθετο",
    ca_address: "Διεύθυνση",
    ca_idCard: "Ταυτότητα",
    ca_passport: "Διαβατήριο",
    ca_idCardNumber: "Αριθμός Ταυτότητας",
    ca_passportNumber: "Αριθμός Διαβατηρίου",
    ca_taxNumberAfm: "ΑΦΜ",
    ca_taxOfficeDoy: "ΔΟΥ",
    ca_phone: "Τηλέφωνο",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Είμαι και ο Κυβερνήτης",
    ca_chartererSignature: "Υπογραφή Ναυλωτή",
    ca_digitallySigned: "Ψηφιακά υπογεγραμμένο",
    ca_clear: "Καθαρισμός",
    ca_skipperDetailsDiff: "Στοιχεία Κυβερνήτη (διαφορετικό πρόσωπο)",
    ca_skipperFullName: "Ονοματεπώνυμο Κυβερνήτη",
    ca_skipperSignature: "Υπογραφή Κυβερνήτη",
    ca_crewList: "Λίστα Πληρώματος",
    ca_fillCrewOnline: "Συμπλήρωση Στοιχείων Πληρώματος",
    ca_fillCrewDesc: "Προσθέστε τα στοιχεία των μελών πληρώματος (λατινικοί χαρακτήρες).",
    ca_skipper: "Κυβερνήτης",
    ca_coSkipper: "Συγκυβερνήτης",
    ca_crewMember: "Μέλος Πληρώματος",
    ca_fullName: "Ονοματεπώνυμο",
    ca_passportNum: "Αριθμός Διαβατηρίου",
    ca_dateOfBirth: "Ημ. Γέννησης",
    ca_nationality: "Εθνικότητα",
    ca_phoneShort: "Τηλέφωνο",
    ca_addCrewMember: "Προσθήκη Μέλους Πληρώματος",
    ca_skipperLicense: "Δίπλωμα Κυβερνήτη",
    ca_skipperLicenseDesc: "Ανεβάστε φωτογραφία ή scan του διπλώματος κυβερνήτη.",
    ca_remove: "Αφαίρεση",
    ca_addAnotherLicense: "Προσθήκη Διπλώματος",
    ca_takePhoto: "Τράβηξε Φωτό",
    ca_useCamera: "Χρήση κάμερας",
    ca_uploadFile: "Ανέβασμα Αρχείου",
    ca_chooseGallery: "Επιλογή από συλλογή",
    ca_orDragDrop: "ή σύρετε και αφήστε",
    ca_charterPartyScanTitle: "Ναυλοσύμφωνο (Υπογεγραμμένο Scan)",
    ca_charterPartyScanDesc: "Ανεβάστε το υπογεγραμμένο Ναυλοσύμφωνο.",
    ca_crewListScanTitle: "Λίστα Πληρώματος (Υπογεγραμμένο Scan)",
    ca_crewListScanDesc: "Ανεβάστε την υπογεγραμμένη Λίστα Πληρώματος.",
    ca_docUploaded: "Αρχείο ανεβάστηκε",
    ca_pdfWordImg: "PDF, Word ή εικόνα",
    ca_submitAllDocs: "Υποβολή Όλων των Εγγράφων",
    ca_alertNoBookingData: "Δεν βρέθηκαν στοιχεία κράτησης.",
    ca_alertUploadLicense: "Παρακαλώ ανεβάστε το δίπλωμα κυβερνήτη.",
    ca_alertFillFields: "Παρακαλώ συμπληρώστε τα παρακάτω:",
    ca_selectLanguage: "Επιλογή Γλώσσας",
    ca_idOrPassportNum: "Αρ. Ταυτότητας/Διαβατηρίου",
    ca_skipperNameLabel: "Όνομα Κυβερνήτη",
    ca_alertCompleteForm: "Παρακαλώ συμπληρώστε και υποβάλετε πρώτα τη φόρμα Ναυλοσυμφώνου.\n\nΥπογράψτε τη φόρμα και πατήστε Υποβολή για να συνεχίσετε.",
    ca_alertFillCrewAll: "Παρακαλώ συμπληρώστε όλα τα στοιχεία των μελών πληρώματος.",
    ca_alertFillFieldsMulti: "Παρακαλώ συμπληρώστε τα ακόλουθα πεδία:\n\n- ",
    ca_submitSuccess: "Τα έγγραφα Ναυλοσυμφώνου υποβλήθηκαν επιτυχώς.",
    ca_errorSaving: "Σφάλμα αποθήκευσης. Παρακαλώ προσπαθήστε ξανά.",
    ca_alertEnterCode: "Παρακαλώ εισάγετε τον κωδικό κράτησης από την αρχική σελίδα.",
    ca_boardingPassDesc2: "Το boarding pass με όλες τις λεπτομέρειες και το σημείο συνάντησης",
    ca_charterDocsDesc: "Κατεβάστε τα έγγραφα ναύλωσης προ-συμπληρωμένα με τα στοιχεία κράτησης",
    ca_charterAgreementDesc: "Το επίσημο Ναυλοσύμφωνο για το ταξίδι σας",
    ca_crewListOfficialDesc: "Λίστα επιβατών απαιτούμενη από τις λιμενικές αρχές πριν την αναχώρηση",
    ca_fiscalNote: "* Τα ποσά υπολογίζονται αυτόματα και αντικατοπτρίζουν τα τελικά στοιχεία πληρωμής του Ναυλοσυμφώνου.",
    ca_toModifyNote: "Για τροποποίηση επικοινωνήστε με το γραφείο ναύλωσης.",
    ca_fillCrewInApp: "Συμπλήρωση λίστας πληρώματος απευθείας στο app",
    ca_uploadSignedCP: "Ανεβάστε το υπογεγραμμένο Ναυλοσύμφωνο",
    ca_uploadSignedCL: "Ανεβάστε την υπογεγραμμένη Λίστα Πληρώματος",
    ca_alertNoBookingExcl: "Δεν βρέθηκαν στοιχεία κράτησης.",
    ca_inviteTitle: "Πρόσκληση Πληρώματος / Κυβερνήτη μέσω Email",
    ca_inviteDesc: "Στείλτε ασφαλές link σε κάθε μέλος πληρώματος ή κυβερνήτη. Συμπληρώνουν τα στοιχεία τους (πάντα στα Αγγλικά) και προστίθενται αυτόματα στη Λίστα Πληρώματος και στο Ναυλοσύμφωνο.",
    ca_sendInvitation: "Αποστολή Πρόσκλησης",
    ca_sending: "Αποστολή...",
    ca_sentInvitations: "Απεσταλμένες Προσκλήσεις",
    ca_pending: "Εκκρεμεί",
    ca_submittedShort: "Υποβλήθηκε",
    ca_resend: "Επαναποστολή",
    ca_deleteBtn: "Διαγραφή",
    ca_copyLink: "Αντιγραφή Link",
    ca_linkCopied: "Το link αντιγράφηκε",
    ca_invitationSentTo: "Πρόσκληση στάλθηκε στο",
    ca_emailRequired: "Απαιτείται email",
    ca_noBookingCodeMsg: "Λείπει κωδικός κράτησης",
    ca_invitationResent: "Η πρόσκληση ξαναστάλθηκε",
    ca_resendFailed: "Αποτυχία επαναποστολής",
    ca_deleteConfirm: "Διαγραφή αυτής της εκκρεμούς πρόσκλησης;",
  },
  it: { boatInventoryMap: "INVENTARIO BARCA - MAPPA INTERATTIVA", progress: "Progresso", sectionsCompleted: "sezioni completate", clickHotspot: "Clicca su qualsiasi punto per vedere l'inventario", floorplanNotAvailable: "Planimetria non disponibile per questa imbarcazione", backToMap: "Torna alla Mappa", toiletNoticeTitle: "AVVISO INTASAMENTO WC", toiletText1: "Se il deposito è stato pagato con damage waiver (non rimborsabile), non si applica alcun addebito per l'intasamento del WC.", toiletText2: "Se il check-in è completato e non vengono rilevati danni o intasamenti del WC, la compagnia e la base non hanno responsabilità dopo il check-in.", toiletAccept: "✓ Comprendo e accetto", toiletAcceptRequired: "⚠ Accettare l'avviso sull'intasamento del WC!", pleaseComplete: "⚠ Completare:", noPhotos: "Nessuna foto aggiunta.", pdfGenerated: "✅ PDF generato!", pdfError: "❌ Errore generazione PDF!", bookingNumber: "Numero Prenotazione", yachtLabel: "Yacht", skipperLabel: "Skipper", checkinDate: "Data Check-in", checkoutDate: "Data Check-out", skipperSignatureTitle: "Firma dello Skipper *", enterItemName: "Inserire nome articolo!", equipmentTitle: "INVENTARIO ATTREZZATURE", selectAllOk: "SELEZIONA TUTTO OK", selectAllOkConfirm: "Sotto la mia responsabilità dichiaro che tutti gli articoli sono corretti. Se qualcosa non è corretto, la compagnia non è responsabile. Vuoi continuare?",
    title: "DICHIARAZIONE DI ACCETTAZIONE / CONSEGNA",
    hullTitle: "ISPEZIONE SCAFO E COPERTA",
    dinghyTitle: "TENDER E MOTORE FUORIBORDO",
    safetyTitle: "EQUIPAGGIAMENTO DI SICUREZZA",
    cabinTitle: "INVENTARIO CABINA",
    optionalTitle: "EQUIPAGGIAMENTO OPZIONALE",
    mode: "Modalità",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Aggiungi",
    newItemPlaceholder: "Nome nuovo articolo",
    newItemPH: "Nome nuovo articolo",
    price: "Prezzo",
    qty: "Qtà",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NON OK",
    camera: "Foto",
    boarding: "Imbarco",
    attach: "Allega",
    note: "Se qualcosa non va, scrivi il motivo e informa il personale",
    notePH: "Scrivi commenti / problemi qui...",
    picsTitle: "Se qualcosa non va, scatta delle foto",
    remove: "Elimina",
    save: "Salva",
    clear: "Cancella",
    next: "Avanti",
    prev: "Indietro",
    pdf: "PDF",
    home: "Home",
    mainsailGenoaTitle: "Randa & Genoa*",
    mainsailGenoaDesc: "Leggere le seguenti informazioni su vele e attrezzatura.",
    mainsailGenoaText: "Ho letto le informazioni su Randa & Genoa.",
    mainsailGenoaLink: "Attrezzatura Randa & Genoa.",
    mainsailGenoaOk: "OK",
    diversTitle: "Rapporto Subacqueo*",
    diversUpload: "Carica immagine",
    diversRequired: "Obbligatorio",
    diversOk: "OK",
    diversFieldRequired: "Campo obbligatorio",
    diversAgreementTitle: "Accettazione rapporto subacqueo*",
    diversAgreementText: "Ho letto il rapporto del subacqueo e confermo di accettarlo. So di poter richiedere un'ispezione aggiuntiva a mie spese durante il check-in. Solo subacquei certificati possono immergersi nel porto base.",
    ok: "OK",
    employeeLogin: "Accesso Dipendenti",
    logout: "Esci",
    ca_title: "Contratto di Noleggio e Documenti",
    ca_booking: "Prenotazione",
    ca_lastUpdated: "Ultimo aggiornamento",
    ca_updating: "Aggiornamento...",
    ca_noBookingFound: "Nessuna Prenotazione Trovata",
    ca_backToHome: "Torna alla Home",
    ca_noBookingMsg: "Nessun dato di prenotazione trovato per questa sessione.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Scarica il tuo boarding pass personalizzato con tutti i dettagli del check-in.",
    ca_download: "Scarica",
    ca_preview: "Anteprima",
    ca_meetingLocation: "Luogo di incontro: Marina Alimos - Charter Village Box A47",
    ca_contact: "Contatto: Sig.ra Maria Mazaraki (+30 6978196009)",
    ca_documents: "Documenti",
    ca_documentsDesc: "Genera automaticamente Charter Party e Lista Equipaggio come documenti Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Lista Equipaggio (DOCX)",
    ca_financialSummary: "Riepilogo Finanziario",
    ca_charterAmountNet: "Importo Noleggio (NETTO):",
    ca_vat12: "IVA (12%):",
    ca_totalWithVat: "TOTALE (con IVA):",
    ca_depositRequired: "Deposito Richiesto:",
    ca_paymentInfo: "L'importo del noleggio e il deposito sono pagabili secondo il contratto di noleggio.",
    ca_pdfFormat: "Formato: PDF (con tutti i dettagli pre-compilati)",
    ca_printSign: "Stampa e firma prima del check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Compila i Dettagli Charter Party Online",
    ca_fillLatinOnly: "Compila i tuoi dettagli direttamente nell'app (solo caratteri latini)",
    ca_close: "Chiudi",
    ca_fillNow: "Compila Ora",
    ca_charterPartySubmitted: "Charter Party Inviato",
    ca_legallyBinding: "LEGALMENTE VINCOLANTE",
    ca_submittedBy: "Inviato da:",
    ca_submittedOn: "Inviato il:",
    ca_lastModified: "Ultima modifica:",
    ca_submittedNotice: "Questo Charter Party è stato firmato digitalmente e inviato. È legalmente vincolante.",
    ca_firstName: "Nome",
    ca_lastName: "Cognome",
    ca_address: "Indirizzo",
    ca_idCard: "Carta d'Identità",
    ca_passport: "Passaporto",
    ca_idCardNumber: "Numero Carta d'Identità",
    ca_passportNumber: "Numero Passaporto",
    ca_taxNumberAfm: "Codice Fiscale",
    ca_taxOfficeDoy: "Ufficio Fiscale",
    ca_phone: "Telefono",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Sono anche lo Skipper",
    ca_chartererSignature: "Firma del Noleggiatore",
    ca_digitallySigned: "Firmato digitalmente",
    ca_clear: "Cancella",
    ca_skipperDetailsDiff: "Dettagli Skipper (persona diversa)",
    ca_skipperFullName: "Nome Completo Skipper",
    ca_skipperSignature: "Firma dello Skipper",
    ca_crewList: "Lista Equipaggio",
    ca_fillCrewOnline: "Compila i Dettagli Equipaggio Online",
    ca_fillCrewDesc: "Aggiungi i dettagli dei membri dell'equipaggio. Solo caratteri latini.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Membro dell'Equipaggio",
    ca_fullName: "Nome Completo",
    ca_passportNum: "Numero Passaporto",
    ca_dateOfBirth: "Data di Nascita",
    ca_nationality: "Nazionalità",
    ca_phoneShort: "Telefono",
    ca_addCrewMember: "Aggiungi Membro Equipaggio",
    ca_skipperLicense: "Patente dello Skipper",
    ca_skipperLicenseDesc: "Carica una foto o scansione chiara della patente dello skipper.",
    ca_remove: "Rimuovi",
    ca_addAnotherLicense: "Aggiungi Altra Patente",
    ca_takePhoto: "Scatta Foto",
    ca_useCamera: "Usa fotocamera",
    ca_uploadFile: "Carica File",
    ca_chooseGallery: "Scegli dalla galleria",
    ca_orDragDrop: "o trascina e rilascia",
    ca_charterPartyScanTitle: "Charter Party (Scansione Firmata)",
    ca_charterPartyScanDesc: "Carica il documento Charter Party firmato.",
    ca_crewListScanTitle: "Lista Equipaggio (Scansione Firmata)",
    ca_crewListScanDesc: "Carica il documento Lista Equipaggio firmato.",
    ca_docUploaded: "Documento caricato",
    ca_pdfWordImg: "PDF, Word o immagine",
    ca_submitAllDocs: "Invia Tutti i Documenti",
    ca_alertNoBookingData: "Nessun dato di prenotazione trovato.",
    ca_alertUploadLicense: "Si prega di caricare la patente dello skipper.",
    ca_alertFillFields: "Si prega di compilare:",
    ca_selectLanguage: "Seleziona Lingua",
    ca_inviteTitle: "Invita Equipaggio / Skipper via Email",
    ca_inviteDesc: "Invia un link sicuro a ogni membro dell equipaggio o skipper. Compilano i loro dati (sempre in inglese) e vengono aggiunti automaticamente alla Lista Equipaggio e al Charter Party.",
    ca_sendInvitation: "Invia Invito",
    ca_sending: "Invio...",
    ca_sentInvitations: "Inviti Inviati",
    ca_pending: "In attesa",
    ca_submittedShort: "Inviato",
    ca_resend: "Reinvia",
    ca_deleteBtn: "Elimina",
    ca_copyLink: "Copia Link",
    ca_linkCopied: "Link copiato",
    ca_invitationSentTo: "Invito inviato a",
    ca_emailRequired: "Email richiesta",
    ca_noBookingCodeMsg: "Nessun codice prenotazione",
    ca_invitationResent: "Invito reinviato",
    ca_resendFailed: "Reinvio fallito",
    ca_deleteConfirm: "Eliminare questo invito in attesa?",
  },
  de: { boatInventoryMap: "BOOTSINVENTAR - INTERAKTIVE KARTE", progress: "Fortschritt", sectionsCompleted: "Abschnitte abgeschlossen", clickHotspot: "Klicken Sie auf einen Punkt um das Inventar zu sehen", floorplanNotAvailable: "Grundriss für dieses Boot nicht verfügbar", backToMap: "Zurück zur Karte", toiletNoticeTitle: "HINWEIS ZUR TOILETTENVERSTOPFUNG", toiletText1: "Wenn die Kaution mit Schadensfreistellung (nicht erstattbar) bezahlt wurde, fallen keine Kosten für Toilettenverstopfung an.", toiletText2: "Wenn das Check-in abgeschlossen ist und keine Schäden oder Toilettenverstopfungen festgestellt werden, übernehmen Firma und Basis keine Verantwortung nach dem Check-in.", toiletAccept: "✓ Ich verstehe und akzeptiere", toiletAcceptRequired: "⚠ Bitte akzeptieren Sie den Hinweis zur Toilettenverstopfung!", pleaseComplete: "⚠ Bitte ausfüllen:", noPhotos: "Noch keine Fotos hinzugefügt.", pdfGenerated: "✅ PDF erstellt!", pdfError: "❌ PDF-Erstellungsfehler!", bookingNumber: "Buchungsnummer", yachtLabel: "Yacht", skipperLabel: "Skipper", checkinDate: "Check-in Datum", checkoutDate: "Check-out Datum", skipperSignatureTitle: "Unterschrift des Skippers *", enterItemName: "Artikelname eingeben!", equipmentTitle: "AUSRÜSTUNGSINVENTAR", selectAllOk: "ALLE AUSWÄHLEN OK", selectAllOkConfirm: "Auf eigene Verantwortung erkläre ich, dass alle Artikel korrekt sind. Wenn etwas nicht stimmt, ist das Unternehmen nicht verantwortlich. Möchten Sie fortfahren?",
    title: "ABNAHME- / ÜBERGABEPROTOKOLL",
    hullTitle: "RUMPF- & DECKINSPEKTION",
    dinghyTitle: "BEIBOOT UND AUSSENBORDMOTOR",
    safetyTitle: "SICHERHEITSAUSRÜSTUNG",
    cabinTitle: "KABINENAUSRÜSTUNG",
    optionalTitle: "OPTIONALE AUSRÜSTUNG",
    mode: "Modus",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Hinzufügen",
    newItemPlaceholder: "Neuer Artikelname",
    newItemPH: "Neuer Artikelname",
    price: "Preis",
    qty: "Menge",
    inOk: "Check-in",
    outOk: "Check-out OK",
    outNotOk: "Check-out NICHT OK",
    camera: "Kamera",
    boarding: "Einsteigen",
    attach: "Anhängen",
    note: "Falls etwas nicht in Ordnung ist, Grund angeben und Personal informieren",
    notePH: "Kommentare / Probleme hier...",
    picsTitle: "Falls etwas nicht in Ordnung ist, Fotos machen",
    remove: "Löschen",
    save: "Speichern",
    clear: "Leeren",
    next: "Weiter",
    prev: "Zurück",
    pdf: "PDF",
    home: "Start",
    mainsailGenoaTitle: "Großsegel & Genoa*",
    mainsailGenoaDesc: "Bitte lesen Sie die folgenden Informationen über Segel und Ausrüstung.",
    mainsailGenoaText: "Ich habe die Informationen zu Großsegel & Genoa gelesen.",
    mainsailGenoaLink: "Großsegel & Genoa Ausrüstung.",
    mainsailGenoaOk: "OK",
    diversTitle: "Taucherbericht*",
    diversUpload: "Bild hochladen",
    diversRequired: "Erforderlich",
    diversOk: "OK",
    diversFieldRequired: "Pflichtfeld",
    diversAgreementTitle: "Taucherbericht Akzeptanz*",
    diversAgreementText: "Ich habe den Taucherbericht gelesen und bestätige, dass ich ihn akzeptiere. Ich kann eine zusätzliche Inspektion auf eigene Kosten beim Check-in anfordern. Nur zertifizierte Taucher dürfen im Basishafen tauchen.",
    ok: "OK",
    employeeLogin: "Mitarbeiter-Login",
    logout: "Abmelden",
    ca_title: "Chartervertrag und Dokumente",
    ca_booking: "Buchung",
    ca_lastUpdated: "Zuletzt aktualisiert",
    ca_updating: "Aktualisierung...",
    ca_noBookingFound: "Keine Buchung gefunden",
    ca_backToHome: "Zurück zur Startseite",
    ca_noBookingMsg: "Keine Buchungsdaten für diese Sitzung gefunden.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Laden Sie Ihren personalisierten Boarding Pass mit allen Check-in-Details herunter.",
    ca_download: "Herunterladen",
    ca_preview: "Vorschau",
    ca_meetingLocation: "Treffpunkt: Marina Alimos - Charter Village Box A47",
    ca_contact: "Kontakt: Frau Maria Mazaraki (+30 6978196009)",
    ca_documents: "Dokumente",
    ca_documentsDesc: "Erstellen Sie automatisch Charter Party und Crew List als Word-Dokumente.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Crew Liste (DOCX)",
    ca_financialSummary: "Finanzübersicht",
    ca_charterAmountNet: "Charterbetrag (NETTO):",
    ca_vat12: "MwSt (12%):",
    ca_totalWithVat: "GESAMT (mit MwSt):",
    ca_depositRequired: "Erforderliche Anzahlung:",
    ca_paymentInfo: "Chartergebühr und Anzahlung sind gemäß Chartervertrag zu zahlen.",
    ca_pdfFormat: "Format: PDF (mit allen vorausgefüllten Details)",
    ca_printSign: "Drucken und unterschreiben Sie vor dem Check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Charter Party Daten Online Ausfüllen",
    ca_fillLatinOnly: "Füllen Sie Ihre Daten direkt in der App aus (nur lateinische Zeichen)",
    ca_close: "Schließen",
    ca_fillNow: "Jetzt Ausfüllen",
    ca_charterPartySubmitted: "Charter Party Eingereicht",
    ca_legallyBinding: "RECHTLICH VERBINDLICH",
    ca_submittedBy: "Eingereicht von:",
    ca_submittedOn: "Eingereicht am:",
    ca_lastModified: "Zuletzt geändert:",
    ca_submittedNotice: "Dieser Chartervertrag wurde digital unterzeichnet und eingereicht. Er ist rechtlich verbindlich.",
    ca_firstName: "Vorname",
    ca_lastName: "Nachname",
    ca_address: "Adresse",
    ca_idCard: "Ausweis",
    ca_passport: "Reisepass",
    ca_idCardNumber: "Ausweisnummer",
    ca_passportNumber: "Reisepassnummer",
    ca_taxNumberAfm: "Steuernummer",
    ca_taxOfficeDoy: "Finanzamt",
    ca_phone: "Telefon",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Ich bin auch der Skipper",
    ca_chartererSignature: "Unterschrift des Charterers",
    ca_digitallySigned: "Digital signiert",
    ca_clear: "Löschen",
    ca_skipperDetailsDiff: "Skipper-Daten (andere Person)",
    ca_skipperFullName: "Skipper Vollständiger Name",
    ca_skipperSignature: "Unterschrift des Skippers",
    ca_crewList: "Crew Liste",
    ca_fillCrewOnline: "Crew-Daten Online Ausfüllen",
    ca_fillCrewDesc: "Fügen Sie die Daten der Crew-Mitglieder hinzu. Nur lateinische Zeichen.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Crew-Mitglied",
    ca_fullName: "Vollständiger Name",
    ca_passportNum: "Reisepassnummer",
    ca_dateOfBirth: "Geburtsdatum",
    ca_nationality: "Nationalität",
    ca_phoneShort: "Telefon",
    ca_addCrewMember: "Crew-Mitglied Hinzufügen",
    ca_skipperLicense: "Skipper-Lizenz",
    ca_skipperLicenseDesc: "Laden Sie ein klares Foto oder einen Scan der Skipper-Lizenz hoch.",
    ca_remove: "Entfernen",
    ca_addAnotherLicense: "Weitere Lizenz Hinzufügen",
    ca_takePhoto: "Foto Aufnehmen",
    ca_useCamera: "Kamera verwenden",
    ca_uploadFile: "Datei Hochladen",
    ca_chooseGallery: "Aus Galerie wählen",
    ca_orDragDrop: "oder per Drag & Drop",
    ca_charterPartyScanTitle: "Charter Party (Unterschriebener Scan)",
    ca_charterPartyScanDesc: "Laden Sie das unterschriebene Charter Party-Dokument hoch.",
    ca_crewListScanTitle: "Crew Liste (Unterschriebener Scan)",
    ca_crewListScanDesc: "Laden Sie das unterschriebene Crew-Listen-Dokument hoch.",
    ca_docUploaded: "Dokument hochgeladen",
    ca_pdfWordImg: "PDF, Word oder Bild",
    ca_submitAllDocs: "Alle Dokumente Einreichen",
    ca_alertNoBookingData: "Keine Buchungsdaten gefunden.",
    ca_alertUploadLicense: "Bitte laden Sie die Skipper-Lizenz hoch.",
    ca_alertFillFields: "Bitte füllen Sie aus:",
    ca_selectLanguage: "Sprache wählen",
    ca_inviteTitle: "Crew / Skipper per E-Mail einladen",
    ca_inviteDesc: "Senden Sie einen sicheren Link an jedes Crew-Mitglied oder jeden Skipper. Sie füllen ihre Daten aus (immer auf Englisch) und werden automatisch zur Crew-Liste und zum Charter Party hinzugefügt.",
    ca_sendInvitation: "Einladung Senden",
    ca_sending: "Senden...",
    ca_sentInvitations: "Gesendete Einladungen",
    ca_pending: "Ausstehend",
    ca_submittedShort: "Übermittelt",
    ca_resend: "Erneut Senden",
    ca_deleteBtn: "Löschen",
    ca_copyLink: "Link Kopieren",
    ca_linkCopied: "Link kopiert",
    ca_invitationSentTo: "Einladung gesendet an",
    ca_emailRequired: "E-Mail erforderlich",
    ca_noBookingCodeMsg: "Kein Buchungscode",
    ca_invitationResent: "Einladung erneut gesendet",
    ca_resendFailed: "Erneutes Senden fehlgeschlagen",
    ca_deleteConfirm: "Diese ausstehende Einladung löschen?",
  },
  ru: { boatInventoryMap: "ИНВЕНТАРЬ СУДНА - ИНТЕРАКТИВНАЯ КАРТА", progress: "Прогресс", sectionsCompleted: "секций завершено", clickHotspot: "Нажмите на любую точку для просмотра инвентаря", floorplanNotAvailable: "План палубы недоступен для этого судна", backToMap: "Назад к карте", toiletNoticeTitle: "УВЕДОМЛЕНИЕ О ЗАСОРЕ УНИТАЗА", toiletText1: "Если залог оплачен с отказом от возмещения ущерба (невозвратный), плата за засор унитаза не взимается.", toiletText2: "Если check-in завершён и не обнаружено повреждений или засора унитаза, компания и база не несут ответственности после check-in.", toiletAccept: "✓ Понимаю и принимаю", toiletAcceptRequired: "⚠ Пожалуйста, примите уведомление о засоре унитаза!", pleaseComplete: "⚠ Пожалуйста, заполните:", noPhotos: "Фото ещё не добавлены.", pdfGenerated: "✅ PDF создан!", pdfError: "❌ Ошибка создания PDF!", bookingNumber: "Номер бронирования", yachtLabel: "Яхта", skipperLabel: "Шкипер", checkinDate: "Дата заезда", checkoutDate: "Дата выезда", skipperSignatureTitle: "Подпись Шкипера *", enterItemName: "Введите название!", equipmentTitle: "ИНВЕНТАРЬ ОБОРУДОВАНИЯ", selectAllOk: "ВЫБРАТЬ ВСЕ OK", selectAllOkConfirm: "Под свою ответственность заявляю, что все пункты верны. Если что-то неверно, компания не несет ответственности. Продолжить?",
    title: "АКТ ПРИЁМА / ПЕРЕДАЧИ",
    hullTitle: "ОСМОТР КОРПУСА И ПАЛУБЫ",
    dinghyTitle: "ТУЗИК И ПОДВЕСНОЙ МОТОР",
    safetyTitle: "СПАСАТЕЛЬНОЕ ОБОРУДОВАНИЕ",
    cabinTitle: "ИНВЕНТАРЬ КАЮТЫ",
    optionalTitle: "ДОПОЛНИТЕЛЬНОЕ ОБОРУДОВАНИЕ",
    mode: "Режим",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Добавить",
    newItemPlaceholder: "Название предмета",
    newItemPH: "Название предмета",
    price: "Цена",
    qty: "Кол.",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out НЕ OK",
    camera: "Камера",
    boarding: "Посадка",
    attach: "Прикрепить",
    note: "Если что-то не в порядке, опишите причину и сообщите персоналу",
    notePH: "Комментарии / проблемы...",
    picsTitle: "Если что-то не в порядке, сделайте фото",
    remove: "Удалить",
    save: "Сохранить",
    clear: "Очистить",
    next: "Далее",
    prev: "Назад",
    pdf: "PDF",
    home: "Главная",
    mainsailGenoaTitle: "Грот & Генуя*",
    mainsailGenoaDesc: "Пожалуйста, прочитайте информацию о парусах и оборудовании.",
    mainsailGenoaText: "Я прочитал информацию о Гроте & Генуе.",
    mainsailGenoaLink: "Оборудование Грота & Генуи.",
    mainsailGenoaOk: "OK",
    diversTitle: "Отчёт водолаза*",
    diversUpload: "Загрузить фото",
    diversRequired: "Обязательно",
    diversOk: "OK",
    diversFieldRequired: "Обязательное поле",
    diversAgreementTitle: "Принятие отчёта водолаза*",
    diversAgreementText: "Я прочитал отчёт водолаза и подтверждаю согласие. Я могу запросить дополнительную инспекцию за свой счёт при регистрации. Только сертифицированные водолазы допускаются к погружениям в базовой марине.",
    ok: "OK",
    employeeLogin: "Вход для сотрудников",
    logout: "Выход",
    ca_title: "Чартерное соглашение и документы",
    ca_booking: "Бронирование",
    ca_lastUpdated: "Последнее обновление",
    ca_updating: "Обновление...",
    ca_noBookingFound: "Бронирование не найдено",
    ca_backToHome: "На главную",
    ca_noBookingMsg: "Данные о бронировании для этой сессии не найдены.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Скачайте ваш персональный boarding pass со всеми деталями check-in.",
    ca_download: "Скачать",
    ca_preview: "Предпросмотр",
    ca_meetingLocation: "Место встречи: Marina Alimos - Charter Village Box A47",
    ca_contact: "Контакт: Мария Мазараки (+30 6978196009)",
    ca_documents: "Документы",
    ca_documentsDesc: "Автоматически создайте Charter Party и Crew List в формате Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Список экипажа (DOCX)",
    ca_financialSummary: "Финансовый отчёт",
    ca_charterAmountNet: "Сумма чартера (НЕТТО):",
    ca_vat12: "НДС (12%):",
    ca_totalWithVat: "ВСЕГО (с НДС):",
    ca_depositRequired: "Требуется депозит:",
    ca_paymentInfo: "Сумма чартера и депозит оплачиваются согласно чартерному договору.",
    ca_pdfFormat: "Формат: PDF (все детали предзаполнены)",
    ca_printSign: "Распечатайте и подпишите перед check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Заполнить Charter Party Онлайн",
    ca_fillLatinOnly: "Заполните ваши данные прямо в приложении (только латиница)",
    ca_close: "Закрыть",
    ca_fillNow: "Заполнить",
    ca_charterPartySubmitted: "Charter Party Отправлен",
    ca_legallyBinding: "ЮРИДИЧЕСКИ ОБЯЗЫВАЮЩИЙ",
    ca_submittedBy: "Отправлено:",
    ca_submittedOn: "Дата отправки:",
    ca_lastModified: "Последнее изменение:",
    ca_submittedNotice: "Этот Charter Party был подписан цифровой подписью и отправлен. Имеет юридическую силу.",
    ca_firstName: "Имя",
    ca_lastName: "Фамилия",
    ca_address: "Адрес",
    ca_idCard: "Удостоверение личности",
    ca_passport: "Паспорт",
    ca_idCardNumber: "Номер удостоверения",
    ca_passportNumber: "Номер паспорта",
    ca_taxNumberAfm: "ИНН",
    ca_taxOfficeDoy: "Налоговая",
    ca_phone: "Телефон",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Я также Шкипер",
    ca_chartererSignature: "Подпись Чартерера",
    ca_digitallySigned: "Подписано цифровой подписью",
    ca_clear: "Очистить",
    ca_skipperDetailsDiff: "Данные Шкипера (другое лицо)",
    ca_skipperFullName: "ФИО Шкипера",
    ca_skipperSignature: "Подпись Шкипера",
    ca_crewList: "Список экипажа",
    ca_fillCrewOnline: "Заполнить данные экипажа онлайн",
    ca_fillCrewDesc: "Добавьте данные членов экипажа. Только латинские символы.",
    ca_skipper: "Шкипер",
    ca_coSkipper: "Помощник шкипера",
    ca_crewMember: "Член экипажа",
    ca_fullName: "ФИО",
    ca_passportNum: "Номер паспорта",
    ca_dateOfBirth: "Дата рождения",
    ca_nationality: "Национальность",
    ca_phoneShort: "Телефон",
    ca_addCrewMember: "Добавить члена экипажа",
    ca_skipperLicense: "Лицензия шкипера",
    ca_skipperLicenseDesc: "Загрузите чёткое фото или скан лицензии шкипера.",
    ca_remove: "Удалить",
    ca_addAnotherLicense: "Добавить ещё лицензию",
    ca_takePhoto: "Сделать фото",
    ca_useCamera: "Использовать камеру",
    ca_uploadFile: "Загрузить файл",
    ca_chooseGallery: "Выбрать из галереи",
    ca_orDragDrop: "или перетащите",
    ca_charterPartyScanTitle: "Charter Party (Подписанный скан)",
    ca_charterPartyScanDesc: "Загрузите подписанный документ Charter Party.",
    ca_crewListScanTitle: "Список экипажа (Подписанный скан)",
    ca_crewListScanDesc: "Загрузите подписанный список экипажа.",
    ca_docUploaded: "Документ загружен",
    ca_pdfWordImg: "PDF, Word или изображение",
    ca_submitAllDocs: "Отправить все документы",
    ca_alertNoBookingData: "Данные бронирования не найдены.",
    ca_alertUploadLicense: "Пожалуйста, загрузите лицензию шкипера.",
    ca_alertFillFields: "Пожалуйста, заполните:",
    ca_selectLanguage: "Выбор языка",
    ca_inviteTitle: "Пригласить Экипаж / Шкипера по Email",
    ca_inviteDesc: "Отправьте безопасную ссылку каждому члену экипажа или шкиперу. Они заполняют свои данные (всегда на английском), которые автоматически добавляются в список экипажа и Charter Party.",
    ca_sendInvitation: "Отправить Приглашение",
    ca_sending: "Отправка...",
    ca_sentInvitations: "Отправленные Приглашения",
    ca_pending: "Ожидает",
    ca_submittedShort: "Отправлено",
    ca_resend: "Повторить",
    ca_deleteBtn: "Удалить",
    ca_copyLink: "Копировать Ссылку",
    ca_linkCopied: "Ссылка скопирована",
    ca_invitationSentTo: "Приглашение отправлено на",
    ca_emailRequired: "Требуется email",
    ca_noBookingCodeMsg: "Нет кода бронирования",
    ca_invitationResent: "Приглашение отправлено повторно",
    ca_resendFailed: "Повторная отправка не удалась",
    ca_deleteConfirm: "Удалить это ожидающее приглашение?",
  },
  fr: { boatInventoryMap: "INVENTAIRE BATEAU - CARTE INTERACTIVE", progress: "Progression", sectionsCompleted: "sections terminées", clickHotspot: "Cliquez sur un point pour voir l'inventaire", floorplanNotAvailable: "Plan non disponible pour ce bateau", backToMap: "Retour à la Carte", toiletNoticeTitle: "AVIS D'OBSTRUCTION DES TOILETTES", toiletText1: "Si le dépôt a été payé avec renonciation aux dommages (non remboursable), aucun frais ne s'applique pour l'obstruction des toilettes.", toiletText2: "Si le check-in est terminé et qu'aucun dommage ou obstruction des toilettes n'est détecté, la société et la base n'ont aucune responsabilité après le check-in.", toiletAccept: "✓ Je comprends et j'accepte", toiletAcceptRequired: "⚠ Veuillez accepter l'avis d'obstruction des toilettes!", pleaseComplete: "⚠ Veuillez compléter:", noPhotos: "Aucune photo ajoutée.", pdfGenerated: "✅ PDF généré!", pdfError: "❌ Erreur de génération PDF!", bookingNumber: "Numéro de réservation", yachtLabel: "Yacht", skipperLabel: "Skipper", checkinDate: "Date d'arrivée", checkoutDate: "Date de départ", skipperSignatureTitle: "Signature du Skipper *", enterItemName: "Entrez le nom!", equipmentTitle: "INVENTAIRE DE L'ÉQUIPEMENT", selectAllOk: "TOUT SÉLECTIONNER OK", selectAllOkConfirm: "Sous ma propre responsabilité, je déclare que tous les articles sont corrects. Si quelque chose n'est pas correct, la compagnie n'est pas responsable. Continuer?",
    title: "DÉCLARATION D'ACCEPTATION / LIVRAISON",
    hullTitle: "INSPECTION COQUE & PONT",
    dinghyTitle: "ANNEXE ET MOTEUR HORS-BORD",
    safetyTitle: "ÉQUIPEMENT DE SÉCURITÉ",
    cabinTitle: "INVENTAIRE CABINE",
    optionalTitle: "ÉQUIPEMENT OPTIONNEL",
    mode: "Mode",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Ajouter",
    newItemPlaceholder: "Nom du nouvel article",
    newItemPH: "Nom du nouvel article",
    price: "Prix",
    qty: "Qté",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NON OK",
    camera: "Photo",
    boarding: "Embarquement",
    attach: "Joindre",
    note: "Si quelque chose ne va pas, indiquez la raison et informez le personnel",
    notePH: "Commentaires / problèmes ici...",
    picsTitle: "Si quelque chose ne va pas, prenez des photos",
    remove: "Supprimer",
    save: "Enregistrer",
    clear: "Effacer",
    next: "Suivant",
    prev: "Retour",
    pdf: "PDF",
    home: "Accueil",
    mainsailGenoaTitle: "Grand-voile & Génois*",
    mainsailGenoaDesc: "Veuillez lire les informations suivantes sur les voiles et l'équipement.",
    mainsailGenoaText: "J'ai lu les informations sur la Grand-voile & le Génois.",
    mainsailGenoaLink: "Équipement Grand-voile & Génois.",
    mainsailGenoaOk: "OK",
    diversTitle: "Rapport de plongeur*",
    diversUpload: "Télécharger image",
    diversRequired: "Obligatoire",
    diversOk: "OK",
    diversFieldRequired: "Champ obligatoire",
    diversAgreementTitle: "Acceptation du rapport de plongeur*",
    diversAgreementText: "J'ai lu le rapport du plongeur et je confirme l'accepter. Je peux demander une inspection supplémentaire à mes frais lors du check-in. Seuls les plongeurs certifiés sont autorisés dans la marina de base.",
    ok: "OK",
    employeeLogin: "Connexion Employé",
    logout: "Déconnexion",
    ca_title: "Contrat de Charter et Documents",
    ca_booking: "Réservation",
    ca_lastUpdated: "Dernière mise à jour",
    ca_updating: "Mise à jour...",
    ca_noBookingFound: "Aucune Réservation Trouvée",
    ca_backToHome: "Retour à l'Accueil",
    ca_noBookingMsg: "Aucune donnée de réservation trouvée pour cette session.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Téléchargez votre boarding pass personnalisé avec tous les détails du check-in.",
    ca_download: "Télécharger",
    ca_preview: "Aperçu",
    ca_meetingLocation: "Lieu de rendez-vous: Marina Alimos - Charter Village Box A47",
    ca_contact: "Contact: Mme Maria Mazaraki (+30 6978196009)",
    ca_documents: "Documents",
    ca_documentsDesc: "Générez automatiquement Charter Party et Liste d'Équipage en documents Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Liste d'Équipage (DOCX)",
    ca_financialSummary: "Résumé Financier",
    ca_charterAmountNet: "Montant Charter (NET):",
    ca_vat12: "TVA (12%):",
    ca_totalWithVat: "TOTAL (avec TVA):",
    ca_depositRequired: "Acompte Requis:",
    ca_paymentInfo: "Le montant du charter et l'acompte sont payables selon le contrat de charter.",
    ca_pdfFormat: "Format: PDF (avec tous les détails pré-remplis)",
    ca_printSign: "Imprimez et signez avant le check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Remplir les Détails Charter Party en Ligne",
    ca_fillLatinOnly: "Remplissez vos détails directement dans l'app (caractères latins uniquement)",
    ca_close: "Fermer",
    ca_fillNow: "Remplir Maintenant",
    ca_charterPartySubmitted: "Charter Party Soumis",
    ca_legallyBinding: "JURIDIQUEMENT CONTRAIGNANT",
    ca_submittedBy: "Soumis par:",
    ca_submittedOn: "Soumis le:",
    ca_lastModified: "Dernière modification:",
    ca_submittedNotice: "Ce Charter Party a été signé numériquement et soumis. Il est juridiquement contraignant.",
    ca_firstName: "Prénom",
    ca_lastName: "Nom",
    ca_address: "Adresse",
    ca_idCard: "Carte d'Identité",
    ca_passport: "Passeport",
    ca_idCardNumber: "Numéro Carte d'Identité",
    ca_passportNumber: "Numéro de Passeport",
    ca_taxNumberAfm: "Numéro Fiscal",
    ca_taxOfficeDoy: "Bureau Fiscal",
    ca_phone: "Téléphone",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Je suis aussi le Skipper",
    ca_chartererSignature: "Signature du Charterer",
    ca_digitallySigned: "Signé numériquement",
    ca_clear: "Effacer",
    ca_skipperDetailsDiff: "Détails Skipper (personne différente)",
    ca_skipperFullName: "Nom Complet Skipper",
    ca_skipperSignature: "Signature du Skipper",
    ca_crewList: "Liste d'Équipage",
    ca_fillCrewOnline: "Remplir les Détails Équipage en Ligne",
    ca_fillCrewDesc: "Ajoutez les détails des membres d'équipage. Caractères latins uniquement.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Membre d'Équipage",
    ca_fullName: "Nom Complet",
    ca_passportNum: "Numéro de Passeport",
    ca_dateOfBirth: "Date de Naissance",
    ca_nationality: "Nationalité",
    ca_phoneShort: "Téléphone",
    ca_addCrewMember: "Ajouter Membre d'Équipage",
    ca_skipperLicense: "Licence du Skipper",
    ca_skipperLicenseDesc: "Téléchargez une photo ou scan clair de la licence du skipper.",
    ca_remove: "Supprimer",
    ca_addAnotherLicense: "Ajouter une Autre Licence",
    ca_takePhoto: "Prendre Photo",
    ca_useCamera: "Utiliser caméra",
    ca_uploadFile: "Télécharger Fichier",
    ca_chooseGallery: "Choisir depuis la galerie",
    ca_orDragDrop: "ou glisser-déposer",
    ca_charterPartyScanTitle: "Charter Party (Scan Signé)",
    ca_charterPartyScanDesc: "Téléchargez le document Charter Party signé.",
    ca_crewListScanTitle: "Liste d'Équipage (Scan Signé)",
    ca_crewListScanDesc: "Téléchargez le document Liste d'Équipage signé.",
    ca_docUploaded: "Document téléchargé",
    ca_pdfWordImg: "PDF, Word ou image",
    ca_submitAllDocs: "Soumettre Tous les Documents",
    ca_alertNoBookingData: "Aucune donnée de réservation trouvée.",
    ca_alertUploadLicense: "Veuillez télécharger la licence du skipper.",
    ca_alertFillFields: "Veuillez remplir:",
    ca_selectLanguage: "Choisir la langue",
    ca_inviteTitle: "Inviter Equipage / Skipper par Email",
    ca_inviteDesc: "Envoyez un lien sécurisé à chaque membre d equipage ou skipper. Ils remplissent leurs données (toujours en anglais) qui sont ajoutées automatiquement à la Liste d Equipage et au Charter Party.",
    ca_sendInvitation: "Envoyer Invitation",
    ca_sending: "Envoi...",
    ca_sentInvitations: "Invitations Envoyées",
    ca_pending: "En attente",
    ca_submittedShort: "Soumis",
    ca_resend: "Renvoyer",
    ca_deleteBtn: "Supprimer",
    ca_copyLink: "Copier Lien",
    ca_linkCopied: "Lien copié",
    ca_invitationSentTo: "Invitation envoyée à",
    ca_emailRequired: "Email requis",
    ca_noBookingCodeMsg: "Pas de code réservation",
    ca_invitationResent: "Invitation renvoyée",
    ca_resendFailed: "Échec du renvoi",
    ca_deleteConfirm: "Supprimer cette invitation en attente?",
  },
  ro: { boatInventoryMap: "INVENTAR BARCĂ - HARTĂ INTERACTIVĂ", progress: "Progres", sectionsCompleted: "secțiuni completate", clickHotspot: "Apăsați pe orice punct pentru a vedea inventarul", floorplanNotAvailable: "Planul nu este disponibil pentru această ambarcațiune", backToMap: "Înapoi la Hartă", toiletNoticeTitle: "AVIZ ÎNFUNDARE TOALETĂ", toiletText1: "Dacă depozitul a fost plătit cu damage waiver (nerambursabil), nu se aplică taxe pentru înfundarea toaletei.", toiletText2: "Dacă check-in-ul este finalizat și nu se detectează daune sau înfundare a toaletei, compania și baza nu au nicio responsabilitate după check-in.", toiletAccept: "✓ Înțeleg și accept", toiletAcceptRequired: "⚠ Vă rugăm să acceptați avizul de înfundare a toaletei!", pleaseComplete: "⚠ Vă rugăm să completați:", noPhotos: "Nicio fotografie adăugată.", pdfGenerated: "✅ PDF generat!", pdfError: "❌ Eroare la generarea PDF!", bookingNumber: "Număr rezervare", yachtLabel: "Iaht", skipperLabel: "Skipper", checkinDate: "Data Check-in", checkoutDate: "Data Check-out", skipperSignatureTitle: "Semnătura Skipperului *", enterItemName: "Introduceți numele!", equipmentTitle: "INVENTAR ECHIPAMENTE", selectAllOk: "SELECTEAZĂ TOATE OK", selectAllOkConfirm: "Pe propria răspundere declar că toate articolele sunt corecte. Dacă ceva nu este corect, compania nu este responsabilă. Continuați?",
    title: "DECLARAȚIE DE ACCEPTARE / PREDARE",
    hullTitle: "INSPECȚIE CARENĂ ȘI PUNTE",
    dinghyTitle: "BARCĂ AUXILIARĂ ȘI MOTOR",
    safetyTitle: "ECHIPAMENT DE SIGURANȚĂ",
    cabinTitle: "INVENTAR CABINĂ",
    optionalTitle: "ECHIPAMENT OPȚIONAL",
    mode: "Mod",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Adaugă",
    newItemPlaceholder: "Nume articol nou",
    newItemPH: "Nume articol nou",
    price: "Preț",
    qty: "Cant.",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NU OK",
    camera: "Cameră",
    boarding: "Îmbarcare",
    attach: "Atașează",
    note: "Dacă ceva nu este în regulă, scrieți motivul și informați personalul",
    notePH: "Comentarii / probleme aici...",
    picsTitle: "Dacă ceva nu este în regulă, faceți fotografii",
    remove: "Șterge",
    save: "Salvează",
    clear: "Șterge tot",
    next: "Următorul",
    prev: "Înapoi",
    pdf: "PDF",
    home: "Acasă",
    mainsailGenoaTitle: "Velă mare și Genoa*",
    mainsailGenoaDesc: "Vă rugăm să citiți informațiile despre vele și echipament.",
    mainsailGenoaText: "Am citit informațiile despre Vela mare & Genoa.",
    mainsailGenoaLink: "Echipament Velă mare & Genoa.",
    mainsailGenoaOk: "OK",
    diversTitle: "Raportul scafandrului*",
    diversUpload: "Încarcă imagine",
    diversRequired: "Obligatoriu",
    diversOk: "OK",
    diversFieldRequired: "Câmp obligatoriu",
    diversAgreementTitle: "Acceptarea raportului scafandrului*",
    diversAgreementText: "Am citit raportul scafandrului și confirm că îl accept. Pot solicita o inspecție suplimentară pe cheltuiala mea la check-in. Doar scafandrii certificați au voie să se scufunde în marina de bază.",
    ok: "OK",
    employeeLogin: "Autentificare Angajat",
    logout: "Deconectare",
    ca_title: "Contract de Charter și Documente",
    ca_booking: "Rezervare",
    ca_lastUpdated: "Ultima actualizare",
    ca_updating: "Se actualizează...",
    ca_noBookingFound: "Rezervare Negăsită",
    ca_backToHome: "Înapoi la Pagina Principală",
    ca_noBookingMsg: "Nu s-au găsit date de rezervare pentru această sesiune.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Descărcați boarding pass-ul personalizat cu toate detaliile check-in.",
    ca_download: "Descarcă",
    ca_preview: "Previzualizare",
    ca_meetingLocation: "Locul întâlnirii: Marina Alimos - Charter Village Box A47",
    ca_contact: "Contact: Dna Maria Mazaraki (+30 6978196009)",
    ca_documents: "Documente",
    ca_documentsDesc: "Generați automat Charter Party și Lista Echipaj ca documente Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Lista Echipaj (DOCX)",
    ca_financialSummary: "Sumar Financiar",
    ca_charterAmountNet: "Suma Charter (NET):",
    ca_vat12: "TVA (12%):",
    ca_totalWithVat: "TOTAL (cu TVA):",
    ca_depositRequired: "Depozit Necesar:",
    ca_paymentInfo: "Suma de charter și depozitul sunt plătibile conform contractului de charter.",
    ca_pdfFormat: "Format: PDF (cu toate detaliile precompletate)",
    ca_printSign: "Tipăriți și semnați înainte de check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Completați Detaliile Charter Party Online",
    ca_fillLatinOnly: "Completați detaliile direct în aplicație (doar caractere latine)",
    ca_close: "Închide",
    ca_fillNow: "Completați Acum",
    ca_charterPartySubmitted: "Charter Party Trimis",
    ca_legallyBinding: "OBLIGATORIU JURIDIC",
    ca_submittedBy: "Trimis de:",
    ca_submittedOn: "Trimis la:",
    ca_lastModified: "Ultima modificare:",
    ca_submittedNotice: "Acest Charter Party a fost semnat digital și trimis. Este obligatoriu juridic.",
    ca_firstName: "Prenume",
    ca_lastName: "Nume",
    ca_address: "Adresă",
    ca_idCard: "Carte de Identitate",
    ca_passport: "Pașaport",
    ca_idCardNumber: "Număr CI",
    ca_passportNumber: "Număr Pașaport",
    ca_taxNumberAfm: "Cod Fiscal",
    ca_taxOfficeDoy: "Administrație Fiscală",
    ca_phone: "Telefon",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Sunt și Skipper",
    ca_chartererSignature: "Semnătura Charterer-ului",
    ca_digitallySigned: "Semnat digital",
    ca_clear: "Șterge",
    ca_skipperDetailsDiff: "Detalii Skipper (persoană diferită)",
    ca_skipperFullName: "Nume Complet Skipper",
    ca_skipperSignature: "Semnătura Skipperului",
    ca_crewList: "Lista Echipaj",
    ca_fillCrewOnline: "Completați Detaliile Echipaj Online",
    ca_fillCrewDesc: "Adăugați detaliile membrilor echipajului. Doar caractere latine.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Membru Echipaj",
    ca_fullName: "Nume Complet",
    ca_passportNum: "Număr Pașaport",
    ca_dateOfBirth: "Data Nașterii",
    ca_nationality: "Naționalitate",
    ca_phoneShort: "Telefon",
    ca_addCrewMember: "Adaugă Membru Echipaj",
    ca_skipperLicense: "Licența Skipperului",
    ca_skipperLicenseDesc: "Încărcați o fotografie sau scan clar al licenței skipperului.",
    ca_remove: "Șterge",
    ca_addAnotherLicense: "Adaugă Altă Licență",
    ca_takePhoto: "Fă Poză",
    ca_useCamera: "Utilizează camera",
    ca_uploadFile: "Încarcă Fișier",
    ca_chooseGallery: "Alege din galerie",
    ca_orDragDrop: "sau trageți și plasați",
    ca_charterPartyScanTitle: "Charter Party (Scan Semnat)",
    ca_charterPartyScanDesc: "Încărcați documentul Charter Party semnat.",
    ca_crewListScanTitle: "Lista Echipaj (Scan Semnat)",
    ca_crewListScanDesc: "Încărcați documentul Lista Echipaj semnat.",
    ca_docUploaded: "Document încărcat",
    ca_pdfWordImg: "PDF, Word sau imagine",
    ca_submitAllDocs: "Trimite Toate Documentele",
    ca_alertNoBookingData: "Nu s-au găsit date de rezervare.",
    ca_alertUploadLicense: "Vă rugăm să încărcați licența skipperului.",
    ca_alertFillFields: "Vă rugăm să completați:",
    ca_selectLanguage: "Alege limba",
    ca_inviteTitle: "Invită Echipaj / Skipper prin Email",
    ca_inviteDesc: "Trimiteți un link securizat fiecărui membru al echipajului sau skipperului. Își completează datele (întotdeauna în engleză) și sunt adăugate automat la Lista Echipaj și Charter Party.",
    ca_sendInvitation: "Trimite Invitație",
    ca_sending: "Se trimite...",
    ca_sentInvitations: "Invitații Trimise",
    ca_pending: "În așteptare",
    ca_submittedShort: "Trimis",
    ca_resend: "Retrimite",
    ca_deleteBtn: "Șterge",
    ca_copyLink: "Copiază Link",
    ca_linkCopied: "Link copiat",
    ca_invitationSentTo: "Invitație trimisă către",
    ca_emailRequired: "Email necesar",
    ca_noBookingCodeMsg: "Fără cod rezervare",
    ca_invitationResent: "Invitație retrimisă",
    ca_resendFailed: "Retrimitere eșuată",
    ca_deleteConfirm: "Ștergeți această invitație în așteptare?",
  },
  pl: { boatInventoryMap: "INWENTARZ ŁODZI - MAPA INTERAKTYWNA", progress: "Postęp", sectionsCompleted: "sekcji ukończonych", clickHotspot: "Kliknij na dowolny punkt aby zobaczyć inwentarz", floorplanNotAvailable: "Plan niedostępny dla tej łodzi", backToMap: "Powrót do Mapy", toiletNoticeTitle: "OSTRZEŻENIE O ZATKANIU TOALETY", toiletText1: "Jeśli depozyt został wpłacony z damage waiver (bezzwrotny), nie nalicza się opłat za zatkanie toalety.", toiletText2: "Jeśli check-in został zakończony i nie wykryto uszkodzeń ani zatkania toalety, firma i baza nie ponoszą odpowiedzialności po check-in.", toiletAccept: "✓ Rozumiem i akceptuję", toiletAcceptRequired: "⚠ Proszę zaakceptować ostrzeżenie o zatkaniu toalety!", pleaseComplete: "⚠ Proszę uzupełnić:", noPhotos: "Nie dodano jeszcze zdjęć.", pdfGenerated: "✅ PDF wygenerowany!", pdfError: "❌ Błąd generowania PDF!", bookingNumber: "Numer rezerwacji", yachtLabel: "Jacht", skipperLabel: "Skipper", checkinDate: "Data zameldowania", checkoutDate: "Data wymeldowania", skipperSignatureTitle: "Podpis Skippera *", enterItemName: "Wprowadź nazwę!", equipmentTitle: "INWENTARZ WYPOSAŻENIA", selectAllOk: "ZAZNACZ WSZYSTKO OK", selectAllOkConfirm: "Na własną odpowiedzialność oświadczam, że wszystkie elementy są prawidłowe. Jeśli coś nie jest prawidłowe, firma nie ponosi odpowiedzialności. Kontynuować?",
    title: "OŚWIADCZENIE ODBIORU / PRZEKAZANIA",
    hullTitle: "INSPEKCJA KADŁUBA I POKŁADU",
    dinghyTitle: "PONTON I SILNIK ZABURTOWY",
    safetyTitle: "WYPOSAŻENIE BEZPIECZEŃSTWA",
    cabinTitle: "WYPOSAŻENIE KABINY",
    optionalTitle: "WYPOSAŻENIE DODATKOWE",
    mode: "Tryb",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Dodaj",
    newItemPlaceholder: "Nazwa nowego przedmiotu",
    newItemPH: "Nazwa nowego przedmiotu",
    price: "Cena",
    qty: "Ilość",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NIE OK",
    camera: "Aparat",
    boarding: "Wejście",
    attach: "Załącz",
    note: "Jeśli coś jest nie tak, opisz powód i poinformuj personel",
    notePH: "Komentarze / problemy...",
    picsTitle: "Jeśli coś jest nie tak, zrób zdjęcia",
    remove: "Usuń",
    save: "Zapisz",
    clear: "Wyczyść",
    next: "Dalej",
    prev: "Wstecz",
    pdf: "PDF",
    home: "Strona główna",
    mainsailGenoaTitle: "Grot & Genua*",
    mainsailGenoaDesc: "Proszę przeczytać poniższe informacje o żaglach i wyposażeniu.",
    mainsailGenoaText: "Przeczytałem informacje o Grocie & Genui.",
    mainsailGenoaLink: "Wyposażenie Grota & Genui.",
    mainsailGenoaOk: "OK",
    diversTitle: "Raport nurka*",
    diversUpload: "Prześlij zdjęcie",
    diversRequired: "Wymagane",
    diversOk: "OK",
    diversFieldRequired: "Pole wymagane",
    diversAgreementTitle: "Akceptacja raportu nurka*",
    diversAgreementText: "Przeczytałem raport nurka i potwierdzam jego akceptację. Mogę poprosić o dodatkową inspekcję na własny koszt podczas zameldowania. Tylko certyfikowani nurkowie mogą nurkować w marinie bazowej.",
    ok: "OK",
    employeeLogin: "Logowanie pracownika",
    logout: "Wyloguj",
    ca_title: "Umowa Czarterowa i Dokumenty",
    ca_booking: "Rezerwacja",
    ca_lastUpdated: "Ostatnia aktualizacja",
    ca_updating: "Aktualizacja...",
    ca_noBookingFound: "Nie znaleziono rezerwacji",
    ca_backToHome: "Powrót do strony głównej",
    ca_noBookingMsg: "Nie znaleziono danych rezerwacji dla tej sesji.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Pobierz spersonalizowany boarding pass ze wszystkimi szczegółami check-in.",
    ca_download: "Pobierz",
    ca_preview: "Podgląd",
    ca_meetingLocation: "Miejsce spotkania: Marina Alimos - Charter Village Box A47",
    ca_contact: "Kontakt: Pani Maria Mazaraki (+30 6978196009)",
    ca_documents: "Dokumenty",
    ca_documentsDesc: "Automatycznie wygeneruj Charter Party i Listę Załogi jako dokumenty Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Lista Załogi (DOCX)",
    ca_financialSummary: "Podsumowanie finansowe",
    ca_charterAmountNet: "Kwota Czarteru (NETTO):",
    ca_vat12: "VAT (12%):",
    ca_totalWithVat: "RAZEM (z VAT):",
    ca_depositRequired: "Wymagana Zaliczka:",
    ca_paymentInfo: "Kwota czarteru i zaliczka płatne zgodnie z umową czarterową.",
    ca_pdfFormat: "Format: PDF (ze wszystkimi szczegółami)",
    ca_printSign: "Wydrukuj i podpisz przed check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Wypełnij Szczegóły Charter Party Online",
    ca_fillLatinOnly: "Wypełnij dane bezpośrednio w aplikacji (tylko znaki łacińskie)",
    ca_close: "Zamknij",
    ca_fillNow: "Wypełnij Teraz",
    ca_charterPartySubmitted: "Charter Party Wysłany",
    ca_legallyBinding: "PRAWNIE WIĄŻĄCY",
    ca_submittedBy: "Wysłane przez:",
    ca_submittedOn: "Wysłano:",
    ca_lastModified: "Ostatnia modyfikacja:",
    ca_submittedNotice: "Ten Charter Party został podpisany cyfrowo i wysłany. Jest prawnie wiążący.",
    ca_firstName: "Imię",
    ca_lastName: "Nazwisko",
    ca_address: "Adres",
    ca_idCard: "Dowód Osobisty",
    ca_passport: "Paszport",
    ca_idCardNumber: "Numer Dowodu",
    ca_passportNumber: "Numer Paszportu",
    ca_taxNumberAfm: "NIP",
    ca_taxOfficeDoy: "Urząd Skarbowy",
    ca_phone: "Telefon",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "Jestem też Skipperem",
    ca_chartererSignature: "Podpis Czarterującego",
    ca_digitallySigned: "Podpisano cyfrowo",
    ca_clear: "Wyczyść",
    ca_skipperDetailsDiff: "Dane Skippera (inna osoba)",
    ca_skipperFullName: "Pełne Imię Skippera",
    ca_skipperSignature: "Podpis Skippera",
    ca_crewList: "Lista Załogi",
    ca_fillCrewOnline: "Wypełnij Dane Załogi Online",
    ca_fillCrewDesc: "Dodaj dane członków załogi. Tylko znaki łacińskie.",
    ca_skipper: "Skipper",
    ca_coSkipper: "Co-Skipper",
    ca_crewMember: "Członek Załogi",
    ca_fullName: "Pełne Imię",
    ca_passportNum: "Numer Paszportu",
    ca_dateOfBirth: "Data Urodzenia",
    ca_nationality: "Narodowość",
    ca_phoneShort: "Telefon",
    ca_addCrewMember: "Dodaj Członka Załogi",
    ca_skipperLicense: "Licencja Skippera",
    ca_skipperLicenseDesc: "Prześlij wyraźne zdjęcie lub skan licencji skippera.",
    ca_remove: "Usuń",
    ca_addAnotherLicense: "Dodaj Kolejną Licencję",
    ca_takePhoto: "Zrób Zdjęcie",
    ca_useCamera: "Użyj kamery",
    ca_uploadFile: "Wgraj Plik",
    ca_chooseGallery: "Wybierz z galerii",
    ca_orDragDrop: "lub przeciągnij i upuść",
    ca_charterPartyScanTitle: "Charter Party (Podpisany Skan)",
    ca_charterPartyScanDesc: "Prześlij podpisany dokument Charter Party.",
    ca_crewListScanTitle: "Lista Załogi (Podpisany Skan)",
    ca_crewListScanDesc: "Prześlij podpisany dokument Lista Załogi.",
    ca_docUploaded: "Dokument wgrany",
    ca_pdfWordImg: "PDF, Word lub obraz",
    ca_submitAllDocs: "Wyślij Wszystkie Dokumenty",
    ca_alertNoBookingData: "Nie znaleziono danych rezerwacji.",
    ca_alertUploadLicense: "Proszę wgrać licencję skippera.",
    ca_alertFillFields: "Proszę wypełnić:",
    ca_selectLanguage: "Wybierz język",
    ca_inviteTitle: "Zaproś Załogę / Skippera przez Email",
    ca_inviteDesc: "Wyślij bezpieczny link do każdego członka załogi lub skippera. Wypełniają swoje dane (zawsze po angielsku) i są automatycznie dodawane do Listy Załogi i Charter Party.",
    ca_sendInvitation: "Wyślij Zaproszenie",
    ca_sending: "Wysyłanie...",
    ca_sentInvitations: "Wysłane Zaproszenia",
    ca_pending: "Oczekujące",
    ca_submittedShort: "Przesłane",
    ca_resend: "Wyślij Ponownie",
    ca_deleteBtn: "Usuń",
    ca_copyLink: "Kopiuj Link",
    ca_linkCopied: "Link skopiowany",
    ca_invitationSentTo: "Zaproszenie wysłane do",
    ca_emailRequired: "Email wymagany",
    ca_noBookingCodeMsg: "Brak kodu rezerwacji",
    ca_invitationResent: "Zaproszenie ponownie wysłane",
    ca_resendFailed: "Ponowne wysłanie nieudane",
    ca_deleteConfirm: "Usunąć to oczekujące zaproszenie?",
  },
  he: { boatInventoryMap: "מלאי סירה - מפה אינטראקטיבית", progress: "התקדמות", sectionsCompleted: "חלקים הושלמו", clickHotspot: "לחץ על נקודה כלשהי לצפייה במלאי", floorplanNotAvailable: "תוכנית לא זמינה לסירה זו", backToMap: "חזרה למפה", toiletNoticeTitle: "הודעה על סתימת שירותים", toiletText1: "במקרה שהפיקדון שולם עם ויתור על נזק (לא ניתן להחזרה), לא חל חיוב על סתימת שירותים.", toiletText2: "אם הצ'ק-אין הושלם ולא נמצאו נזקים או סתימת שירותים, לחברה ולבסיס אין אחריות לאחר הצ'ק-אין.", toiletAccept: "✓ אני מבין ומקבל", toiletAcceptRequired: "⚠ אנא אשר את ההודעה על סתימת שירותים!", pleaseComplete: "⚠ אנא השלם:", noPhotos: "לא נוספו תמונות עדיין.", pdfGenerated: "✅ PDF נוצר!", pdfError: "❌ שגיאת יצירת PDF!", bookingNumber: "מספר הזמנה", yachtLabel: "יאכטה", skipperLabel: "סקיפר", checkinDate: "תאריך כניסה", checkoutDate: "תאריך יציאה", skipperSignatureTitle: "חתימת הסקיפר *", enterItemName: "הזן שם פריט!", equipmentTitle: "רשימת ציוד", selectAllOk: "סמן הכל כתקין", selectAllOkConfirm: "על אחריותי אני מצהיר שכל הפריטים תקינים. אם משהו לא בסדר, החברה אינה אחראית. להמשיך?",
    title: "הצהרת קבלה / מסירה",
    hullTitle: "בדיקת גוף וסיפון",
    dinghyTitle: "סירת עזר ומנוע חיצוני",
    safetyTitle: "ציוד בטיחות",
    cabinTitle: "ציוד תא",
    optionalTitle: "ציוד אופציונלי",
    mode: "מצב",
    checkIn: "צ׳ק-אין",
    checkOut: "צ׳ק-אאוט",
    addItem: "הוסף",
    newItemPlaceholder: "שם פריט חדש",
    newItemPH: "שם פריט חדש",
    price: "מחיר",
    qty: "כמות",
    inOk: "צ׳ק-אין",
    outOk: "צ׳ק-אאוט OK",
    outNotOk: "צ׳ק-אאוט לא OK",
    camera: "מצלמה",
    boarding: "עלייה",
    attach: "צרף",
    note: "אם משהו לא תקין, כתוב את הסיבה ויידע את הצוות",
    notePH: "הערות / בעיות כאן...",
    picsTitle: "אם משהו לא תקין, צלם תמונות",
    remove: "מחק",
    save: "שמור",
    clear: "נקה",
    next: "הבא",
    prev: "חזרה",
    pdf: "PDF",
    home: "בית",
    mainsailGenoaTitle: "מפרש ראשי וג'נואה*",
    mainsailGenoaDesc: "אנא קרא את המידע הבא על מפרשים וציוד.",
    mainsailGenoaText: "קראתי את המידע על המפרש הראשי והג'נואה.",
    mainsailGenoaLink: "ציוד מפרש ראשי וג'נואה.",
    mainsailGenoaOk: "OK",
    diversTitle: "דוח צוללן*",
    diversUpload: "העלה תמונה",
    diversRequired: "חובה",
    diversOk: "OK",
    diversFieldRequired: "שדה חובה",
    diversAgreementTitle: "אישור דוח צוללן*",
    diversAgreementText: "קראתי את דוח הצוללן ומאשר שאני מקבל אותו. אני יודע שאני יכול לבקש בדיקה נוספת על חשבוני בעת הצ'ק-אין. רק צוללנים מוסמכים רשאים לצלול במרינה הבסיסית.",
    ok: "OK",
    employeeLogin: "כניסת עובד",
    logout: "התנתק",
    ca_title: "הסכם צ'ארטר ומסמכים",
    ca_booking: "הזמנה",
    ca_lastUpdated: "עדכון אחרון",
    ca_updating: "מתעדכן...",
    ca_noBookingFound: "הזמנה לא נמצאה",
    ca_backToHome: "חזרה לדף הבית",
    ca_noBookingMsg: "לא נמצאו נתוני הזמנה עבור סשן זה.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "הורד את כרטיס העלייה המותאם אישית עם כל פרטי הצ'ק-אין.",
    ca_download: "הורד",
    ca_preview: "תצוגה מקדימה",
    ca_meetingLocation: "מקום מפגש: Marina Alimos - Charter Village Box A47",
    ca_contact: "איש קשר: גב' מריה מזרקי (+30 6978196009)",
    ca_documents: "מסמכים",
    ca_documentsDesc: "צור אוטומטית Charter Party ורשימת צוות כמסמכי Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "רשימת צוות (DOCX)",
    ca_financialSummary: "סיכום פיננסי",
    ca_charterAmountNet: "סכום צ'ארטר (נטו):",
    ca_vat12: "מע\"מ (12%):",
    ca_totalWithVat: "סה\"כ (כולל מע\"מ):",
    ca_depositRequired: "פיקדון נדרש:",
    ca_paymentInfo: "סכום הצ'ארטר והפיקדון משולמים בהתאם לחוזה הצ'ארטר.",
    ca_pdfFormat: "פורמט: PDF (עם כל הפרטים מוכנים מראש)",
    ca_printSign: "הדפס וחתום לפני הצ'ק-אין",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "מלא פרטי Charter Party באופן מקוון",
    ca_fillLatinOnly: "מלא פרטים ישירות באפליקציה (אותיות לטיניות בלבד)",
    ca_close: "סגור",
    ca_fillNow: "מלא עכשיו",
    ca_charterPartySubmitted: "Charter Party נשלח",
    ca_legallyBinding: "מחייב משפטית",
    ca_submittedBy: "נשלח על ידי:",
    ca_submittedOn: "נשלח בתאריך:",
    ca_lastModified: "שונה לאחרונה:",
    ca_submittedNotice: "Charter Party זה נחתם דיגיטלית ונשלח. הוא מחייב משפטית.",
    ca_firstName: "שם פרטי",
    ca_lastName: "שם משפחה",
    ca_address: "כתובת",
    ca_idCard: "תעודת זהות",
    ca_passport: "דרכון",
    ca_idCardNumber: "מספר תעודת זהות",
    ca_passportNumber: "מספר דרכון",
    ca_taxNumberAfm: "מספר עוסק",
    ca_taxOfficeDoy: "משרד המס",
    ca_phone: "טלפון",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "אני גם הסקיפר",
    ca_chartererSignature: "חתימת השוכר",
    ca_digitallySigned: "נחתם דיגיטלית",
    ca_clear: "נקה",
    ca_skipperDetailsDiff: "פרטי סקיפר (אדם אחר)",
    ca_skipperFullName: "שם מלא של הסקיפר",
    ca_skipperSignature: "חתימת הסקיפר",
    ca_crewList: "רשימת צוות",
    ca_fillCrewOnline: "מלא פרטי צוות באופן מקוון",
    ca_fillCrewDesc: "הוסף את פרטי חברי הצוות. אותיות לטיניות בלבד.",
    ca_skipper: "סקיפר",
    ca_coSkipper: "עוזר סקיפר",
    ca_crewMember: "חבר צוות",
    ca_fullName: "שם מלא",
    ca_passportNum: "מספר דרכון",
    ca_dateOfBirth: "תאריך לידה",
    ca_nationality: "לאום",
    ca_phoneShort: "טלפון",
    ca_addCrewMember: "הוסף חבר צוות",
    ca_skipperLicense: "רישיון סקיפר",
    ca_skipperLicenseDesc: "העלה תמונה ברורה או סריקה של רישיון הסקיפר.",
    ca_remove: "הסר",
    ca_addAnotherLicense: "הוסף רישיון נוסף",
    ca_takePhoto: "צלם תמונה",
    ca_useCamera: "השתמש במצלמה",
    ca_uploadFile: "העלה קובץ",
    ca_chooseGallery: "בחר מהגלריה",
    ca_orDragDrop: "או גרור ושחרר",
    ca_charterPartyScanTitle: "Charter Party (סריקה חתומה)",
    ca_charterPartyScanDesc: "העלה את מסמך Charter Party החתום.",
    ca_crewListScanTitle: "רשימת צוות (סריקה חתומה)",
    ca_crewListScanDesc: "העלה את מסמך רשימת הצוות החתום.",
    ca_docUploaded: "מסמך הועלה",
    ca_pdfWordImg: "PDF, Word או תמונה",
    ca_submitAllDocs: "שלח את כל המסמכים",
    ca_alertNoBookingData: "לא נמצאו נתוני הזמנה.",
    ca_alertUploadLicense: "נא העלה את רישיון הסקיפר.",
    ca_alertFillFields: "נא למלא:",
    ca_selectLanguage: "בחר שפה",
    ca_inviteTitle: "הזמן צוות סקיפר באימייל",
    ca_inviteDesc: "שלח קישור מאובטח לכל חבר צוות או סקיפר. הם ממלאים את הפרטים שלהם (תמיד באנגלית) והנתונים מתווספים אוטומטית לרשימת הצוות ול-Charter Party.",
    ca_sendInvitation: "שלח הזמנה",
    ca_sending: "שולח...",
    ca_sentInvitations: "הזמנות שנשלחו",
    ca_pending: "ממתין",
    ca_submittedShort: "נשלח",
    ca_resend: "שלח שוב",
    ca_deleteBtn: "מחק",
    ca_copyLink: "העתק קישור",
    ca_linkCopied: "הקישור הועתק",
    ca_invitationSentTo: "הזמנה נשלחה אל",
    ca_emailRequired: "נדרש אימייל",
    ca_noBookingCodeMsg: "חסר קוד הזמנה",
    ca_invitationResent: "ההזמנה נשלחה שוב",
    ca_resendFailed: "שליחה חוזרת נכשלה",
    ca_deleteConfirm: "למחוק הזמנה ממתינה זו?",
  },
  es: { boatInventoryMap: "INVENTARIO BARCO - MAPA INTERACTIVO", progress: "Progreso", sectionsCompleted: "secciones completadas", clickHotspot: "Haga clic en cualquier punto para ver el inventario", floorplanNotAvailable: "Plano no disponible para esta embarcación", backToMap: "Volver al Mapa", toiletNoticeTitle: "AVISO DE ATASCO DEL INODORO", toiletText1: "Si el depósito se ha pagado con exención de daños (no reembolsable), no se aplica cargo por atasco del inodoro.", toiletText2: "Si el check-in se completa y no se detectan daños ni atascos del inodoro, la empresa y la base no tienen responsabilidad después del check-in.", toiletAccept: "✓ Entiendo y acepto", toiletAcceptRequired: "⚠ ¡Acepte el aviso de atasco del inodoro!", pleaseComplete: "⚠ Por favor complete:", noPhotos: "No se han añadido fotos.", pdfGenerated: "✅ ¡PDF generado!", pdfError: "❌ ¡Error al generar PDF!", bookingNumber: "Número de reserva", yachtLabel: "Yate", skipperLabel: "Patrón", checkinDate: "Fecha de entrada", checkoutDate: "Fecha de salida", skipperSignatureTitle: "Firma del Patrón *", enterItemName: "Introduzca el nombre!", equipmentTitle: "INVENTARIO DE EQUIPOS", selectAllOk: "SELECCIONAR TODO OK", selectAllOkConfirm: "Bajo mi propia responsabilidad declaro que todos los artículos son correctos. Si algo no es correcto, la empresa no es responsable. ¿Desea continuar?",
    title: "DECLARACIÓN DE ACEPTACIÓN / ENTREGA",
    hullTitle: "INSPECCIÓN DE CASCO Y CUBIERTA",
    dinghyTitle: "BOTE AUXILIAR Y MOTOR FUERABORDA",
    safetyTitle: "EQUIPO DE SEGURIDAD",
    cabinTitle: "INVENTARIO DE CABINA",
    optionalTitle: "EQUIPO OPCIONAL",
    mode: "Modo",
    checkIn: "Check-in",
    checkOut: "Check-out",
    addItem: "Añadir",
    newItemPlaceholder: "Nombre del artículo",
    newItemPH: "Nombre del artículo",
    price: "Precio",
    qty: "Cant.",
    inOk: "check-in",
    outOk: "check-out OK",
    outNotOk: "check-out NO OK",
    camera: "Cámara",
    boarding: "Embarque",
    attach: "Adjuntar",
    note: "Si algo no está bien, escriba el motivo e informe al personal",
    notePH: "Comentarios / problemas aquí...",
    picsTitle: "Si algo no está bien, tome fotografías",
    remove: "Eliminar",
    save: "Guardar",
    clear: "Limpiar",
    next: "Siguiente",
    prev: "Atrás",
    pdf: "PDF",
    home: "Inicio",
    mainsailGenoaTitle: "Vela Mayor & Génova*",
    mainsailGenoaDesc: "Por favor lea la siguiente información sobre velas y equipo.",
    mainsailGenoaText: "He leído la información sobre Vela Mayor & Génova.",
    mainsailGenoaLink: "Equipo de Vela Mayor & Génova.",
    mainsailGenoaOk: "OK",
    diversTitle: "Informe de buzo*",
    diversUpload: "Subir imagen",
    diversRequired: "Obligatorio",
    diversOk: "OK",
    diversFieldRequired: "Campo obligatorio",
    diversAgreementTitle: "Aceptación del informe de buzo*",
    diversAgreementText: "He leído el informe del buzo y confirmo que lo acepto. Puedo solicitar una inspección adicional a mi costa durante el check-in. Solo buzos certificados pueden bucear en la marina base.",
    ok: "OK",
    employeeLogin: "Acceso Empleados",
    logout: "Cerrar sesión",
    ca_title: "Contrato de Charter y Documentos",
    ca_booking: "Reserva",
    ca_lastUpdated: "Última actualización",
    ca_updating: "Actualizando...",
    ca_noBookingFound: "No se encontró reserva",
    ca_backToHome: "Volver al Inicio",
    ca_noBookingMsg: "No se encontraron datos de reserva para esta sesión.",
    ca_boardingPass: "Boarding Pass",
    ca_boardingPassDesc: "Descargue su boarding pass personalizado con todos los detalles del check-in.",
    ca_download: "Descargar",
    ca_preview: "Vista previa",
    ca_meetingLocation: "Lugar de encuentro: Marina Alimos - Charter Village Box A47",
    ca_contact: "Contacto: Sra. Maria Mazaraki (+30 6978196009)",
    ca_documents: "Documentos",
    ca_documentsDesc: "Genere automáticamente Charter Party y Lista de Tripulación como documentos Word.",
    ca_charterPartyDocx: "Charter Party (DOCX)",
    ca_crewListDocx: "Lista de Tripulación (DOCX)",
    ca_financialSummary: "Resumen Financiero",
    ca_charterAmountNet: "Importe Charter (NETO):",
    ca_vat12: "IVA (12%):",
    ca_totalWithVat: "TOTAL (con IVA):",
    ca_depositRequired: "Depósito Requerido:",
    ca_paymentInfo: "El importe del charter y el depósito son pagaderos según el contrato de charter.",
    ca_pdfFormat: "Formato: PDF (con todos los detalles pre-rellenados)",
    ca_printSign: "Imprima y firme antes del check-in",
    ca_charterParty: "Charter Party",
    ca_fillCharterPartyOnline: "Rellenar Detalles Charter Party Online",
    ca_fillLatinOnly: "Rellene sus detalles directamente en la app (solo caracteres latinos)",
    ca_close: "Cerrar",
    ca_fillNow: "Rellenar Ahora",
    ca_charterPartySubmitted: "Charter Party Enviado",
    ca_legallyBinding: "LEGALMENTE VINCULANTE",
    ca_submittedBy: "Enviado por:",
    ca_submittedOn: "Enviado el:",
    ca_lastModified: "Última modificación:",
    ca_submittedNotice: "Este Charter Party ha sido firmado digitalmente y enviado. Es legalmente vinculante.",
    ca_firstName: "Nombre",
    ca_lastName: "Apellido",
    ca_address: "Dirección",
    ca_idCard: "DNI",
    ca_passport: "Pasaporte",
    ca_idCardNumber: "Número de DNI",
    ca_passportNumber: "Número de Pasaporte",
    ca_taxNumberAfm: "NIF",
    ca_taxOfficeDoy: "Oficina Fiscal",
    ca_phone: "Teléfono",
    ca_emailLabel: "Email",
    ca_iAmSkipper: "También soy el Patrón",
    ca_chartererSignature: "Firma del Charterer",
    ca_digitallySigned: "Firmado digitalmente",
    ca_clear: "Borrar",
    ca_skipperDetailsDiff: "Detalles del Patrón (persona diferente)",
    ca_skipperFullName: "Nombre Completo del Patrón",
    ca_skipperSignature: "Firma del Patrón",
    ca_crewList: "Lista de Tripulación",
    ca_fillCrewOnline: "Rellenar Datos de Tripulación Online",
    ca_fillCrewDesc: "Agregue los datos de los miembros de la tripulación. Solo caracteres latinos.",
    ca_skipper: "Patrón",
    ca_coSkipper: "Co-Patrón",
    ca_crewMember: "Miembro de Tripulación",
    ca_fullName: "Nombre Completo",
    ca_passportNum: "Número de Pasaporte",
    ca_dateOfBirth: "Fecha de Nacimiento",
    ca_nationality: "Nacionalidad",
    ca_phoneShort: "Teléfono",
    ca_addCrewMember: "Agregar Miembro de Tripulación",
    ca_skipperLicense: "Licencia del Patrón",
    ca_skipperLicenseDesc: "Suba una foto o escaneo claro de la licencia del patrón.",
    ca_remove: "Eliminar",
    ca_addAnotherLicense: "Agregar Otra Licencia",
    ca_takePhoto: "Tomar Foto",
    ca_useCamera: "Usar cámara",
    ca_uploadFile: "Subir Archivo",
    ca_chooseGallery: "Elegir de galería",
    ca_orDragDrop: "o arrastrar y soltar",
    ca_charterPartyScanTitle: "Charter Party (Escaneo Firmado)",
    ca_charterPartyScanDesc: "Suba el documento Charter Party firmado.",
    ca_crewListScanTitle: "Lista de Tripulación (Escaneo Firmado)",
    ca_crewListScanDesc: "Suba el documento Lista de Tripulación firmado.",
    ca_docUploaded: "Documento subido",
    ca_pdfWordImg: "PDF, Word o imagen",
    ca_submitAllDocs: "Enviar Todos los Documentos",
    ca_alertNoBookingData: "No se encontraron datos de reserva.",
    ca_alertUploadLicense: "Por favor suba la licencia del patrón.",
    ca_alertFillFields: "Por favor rellene:",
    ca_selectLanguage: "Seleccionar idioma",
    ca_inviteTitle: "Invitar Tripulación / Patrón por Email",
    ca_inviteDesc: "Envíe un enlace seguro a cada miembro de la tripulación o patrón. Completan sus datos (siempre en inglés) y se añaden automáticamente a la Lista de Tripulación y Charter Party.",
    ca_sendInvitation: "Enviar Invitación",
    ca_sending: "Enviando...",
    ca_sentInvitations: "Invitaciones Enviadas",
    ca_pending: "Pendiente",
    ca_submittedShort: "Enviado",
    ca_resend: "Reenviar",
    ca_deleteBtn: "Eliminar",
    ca_copyLink: "Copiar Enlace",
    ca_linkCopied: "Enlace copiado",
    ca_invitationSentTo: "Invitación enviada a",
    ca_emailRequired: "Email requerido",
    ca_noBookingCodeMsg: "Sin código de reserva",
    ca_invitationResent: "Invitación reenviada",
    ca_resendFailed: "Reenvío fallido",
    ca_deleteConfirm: "Eliminar esta invitación pendiente?",
  },

};

// 💾 STORAGE FUNCTIONS - DEPRECATED: Use apiService.ts functions instead
// These functions are kept for backwards compatibility but should NOT use localStorage
export const saveBookingData = (bookingNumber, page2Data, mode) => {
  // DEPRECATED: Use savePage2DataHybrid from apiService.ts instead
  console.warn('⚠️ saveBookingData is deprecated - use apiService.ts functions instead');
  console.log(`📝 Page 2 data for ${bookingNumber} (${mode}) should be saved via API`);
};

export const loadBookingData = (bookingNumber, mode) => {
  // DEPRECATED: Use getPage2DataHybrid from apiService.ts instead
  console.warn('⚠️ loadBookingData is deprecated - use apiService.ts functions instead');
  console.log(`📝 Page 2 data for ${bookingNumber} (${mode}) should be loaded via API`);
  return null; // Return null - callers should use API functions
};


// 📦 BOOKING INFO BOX (Πράσινο box πάνω πάνω)
export function BookingInfoBox({ bookingInfo, currentBookingNumber }) {
  const lang = sessionStorage.getItem("yacht_lang") || "en";
  const t = I18N[lang] || I18N.en;
  return (
    <div className="mb-6 p-4 rounded-xl border-2" style={{ backgroundColor: brand.successBg, borderColor: brand.successBorder }}>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-xs text-gray-600">{t.bookingNumber || "Booking Number"}</div>
          <div className="text-lg font-bold">{currentBookingNumber || 'N/A'}</div>
          <div className="text-xs text-gray-600 mt-2">{t.checkinDate || "Check-in Date"}</div>
          <div className="text-base font-semibold">{formatDate(bookingInfo?.checkInDate)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-600">{t.yachtLabel || "Yacht"}</div>
          <div className="text-lg font-bold">{bookingInfo?.vesselName || 'N/A'}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600">{t.skipperLabel || "Skipper"}</div>
          <div className="text-lg font-bold">{bookingInfo?.skipperFirstName || ''} {bookingInfo?.skipperLastName || ''}</div>
          <div className="text-xs text-gray-600 mt-2">{t.checkoutDate || "Check-out Date"}</div>
          <div className="text-base font-semibold">{formatDate(bookingInfo?.checkOutDate)}</div>
        </div>
      </div>
    </div>
  );
}

// 🔵 TAILWIND YACHTING BUTTON
export function TailwindButton() {
  return (
    <div className="text-center mb-4">
      <button className="px-6 py-3 rounded-lg font-bold text-white text-lg" style={{ backgroundColor: brand.blue }}>
        TAILWIND YACHTING
      </button>
    </div>
  );
}

// 📄 PAGE HEADER
export function PageHeader({ title, subtitle }) {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-center" style={{ color: brand.navy }}>{title}</h1>
      </div>
      {subtitle && (
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-center">{subtitle}</h2>
        </div>
      )}
    </>
  );
}

// 🎛️ TOP CONTROLS (Online, Language, Employee Login, Progress) - 🏠 HOME BUTTON ADDED
export function TopControls({ 
  isOnline, 
  lang, 
  setLang, 
  isEmployee, 
  currentEmployee, 
  onEmployeeLogout, 
  onEmployeeLogin, 
  percentage,
  onHomeClick 
}) {
  const [showLangPopup, setShowLangPopup] = useState(false);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    sessionStorage.setItem("yacht_lang", newLang);
    setShowLangPopup(false);
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onHomeClick && (
          <button 
            onClick={onHomeClick}
            className="px-3 py-1.5 rounded border text-xs font-semibold hover:bg-gray-100 transition-colors"
            style={{ borderColor: brand.black, color: brand.black }}
            title={lang === 'el' ? 'Αρχική' : 'Home'}
          >
            🏠 {lang === 'el' ? 'Αρχική' : 'Home'}
          </button>
        )}
        <span className={`px-2 py-1 rounded text-xs font-semibold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
          <button onClick={() => setShowLangPopup(!showLangPopup)}
            className="px-3 py-1 rounded border text-xs font-semibold"
            style={{ borderColor: brand.black, color: brand.black }}>
            <img src={flagImg(LANG_MAP.find(l => l.code === lang)?.country || "GB")} alt="" style={{width: "24px", height: "18px", verticalAlign: "middle"}} /> {lang.toUpperCase()}
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
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', color: '#1e293b' }}>
                  Select Language
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {LANG_MAP.map(({ code, country, label }) => (
                    <button key={code} onClick={() => handleLanguageChange(code)}
                      style={{
                        padding: '12px 8px', borderRadius: '10px', border: 'none',
                        background: lang === code ? 'linear-gradient(135deg, #0c4a6e, #0ea5e9)' : '#f1f5f9',
                        color: lang === code ? 'white' : '#334155',
                        fontSize: '15px', fontWeight: lang === code ? 700 : 500,
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px'
                      }}>
                      <img src={flagImg(country)} alt="" style={{width: "24px", height: "18px", borderRadius: "2px"}} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        {isEmployee ? (
          <button onClick={onEmployeeLogout} className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: "#FF6B35", color: "white" }}>
            🔓 {currentEmployee?.name} - Logout
          </button>
        ) : (
          <button onClick={onEmployeeLogin} className="px-3 py-1 rounded text-xs font-semibold" style={{ backgroundColor: "#FF6B35", color: "white" }}>
            🔒 Employee Login
          </button>
        )}
      </div>
      <div className="text-sm font-semibold" style={{ color: brand.black }}>
        Progress: {percentage}%
      </div>
    </div>
  );
}

// 🎨 MODE DISPLAY
export function ModeDisplay({ mode, t }) {
  return (
    <div className="mb-4">
      <div className="text-base font-semibold" style={{ color: brand.black }}>
        {t.mode}: <span style={{ color: mode === "in" ? brand.blue : brand.pink, fontSize: '17px' }}>
          {mode === "in" ? t.checkIn : t.checkOut}
        </span>
      </div>
    </div>
  );
}

// 🔘 ACTION BUTTONS (Previous, Save, Clear, PDF, Next)
export function ActionButtons({ onPrevious, onSave, onClear, onPDF, onNext, t }) {
  return (
    <div className="mt-6 flex flex-wrap justify-between gap-3">
      <button type="button" onClick={onPrevious}
        className="px-5 py-2.5 rounded transition-colors font-semibold"
        style={{ background: "#6B7280", color: "#fff" }}>
        ← {t.prev}
      </button>
      
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onSave}
          className="px-5 py-2.5 rounded transition-colors font-semibold"
          style={{ background: "#4B5563", color: "#fff" }}>
          {t.save}
        </button>
        <button type="button" onClick={onClear}
          className="px-5 py-2.5 rounded border-2 transition-colors font-semibold bg-white"
          style={{ borderColor: brand.blue, color: brand.blue }}>
          {t.clear}
        </button>
        {onPDF && (
          <button type="button" onClick={onPDF}
            className="px-5 py-2.5 rounded font-semibold transition-colors shadow-md"
            style={{ background: "#DC2626", color: "#fff" }}>
            📄 {t.pdf}
          </button>
        )}
        <button type="button" onClick={onNext}
          className="px-5 py-2.5 rounded font-semibold transition-colors shadow-md"
          style={{ background: brand.blue, color: "#fff" }}>
          {t.next} →
        </button>
      </div>
    </div>
  );
}

// ⛵ MAINSAIL AGREEMENT
export function MainsailAgreement({ t, onAcceptChange, initialValue }) {
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
        <div className="font-semibold" style={{ color: brand.black }}>{t.mainsailGenoaTitle}</div>
        <p className="mt-2 text-[15px]" style={{ color: brand.black }}>{t.mainsailGenoaDesc}</p>
        <div className="mt-3 flex items-start gap-3">
          <input type="checkbox" checked={accepted} readOnly className="mt-1" />
          <p className="text-[15px]" style={{ color: brand.black }}>{t.mainsailGenoaText}</p>
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

// ✍️ SIGNATURE BOX - ΔΙΟΡΘΩΜΕΝΟ ΜΕ MODE-BASED LABEL
export function SignatureBox({ brand, lang, onSignChange, onImageChange, initialImage, currentBookingNumber, mode, pageNumber = 2 }) {
  const t = I18N[lang] || I18N.en;
  const canvasRef = useRef(null);
  useSignatureTouch(canvasRef);
  const [hasSigned, setHasSigned] = useState(false);

  // 🔥 Drawing logic with addEventListener (from Page 3)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let drawing = false;
    let x = 0, y = 0;
    
    const rect = () => canvas.getBoundingClientRect();
    const getPoint = (e) => {
      const t = e.touches ? e.touches[0] : e;
      const r = rect();
      const scaleX = canvas.width / r.width;
      const scaleY = canvas.height / r.height;
      return { 
        x: (t.clientX - r.left) * scaleX, 
        y: (t.clientY - r.top) * scaleY 
      };
    };
    
    const start = (e) => { 
      drawing = true; 
      const p = getPoint(e); 
      x = p.x; 
      y = p.y; 
      setHasSigned(true);
      onSignChange(true);
    };
    
    const move = (e) => { 
      if (!drawing) return; 
      const p = getPoint(e); 
      ctx.strokeStyle = "#000"; 
      ctx.lineWidth = 2; 
      ctx.lineCap = "round"; 
      ctx.beginPath(); 
      ctx.moveTo(x, y); 
      ctx.lineTo(p.x, p.y); 
      ctx.stroke(); 
      x = p.x; 
      y = p.y; 
    };
    
    const end = async () => { 
      if (!drawing) return;
      drawing = false;
      
      // Save signature
      try {
        const compressed = await compressSignature(canvas.toDataURL('image/png'));
        onImageChange(compressed);
        
        if (currentBookingNumber && mode) {
          const signatureKey = `page${pageNumber}_signature_${currentBookingNumber}_${mode}`;
          localStorage.setItem(signatureKey, compressed);
        }
      } catch (e) {
        console.error('Error saving signature:', e);
      }
    };
    
    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("touchend", end);
    
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, [currentBookingNumber, mode, onSignChange, onImageChange, pageNumber]);

  // Load saved signature
  useEffect(() => {
    if (!currentBookingNumber || !mode) return;
    
    const signatureKey = `page${pageNumber}_signature_${currentBookingNumber}_${mode}`;
    const saved = localStorage.getItem(signatureKey);
    
    if (saved) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasSigned(true);
        onSignChange(true);
      };
      img.src = saved;
    }
  }, [currentBookingNumber, mode, onSignChange, pageNumber]);

  const clearSignature = () => { 
    const canvas = canvasRef.current; 
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    setHasSigned(false);
    onSignChange(false);
    onImageChange('');
    
    if (currentBookingNumber && mode) {
      const signatureKey = `page${pageNumber}_signature_${currentBookingNumber}_${mode}`;
      localStorage.removeItem(signatureKey);
    }
  };

  return (
    <div className="mt-3">
      <label className="block font-semibold mb-2" style={{ color: brand.black }}>
        {mode === "in" ? (t.skipperSignatureTitle || "Skipper's Signature *") : (t.employeeSignatureTitle || "Employee's Signature *")}
      </label>
      <div style={{ 
        border: "2px solid", 
        borderColor: hasSigned ? brand.successBorder : brand.black, 
        background: hasSigned ? brand.successBg : "#ffffff", 
        borderRadius: 12, 
        padding: 8 
      }}>
        <canvas ref={canvasRef} width={600} height={200} className="w-full h-[200px]" />
      </div>
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1 rounded text-sm border"
          style={{ borderColor: brand.black, color: brand.black }}
        >
          {lang === 'el' ? 'Καθαρισμός' : 'Clear'}
        </button>
      </div>
      {!hasSigned && (
        <div className="mt-1 inline-block text-xs px-2 py-1 rounded border"
          style={{ color: "#ef4444", borderColor: "#ef4444" }}>
          {lang === 'el' ? 'Απαιτείται πεδίο' : 'Field required'}
        </div>
      )}
    </div>
  );
}

// ========= Page 3 Specific Save/Load - DEPRECATED =========
export const savePage3Data = (bookingNumber, page3Data, mode) => {
  // DEPRECATED: Use savePage3DataHybrid from apiService.ts instead
  console.warn('⚠️ savePage3Data is deprecated - use apiService.ts functions instead');
  console.log(`📝 Page 3 data for ${bookingNumber} (${mode}) should be saved via API`);
};

export const loadPage3Data = (bookingNumber, mode) => {
  // DEPRECATED: Use getPage3DataHybrid from apiService.ts instead
  console.warn('⚠️ loadPage3Data is deprecated - use apiService.ts functions instead');
  console.log(`📝 Page 3 data for ${bookingNumber} (${mode}) should be loaded via API`);
  return null; // Return null - callers should use API functions
};

// ========= TableSection Component (for Page 3 and future pages) =========
export function TableSection({ data, t, setPrice, incQty, decQty, toggleInOk, setOut, openCamera, handleFiles, openFilePicker, removeRow, mode, getLabel, isEmployee, currentEmployee, newItem, setNewItem, addItem, sectionTitle }) {
  const canEditPrices = isEmployee && currentEmployee?.canEdit;
  const canRemoveItems = isEmployee && currentEmployee?.canDelete;
  
  return (
    <div className="overflow-x-auto mb-6">
      <h2 className="mb-2 text-xl font-bold text-center" style={{ color: brand.black }}>{sectionTitle}</h2>
      
      {/* Add Item Row - OUTSIDE the table */}
      {isEmployee && currentEmployee?.canEdit && (
        <div className="mb-4 flex gap-2">
          <input 
            type="text" 
            value={newItem} 
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="New item name"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            className="flex-1 px-3 py-2 border rounded" 
            style={{ borderColor: brand.black }} 
          />
          <button 
            type="button" 
            onClick={addItem} 
            className="px-4 py-2 rounded font-semibold text-white whitespace-nowrap" 
            style={{ backgroundColor: brand.blue }}>
            Add item
          </button>
        </div>
      )}
      
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ backgroundColor: brand.navy, color: "#fff" }}>
            <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '50px' }}>#</th>
            <th className="border px-2 py-2 text-left" style={{ borderColor: brand.black }}>{t.addItem}</th>
            <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '180px' }}>{t.price}</th>
            <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '120px' }}>{t.qty}</th>
            {mode === "in" ? (
              <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '120px' }}>{t.checkIn}</th>
            ) : (
              <>
                {SHOW_CHECKIN_REFERENCE_IN_CHECKOUT && <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '120px' }}>{t.checkIn}</th>}
                <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '120px' }}>{t.outOk || "check-out OK"}</th>
                <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '150px' }}>{t.outNotOk || "check-out NOT OK"}</th>
              </>
            )}
            <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '80px' }}>{t.camera}</th>
            <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '80px' }}>{t.attach}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={item.id} id={`row-${item.id}`} data-item-id={item.id} style={{ backgroundColor: idx % 2 === 0 ? "#f9fafb" : "#fff" }}>
              <td className="border px-2 py-2 text-center font-semibold" style={{ borderColor: brand.black, color: "#dc2626" }}>{idx + 1}</td>
              <td className="border px-2 py-2" style={{ borderColor: brand.black }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold break-words" style={{ color: brand.black, wordBreak: 'break-word', hyphens: 'auto' }}>{getLabel(item.key)}</span>
                  {canRemoveItems && (
                    <button onClick={() => removeRow(item.id)} className="ml-2 text-red-600 hover:text-red-800 font-bold">✕</button>
                  )}
                </div>
              </td>
              <td className="border px-2 py-2" style={{ borderColor: brand.black }}>
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => {
                      const currentPrice = parseFloat(item.price) || 0;
                      setPrice(item.id, Math.max(0, currentPrice - 5).toString());
                    }}
                    disabled={!canEditPrices}
                    className="min-w-[44px] min-h-[44px] border rounded flex items-center justify-center text-sm font-bold"
                    style={{ borderColor: brand.black, color: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white', touchAction: 'manipulation' }}>
                    −5
                  </button>
                  <input
                    type="text"
                    value={item.price || ""}
                    onChange={(e) => setPrice(item.id, e.target.value)}
                    disabled={!canEditPrices}
                    className="w-20 px-2 py-2 border rounded text-center text-sm"
                    style={{ borderColor: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white', color: brand.black }}
                  />
                  <span className="text-sm font-semibold" style={{ color: brand.black }}>€</span>
                  <button
                    onClick={() => {
                      const currentPrice = parseFloat(item.price) || 0;
                      setPrice(item.id, (currentPrice + 5).toString());
                    }}
                    disabled={!canEditPrices}
                    className="min-w-[44px] min-h-[44px] border rounded flex items-center justify-center text-sm font-bold"
                    style={{ borderColor: brand.black, color: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white', touchAction: 'manipulation' }}>
                    +5
                  </button>
                </div>
              </td>
              <td className="border px-1 py-1 text-center align-middle" style={{ borderColor: brand.black }}>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => decQty(item.id)} className="min-w-[44px] min-h-[44px] border rounded flex items-center justify-center font-bold text-lg" style={{ borderColor: brand.black, color: brand.black, touchAction: 'manipulation' }}>−</button>
                  <span className="font-semibold mx-1" style={{ color: brand.black }}>{item.qty || 1}</span>
                  <button onClick={() => incQty(item.id)} className="min-w-[44px] min-h-[44px] border rounded flex items-center justify-center font-bold text-lg" style={{ borderColor: brand.black, color: brand.black, touchAction: 'manipulation' }}>+</button>
                </div>
              </td>
              {mode === "in" ? (
                <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                  <button onClick={() => toggleInOk(item.id)} className="px-3 py-1 rounded font-semibold text-sm" style={{ backgroundColor: item.inOk ? brand.successBg : "#f3f4f6", color: item.inOk ? brand.successText : brand.black, border: `1px solid ${item.inOk ? brand.successBorder : brand.black}` }}>
                    {item.inOk ? "✓ OK" : t.checkIn}
                  </button>
                </td>
              ) : (
                <>
                  {/* Check-IN status column (READ ONLY - NO onClick!) — hidden by flag */}
                  {SHOW_CHECKIN_REFERENCE_IN_CHECKOUT && (
                  <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                    <div className="px-3 py-1 rounded font-bold text-sm" style={{ backgroundColor: item.inOk ? brand.successBorder : "#f5f5f5", color: item.inOk ? "#ffffff" : "#999", border: `1px solid ${item.inOk ? brand.successBorder : "#ccc"}` }}>
                      {item.inOk ? "OK" : t.checkIn}
                    </div>
                  </td>
                  )}
                  {/* OUT OK button */}
                  <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                    <button onClick={() => setOut(item.id, item.out === "ok" ? null : "ok")} className="px-3 py-1 rounded font-semibold text-sm" style={{ backgroundColor: item.out === "ok" ? brand.successBg : "#f3f4f6", color: item.out === "ok" ? brand.successText : brand.black, border: `1px solid ${item.out === "ok" ? brand.successBorder : brand.black}` }}>
                      {item.out === "ok" ? "✓ OK" : "OK"}
                    </button>
                  </td>
                  {/* OUT NOT button */}
                  <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                    <button onClick={() => setOut(item.id, item.out === "not" ? null : "not")} className="px-3 py-1 rounded font-semibold text-sm" style={{ backgroundColor: item.out === "not" ? "#fee2e2" : "#f3f4f6", color: item.out === "not" ? "#dc2626" : brand.black, border: `1px solid ${item.out === "not" ? "#dc2626" : brand.black}` }}>
                      {item.out === "not" ? "✗ NOT" : "NOT"}
                    </button>
                  </td>
                </>
              )}
              <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                <button onClick={() => openCamera(item.id)} className="px-2 py-1 rounded text-xs" style={{ backgroundColor: brand.black, color: "#fff" }}>📷</button>
              </td>
              <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                <button onClick={() => openFilePicker(item.id)} className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: brand.pink, color: "#fff" }}>
                  📎 {item.media?.length || 0}
                </button>
                {item.media?.length ? (<div className="text-[10px] text-gray-600 mt-1">{item.media.length} file(s)</div>) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
