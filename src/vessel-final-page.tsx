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

import React, { useState, useRef, useEffect, useContext } from "react";
import { generateLuxuryPDF } from './utils/LuxuryPDFGenerator';
import { sendCheckInEmail, sendCheckOutEmail } from './services/emailService';
import authService, { getVATRate } from './authService';
import FloatingChatWidget from './FloatingChatWidget';
import { saveBooking, getBooking, savePage5DataHybrid, getPage5DataHybrid, getAllBookings, getPage1DataHybrid, getPage2DataHybrid, getPage3DataHybrid, getPage4DataHybrid } from './services/apiService';
import { getPageMedia, mergeMediaIntoItems } from './utils/mediaStorage';
import { DataContext } from './App';
import { useNavigate } from 'react-router-dom';
import { useSignatureTouch } from './utils/useSignatureTouch';

import {
  brand,
  I18N,
  uid,
  compressSignature,
  compressImageWithLogging,
  saveBookingData,
  loadBookingData,
  BookingInfoBox,
  SHOW_BOOKING_INFO_ON_CHECKLIST_PAGES,
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

import { ITEM_LABELS as ITEM_LABELS_P2 } from "./vessel-checkin-page2";
import { ITEM_LABELS as ITEM_LABELS_P3 } from "./vessel-checkin-page3";
import { ITEM_LABELS as ITEM_LABELS_P4 } from "./page4-with-vessel-floorplans";

// Merged ITEM_LABELS from all pages (10 languages)
const ITEM_LABELS: Record<string, Record<string, string>> = { ...ITEM_LABELS_P2, ...ITEM_LABELS_P3, ...ITEM_LABELS_P4 };

const Page5_I18N = {
  en: {
    ...I18N.en,
    mainEquipment: "Main Equipment",
    hull: "Hull",
    mandatoryReading: "🔴 MANDATORY READING – CLICK HERE!",
    skipperSignatureNote: "* The skipper signature below covers this authorization",
    cancelBtn: "Cancel",
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
    netTotal: "NET TOTAL",
    vatPercent: "VAT",
    totalWithVAT: "TOTAL WITH VAT",
    notesTitle: "Additional Remarks",
    notesPlaceholder: "Write any remarks below and inform our base staff...",
    skipperSignatureTitle: "Skipper's Signature",
    employeeSignatureTitle: "Employee's Signature",
    clear: "Clear",
    signatureRequired: "Signature required",
    damagePhotosTitle: "Damage Photos",
    mustBeRead: "MUST BE READ!",
    damagePhotosBtn: "📸 DAMAGE PHOTOS",
    photosBtn: "📸 PHOTOS",
    loggedIn: "Logged in",
    logoutBtn: "Logout",
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
    mainEquipment: "Κύριος Εξοπλισμός",
    hull: "Κύτος",
    mandatoryReading: "🔴 ΥΠΟΧΡΕΩΤΙΚΗ ΑΝΑΓΝΩΣΗ – ΚΛΙΚ ΕΔΩ!",
    skipperSignatureNote: "* Η υπογραφή του κυβερνήτη παρακάτω καλύπτει και αυτήν την εξουσιοδότηση",
    cancelBtn: "Ακύρωση",
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
    netTotal: "ΚΑΘΑΡΟ ΣΥΝΟΛΟ",
    vatPercent: "ΦΠΑ",
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
  },
  it: {
    ...I18N.it,
    mainEquipment: "Equipaggiamento Principale",
    hull: "Scafo",
    mandatoryReading: "🔴 LETTURA OBBLIGATORIA – CLICCA QUI!",
    skipperSignatureNote: "* La firma dello skipper qui sotto copre anche questa autorizzazione",
    cancelBtn: "Annulla",
    pageTitle: "COMPLETAMENTO CHECK-IN/OUT",
    checkInMode: "\u2705 Modalit\u00e0 Check-in",
    checkOutMode: "\ud83d\udce6 Modalit\u00e0 Check-out",
    termsTitle: "Termini e Condizioni",
    privacyTitle: "Consenso alla Privacy",
    privacyText: "Acconsento alla ",
    privacyText2: " e all'utilizzo dei miei dati personali da parte di Tailwind Yachting.",
    returnTitle: "Riconoscimento Condizioni di Restituzione",
    returnText: "Confermo che lo yacht sarà restituito con tutta l'attrezzatura elencata. Eventuali danni o oggetti mancanti potranno essere addebitati secondo il listino prezzi.",
    termsText: "Accetto i termini e le condizioni del noleggio. Confermo che tutte le informazioni fornite sono corrette e che ho ispezionato l'imbarcazione.",
    warningTitle: "\u26a0\ufe0f Avviso Importante",
    warningTextPart1: "ATTENZIONE: Eventuali danni, perdite o malfunzionamenti NON registrati nel presente documento saranno considerati avvenuti durante il periodo di noleggio.",
    warningTextPart2: "Il noleggiatore sar\u00e0 responsabile per tutti i costi di riparazione o sostituzione.",
    warningTextPart3: "Si prega di ispezionare accuratamente e segnalare TUTTO prima della partenza.",
    warningTextPart4: "Grazie in anticipo.",
    warningAccept: "\u2714 Ho letto e compreso",
    paymentAuthTitle: "Autorizzazione al Pagamento",
    paymentAuthText: "Il cliente con il suo consenso ci autorizza a prelevare dalla carta di credito registrata i costi per eventuali danni riscontrati.",
    paymentAuthAccept: "\u2714 Autorizzo il pagamento",
    completeInventory: "INVENTARIO COMPLETO",
    damageInventory: "RAPPORTO DANNI",
    damageRate: "Costo (se danneggiato)",
    unitPrice: "Prezzo Unitario",
    totalPrice: "Totale",
    netTotal: "TOTALE NETTO",
    vatPercent: "IVA",
    totalWithVAT: "TOTALE CON IVA",
    notesTitle: "Note Aggiuntive",
    notesPlaceholder: "Scrivere osservazioni e informare il personale della base...",
    skipperSignatureTitle: "Firma dello Skipper",
    employeeSignatureTitle: "Firma del Dipendente",
    employeeCodeRequired: "\u26a0 Codice Dipendente Richiesto",
    employeeCodeNeeded: "\u26a0 Codice dipendente necessario!",
    signatureRequired: "Firma obbligatoria",
    save: "Salva bozza",
    clear: "Cancella",
    pdf: "PDF",
    back: "Indietro",
    submit: "Invia",
    ok: "OK - CONFERMO",
    fieldRequired: "Campo obbligatorio",
    emailSent: "Email di conferma inviate con successo!",
    emailError: "Errore nell'invio email. Riprovare.",
    checkInComplete: "Check-in completato con successo!",
    pdfGenerated: "PDF generato con successo!",
    dataSaved: "Dati salvati automaticamente!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  de: {
    ...I18N.de,
    mainEquipment: "Hauptausrüstung",
    hull: "Rumpf",
    mandatoryReading: "🔴 PFLICHTLEKTÜRE – HIER KLICKEN!",
    skipperSignatureNote: "* Die Unterschrift des Skippers unten deckt auch diese Genehmigung ab",
    cancelBtn: "Abbrechen",
    pageTitle: "CHECK-IN/OUT ABSCHLUSS",
    checkInMode: "\u2705 Check-in Modus",
    checkOutMode: "\ud83d\udce6 Check-out Modus",
    termsTitle: "Allgemeine Gesch\u00e4ftsbedingungen",
    privacyTitle: "Datenschutz-Einwilligung",
    privacyText: "Ich stimme der ",
    privacyText2: " zu und erkläre mich mit der Nutzung meiner persönlichen Daten durch Tailwind Yachting einverstanden.",
    returnTitle: "Bestätigung des Rückgabezustands",
    returnText: "Ich bestätige, dass die Yacht mit der gesamten aufgelisteten Ausrüstung zurückgegeben wird. Eventuelle Schäden oder fehlende Gegenstände können gemäß der Preisliste berechnet werden.",
    termsText: "Ich akzeptiere die Mietbedingungen. Ich best\u00e4tige, dass alle Angaben korrekt sind und ich das Boot inspiziert habe.",
    warningTitle: "\u26a0\ufe0f Wichtiger Hinweis",
    warningTextPart1: "ACHTUNG: Sch\u00e4den, Verluste oder Fehlfunktionen, die NICHT in diesem Dokument erfasst sind, gelten als w\u00e4hrend der Mietzeit entstanden.",
    warningTextPart2: "Der Mieter haftet f\u00fcr alle Reparatur- oder Ersatzkosten.",
    warningTextPart3: "Bitte inspizieren Sie gr\u00fcndlich und melden Sie ALLES vor der Abfahrt.",
    warningTextPart4: "Vielen Dank im Voraus.",
    warningAccept: "\u2714 Ich habe gelesen und verstanden",
    paymentAuthTitle: "Zahlungsautorisierung",
    paymentAuthText: "Der Kunde autorisiert uns, Kosten f\u00fcr festgestellte Sch\u00e4den von der hinterlegten Kreditkarte abzubuchen.",
    paymentAuthAccept: "\u2714 Ich autorisiere die Zahlung",
    completeInventory: "VOLLST\u00c4NDIGES INVENTAR",
    damageInventory: "SCHADENSBERICHT",
    damageRate: "Kosten (bei Besch\u00e4digung)",
    unitPrice: "St\u00fcckpreis",
    totalPrice: "Gesamt",
    netTotal: "NETTOBETRAG",
    vatPercent: "MwSt",
    totalWithVAT: "GESAMT MIT MwSt",
    notesTitle: "Zus\u00e4tzliche Anmerkungen",
    notesPlaceholder: "Anmerkungen schreiben und Basispersonal informieren...",
    skipperSignatureTitle: "Unterschrift des Skippers",
    employeeSignatureTitle: "Unterschrift des Mitarbeiters",
    employeeCodeRequired: "\u26a0 Mitarbeitercode erforderlich",
    employeeCodeNeeded: "\u26a0 Mitarbeitercode ben\u00f6tigt!",
    signatureRequired: "Unterschrift erforderlich",
    save: "Entwurf speichern",
    clear: "L\u00f6schen",
    pdf: "PDF",
    back: "Zur\u00fcck",
    submit: "Absenden",
    ok: "OK - ICH BEST\u00c4TIGE",
    fieldRequired: "Pflichtfeld",
    emailSent: "Best\u00e4tigungs-E-Mails erfolgreich gesendet!",
    emailError: "Fehler beim E-Mail-Versand. Bitte erneut versuchen.",
    checkInComplete: "Check-in erfolgreich abgeschlossen!",
    pdfGenerated: "PDF erfolgreich erstellt!",
    dataSaved: "Daten automatisch gespeichert!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  ru: {
    ...I18N.ru,
    mainEquipment: "Основное оборудование",
    hull: "Корпус",
    mandatoryReading: "🔴 ОБЯЗАТЕЛЬНО К ПРОЧТЕНИЮ – НАЖМИТЕ ЗДЕСЬ!",
    skipperSignatureNote: "* Подпись шкипера ниже также покрывает данное разрешение",
    cancelBtn: "Отмена",
    pageTitle: "\u0417\u0410\u0412\u0415\u0420\u0428\u0415\u041d\u0418\u0415 CHECK-IN/OUT",
    checkInMode: "\u2705 \u0420\u0435\u0436\u0438\u043c Check-in",
    checkOutMode: "\ud83d\udce6 \u0420\u0435\u0436\u0438\u043c Check-out",
    termsTitle: "\u0423\u0441\u043b\u043e\u0432\u0438\u044f",
    privacyTitle: "Согласие на обработку данных",
    privacyText: "Я соглашаюсь с ",
    privacyText2: " и даю согласие на использование моих персональных данных компанией Tailwind Yachting.",
    returnTitle: "Подтверждение состояния возврата",
    returnText: "Я подтверждаю, что яхта будет возвращена со всем перечисленным оборудованием. Любые повреждения или недостающие предметы могут быть оплачены согласно прейскуранту.",
    termsText: "\u042f \u043f\u0440\u0438\u043d\u0438\u043c\u0430\u044e \u0443\u0441\u043b\u043e\u0432\u0438\u044f \u0430\u0440\u0435\u043d\u0434\u044b. \u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0430\u044e, \u0447\u0442\u043e \u0432\u0441\u044f \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u0432\u0435\u0440\u043d\u0430 \u0438 \u044f\u0445\u0442\u0430 \u043e\u0441\u043c\u043e\u0442\u0440\u0435\u043d\u0430.",
    warningTitle: "\u26a0\ufe0f \u0412\u0430\u0436\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435",
    warningTextPart1: "\u0412\u041d\u0418\u041c\u0410\u041d\u0418\u0415: \u041f\u043e\u0432\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u044f, \u043d\u0435 \u0437\u0430\u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0432 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0435, \u0441\u0447\u0438\u0442\u0430\u044e\u0442\u0441\u044f \u0432\u043e\u0437\u043d\u0438\u043a\u0448\u0438\u043c\u0438 \u0432 \u043f\u0435\u0440\u0438\u043e\u0434 \u0430\u0440\u0435\u043d\u0434\u044b.",
    warningTextPart2: "\u0410\u0440\u0435\u043d\u0434\u0430\u0442\u043e\u0440 \u043d\u0435\u0441\u0451\u0442 \u043e\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0435\u043d\u043d\u043e\u0441\u0442\u044c \u0437\u0430 \u0432\u0441\u0435 \u0440\u0430\u0441\u0445\u043e\u0434\u044b.",
    warningTextPart3: "\u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0432\u0441\u0451 \u0442\u0449\u0430\u0442\u0435\u043b\u044c\u043d\u043e \u043f\u0435\u0440\u0435\u0434 \u043e\u0442\u043f\u043b\u044b\u0442\u0438\u0435\u043c.",
    warningTextPart4: "\u0421\u043f\u0430\u0441\u0438\u0431\u043e.",
    warningAccept: "\u2714 \u041f\u0440\u043e\u0447\u0438\u0442\u0430\u043d\u043e \u0438 \u043f\u043e\u043d\u044f\u0442\u043e",
    paymentAuthTitle: "\u0410\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f \u043e\u043f\u043b\u0430\u0442\u044b",
    paymentAuthText: "\u041a\u043b\u0438\u0435\u043d\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442 \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0441\u0440\u0435\u0434\u0441\u0442\u0432 \u0437\u0430 \u0443\u0449\u0435\u0440\u0431 \u0441 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u043a\u0430\u0440\u0442\u044b.",
    paymentAuthAccept: "\u2714 \u0410\u0432\u0442\u043e\u0440\u0438\u0437\u0443\u044e \u043e\u043f\u043b\u0430\u0442\u0443",
    completeInventory: "\u041f\u041e\u041b\u041d\u0410\u042f \u0418\u041d\u0412\u0415\u041d\u0422\u0410\u0420\u0418\u0417\u0410\u0426\u0418\u042f",
    damageInventory: "\u041e\u0422\u0427\u0401\u0422 \u041e \u041f\u041e\u0412\u0420\u0415\u0416\u0414\u0415\u041d\u0418\u042f\u0425",
    damageRate: "\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c (\u043f\u0440\u0438 \u043f\u043e\u0432\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0438)",
    unitPrice: "\u0426\u0435\u043d\u0430 \u0437\u0430 \u0435\u0434.",
    totalPrice: "\u0418\u0442\u043e\u0433\u043e",
    netTotal: "\u0418\u0422\u041e\u0413\u041e \u0411\u0415\u0417 \u041d\u0414\u0421",
    vatPercent: "\u041d\u0414\u0421",
    totalWithVAT: "\u0418\u0422\u041e\u0413\u041e \u0421 \u041d\u0414\u0421",
    notesTitle: "\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0437\u0430\u043c\u0435\u0447\u0430\u043d\u0438\u044f",
    notesPlaceholder: "\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0437\u0430\u043c\u0435\u0447\u0430\u043d\u0438\u044f...",
    skipperSignatureTitle: "\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u0448\u043a\u0438\u043f\u0435\u0440\u0430",
    employeeSignatureTitle: "\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430",
    employeeCodeRequired: "\u26a0 \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u043a\u043e\u0434 \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430",
    employeeCodeNeeded: "\u26a0 \u041d\u0443\u0436\u0435\u043d \u043a\u043e\u0434 \u0441\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a\u0430!",
    signatureRequired: "\u041f\u043e\u0434\u043f\u0438\u0441\u044c \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430",
    save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0447\u0435\u0440\u043d\u043e\u0432\u0438\u043a",
    clear: "\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u044c",
    pdf: "PDF",
    back: "\u041d\u0430\u0437\u0430\u0434",
    submit: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
    ok: "OK - \u041f\u041e\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0410\u042e",
    fieldRequired: "\u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u043f\u043e\u043b\u0435",
    emailSent: "\u041f\u0438\u0441\u044c\u043c\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u044b!",
    emailError: "\u041e\u0448\u0438\u0431\u043a\u0430 \u043e\u0442\u043f\u0440\u0430\u0432\u043a\u0438. \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435.",
    checkInComplete: "Check-in \u0443\u0441\u043f\u0435\u0448\u043d\u043e \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d!",
    pdfGenerated: "PDF \u0441\u043e\u0437\u0434\u0430\u043d!",
    dataSaved: "\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  fr: {
    ...I18N.fr,
    mainEquipment: "Équipement Principal",
    hull: "Coque",
    mandatoryReading: "🔴 LECTURE OBLIGATOIRE – CLIQUEZ ICI!",
    skipperSignatureNote: "* La signature du skipper ci-dessous couvre également cette autorisation",
    cancelBtn: "Annuler",
    pageTitle: "FIN DU CHECK-IN/OUT",
    checkInMode: "\u2705 Mode Check-in",
    checkOutMode: "\ud83d\udce6 Mode Check-out",
    termsTitle: "Conditions G\u00e9n\u00e9rales",
    privacyTitle: "Consentement de Confidentialité",
    privacyText: "J'accepte la ",
    privacyText2: " et j'autorise l'utilisation de mes données personnelles par Tailwind Yachting.",
    returnTitle: "Reconnaissance de l'État de Retour",
    returnText: "Je confirme que le yacht sera restitué avec tout l'équipement listé. Tout dommage ou objet manquant pourra être facturé selon la grille tarifaire.",
    termsText: "J'accepte les conditions de location. Je confirme que toutes les informations sont correctes et que j'ai inspect\u00e9 le bateau.",
    warningTitle: "\u26a0\ufe0f Avertissement Important",
    warningTextPart1: "ATTENTION: Les dommages non enregistr\u00e9s seront consid\u00e9r\u00e9s comme survenus pendant la p\u00e9riode de location.",
    warningTextPart2: "Le locataire sera responsable de tous les co\u00fbts.",
    warningTextPart3: "Veuillez tout inspecter avant le d\u00e9part.",
    warningTextPart4: "Merci d'avance.",
    warningAccept: "\u2714 J'ai lu et compris",
    paymentAuthTitle: "Autorisation de Paiement",
    paymentAuthText: "Le client autorise le pr\u00e9l\u00e8vement sur sa carte pour les dommages constat\u00e9s.",
    paymentAuthAccept: "\u2714 J'autorise le paiement",
    completeInventory: "INVENTAIRE COMPLET",
    damageInventory: "RAPPORT DE DOMMAGES",
    damageRate: "Co\u00fbt (si endommag\u00e9)",
    unitPrice: "Prix Unitaire",
    totalPrice: "Total",
    netTotal: "TOTAL NET",
    vatPercent: "TVA",
    totalWithVAT: "TOTAL TTC",
    notesTitle: "Remarques Suppl\u00e9mentaires",
    notesPlaceholder: "\u00c9crivez vos remarques...",
    skipperSignatureTitle: "Signature du Skipper",
    employeeSignatureTitle: "Signature de l'Employ\u00e9",
    employeeCodeRequired: "\u26a0 Code Employ\u00e9 Requis",
    employeeCodeNeeded: "\u26a0 Code employ\u00e9 n\u00e9cessaire!",
    signatureRequired: "Signature obligatoire",
    save: "Enregistrer brouillon",
    clear: "Effacer",
    pdf: "PDF",
    back: "Retour",
    submit: "Soumettre",
    ok: "OK - JE CONFIRME",
    fieldRequired: "Champ obligatoire",
    emailSent: "Emails envoy\u00e9s avec succ\u00e8s!",
    emailError: "Erreur d'envoi. R\u00e9essayez.",
    checkInComplete: "Check-in termin\u00e9!",
    pdfGenerated: "PDF g\u00e9n\u00e9r\u00e9!",
    dataSaved: "Donn\u00e9es sauvegard\u00e9es!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  ro: {
    ...I18N.ro,
    mainEquipment: "Echipament Principal",
    hull: "Coca",
    mandatoryReading: "🔴 LECTURĂ OBLIGATORIE – CLICK AICI!",
    skipperSignatureNote: "* Semnătura skipperului de mai jos acoperă și această autorizare",
    cancelBtn: "Anulare",
    pageTitle: "FINALIZARE CHECK-IN/OUT",
    checkInMode: "\u2705 Mod Check-in",
    checkOutMode: "\ud83d\udce6 Mod Check-out",
    termsTitle: "Termeni \u0219i Condi\u021bii",
    privacyTitle: "Consimțământ Confidențialitate",
    privacyText: "Sunt de acord cu ",
    privacyText2: " și consimt la utilizarea datelor mele personale de către Tailwind Yachting.",
    returnTitle: "Confirmarea Stării de Returnare",
    returnText: "Confirm că iahtul va fi returnat cu tot echipamentul listat. Orice daune sau obiecte lipsă pot fi taxate conform listei de prețuri.",
    termsText: "Accept termenii \u0219i condi\u021biile de \u00eenchiriere. Confirm c\u0103 toate informa\u021biile sunt corecte.",
    warningTitle: "\u26a0\ufe0f Avertisment Important",
    warningTextPart1: "ATEN\u021aIE: Daunele ne\u00eenregistrate vor fi considerate ap\u0103rute \u00een perioada de \u00eenchiriere.",
    warningTextPart2: "Chiria\u0219ul va fi responsabil pentru toate costurile.",
    warningTextPart3: "V\u0103 rug\u0103m s\u0103 inspectati totul \u00eenainte de plecare.",
    warningTextPart4: "V\u0103 mul\u021bumim.",
    warningAccept: "\u2714 Am citit \u0219i am \u00een\u021beles",
    paymentAuthTitle: "Autorizare de Plat\u0103",
    paymentAuthText: "Clientul autorizeaz\u0103 debitarea cardului pentru daune constatate.",
    paymentAuthAccept: "\u2714 Autorizez plata",
    completeInventory: "INVENTAR COMPLET",
    damageInventory: "RAPORT DAUNE",
    damageRate: "Cost (dac\u0103 deteriorat)",
    unitPrice: "Pre\u021b Unitar",
    totalPrice: "Total",
    netTotal: "TOTAL NET",
    vatPercent: "TVA",
    totalWithVAT: "TOTAL CU TVA",
    notesTitle: "Observa\u021bii Suplimentare",
    notesPlaceholder: "Scrie\u021bi observa\u021bii...",
    skipperSignatureTitle: "Semn\u0103tura Skipperului",
    employeeSignatureTitle: "Semn\u0103tura Angajatului",
    employeeCodeRequired: "\u26a0 Cod Angajat Necesar",
    employeeCodeNeeded: "\u26a0 Este necesar codul!",
    signatureRequired: "Semn\u0103tura obligatorie",
    save: "Salveaz\u0103 ciorn\u0103",
    clear: "\u0218terge",
    pdf: "PDF",
    back: "\u00cenapoi",
    submit: "Trimite",
    ok: "OK - CONFIRM",
    fieldRequired: "C\u00e2mp obligatoriu",
    emailSent: "Emailuri trimise cu succes!",
    emailError: "Eroare la trimitere. Re\u00eencerca\u021bi.",
    checkInComplete: "Check-in finalizat!",
    pdfGenerated: "PDF generat!",
    dataSaved: "Date salvate automat!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  pl: {
    ...I18N.pl,
    mainEquipment: "Wyposażenie Główne",
    hull: "Kadłub",
    mandatoryReading: "🔴 LEKTURA OBOWIĄZKOWA – KLIKNIJ TUTAJ!",
    skipperSignatureNote: "* Podpis skippera poniżej obejmuje również tę autoryzację",
    cancelBtn: "Anuluj",
    pageTitle: "ZAKO\u0143CZENIE CHECK-IN/OUT",
    checkInMode: "\u2705 Tryb Check-in",
    checkOutMode: "\ud83d\udce6 Tryb Check-out",
    termsTitle: "Regulamin",
    privacyTitle: "Zgoda na Prywatność",
    privacyText: "Wyrażam zgodę na ",
    privacyText2: " i na wykorzystanie moich danych osobowych przez Tailwind Yachting.",
    returnTitle: "Potwierdzenie Stanu Zwrotu",
    returnText: "Potwierdzam, że jacht zostanie zwrócony z całym wymienionym wyposażeniem. Wszelkie uszkodzenia lub brakujące przedmioty mogą być obciążone zgodnie z cennikiem.",
    termsText: "Akceptuj\u0119 warunki wynajmu. Potwierdzam poprawno\u015b\u0107 danych i inspekcj\u0119 jachtu.",
    warningTitle: "\u26a0\ufe0f Wa\u017cne Ostrze\u017cenie",
    warningTextPart1: "UWAGA: Uszkodzenia niezg\u0142oszone b\u0119d\u0105 uznane za powsta\u0142e w okresie wynajmu.",
    warningTextPart2: "Najemca ponosi odpowiedzialno\u015b\u0107 za wszystkie koszty.",
    warningTextPart3: "Prosz\u0119 dok\u0142adnie sprawdzi\u0107 wszystko przed wyp\u0142yni\u0119ciem.",
    warningTextPart4: "Dzi\u0119kujemy.",
    warningAccept: "\u2714 Przeczyta\u0142em i rozumiem",
    paymentAuthTitle: "Autoryzacja P\u0142atno\u015bci",
    paymentAuthText: "Klient autoryzuje obci\u0105\u017cenie karty za stwierdzone szkody.",
    paymentAuthAccept: "\u2714 Autoryzuj\u0119 p\u0142atno\u015b\u0107",
    completeInventory: "PE\u0141NY INWENTARZ",
    damageInventory: "RAPORT USZKODZE\u0143",
    damageRate: "Koszt (je\u015bli uszkodzony)",
    unitPrice: "Cena Jednostkowa",
    totalPrice: "Razem",
    netTotal: "RAZEM NETTO",
    vatPercent: "VAT",
    totalWithVAT: "RAZEM Z VAT",
    notesTitle: "Dodatkowe Uwagi",
    notesPlaceholder: "Wpisz uwagi...",
    skipperSignatureTitle: "Podpis Skippera",
    employeeSignatureTitle: "Podpis Pracownika",
    employeeCodeRequired: "\u26a0 Wymagany Kod Pracownika",
    employeeCodeNeeded: "\u26a0 Potrzebny kod pracownika!",
    signatureRequired: "Podpis wymagany",
    save: "Zapisz wersj\u0119 robocz\u0105",
    clear: "Wyczy\u015b\u0107",
    pdf: "PDF",
    back: "Wstecz",
    submit: "Wy\u015blij",
    ok: "OK - POTWIERDZAM",
    fieldRequired: "Pole wymagane",
    emailSent: "Emaile wys\u0142ane!",
    emailError: "B\u0142\u0105d wysy\u0142ki. Spr\u00f3buj ponownie.",
    checkInComplete: "Check-in zako\u0144czony!",
    pdfGenerated: "PDF wygenerowany!",
    dataSaved: "Dane zapisane!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  he: {
    ...I18N.he,
    mainEquipment: "ציוד ראשי",
    hull: "גוף הסירה",
    mandatoryReading: "🔴 !קריאה חובה – לחצו כאן",
    skipperSignatureNote: "* חתימת הסקיפר למטה מכסה גם הרשאה זו",
    cancelBtn: "ביטול",
    pageTitle: "\u05e1\u05d9\u05d5\u05dd CHECK-IN/OUT",
    checkInMode: "\u2705 \u05de\u05e6\u05d1 \u05e6\u05f2\u05e7-\u05d0\u05d9\u05df",
    checkOutMode: "\ud83d\udce6 \u05de\u05e6\u05d1 \u05e6\u05f2\u05e7-\u05d0\u05d0\u05d5\u05d8",
    termsTitle: "\u05ea\u05e0\u05d0\u05d9\u05dd",
    privacyTitle: "הסכמה לפרטיות",
    privacyText: "אני מסכים/ה ל",
    privacyText2: " ומאשר/ת שימוש בפרטים האישיים שלי על ידי Tailwind Yachting.",
    returnTitle: "אישור מצב החזרה",
    returnText: "אני מאשר/ת שהיאכטה תוחזר עם כל הציוד הרשום. כל נזק או פריטים חסרים עלולים להיות מחויבים בהתאם למחירון.",
    termsText: "\u05d0\u05e0\u05d9 \u05de\u05e7\u05d1\u05dc \u05d0\u05ea \u05ea\u05e0\u05d0\u05d9 \u05d4\u05d4\u05e9\u05db\u05e8\u05d4. \u05d0\u05e0\u05d9 \u05de\u05d0\u05e9\u05e8 \u05e9\u05db\u05dc \u05d4\u05de\u05d9\u05d3\u05e2 \u05e0\u05db\u05d5\u05df.",
    warningTitle: "\u26a0\ufe0f \u05d0\u05d6\u05d4\u05e8\u05d4 \u05d7\u05e9\u05d5\u05d1\u05d4",
    warningTextPart1: "\u05e9\u05d9\u05de\u05d5 \u05dc\u05d1: \u05e0\u05d6\u05e7\u05d9\u05dd \u05e9\u05dc\u05d0 \u05d3\u05d5\u05d5\u05d7\u05d5 \u05d9\u05d9\u05d7\u05e9\u05d1\u05d5 \u05db\u05d0\u05d9\u05dc\u05d5 \u05d0\u05e8\u05e2\u05d5 \u05d1\u05ea\u05e7\u05d5\u05e4\u05ea \u05d4\u05d4\u05e9\u05db\u05e8\u05d4.",
    warningTextPart2: "\u05d4\u05e9\u05d5\u05db\u05e8 \u05d9\u05d4\u05d9\u05d4 \u05d0\u05d7\u05e8\u05d0\u05d9 \u05dc\u05db\u05dc \u05d4\u05e2\u05dc\u05d5\u05d9\u05d5\u05ea.",
    warningTextPart3: "\u05d1\u05d3\u05e7\u05d5 \u05d4\u05db\u05dc \u05dc\u05e4\u05e0\u05d9 \u05d4\u05d4\u05e4\u05dc\u05d2\u05d4.",
    warningTextPart4: "\u05ea\u05d5\u05d3\u05d4.",
    warningAccept: "\u2714 \u05e7\u05e8\u05d0\u05ea\u05d9 \u05d5\u05d4\u05d1\u05e0\u05ea\u05d9",
    paymentAuthTitle: "\u05d0\u05d9\u05e9\u05d5\u05e8 \u05ea\u05e9\u05dc\u05d5\u05dd",
    paymentAuthText: "\u05d4\u05dc\u05e7\u05d5\u05d7 \u05de\u05d0\u05e9\u05e8 \u05d7\u05d9\u05d5\u05d1 \u05db\u05e8\u05d8\u05d9\u05e1 \u05d1\u05d2\u05d9\u05df \u05e0\u05d6\u05e7\u05d9\u05dd.",
    paymentAuthAccept: "\u2714 \u05d0\u05e0\u05d9 \u05de\u05d0\u05e9\u05e8 \u05ea\u05e9\u05dc\u05d5\u05dd",
    completeInventory: "\u05de\u05dc\u05d0\u05d9 \u05de\u05dc\u05d0",
    damageInventory: "\u05d3\u05d5\u05d7 \u05e0\u05d6\u05e7\u05d9\u05dd",
    damageRate: "\u05e2\u05dc\u05d5\u05ea (\u05d0\u05dd \u05e0\u05d9\u05d6\u05d5\u05e7)",
    unitPrice: "\u05de\u05d7\u05d9\u05e8 \u05dc\u05d9\u05d7\u05d9\u05d3\u05d4",
    totalPrice: "\u05e1\u05d4\u05f4\u05db",
    netTotal: "\u05e1\u05d4\u05f4\u05db \u05e0\u05e7\u05d9",
    vatPercent: "\u05de\u05e2\u05f4\u05de",
    totalWithVAT: "\u05e1\u05d4\u05f4\u05db \u05db\u05d5\u05dc\u05dc \u05de\u05e2\u05f4\u05de",
    notesTitle: "\u05d4\u05e2\u05e8\u05d5\u05ea \u05e0\u05d5\u05e1\u05e4\u05d5\u05ea",
    notesPlaceholder: "\u05db\u05ea\u05d1\u05d5 \u05d4\u05e2\u05e8\u05d5\u05ea...",
    skipperSignatureTitle: "\u05d7\u05ea\u05d9\u05de\u05ea \u05d4\u05e1\u05e7\u05d9\u05e4\u05e8",
    employeeSignatureTitle: "\u05d7\u05ea\u05d9\u05de\u05ea \u05d4\u05e2\u05d5\u05d1\u05d3",
    employeeCodeRequired: "\u26a0 \u05e0\u05d3\u05e8\u05e9 \u05e7\u05d5\u05d3 \u05e2\u05d5\u05d1\u05d3",
    employeeCodeNeeded: "\u26a0 \u05e6\u05e8\u05d9\u05da \u05e7\u05d5\u05d3!",
    signatureRequired: "\u05d7\u05ea\u05d9\u05de\u05d4 \u05d7\u05d5\u05d1\u05d4",
    save: "\u05e9\u05de\u05d5\u05e8 \u05d8\u05d9\u05d5\u05d8\u05d4",
    clear: "\u05e0\u05e7\u05d4",
    pdf: "PDF",
    back: "\u05d7\u05d6\u05e8\u05d4",
    submit: "\u05e9\u05dc\u05d7",
    ok: "OK - \u05d0\u05e0\u05d9 \u05de\u05d0\u05e9\u05e8",
    fieldRequired: "\u05e9\u05d3\u05d4 \u05d7\u05d5\u05d1\u05d4",
    emailSent: "\u05d0\u05d9\u05de\u05d9\u05d9\u05dc\u05d9\u05dd \u05e0\u05e9\u05dc\u05d7\u05d5!",
    emailError: "\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05e9\u05dc\u05d9\u05d7\u05d4. \u05e0\u05e1\u05d5 \u05e9\u05d5\u05d1.",
    checkInComplete: "\u05e6\u05f2\u05e7-\u05d0\u05d9\u05df \u05d4\u05d5\u05e9\u05dc\u05dd!",
    pdfGenerated: "PDF \u05e0\u05d5\u05e6\u05e8!",
    dataSaved: "\u05e0\u05ea\u05d5\u05e0\u05d9\u05dd \u05e0\u05e9\u05de\u05e8\u05d5!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },
  es: {
    ...I18N.es,
    mainEquipment: "Equipamiento Principal",
    hull: "Casco",
    mandatoryReading: "🔴 LECTURA OBLIGATORIA – ¡HAGA CLIC AQUÍ!",
    skipperSignatureNote: "* La firma del skipper a continuación cubre también esta autorización",
    cancelBtn: "Cancelar",
    pageTitle: "FINALIZAR CHECK-IN/OUT",
    checkInMode: "\u2705 Modo Check-in",
    checkOutMode: "\ud83d\udce6 Modo Check-out",
    termsTitle: "T\u00e9rminos y Condiciones",
    privacyTitle: "Consentimiento de Privacidad",
    privacyText: "Acepto la ",
    privacyText2: " y consiento el uso de mis datos personales por parte de Tailwind Yachting.",
    returnTitle: "Reconocimiento del Estado de Devolución",
    returnText: "Confirmo que el yate será devuelto con todo el equipamiento listado. Cualquier daño o artículo faltante podrá ser cobrado según la lista de precios.",
    termsText: "Acepto los t\u00e9rminos del alquiler. Confirmo que toda la informaci\u00f3n es correcta y he inspeccionado la embarcaci\u00f3n.",
    warningTitle: "\u26a0\ufe0f Aviso Importante",
    warningTextPart1: "ATENCI\u00d3N: Los da\u00f1os no registrados se considerar\u00e1n ocurridos durante el per\u00edodo de alquiler.",
    warningTextPart2: "El arrendatario ser\u00e1 responsable de todos los costes.",
    warningTextPart3: "Inspeccione todo cuidadosamente antes de zarpar.",
    warningTextPart4: "Gracias de antemano.",
    warningAccept: "\u2714 He le\u00eddo y entendido",
    paymentAuthTitle: "Autorizaci\u00f3n de Pago",
    paymentAuthText: "El cliente autoriza el cargo en tarjeta por da\u00f1os detectados.",
    paymentAuthAccept: "\u2714 Autorizo el pago",
    completeInventory: "INVENTARIO COMPLETO",
    damageInventory: "INFORME DE DA\u00d1OS",
    damageRate: "Coste (si da\u00f1ado)",
    unitPrice: "Precio Unitario",
    totalPrice: "Total",
    netTotal: "TOTAL NETO",
    vatPercent: "IVA",
    totalWithVAT: "TOTAL CON IVA",
    notesTitle: "Observaciones Adicionales",
    notesPlaceholder: "Escriba observaciones...",
    skipperSignatureTitle: "Firma del Patr\u00f3n",
    employeeSignatureTitle: "Firma del Empleado",
    employeeCodeRequired: "\u26a0 C\u00f3digo de Empleado Requerido",
    employeeCodeNeeded: "\u26a0 Se necesita c\u00f3digo!",
    signatureRequired: "Firma obligatoria",
    save: "Guardar borrador",
    clear: "Limpiar",
    pdf: "PDF",
    back: "Atr\u00e1s",
    submit: "Enviar",
    ok: "OK - CONFIRMO",
    fieldRequired: "Campo obligatorio",
    emailSent: "\u00a1Emails enviados con \u00e9xito!",
    emailError: "Error de env\u00edo. Reintente.",
    checkInComplete: "\u00a1Check-in completado!",
    pdfGenerated: "\u00a1PDF generado!",
    dataSaved: "\u00a1Datos guardados!",
    footerAddress: "Leukosias 37, Alimos",
    footerWebsite: "www.tailwindyachting.com",
    footerPhone: "Tel: +30 6978196009"
  },

};

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function getItemLabel(key, lang = 'en') {
  return ITEM_LABELS[key]?.[lang] || key;
}

// Transform items array into CompleteInventory format
function transformItemsToInventory(items: any[], page: string, sectionParam: any, lang: string = 'en'): any[] {
    const section = typeof sectionParam === 'string' ? sectionParam : (sectionParam.en || sectionParam[lang] || sectionParam);
    const sectionEn = typeof sectionParam === 'string' ? sectionParam : (sectionParam.en || section);
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => {
    // Debug: Log items with media
    if (item.media && item.media.length > 0) {
      console.log(`📷 [${page}/${section}] Item "${item.key}" has ${item.media.length} photos`);
    }
    return {
      page,
      section,
      name: getItemLabel(item.key, lang) || item.key,
            nameEn: getItemLabel(item.key, 'en') || item.key,
      qty: item.qty || 1,
      inOk: item.inOk || false,
      out: item.out || null,
      price: item.price || '0',
      media: item.media || [] // Include photos/media
    };
  });
}

// Transform Page 2 data to inventory items
function transformPage2Data(data: any, lang: string = 'en'): any[] {
  if (!data) return [];
  const results: any[] = [];

  // Main equipment items
  if (data.items && Array.isArray(data.items)) {
    results.push(...transformItemsToInventory(data.items, 'Equipment Inspection', {en:'Main Equipment',el:'Κύριος Εξοπλισμός',it:'Equipaggiamento Principale',de:'Hauptausrüstung',ru:'Основное оборудование',fr:'Équipement Principal',ro:'Echipament Principal',pl:'Wyposażenie Główne',he:'ציוד ראשי',es:'Equipamiento Principal'}, lang));
  }

  // Hull items
  if (data.hullItems && Array.isArray(data.hullItems)) {
    results.push(...transformItemsToInventory(data.hullItems, 'Equipment Inspection', {en:'Hull',el:'Κύτος',it:'Scafo',de:'Rumpf',ru:'Корпус',fr:'Coque',ro:'Coca',pl:'Kadłub',he:'גוף הסירה',es:'Casco'}, lang));
  }

  // Dinghy items
  if (data.dinghyItems && Array.isArray(data.dinghyItems)) {
    results.push(...transformItemsToInventory(data.dinghyItems, 'Equipment Inspection', {en:'Dinghy',el:'Λέμβος',it:'Tender',de:'Beiboot',ru:'Тузик',fr:'Annexe',ro:'Barcă',pl:'Ponton',he:'סירת גומי',es:'Bote'}, lang));
  }

  return results;
}

// Transform Page 3 data to inventory items
function transformPage3Data(data: any, lang: string = 'en'): any[] {
  if (!data) return [];
  const results: any[] = [];

  // Safety items
  if (data.safetyItems && Array.isArray(data.safetyItems)) {
    results.push(...transformItemsToInventory(data.safetyItems, 'Page 3', {en:'Safety Equipment',el:'Εξοπλισμός Ασφαλείας',it:'Equipaggiamento di Sicurezza',de:'Sicherheitsausrüstung',ru:'Оборудование безопасности',fr:'Équipement de Sécurité',ro:'Echipament de Siguranță',pl:'Wyposażenie Bezpieczeństwa',he:'ציוד בטיחות',es:'Equipo de Seguridad'}, lang));
  }

  // Cabin items
  if (data.cabinItems && Array.isArray(data.cabinItems)) {
    results.push(...transformItemsToInventory(data.cabinItems, 'Page 3', {en:'Cabin',el:'Καμπίνα',it:'Cabina',de:'Kabine',ru:'Каюта',fr:'Cabine',ro:'Cabină',pl:'Kabina',he:'תא',es:'Camarote'}, lang));
  }

  // Optional items
  if (data.optionalItems && Array.isArray(data.optionalItems)) {
    results.push(...transformItemsToInventory(data.optionalItems, 'Page 3', {en:'Optional',el:'Προαιρετικά',it:'Opzionali',de:'Optional',ru:'Дополнительно',fr:'Optionnel',ro:'Opțional',pl:'Opcjonalne',he:'אופציונלי',es:'Opcional'}, lang));
  }

  return results;
}

// Transform Page 4 data to inventory items
function transformPage4Data(data: any, lang: string = 'en'): any[] {
  if (!data) return [];
  const results: any[] = [];

  // Navigation items
  if (data.navItems && Array.isArray(data.navItems)) {
    results.push(...transformItemsToInventory(data.navItems, 'Detailed Inspection', {en:'Navigation',el:'Πλοήγηση',it:'Navigazione',de:'Navigation',ru:'Навигация',fr:'Navigation',ro:'Navigație',pl:'Nawigacja',he:'ניווט',es:'Navegación'}, lang));
  }

  // Safety items
  if (data.safetyItems && Array.isArray(data.safetyItems)) {
    results.push(...transformItemsToInventory(data.safetyItems, 'Detailed Inspection', {en:'Safety',el:'Ασφάλεια',it:'Sicurezza',de:'Sicherheit',ru:'Безопасность',fr:'Sécurité',ro:'Siguranță',pl:'Bezpieczeństwo',he:'בטיחות',es:'Seguridad'}, lang));
  }

  // Generator items
  if (data.genItems && Array.isArray(data.genItems)) {
    results.push(...transformItemsToInventory(data.genItems, 'Detailed Inspection', {en:'Generator',el:'Γεννήτρια',it:'Generatore',de:'Generator',ru:'Генератор',fr:'Générateur',ro:'Generator',pl:'Generator',he:'גנרטור',es:'Generador'}, lang));
  }

  // Deck items
  if (data.deckItems && Array.isArray(data.deckItems)) {
    results.push(...transformItemsToInventory(data.deckItems, 'Detailed Inspection', {en:'Deck',el:'Κατάστρωμα',it:'Ponte',de:'Deck',ru:'Палуба',fr:'Pont',ro:'Punte',pl:'Pokład',he:'סיפון',es:'Cubierta'}, lang));
  }

  // Front deck items
  if (data.fdeckItems && Array.isArray(data.fdeckItems)) {
    results.push(...transformItemsToInventory(data.fdeckItems, 'Detailed Inspection', {en:'Front Deck',el:'Πλώρη',it:'Ponte Anteriore',de:'Vordeck',ru:'Носовая палуба',fr:'Pont Avant',ro:'Punte Față',pl:'Pokład Dziobowy',he:'סיפון קדמי',es:'Cubierta Delantera'}, lang));
  }

  // Dinghy items
  if (data.dinghyItems && Array.isArray(data.dinghyItems)) {
    results.push(...transformItemsToInventory(data.dinghyItems, 'Detailed Inspection', {en:'Dinghy',el:'Λέμβος',it:'Tender',de:'Beiboot',ru:'Тузик',fr:'Annexe',ro:'Barcă',pl:'Ponton',he:'סירת גומי',es:'Bote'}, lang));
  }

  // Fenders items
  if (data.fendersItems && Array.isArray(data.fendersItems)) {
    results.push(...transformItemsToInventory(data.fendersItems, 'Detailed Inspection', {en:'Fenders',el:'Μπαλόνια',it:'Parabordi',de:'Fender',ru:'Кранцы',fr:'Pare-battages',ro:'Apărători',pl:'Odbijacze',he:'פנדרים',es:'Defensas'}, lang));
  }

  // Boathook items
  if (data.boathookItems && Array.isArray(data.boathookItems)) {
    results.push(...transformItemsToInventory(data.boathookItems, 'Detailed Inspection', {en:'Boathook',el:'Γάντζος',it:'Mezzo Marinaio',de:'Bootshaken',ru:'Отпорный крюк',fr:'Gaffe',ro:'Cange',pl:'Bosak',he:'אנקול',es:'Bichero'}, lang));
  }

  // Main items (if present)
  if (data.items && Array.isArray(data.items)) {
    results.push(...transformItemsToInventory(data.items, 'Detailed Inspection', {en:'General',el:'Γενικά',it:'Generale',de:'Allgemein',ru:'Общее',fr:'Général',ro:'General',pl:'Ogólne',he:'כללי',es:'General'}, lang));
  }

  return results;
}

// Load all inventory items from Pages 2, 3, 4
async function loadAllInventoryItems(bookingNumber: string, mode: 'in' | 'out', lang: string = 'en'): Promise<any[]> {
  const allItems: any[] = [];

  // 🔥 Load media from localStorage (photos stored separately from API)
  // For check-out mode, load media from BOTH check-in AND check-out (photos taken during check-in should still appear)
  const page2MediaCurrent = getPageMedia(bookingNumber, mode, 'page2');
  const page3MediaCurrent = getPageMedia(bookingNumber, mode, 'page3');
  const page4MediaCurrent = getPageMedia(bookingNumber, mode, 'page4');

  // Start with current mode's media
  let page2Media: Record<string, any[]> = { ...page2MediaCurrent };
  let page3Media: Record<string, any[]> = { ...page3MediaCurrent };
  let page4Media: Record<string, any[]> = { ...page4MediaCurrent };

  // If in check-out mode, also load check-in photos
  if (mode === 'out') {
    const page2MediaIn = getPageMedia(bookingNumber, 'in', 'page2');
    const page3MediaIn = getPageMedia(bookingNumber, 'in', 'page3');
    const page4MediaIn = getPageMedia(bookingNumber, 'in', 'page4');

    // Merge check-in photos with check-out photos (combine both)
    Object.keys(page2MediaIn).forEach(key => {
      if (!page2Media[key]) page2Media[key] = page2MediaIn[key];
      else page2Media[key] = [...page2MediaIn[key], ...page2Media[key]];
    });
    Object.keys(page3MediaIn).forEach(key => {
      if (!page3Media[key]) page3Media[key] = page3MediaIn[key];
      else page3Media[key] = [...page3MediaIn[key], ...page3Media[key]];
    });
    Object.keys(page4MediaIn).forEach(key => {
      if (!page4Media[key]) page4Media[key] = page4MediaIn[key];
      else page4Media[key] = [...page4MediaIn[key], ...page4Media[key]];
    });

    console.log('📷 Check-in media also loaded for check-out mode');
  }

  console.log('📷 Media loaded from localStorage:', {
    page2: Object.keys(page2Media).length + ' items',
    page3: Object.keys(page3Media).length + ' items',
    page4: Object.keys(page4Media).length + ' items'
  });

  try {
    // Load Page 2 data
    const page2Data = await getPage2DataHybrid(bookingNumber, mode);
    if (page2Data) {
      console.log('📦 Page 2 data loaded:', page2Data);
      // 🔥 Merge media from localStorage into items
      if (page2Data.items) page2Data.items = mergeMediaIntoItems(page2Data.items, page2Media);
      if (page2Data.hullItems) page2Data.hullItems = mergeMediaIntoItems(page2Data.hullItems, page2Media);
      if (page2Data.dinghyItems) page2Data.dinghyItems = mergeMediaIntoItems(page2Data.dinghyItems, page2Media);
      // Debug: Check if media exists after merge
      if (page2Data.items) {
        const itemsWithMedia = page2Data.items.filter((i: any) => i.media && i.media.length > 0);
        console.log(`📷 Page 2 items with media after merge: ${itemsWithMedia.length}`);
        itemsWithMedia.forEach((i: any) => {
          console.log(`  - Item "${i.key}": ${i.media.length} photos, first photo structure:`, {
            type: typeof i.media[0],
            hasUrl: !!i.media[0]?.url,
            hasData: !!i.media[0]?.data,
            urlPreview: i.media[0]?.url?.substring(0, 80) || 'N/A'
          });
        });
      }
      allItems.push(...transformPage2Data(page2Data, lang));
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Page 2 data:', error);
  }

  try {
    // Load Page 3 data
    const page3Data = await getPage3DataHybrid(bookingNumber, mode);
    if (page3Data) {
      console.log('📦 Page 3 data loaded:', page3Data);
      // 🔥 Merge media from localStorage into items
      if (page3Data.safetyItems) page3Data.safetyItems = mergeMediaIntoItems(page3Data.safetyItems, page3Media);
      if (page3Data.cabinItems) page3Data.cabinItems = mergeMediaIntoItems(page3Data.cabinItems, page3Media);
      if (page3Data.optionalItems) page3Data.optionalItems = mergeMediaIntoItems(page3Data.optionalItems, page3Media);
      allItems.push(...transformPage3Data(page3Data, lang));
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Page 3 data:', error);
  }

  try {
    // Load Page 4 data
    const page4Data = await getPage4DataHybrid(bookingNumber, mode);
    if (page4Data) {
      console.log('📦 Page 4 data loaded:', page4Data);
      // 🔥 Merge media from localStorage into items
      if (page4Data.items) page4Data.items = mergeMediaIntoItems(page4Data.items, page4Media);
      if (page4Data.navItems) page4Data.navItems = mergeMediaIntoItems(page4Data.navItems, page4Media);
      if (page4Data.safetyItems) page4Data.safetyItems = mergeMediaIntoItems(page4Data.safetyItems, page4Media);
      if (page4Data.genItems) page4Data.genItems = mergeMediaIntoItems(page4Data.genItems, page4Media);
      if (page4Data.deckItems) page4Data.deckItems = mergeMediaIntoItems(page4Data.deckItems, page4Media);
      if (page4Data.fdeckItems) page4Data.fdeckItems = mergeMediaIntoItems(page4Data.fdeckItems, page4Media);
      if (page4Data.dinghyItems) page4Data.dinghyItems = mergeMediaIntoItems(page4Data.dinghyItems, page4Media);
      if (page4Data.fendersItems) page4Data.fendersItems = mergeMediaIntoItems(page4Data.fendersItems, page4Media);
      if (page4Data.boathookItems) page4Data.boathookItems = mergeMediaIntoItems(page4Data.boathookItems, page4Media);
      allItems.push(...transformPage4Data(page4Data, lang));
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Page 4 data:', error);
  }

  console.log(`📋 Total inventory items loaded: ${allItems.length}`);
  const itemsWithPhotos = allItems.filter(i => i.media && i.media.length > 0);
  console.log(`📷 Items with photos: ${itemsWithPhotos.length}`, itemsWithPhotos.map(i => ({ name: i.name, photos: i.media.length })));
  return allItems;
}

function getDamagePhotos(mode) {
  // DEPRECATED: This function needs refactoring to use API data
  console.warn('⚠️ getDamagePhotos: localStorage for bookings removed - photos should be loaded via API');
  if (mode !== 'out') return {};
  return {};
}

function getAllPhotos() {
  // DEPRECATED: This function needs refactoring to use API data
  console.warn('⚠️ getAllPhotos: localStorage for bookings removed - photos should be loaded via API');
  return {};
}

async function sendEmailWithPDF(bookingData, pdfBlob, mode, lang, additionalData?: any) {
  const t = Page5_I18N[lang] || Page5_I18N.en;
  try {
    const customerEmail = bookingData.skipperEmail || '';

    // Use the centralized email service with additional data (inventory, agreements, notes)
    if (mode === 'in') {
      return await sendCheckInEmail(customerEmail, bookingData, pdfBlob, additionalData, lang);
    } else {
      return await sendCheckOutEmail(customerEmail, bookingData, pdfBlob, additionalData, lang);
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
  useSignatureTouch(canvasRef);
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

  const t = Page5_I18N[lang] || Page5_I18N.en;

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
          width={600} 
          height={180} 
          className="w-full max-w-full h-[180px] md:h-[200px] cursor-crosshair"
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
  const [zoomedPhoto, setZoomedPhoto] = React.useState(null);

  if (items.length === 0) return null;

  // Get VAT rate from settings
  let vatRate = 24;
  try {
    vatRate = getVATRate() || 24;
  } catch (e) {
    vatRate = 24; // Default to 24%
  }

  let totalAmount = 0;
  items.forEach(item => {
    const qty = item.qty || 1;
    const unitPrice = parseFloat(item.price) || 0;
    totalAmount += qty * unitPrice;
  });

  // Calculate VAT
  const netTotal = totalAmount;
  const vatAmount = netTotal * (vatRate / 100);
  const totalWithVat = netTotal + vatAmount;

  // Collect all photos with item info
  const allDamagePhotos = [];
  items.forEach((item, idx) => {
    const photos = item.media || [];
    // 🔥 Debug: Log photo structure
    if (photos.length > 0) {
      console.log(`📷 DamageInventory: Item "${item.name}" has ${photos.length} photos:`,
        photos.map((p, i) => ({
          index: i,
          type: typeof p,
          hasUrl: !!p?.url,
          hasData: !!p?.data,
          urlPreview: p?.url?.substring(0, 50) || p?.data?.substring(0, 50) || 'N/A'
        }))
      );
    }
    photos.forEach((photo, photoIdx) => {
      allDamagePhotos.push({
        itemName: item.name,
        itemPage: item.page,
        photo,
        idx: `${idx}-${photoIdx}`
      });
    });
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
                <th className="text-center p-2 font-bold">📷</th>
                <th className="text-right p-2 font-bold">{t.unitPrice}</th>
                <th className="text-right p-2 font-bold">{t.totalPrice}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = item.qty || 1;
                const unitPrice = parseFloat(item.price) || 0;
                const total = qty * unitPrice;
                const photoCount = (item.media || []).length;

                return (
                  <tr key={idx} className="border-t" style={{ borderColor: '#fee2e2' }}>
                    <td className="p-2 text-xs text-gray-600">{item.page}</td>
                    <td className="p-2 font-semibold" style={{ color: brand.black }}>{item.name}</td>
                    <td className="p-2 text-center font-bold">{qty}</td>
                    <td className="p-2 text-center">
                      {photoCount > 0 ? (
                        <span className="inline-flex items-center justify-center bg-red-100 text-red-600 text-xs font-bold rounded-full w-6 h-6">
                          {photoCount}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-2 text-right" style={{ color: brand.grey }}>€{unitPrice.toFixed(2)}</td>
                    <td className="p-2 text-right font-bold" style={{ color: '#dc2626' }}>€{total.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Damage Photos Gallery */}
        {allDamagePhotos.length > 0 && (
          <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#dc2626' }}>
            <h4 className="font-bold text-base mb-3" style={{ color: '#dc2626' }}>
              📷 {t.damagePhotosTitle || 'Damage Photos'} ({allDamagePhotos.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allDamagePhotos.map(({ itemName, itemPage, photo, idx }) => {
                const photoUrl = photo?.url || photo?.data || (typeof photo === 'string' ? photo : null);
                if (!photoUrl) return null;

                return (
                  <div
                    key={idx}
                    className="relative rounded-lg overflow-hidden border-2 border-red-200 cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => setZoomedPhoto(photoUrl)}
                  >
                    <img
                      src={photoUrl}
                      alt={`${itemName} damage`}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1">
                      <p className="text-white text-xs truncate font-semibold">{itemName}</p>
                      <p className="text-gray-300 text-xs">{itemPage}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t-2" style={{ borderColor: '#dc2626' }}>
          {/* NET TOTAL */}
          <div className="flex justify-between items-center py-2 px-3 mb-1" style={{ backgroundColor: '#f3f4f6' }}>
            <span className="text-base font-bold" style={{ color: brand.black }}>{t.netTotal}:</span>
            <span className="text-lg font-bold" style={{ color: brand.black }}>€{netTotal.toFixed(2)}</span>
          </div>
          {/* VAT */}
          <div className="flex justify-between items-center py-2 px-3 mb-1" style={{ backgroundColor: '#f3f4f6' }}>
            <span className="text-base font-bold" style={{ color: brand.black }}>{t.vatPercent} {vatRate}%:</span>
            <span className="text-lg font-bold" style={{ color: brand.black }}>€{vatAmount.toFixed(2)}</span>
          </div>
          {/* TOTAL WITH VAT */}
          <div className="flex justify-between items-center py-3 px-3 rounded-lg border-2" style={{ backgroundColor: '#fee2e2', borderColor: '#dc2626' }}>
            <span className="text-xl font-bold" style={{ color: '#dc2626' }}>{t.totalWithVAT}:</span>
            <span className="text-2xl font-bold" style={{ color: '#dc2626' }}>€{totalWithVat.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Photo Zoom Modal */}
      {zoomedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <img
            src={zoomedPhoto}
            alt="Zoomed damage photo"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl"
          />
          <button
            className="absolute top-4 right-4 text-white text-3xl font-bold hover:text-gray-300"
            onClick={() => setZoomedPhoto(null)}
          >
            ✕
          </button>
        </div>
      )}
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
  useSignatureTouch(canvasRef);
  
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
          width={600} 
          height={180} 
          className="w-full max-w-full h-[180px] md:h-[200px] cursor-crosshair"
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
  // Get context data (API is source of truth)
  const contextData = useContext(DataContext);

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
  
  const [lang, setLang] = useState(sessionStorage.getItem("yacht_lang") || "en"); // Will be set from context/API
  const navigatePage5 = useNavigate();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
    // Load mode from context (API is source of truth)
    const savedMode = contextData?.mode || 'in';
    setMode(savedMode);

    const employeeSession = sessionStorage.getItem('currentEmployee');
    if (employeeSession) {
      try {
        const employee = JSON.parse(employeeSession);
        setIsEmployee(true);
        setCurrentEmployee(employee);
      } catch (e) {
        console.error('Error parsing employee session:', e);
      }
    }
  }, [contextData?.mode]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get booking from context (API is source of truth)
        const currentBooking = contextData?.bookingNumber || localStorage.getItem('currentBooking');
        if (!currentBooking) return;
        setCurrentBookingNumber(currentBooking);

        // 🔥 FIX: Load inventory items from Pages 2, 3, 4 via API
        const inventoryItems = await loadAllInventoryItems(currentBooking, mode as 'in' | 'out', lang);
        setAllItems(inventoryItems);

        if (mode === 'out') {
          // 🔥 FIX: Filter damaged items (out === 'not' OR inOk === false for check-out)
          const damaged = inventoryItems.filter(item => item.out === 'not' || item.inOk === false);
          setDamageItems(damaged);
        }

        // 🔥 FIX: Extract photos from inventoryItems (which already has merged media from localStorage)
        // This replaces the deprecated getDamagePhotos/getAllPhotos functions
        // PDF and Email expect an array of URL strings, not media objects
        const extractedPhotos: Record<string, string[]> = {};
        inventoryItems.forEach(item => {
          if (item.media && item.media.length > 0) {
            const itemKey = item.name || item.key || 'unknown';
            // Extract URL strings from media objects (media objects have { mid, type, url } structure)
            const photoUrls = item.media
              .map((m: any) => m?.url || m?.data || (typeof m === 'string' ? m : null))
              .filter(Boolean);
            if (photoUrls.length > 0) {
              extractedPhotos[itemKey] = photoUrls;
              console.log(`📷 Item "${itemKey}" has ${photoUrls.length} photos, first URL starts with: ${photoUrls[0]?.substring(0, 50)}...`);
            }
          }
        });
        console.log(`📷 Extracted photos from ${Object.keys(extractedPhotos).length} items for email/PDF`);
        setAllPhotos(extractedPhotos);

        // 🔥 FIX: First get vessel/skipper data from Page 1 API (source of truth)
        const page1Data = await getPage1DataHybrid(currentBooking);
        console.log('📍 Final Page: Loaded Page 1 data:', page1Data);

        // Use globalBookings from context instead of localStorage
        const globalBookings = contextData?.globalBookings || [];
        const bookingFromContext = globalBookings.find((b: any) =>
          b.bookingNumber === currentBooking || b.code === currentBooking
        );
        const baseData = bookingFromContext || contextData?.data || {};

        // 🔥 FIX: Merge booking info, prioritizing Page 1 data (source of truth for vessel/skipper/dates)
        const mergedData = {
          ...baseData,
          // 🔥 CRITICAL: Explicitly set bookingNumber so PDF and email can use it
          bookingNumber: currentBooking,
          vesselName: page1Data?.vesselName || baseData?.vesselName || baseData?.vessel,
          skipperFirstName: page1Data?.skipperFirstName || baseData?.skipperFirstName,
          skipperLastName: page1Data?.skipperLastName || baseData?.skipperLastName,
          skipperEmail: page1Data?.skipperEmail || baseData?.skipperEmail,
          skipperPhone: page1Data?.skipperPhone || baseData?.skipperPhone,
          skipperAddress: page1Data?.skipperAddress || baseData?.skipperAddress,
          checkInDate: page1Data?.checkInDate || baseData?.checkInDate,
          checkOutDate: page1Data?.checkOutDate || baseData?.checkOutDate,
        };
        console.log('📍 Final Page: mergedData.bookingNumber =', mergedData.bookingNumber);
        setBookingData(mergedData);

        // Set language from booking data
        if (mergedData?.language) {
          setLang(mergedData.language);
        }

        // 🔥 Try API first for Page 5 data
        let page5Data = null;
        try {
          const apiData = await getPage5DataHybrid(currentBooking, mode);
          if (apiData) {
            console.log('✅ Page 5 data loaded from API');
            page5Data = apiData;
          }
        } catch (error) {
          console.warn('⚠️ API load failed, trying localStorage:', error);
        }

        // Fallback to localStorage
        if (!page5Data) {
          const storageKey = mode === 'in' ? `page5DataCheckIn_${currentBooking}` : `page5DataCheckOut_${currentBooking}`;
          const savedPage5Data = localStorage.getItem(storageKey);
          if (savedPage5Data) {
            try {
              page5Data = JSON.parse(savedPage5Data);
            } catch (e) {
              console.error('Error parsing saved Page 5 data:', e);
            }
          }
        }

        if (page5Data) {
          setTermsAccepted(page5Data.termsAccepted || false);
          setPrivacyAccepted(page5Data.privacyAccepted || false);
          setReturnAccepted(page5Data.returnAccepted || false);
          setWarningAccepted(page5Data.warningAccepted || false);
          setPaymentAuthAccepted(page5Data.paymentAuthAccepted || false);
          setNotes(page5Data.notes || '');
          setSkipperSigned(!!page5Data.skipperSignatureData);
          setEmployeeSigned(!!page5Data.employeeSignatureData);
          setSignatureImage(page5Data.skipperSignatureData || '');
          setEmployeeSignatureImage(page5Data.employeeSignatureData || '');
          setPaymentAuthSignatureImage(page5Data.paymentAuthSignatureData || '');
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
    const timer = setTimeout(async () => {
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
        // 🔥 Also save to API
        try {
          await savePage5DataHybrid(currentBookingNumber, page5Data, mode);
          console.log('💾 Page 5 auto-saved to API');
        } catch (error) {
          console.warn('⚠️ Page 5 API auto-save failed:', error);
        }
      }
    }, 2000); // Increased to 2 seconds to reduce API calls
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
    
    // Validate ALL items from Pages 1 + 2 + 3 + 4 before allowing submit
    const bookingNumForValidation = currentBookingNumber || localStorage.getItem('currentBooking');
    if (bookingNumForValidation) {
      const isIncomplete = (item: any) => {
        if (mode === 'in') return !item.inOk;
        return item.out !== 'ok' && item.out !== 'not';
      };
      try {
        // Page 1 check
        const p1 = await getPage1DataHybrid(bookingNumForValidation);
        if (p1) {
          const requiredP1 = [
            { key: 'vesselName', label: 'Vessel Name' },
            { key: 'skipperFirstName', label: 'Skipper First Name' },
            { key: 'checkInDate', label: 'Check-in Date' }
          ];
          for (const { key, label } of requiredP1) {
            if (!p1[key] || String(p1[key]).trim() === '') {
              alert(`Please complete: Page 1 - ${label}`);
              navigatePage5('/page1');
              return;
            }
          }
        }
        // Page 2 check
        const p2 = await getPage2DataHybrid(bookingNumForValidation, mode);
        if (p2) {
          const p2Arrays = [
            { key: 'items', label: 'Equipment Inspection' },
            { key: 'hullItems', label: 'Hull Inspection' },
            { key: 'dinghyItems', label: 'Dinghy (Equipment)' }
          ];
          for (const { key, label } of p2Arrays) {
            if (Array.isArray(p2[key])) {
              const missing = p2[key].find(isIncomplete);
              if (missing) {
                alert(`Please complete: ${label} - ${missing.name || missing.key || missing.id}`);
                navigatePage5('/page2');
                return;
              }
            }
          }
        }
        const p3 = await getPage3DataHybrid(bookingNumForValidation, mode);
        if (p3) {
          const p3Arrays = [
            { key: 'safetyItems', label: 'Page 3 - Safety' },
            { key: 'cabinItems', label: 'Page 3 - Cabin' }
          ];
          for (const { key, label } of p3Arrays) {
            if (Array.isArray(p3[key])) {
              const missing = p3[key].find(isIncomplete);
              if (missing) {
                alert(`Please complete: ${label} - ${missing.name || missing.key || missing.id}`);
                navigatePage5('/page3');
                return;
              }
            }
          }
        }
        const p4 = await getPage4DataHybrid(bookingNumForValidation, mode);
        if (p4) {
          const p4Arrays = [
            { key: 'items', label: 'Detailed Inspection' },
            { key: 'navItems', label: 'Navigation Equipment' },
            { key: 'safetyItems', label: 'Safety Equipment' },
            { key: 'genItems', label: 'General Equipment' },
            { key: 'deckItems', label: 'Deck Equipment' },
            { key: 'fdeckItems', label: 'Fore Deck Equipment' },
            { key: 'dinghyItems', label: 'Dinghy Equipment' },
            { key: 'fendersItems', label: 'Fenders' },
            { key: 'boathookItems', label: 'Boathook' }
          ];
          for (const { key, label } of p4Arrays) {
            if (Array.isArray(p4[key])) {
              const missing = p4[key].find(isIncomplete);
              if (missing) {
                alert(`Please complete: ${label} - ${missing.name || missing.key || missing.id}`);
                navigatePage5('/page4');
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error('Validation error:', err);
      }
    }

    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      console.log('📝 handleSubmit - Starting signature capture...');
      console.log('📝 handleSubmit - skipperSigned:', skipperSigned);
      console.log('📝 handleSubmit - skipperCanvasRef.current:', !!skipperCanvasRef.current);
      console.log('📝 handleSubmit - signatureImage length:', signatureImage?.length || 0);

      let skipperSignatureData = null;

      // Try to get skipper signature from canvas first
      if (skipperSigned && skipperCanvasRef.current) {
        try {
          skipperSignatureData = await compressSignature(skipperCanvasRef.current.toDataURL('image/png'));
          console.log('📝 handleSubmit - Skipper sig from canvas, length:', skipperSignatureData?.length || 0);
        } catch (e) {
          console.error("❌ Error compressing skipper signature:", e);
        }
      }

      // Fallback to signatureImage state (like employee signature logic)
      if (!skipperSignatureData && signatureImage && signatureImage.length > 100) {
        skipperSignatureData = signatureImage;
        console.log('📝 handleSubmit - Skipper sig from signatureImage state, length:', skipperSignatureData?.length || 0);
      }

      // Fallback to localStorage
      if (!skipperSignatureData && currentBookingNumber) {
        const signatureKey = `page5_skipper_signature_${currentBookingNumber}_${mode}`;
        const saved = localStorage.getItem(signatureKey);
        if (saved && saved.length > 100) {
          skipperSignatureData = saved;
          console.log('📝 handleSubmit - Skipper sig from localStorage, length:', skipperSignatureData?.length || 0);
        }
      }

      console.log('📝 handleSubmit - Final skipperSignatureData:', skipperSignatureData ? `${skipperSignatureData.substring(0, 50)}... (${skipperSignatureData.length} chars)` : 'null');
      
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
          console.log('📝 handleSubmit - Employee sig from employeeSignatureImage state');
        }

      console.log('📝 handleSubmit - Final employeeSignatureData:', employeeSignatureData ? `${employeeSignatureData.substring(0, 50)}... (${employeeSignatureData.length} chars)` : 'null');
      console.log('📝 handleSubmit - Sending to email: skipper=', !!skipperSignatureData, 'employee=', !!employeeSignatureData);

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

      // ✅ SAVE ALL DATA TO API BEFORE PDF/EMAIL
      if (currentBookingNumber) {
        try {
          // Load existing booking to get all page data
          const existingBooking = await getBooking(currentBookingNumber);

          // Prepare complete booking update
          const completeUpdate = {
            bookingData: bookingData,
            page2DataCheckIn: existingBooking?.page2DataCheckIn || null,
            page2DataCheckOut: existingBooking?.page2DataCheckOut || null,
            page3DataCheckIn: existingBooking?.page3DataCheckIn || null,
            page3DataCheckOut: existingBooking?.page3DataCheckOut || null,
            page4DataCheckIn: existingBooking?.page4DataCheckIn || null,
            page4DataCheckOut: existingBooking?.page4DataCheckOut || null
          };

          // Add page5 data to the appropriate mode
          if (mode === 'in') {
            completeUpdate.page5DataCheckIn = page5AdditionalData;
          } else {
            completeUpdate.page5DataCheckOut = page5AdditionalData;
          }

          // Save complete booking to API
          await saveBooking(currentBookingNumber, completeUpdate);
          console.log('✅ Complete booking saved to API');
            setIsSubmitted(true);
            setIsSubmitting(false);
        } catch (error) {
          console.error('⚠️ Failed to save complete booking to API:', error);
          // Continue with PDF/email even if API save fails
        }
      }

      const pdfDoc = generateLuxuryPDF(bookingData, mode, page5AdditionalData, lang, { isPage5: true });
      if (!pdfDoc) {
        alert('Error generating PDF!');
        return;
      }
      
      const pdfBlob = pdfDoc.output('blob');
      console.log('PDF Blob size:', pdfBlob?.size || 0);
      const emailResult = await sendEmailWithPDF(bookingData, pdfBlob, mode, lang, page5AdditionalData);
      
      if (emailResult.success) {
        alert(t.emailSent + '\n' + t.checkInComplete);
      } else {
        alert(t.emailError);
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
      alert('Error submitting form!');
            setIsSubmitting(false);
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
        {SHOW_BOOKING_INFO_ON_CHECKLIST_PAGES && (
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
        )}
        
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
                    {t.loggedIn || 'Logged in'}
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
                {t.logoutBtn || 'Logout'}
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
              ⚠️ {t.fieldRequired} - {t.mustBeRead || 'MUST BE READ!'}
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
                ? (t.damagePhotosBtn || '📸 DAMAGE PHOTOS')
                : (t.photosBtn || '📸 PHOTOS')
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
        <div className="mt-6 grid grid-cols-2 md:flex md:flex-wrap md:justify-between gap-2 md:gap-3">
          <button 
            type="button" 
            onClick={handlePrevious} 
            className="px-4 py-3 rounded font-semibold bg-gray-500 text-white hover:bg-gray-600 transition-colors min-h-[44px] col-span-2 md:col-span-1"
          >
            ← {t.back}
          </button>
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3 col-span-2 md:col-span-1">
            <button 
              type="button" 
              onClick={handleSaveDraft} 
              className="px-4 py-3 rounded transition-colors bg-gray-500 text-white hover:bg-gray-600 min-h-[44px]"
            >
              {t.save}
            </button>
            {/* 🔒 PDF BUTTON WITH LOCK */}
            <button 
              type="button" 
              onClick={handleGeneratePDF} 
              disabled={areButtonsLocked || isSubmitting || isSubmitted}
              className="px-4 py-2 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 min-h-[44px]" 
              style={{ background: areButtonsLocked ? '#9ca3af' : '#dc2626', color: '#fff' }}
              title={areButtonsLocked ? (lang === 'el' ? 'Χρειάζεται κωδικός υπαλλήλου' : 'Employee code required') : ''}
            >
              {areButtonsLocked ? '🔒' : '📄'} {t.pdf}
            </button>
            {/* 🔒 SUBMIT BUTTON WITH LOCK */}
            <button 
              type="button" 
              onClick={handleSubmit} 
              disabled={areButtonsLocked || isSubmitting || isSubmitted}
              className="px-4 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 min-h-[44px]"
              style={{ background: isSubmitted ? '#22c55e' : (areButtonsLocked || isSubmitting) ? '#9ca3af' : brand.blue, color: '#fff' }}
              title={areButtonsLocked ? (lang === 'el' ? 'Χρειάζεται κωδικός υπαλλήλου' : 'Employee code required') : ''}
            >
                {isSubmitted ? '✅ Sent!' : isSubmitting ? '⏳...' : areButtonsLocked ? '🔒' : '✓'} {!isSubmitted && !isSubmitting && t.submit}
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
                {t.cancelBtn}
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