import React, { useState, useRef, useEffect } from "react";

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
  en: {
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
  },
  el: {
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
  return (
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
        <button onClick={() => setLang(lang === "en" ? "el" : "en")}
          className="px-3 py-1 rounded border text-xs font-semibold"
          style={{ borderColor: brand.black, color: brand.black }}>
          {lang === "en" ? "GR EL" : "GB EN"}
        </button>
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
  const canvasRef = useRef(null);
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
        {mode === "in" ? (lang === "el" ? "Υπογραφή Κυβερνήτη *" : "Skipper's Signature *") : (lang === "el" ? "Υπογραφή Υπαλλήλου *" : "Employee's Signature *")}
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
                <th className="border px-2 py-2 text-center" style={{ borderColor: brand.black, width: '120px' }}>{t.checkIn}</th>
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
                  <span className="font-semibold" style={{ color: brand.black }}>{getLabel(item.key)}</span>
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
                    className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold" 
                    style={{ borderColor: brand.black, color: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white' }}>
                    −5
                  </button>
                  <input 
                    type="text" 
                    value={item.price || ""} 
                    onChange={(e) => setPrice(item.id, e.target.value)}
                    disabled={!canEditPrices}
                    className="w-16 px-1 py-0.5 border rounded text-center text-sm" 
                    style={{ borderColor: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white', color: brand.black }} 
                  />
                  <span className="text-sm font-semibold" style={{ color: brand.black }}>€</span>
                  <button 
                    onClick={() => {
                      const currentPrice = parseFloat(item.price) || 0;
                      setPrice(item.id, (currentPrice + 5).toString());
                    }}
                    disabled={!canEditPrices}
                    className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold" 
                    style={{ borderColor: brand.black, color: brand.black, backgroundColor: !canEditPrices ? '#f5f5f5' : 'white' }}>
                    +5
                  </button>
                </div>
              </td>
              <td className="border px-1 py-1 text-center align-middle" style={{ borderColor: brand.black }}>
                <div className="flex items-center justify-center gap-1">
                  <button onClick={() => decQty(item.id)} className="w-6 h-6 border rounded flex items-center justify-center font-bold" style={{ borderColor: brand.black, color: brand.black }}>−</button>
                  <span className="font-semibold mx-1" style={{ color: brand.black }}>{item.qty || 1}</span>
                  <button onClick={() => incQty(item.id)} className="w-6 h-6 border rounded flex items-center justify-center font-bold" style={{ borderColor: brand.black, color: brand.black }}>+</button>
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
                  {/* Check-IN status column (READ ONLY - NO onClick!) */}
                  <td className="border px-2 py-2 text-center" style={{ borderColor: brand.black }}>
                    <div className="px-3 py-1 rounded font-semibold text-sm" style={{ backgroundColor: item.inOk ? brand.successBg : "#f5f5f5", color: item.inOk ? brand.successText : "#999", border: `1px solid ${item.inOk ? brand.successBorder : "#ccc"}` }}>
                      {item.inOk ? "✓ OK" : t.checkIn}
                    </div>
                  </td>
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
