// =================================================================
// LUXURY PDF GENERATOR - FIXED VERSION - PART 1 OF 3
// =================================================================
// 🔥 FIX: Payment Authorization now BEFORE signatures in PDF
// =================================================================
// Copy all 3 parts into: src/utils/LuxuryPDFGenerator.js
// =================================================================

import jsPDF from 'jspdf';

const COLORS = {
  navy: [11, 29, 81],
  gold: [198, 166, 100],
  grey: [107, 114, 128],
  lightGrey: [232, 232, 232],
  black: [26, 26, 26],
  white: [255, 255, 255],
  green: [16, 185, 129],
  red: [239, 68, 68],
  orange: [217, 119, 6]
};

function sanitizeText(text) {
  if (!text) return '';
  const str = String(text);
  const greekToLatin = {
    'Α': 'A', 'α': 'a', 'Β': 'B', 'β': 'v', 'Γ': 'G', 'γ': 'g',
    'Δ': 'D', 'δ': 'd', 'Ε': 'E', 'ε': 'e', 'Ζ': 'Z', 'ζ': 'z',
    'Η': 'I', 'η': 'i', 'Θ': 'Th', 'θ': 'th', 'Ι': 'I', 'ι': 'i',
    'Κ': 'K', 'κ': 'k', 'Λ': 'L', 'λ': 'l', 'Μ': 'M', 'μ': 'm',
    'Ν': 'N', 'ν': 'n', 'Ξ': 'X', 'ξ': 'x', 'Ο': 'O', 'ο': 'o',
    'Π': 'P', 'π': 'p', 'Ρ': 'R', 'ρ': 'r', 'Σ': 'S', 'σ': 's', 'ς': 's',
    'Τ': 'T', 'τ': 't', 'Υ': 'Y', 'υ': 'y', 'Φ': 'F', 'φ': 'f',
    'Χ': 'Ch', 'χ': 'ch', 'Ψ': 'Ps', 'ψ': 'ps', 'Ω': 'O', 'ω': 'o',
    'Ά': 'A', 'ά': 'a', 'Έ': 'E', 'έ': 'e', 'Ή': 'I', 'ή': 'i',
    'Ί': 'I', 'ί': 'i', 'Ό': 'O', 'ό': 'o', 'Ύ': 'Y', 'ύ': 'y',
    'Ώ': 'O', 'ώ': 'o', 'Ϊ': 'I', 'ϊ': 'i', 'Ϋ': 'Y', 'ϋ': 'y',
    'ΐ': 'i', 'ΰ': 'y'
  };
  let result = str;
  for (const [greek, latin] of Object.entries(greekToLatin)) {
    result = result.replace(new RegExp(greek, 'g'), latin);
  }
  result = result.replace(/[^\x00-\x7F]/g, '');
  return result.trim();
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

const ITEM_LABELS = {
  lifejackets: { en: "Lifejackets", el: "Sosivia" },
  flares: { en: "Flares", el: "Voitheia kindynou (flares)" },
  first_aid: { en: "First aid kit", el: "Farmakeio" },
  fire_extinguisher: { en: "Fire extinguisher", el: "Pyrosvestiras" },
  liferaft: { en: "Liferaft", el: "Sostiki schedia" },
  fog_horn: { en: "Fog horn", el: "Korna omichlis" },
  toolkit: { en: "Toolkit", el: "Ergaleia" },
  bed_linen: { en: "Bed linen for all cabins", el: "Klinoskepesmata gia oles tis kampines" },
  pillows_cases: { en: "Pillows and Pillow cases", el: "Maxilaria kai maxilarothikes" },
  blankets: { en: "Blankets", el: "Kouvertes" },
  bath_towels: { en: "Bath towels per person", el: "Petsetes mpaniou ana atomo" },
  tea_towels: { en: "Tea towels", el: "Petsetes kouzinas" },
  wc_mats: { en: "WC mats", el: "Chalakia WC" },
  hatch_large: { en: "Hatch Large", el: "Hatch megala" },
  hatch_toilet: { en: "Hatch Toilet", el: "Hatch toualetas" },
  hatch_cabin: { en: "Hatch Cabin", el: "Hatch kampinas" },
  toilet_clogging: { en: "Toilet Clogging", el: "Vouloma toualetas" },
  spinnaker: { en: "Spinnaker", el: "Mpaloni (Spinnaker)" },
  snorkeling_gear: { en: "Snorkeling gear", el: "Exoplismos snorkeling" },
  fishing_equipment: { en: "Fishing equipment", el: "Exoplismos psarematos" },
  bbq_grill: { en: "BBQ Grill", el: "Psistaria BBQ" },
  stand_up_paddle: { en: "Stand-up paddle", el: "SUP board" },
  kayak: { en: "Kayak", el: "Kagiak" },
  control_gangway: { en: "Control Gangway", el: "Cheiristririo pasarelas" },
  control_tv: { en: "Control TV", el: "Cheiristririo tileorasis" },
  wifi_router: { en: "Wi-Fi Router", el: "Wi-Fi Router" },
  card_sd_gps: { en: "Card SD GPS Maker", el: "Karta SD GPS Maker" },
  feet_for_saloon: { en: "Feet for Saloon", el: "Podia gia saloni" },
  mattress: { en: "Mattress", el: "Stroma" },
  espresso_machine: { en: "Espresso Machine", el: "Michani Espresso" },
  ice_maker: { en: "Ice Maker", el: "Pagomichani" },
  sea_scooter: { en: "Sea Scooter", el: "Thalassio skouter" },
  electric_fridge: { en: "Electric fridge", el: "Ilektriko psygeio" },
  gas_stove_4_heads: { en: "Gas stove - 4 heads", el: "Estia aeriou - 4 matia" },
  dinner_plates: { en: "Dinner plates", el: "Piata fagitou" },
  soup_plates: { en: "Soup plates", el: "Piata soupas" },
  glasses_water: { en: "Glasses of water", el: "Potiria nerou" },
  glasses_wine: { en: "Glasses of wine", el: "Potiria krasiou" },
  knives: { en: "Knives", el: "Machairia" },
  forks: { en: "Forks", el: "Pirounia" },
  spoons: { en: "Spoons", el: "Koutalia" },
  gps_plotter: { en: "GPS - Plotter", el: "GPS - Ploter" },
  vhf_dsc: { en: "VHF/DSC", el: "VHF/DSC" },
  binoculars: { en: "Binoculars", el: "Kialia" },
  charts: { en: "Charts", el: "Naftikoi chartes" },
  life_raft: { en: "Life raft", el: "Sosivia lemos" },
  life_jackets: { en: "Life jackets", el: "Sosivia" },
  first_aid_kit: { en: "First aid kit", el: "Farmakeio" },
  generator: { en: "Generator", el: "Gennitria" },
  spare_anchor: { en: "Spare anchor", el: "Efedriki agoura" },
  deck_brush: { en: "Deck brush", el: "Vourtsa katastromatos" },
  gangway: { en: "Gangway", el: "Pasarela" },
  lines_20m: { en: "Lines 20m", el: "Schoinia 20m" },
  lines_50m: { en: "Lines 50m", el: "Schoinia 50m" },
  inflatable_dinghy: { en: "Inflatable dinghy", el: "Fouskoti varka" },
  oars: { en: "Oars", el: "Koupia" },
  air_pump: { en: "Air pump", el: "Antlia aera" },
  bow_fenders: { en: "Bow fenders", el: "Mpalonia plaina" },
  stern_fenders: { en: "Stern fenders", el: "Mbalonia prymnis" },
  telescopic_boathook: { en: "Telescopic boat-hook", el: "Tileskopikos gantzos" }
};

function getItemLabel(key, lang) {
  return ITEM_LABELS[key]?.[lang] || key;
}

export function generateLuxuryPDF(bookingData, mode, additionalData = {}, lang = 'en', options = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 20;

  // HEADER
  doc.setTextColor(...COLORS.navy);
  doc.setFontSize(28);
  doc.setFont(undefined, 'normal');
  doc.text('TAILWIND YACHTING', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setTextColor(...COLORS.grey);
  doc.setFontSize(14);
  const reportTitle = mode === 'in' ? 'Check-in Report' : 'Check-out Report';
  let pageNumber = '';
  if (options.isPage5) {
    pageNumber = ' - Page 5';
  } else if (options.isPage4) {
    pageNumber = ' - Page 4';
  } else if (options.isPage3) {
    pageNumber = ' - Page 3';
  } else if (!options.isPage1) {
    pageNumber = ' - Page 2';
  }
  doc.text(reportTitle + pageNumber, pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);

  y += 12;
  const colWidth = (pageWidth - 2 * margin) / 3;
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('BOOKING NUMBER', margin, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  doc.text(sanitizeText(bookingData.bookingNumber) || 'N/A', margin, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('YACHT', margin + colWidth, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const vesselText = sanitizeText(bookingData.selectedVessel || bookingData.vesselName) || 'N/A';
  doc.text(vesselText, margin + colWidth, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('SKIPPER', margin + 2 * colWidth, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const skipperName = sanitizeText(`${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`.trim()) || 'N/A';
  doc.text(skipperName, margin + 2 * colWidth, y + 5);

  y += 15;
  doc.setDrawColor(...COLORS.lightGrey);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('ADDRESS', margin, y);
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const skipperAddress = sanitizeText(bookingData.skipperAddress) || 'N/A';
  doc.text(skipperAddress, margin, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('EMAIL', margin + colWidth, y);
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const skipperEmail = bookingData.skipperEmail || 'N/A';
  doc.text(skipperEmail, margin + colWidth, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('PHONE', margin + 2 * colWidth, y);
  
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const skipperPhone = bookingData.skipperPhone 
    ? `${bookingData.phoneCountryCode || ''} ${bookingData.skipperPhone}`
    : 'N/A';
  doc.text(skipperPhone, margin + 2 * colWidth, y + 5);

  y += 15;
  doc.setDrawColor(...COLORS.lightGrey);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('CHECK-IN', margin, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const checkInText = bookingData.checkInDate 
    ? `${formatDate(bookingData.checkInDate)} ${bookingData.checkInTime || ''}`
    : 'N/A';
  doc.text(checkInText, margin, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('CHECK-OUT', margin + colWidth, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  const checkOutText = bookingData.checkOutDate 
    ? `${formatDate(bookingData.checkOutDate)} ${bookingData.checkOutTime || ''}`
    : 'N/A';
  doc.text(checkOutText, margin + colWidth, y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'bold');
  doc.text('MODE', margin + 2 * colWidth, y);
  
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, 'normal');
  doc.text(mode === 'in' ? 'Check-in' : 'Check-out', margin + 2 * colWidth, y + 5);

  y += 15;
  doc.setDrawColor(...COLORS.lightGrey);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 15;

  // Equipment sections for Pages 2, 3, 4 (keeping all original code for these pages)
  if (!options.isPage5 && !options.isPage1 && mode === 'in' && additionalData.equipment && additionalData.equipment.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.navy);
    doc.setFont(undefined, 'normal');
    doc.text('Equipment & Systems', margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const tableWidth = pageWidth - 2 * margin;
    const col1 = tableWidth * 0.40;
    const col2 = tableWidth * 0.15;
    const col3 = tableWidth * 0.20;
    const col4 = tableWidth * 0.25;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey);
    doc.setFont(undefined, 'bold');
    doc.text('ITEM', margin + 2, y);
    doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
    doc.text('CHECK-IN STATUS', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
    doc.text('RATE (IF DAMAGED)', margin + col1 + col2 + col3, y);
    
    y += 3;
    doc.setDrawColor(...COLORS.lightGrey);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    additionalData.equipment.forEach((item) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...COLORS.black);
      const itemName = item.name || getItemLabel(item.key, lang) || sanitizeText(item.key) || '';
      doc.text(itemName, margin + 2, y);
      doc.text((item.quantity || item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
      
      if (item.checkInOk || item.inOk) {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.setTextColor(...COLORS.grey);
      const price = item.price || 0;
      doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });

      y += 7;
      doc.setDrawColor(...COLORS.lightGrey);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
    });

    y += 5;
  }

// =================================================================
// END OF PART 1 - Continue with PART 2
// =================================================================
// =================================================================
// LUXURY PDF GENERATOR - FIXED VERSION - PART 2 OF 3
// =================================================================
// PASTE THIS AFTER PART 1
// =================================================================

  // Continuing from PART 1...
  // Pages 2, 3, 4 code (keeping original - this is a massive section)
  
  if (!options.isPage5 && !options.isPage1 && mode === 'out' && additionalData.equipment && additionalData.equipment.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.navy);
    doc.setFont(undefined, 'normal');
    doc.text('Equipment & Systems', margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const tableWidth = pageWidth - 2 * margin;
    const col1 = tableWidth * 0.40;
    const col2 = tableWidth * 0.15;
    const col3 = tableWidth * 0.225;
    const col4 = tableWidth * 0.225;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey);
    doc.setFont(undefined, 'bold');
    doc.text('ITEM', margin + 2, y);
    doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
    doc.text('CHECK-OUT OK', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
    doc.text('CHECK-OUT NOT OK', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
    
    y += 3;
    doc.setDrawColor(...COLORS.lightGrey);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    additionalData.equipment.forEach((item) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...COLORS.black);
      const itemName = item.name || getItemLabel(item.key, lang) || sanitizeText(item.key) || '';
      doc.text(itemName, margin + 2, y);
      doc.text((item.quantity || item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
      
      if (item.checkOutOk || item.out === 'ok') {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.setFont('helvetica', 'normal');
      }
      
      if (item.checkOutNotOk || item.out === 'not') {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(...COLORS.red);
        doc.text('4', margin + col1 + col2 + col3 + col4 / 2 - 15, y, { align: 'center' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        const price = item.price || 0;
        doc.text(`€${Number(price).toFixed(2)}`, margin + col1 + col2 + col3 + col4 / 2 - 5, y);
        doc.setFont('helvetica', 'normal');
      }

      y += 7;
      doc.setDrawColor(...COLORS.lightGrey);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
    });

    y += 5;
  }

  // Page 3 Safety Equipment (check-in)
  if (!options.isPage5 && options.isPage3 && mode === 'in' && additionalData.safety && additionalData.safety.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.navy);
    doc.setFont(undefined, 'normal');
    doc.text('Safety Equipment', margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const tableWidth = pageWidth - 2 * margin;
    const col1 = tableWidth * 0.40;
    const col2 = tableWidth * 0.15;
    const col3 = tableWidth * 0.20;
    const col4 = tableWidth * 0.25;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey);
    doc.setFont(undefined, 'bold');
    doc.text('ITEM', margin + 2, y);
    doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
    doc.text('CHECK-IN STATUS', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
    doc.text('RATE (IF DAMAGED)', margin + col1 + col2 + col3, y);
    
    y += 3;
    doc.setDrawColor(...COLORS.lightGrey);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    additionalData.safety.forEach((item) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...COLORS.black);
      const itemLabel = getItemLabel(item.key, lang);
      doc.text(sanitizeText(itemLabel) || '', margin + 2, y);
      doc.text((item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
      
      if (item.inOk) {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.setTextColor(...COLORS.grey);
      const price = item.price || 0;
      doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });

      y += 7;
      doc.setDrawColor(...COLORS.lightGrey);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
    });

    y += 5;
  }

  // Page 3 Safety Equipment (check-out)
  if (!options.isPage5 && options.isPage3 && mode === 'out' && additionalData.safety && additionalData.safety.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.navy);
    doc.setFont(undefined, 'normal');
    doc.text('Safety Equipment', margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const tableWidth = pageWidth - 2 * margin;
    const col1 = tableWidth * 0.30;
    const col2 = tableWidth * 0.12;
    const col3 = tableWidth * 0.15;
    const col4 = tableWidth * 0.20;
    const col5 = tableWidth * 0.23;

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey);
    doc.setFont(undefined, 'bold');
    doc.text('ITEM', margin + 2, y);
    doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
    doc.text('CHECK-IN', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
    doc.text('CHECK-OUT', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
    doc.text('RATE', margin + col1 + col2 + col3 + col4, y);
    
    y += 3;
    doc.setDrawColor(...COLORS.lightGrey);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    additionalData.safety.forEach((item) => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setTextColor(...COLORS.black);
      const itemLabel = getItemLabel(item.key, lang);
      doc.text(sanitizeText(itemLabel) || '', margin + 2, y);
      doc.text((item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
      
      if (item.inOk) {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      }
      
      doc.setTextColor(...COLORS.black);
      if (item.out === 'ok') {
        doc.setFontSize(12);
        doc.setFont('ZapfDingbats', 'normal');
        doc.setTextColor(16, 185, 129);
        doc.text('4', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
      } else if (item.out === 'not') {
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.red);
        doc.text('Not OK', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
        doc.setFontSize(11);
      }
      
      doc.setTextColor(...COLORS.grey);
      const price = item.price || 0;
      doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });

      y += 7;
      doc.setDrawColor(...COLORS.lightGrey);
      doc.line(margin, y, pageWidth - margin, y);
      y += 7;
    });

    y += 5;
  }

  // Page 3 Toilet Warning
  if (!options.isPage5 && options.isPage3 && additionalData.toiletWarningAccepted) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    y += 10;

    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(1);
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 42);

    doc.setFontSize(20);
    doc.text('⚠', margin + 5, y + 5);

    doc.setFontSize(12);
    doc.setTextColor(180, 83, 9);
    doc.setFont(undefined, 'bold');
    doc.text('TOILET CLOGGING NOTICE', margin + 15, y + 5);

    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.black);
    doc.setFont(undefined, 'normal');
    
    const warningText1 = lang === 'el' 
      ? 'Se periptosi pou ehei plirothei i egguisi me damage waiver (mi epistrepsia), den ishei plirome gia to vouloma tis toualetas.'
      : 'In case the deposit has been paid with damage waiver (non-refundable), no charge applies for toilet clogging.';
    
    const warningText2 = lang === 'el'
      ? 'Ean ginei check-in kai den diapistothei kamia zemia i vouloma stin toualeta, i etairia kai i vasi den ehoun kamia euthyni meta to check-in.'
      : 'If check-in is completed and no damage or toilet clogging is detected, the company and base have no responsibility after check-in.';
    
    const lines1 = doc.splitTextToSize(warningText1, pageWidth - 2 * margin - 20);
    lines1.forEach(line => {
      doc.text(line, margin + 15, y);
      y += 4;
    });
    
    y += 2;
    const lines2 = doc.splitTextToSize(warningText2, pageWidth - 2 * margin - 20);
    lines2.forEach(line => {
      doc.text(line, margin + 15, y);
      y += 4;
    });

    y += 8;
    doc.setFillColor(...COLORS.green);
    doc.setDrawColor(...COLORS.green);
    doc.rect(margin + 15, y - 3, 4, 4, 'FD');
    
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(8);
    doc.text('✓', margin + 17, y, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.black);
    doc.setFont(undefined, 'bold');
    doc.text(lang === 'el' ? '✓ Katanoo kai apodechomai' : '✓ I understand and accept', margin + 22, y);

    y += 12;
  }

  // Page 4 Floorplan
  if (!options.isPage5 && options.isPage4) {
    if (additionalData.floorplanPath) {
      if (y > pageHeight - 120) {
        doc.addPage();
        y = 20;
      }

      try {
        const floorplanWidth = pageWidth - 2 * margin;
        const floorplanHeight = 100;
        doc.addImage(additionalData.floorplanPath, 'PNG', margin, y, floorplanWidth, floorplanHeight);
        y += floorplanHeight + 20;
      } catch (e) {
        console.error('Error adding floorplan:', e);
        doc.setFontSize(10);
        doc.setTextColor(...COLORS.grey);
        doc.text('Floorplan not available', margin, y);
        y += 15;
      }
    }

    // Page 4 Sections rendering function
    const renderPage4Section = (sectionTitle, sectionData) => {
      if (!sectionData || sectionData.length === 0) return;

      const titleHeight = 20;
      const headerHeight = 15;
      const minItems = Math.min(3, sectionData.length);
      const itemsHeight = minItems * 14;
      const estimatedHeight = titleHeight + headerHeight + itemsHeight;
      
      if (y + estimatedHeight > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(...COLORS.navy);
      doc.setFont(undefined, 'normal');
      doc.text(sectionTitle, margin, y);
      y += 2;
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const tableWidth = pageWidth - 2 * margin;
      
      if (mode === 'in') {
        const col1 = tableWidth * 0.40;
        const col2 = tableWidth * 0.15;
        const col3 = tableWidth * 0.20;
        const col4 = tableWidth * 0.25;

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.grey);
        doc.setFont(undefined, 'bold');
        doc.text('ITEM', margin + 2, y);
        doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
        doc.text('CHECK-IN STATUS', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.text('RATE (IF DAMAGED)', margin + col1 + col2 + col3, y);
        
        y += 3;
        doc.setDrawColor(...COLORS.lightGrey);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        sectionData.forEach((item) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }

          doc.setTextColor(...COLORS.black);
          const itemLabel = getItemLabel(item.key, lang);
          doc.text(sanitizeText(itemLabel) || '', margin + 2, y);
          
          doc.setTextColor(...COLORS.black);
          doc.text((item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
          
          if (item.inOk) {
            doc.setFontSize(12);
            doc.setFont('ZapfDingbats', 'normal');
            doc.setTextColor(16, 185, 129);
            doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
          }
          
          doc.setTextColor(...COLORS.grey);
          const price = item.price || 0;
          doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });

          y += 7;
          doc.setDrawColor(...COLORS.lightGrey);
          doc.line(margin, y, pageWidth - margin, y);
          y += 7;
        });

      } else {
        const col1 = tableWidth * 0.40;
        const col2 = tableWidth * 0.15;
        const col3 = tableWidth * 0.15;
        const col4 = tableWidth * 0.20;
        const col5 = tableWidth * 0.23;

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.grey);
        doc.setFont(undefined, 'bold');
        doc.text('ITEM', margin + 2, y);
        doc.text('QTY', margin + col1 + col2 / 2, y, { align: 'center' });
        doc.text('CHECK-IN', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.text('CHECK-OUT', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
        doc.text('RATE', margin + col1 + col2 + col3 + col4, y);
        
        y += 3;
        doc.setDrawColor(...COLORS.lightGrey);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');

        sectionData.forEach((item) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }

          doc.setTextColor(...COLORS.black);
          const itemLabel = getItemLabel(item.key, lang);
          doc.text(sanitizeText(itemLabel) || '', margin + 2, y);
          doc.text((item.qty || 1).toString(), margin + col1 + col2 / 2, y, { align: 'center' });
          
          if (item.inOk) {
            doc.setFontSize(12);
            doc.setFont('ZapfDingbats', 'normal');
            doc.setTextColor(16, 185, 129);
            doc.text('4', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
          }
          
          doc.setTextColor(...COLORS.black);
          if (item.out === 'ok') {
            doc.setFontSize(12);
            doc.setFont('ZapfDingbats', 'normal');
            doc.setTextColor(16, 185, 129);
            doc.text('4', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
          } else if (item.out === 'not') {
            doc.setFontSize(10);
            doc.setTextColor(...COLORS.red);
            doc.text('Not OK', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
            doc.setFontSize(11);
          }
          
          doc.setTextColor(...COLORS.grey);
          const price = item.price || 0;
          doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });

          y += 7;
          doc.setDrawColor(...COLORS.lightGrey);
          doc.line(margin, y, pageWidth - margin, y);
          y += 7;
        });
      }

      y += 5;
    };

    // Render all Page 4 sections
    renderPage4Section('Kitchen', additionalData.kitchen);
    renderPage4Section('Navigation', additionalData.navigation);
    renderPage4Section('Safety Equipment', additionalData.safety);
    renderPage4Section('Generator', additionalData.generator);
    renderPage4Section('Deck', additionalData.deck);
    renderPage4Section('Front Deck', additionalData.frontDeck);
    renderPage4Section('Dinghy & Accessories', additionalData.dinghy);
    renderPage4Section('Fenders', additionalData.fenders);
    renderPage4Section('Boat-hook', additionalData.boathook);
  }

// =================================================================
// END OF PART 2 - Continue with PART 3 (PAGE 5 with FIX!)
// =================================================================
// =================================================================
// =================================================================
// =================================================================
// LUXURY PDF GENERATOR - FIXED VERSION - PART 3 OF 3 (FINAL!)
// =================================================================
// 🔥🔥🔥 PAGE 5 WITH FIX! 🔥🔥🔥
// Payment Authorization now appears BEFORE signatures!
// =================================================================
// PASTE THIS AFTER PART 2
// =================================================================

  // Continuing from PART 2...
  // =================================================================
  // 🔥🔥🔥 PAGE 5 BLOCK WITH FIX! 🔥🔥🔥
  // =================================================================
  if (options.isPage5) {
    console.log('✅ Rendering PAGE 5 with PAYMENT AUTH FIX');
    
    // Agreements
    if (additionalData.agreements) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.navy);
      doc.setFont(undefined, 'normal');
      doc.text('Agreements', margin, y);
      y += 2;
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      const agreements = [
        { key: 'return', label: lang === 'el' ? 'Anagnorisi Katastasis Epistrofis' : 'Return Condition Acknowledgement' },
        { key: 'terms', label: lang === 'el' ? 'Oroi & Proypotheseis' : 'Terms & Conditions' },
        { key: 'privacy', label: lang === 'el' ? 'Politiki Aporritou' : 'Privacy Policy Consent' },
        { key: 'warning', label: lang === 'el' ? 'Apodohi Simantikis Eidopoiisis' : 'Important Notice Acceptance' }
      ];
      
      if (mode === 'out' && additionalData.paymentAuthAccepted) {
        agreements.push({ 
          key: 'paymentAuth', 
          label: lang === 'el' ? 'Exousiodotisi Plirosis' : 'Payment Authorization' 
        });
      }
      
      agreements.forEach(agreement => {
        if (agreement.key === 'paymentAuth') {
          if (additionalData.paymentAuthAccepted) {
            doc.setFillColor(...COLORS.green);
            doc.setDrawColor(...COLORS.green);
            doc.rect(margin, y - 3, 4, 4, 'FD');
            
            doc.setTextColor(...COLORS.white);
            doc.setFontSize(8);
            doc.text('✓', margin + 2, y, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(...COLORS.black);
            doc.setFont(undefined, 'normal');
            doc.text(agreement.label, margin + 8, y);
            
            y += 8;
          }
        } else if (additionalData.agreements[agreement.key]) {
          doc.setFillColor(...COLORS.green);
          doc.setDrawColor(...COLORS.green);
          doc.rect(margin, y - 3, 4, 4, 'FD');
          
          doc.setTextColor(...COLORS.white);
          doc.setFontSize(8);
          doc.text('✓', margin + 2, y, { align: 'center' });
          
          doc.setFontSize(10);
          doc.setTextColor(...COLORS.black);
          doc.setFont(undefined, 'normal');
          doc.text(agreement.label, margin + 8, y);
          
          y += 8;
        }
      });
      
      y += 5;
    }
    
    // Warning Notice
    if (y > pageHeight - 80) {
      doc.addPage();
      y = 20;
    }
    
    y += 10;
    
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(4);
    doc.rect(margin, y - 5, pageWidth - 2 * margin, 95);
    
    doc.setFontSize(16);
    doc.text('⚠', margin + 5, y + 5);
    
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.setFont(undefined, 'bold');
    doc.text('IMPORTANT NOTICE - MANDATORY READING', margin + 15, y + 5);
    
    y += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.black);
    doc.setFont(undefined, 'normal');
    
    const warningText1 = lang === 'el'
      ? 'Ean ginei check-in apo to exeidikevmeno prosopiko tis etairias, ypografei o pelatis kai o ypeythinos tou check-in, kai den diapistothei kamia zemia sto skafos '
      : 'If check-in is completed by the company\'s specialized staff, signed by the customer and the check-in manager, and no damage or clogging is detected on the yacht ';
    
    const lines1 = doc.splitTextToSize(warningText1, pageWidth - 2 * margin - 20);
    lines1.forEach(line => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin + 15, y);
      y += 5;
    });
    
    y += 2;
    doc.setFillColor(254, 226, 226);
    doc.rect(margin + 15, y - 4, pageWidth - 2 * margin - 30, 18, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.setFont(undefined, 'bold');
    
    const highlightText = lang === 'el'
      ? '(ean yparchei kapoia zemia ypohreoytai na to pei o ypeythinos tis vasis oste o pelatis na to gnorizei, na to grapsei sta scholia kai na vgalei fotografia)'
      : '(if there is any damage, the base manager is obliged to report it so that the customer knows, writes it in the comments and takes a photo)';
    
    const highlightLines = doc.splitTextToSize(highlightText, pageWidth - 2 * margin - 35);
    highlightLines.forEach(line => {
      doc.text(line, margin + 17, y);
      y += 4.5;
    });
    
    y += 3;
    
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.black);
    doc.setFont(undefined, 'normal');
    
    const warningText2 = lang === 'el'
      ? 'i vouloma stin toualeta, i etairia kai i vasi den ehoun kamia eythyni meta to check-in.'
      : 'or toilet clogging, the company and the base have no responsibility after check-in.';
    
    const lines2 = doc.splitTextToSize(warningText2, pageWidth - 2 * margin - 20);
    lines2.forEach(line => {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin + 15, y);
      y += 5;
    });
    
    y += 3;
    
    doc.setFillColor(254, 252, 232);
    doc.rect(margin + 15, y - 4, pageWidth - 2 * margin - 30, 18, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.black);
    doc.setFont(undefined, 'bold');
    
    const warningText3 = lang === 'el'
      ? 'O pelatis stin epistrofi tha prepei na plirosei tin zemia horis kamia dikaiologia. O pelatis einai ypeythinos gia opoiadipote zemia ginei meta to check-in. Tha prepei na frontizei to skafos kai na to paradosei stin katastasi pou to pire.'
      : 'Upon return, the customer must pay for any damage without any excuse. The customer is responsible for any damage that occurs after check-in. They must take care of the yacht and return it in the condition they received it.';
    
    const lines3 = doc.splitTextToSize(warningText3, pageWidth - 2 * margin - 35);
    lines3.forEach(line => {
      doc.text(line, margin + 17, y);
      y += 4.5;
    });
    
    y += 10;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...COLORS.black);
    const thankYou = lang === 'el' ? 'Efcharistoyme ek ton proteron.' : 'Thank you in advance.';
    doc.text(thankYou, pageWidth / 2, y, { align: 'center' });
    
    y += 15;
    
    if (additionalData.warningAccepted) {
      doc.setFillColor(...COLORS.green);
      doc.setDrawColor(...COLORS.green);
      doc.rect(margin + 15, y - 3, 4, 4, 'FD');
      
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(8);
      doc.text('✓', margin + 17, y, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.black);
      doc.setFont(undefined, 'bold');
      doc.text(lang === 'el' ? '✓ Exo diavassei kai apodehomai' : '✓ I have read and accept', margin + 22, y);
    }
    
    y += 15;
    
    // Inventory Table
    if (additionalData.allItems && additionalData.allItems.length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      if (mode === 'out') {
        const damagedItems = additionalData.allItems.filter(item => item.out === 'not');
        
        if (damagedItems.length > 0) {
          doc.setFontSize(14);
          doc.setTextColor(...COLORS.red);
          doc.setFont(undefined, 'bold');
          doc.text(lang === 'el' ? 'Anafora Zimion' : 'DAMAGE REPORT', margin, y);
          y += 2;
          doc.setDrawColor(...COLORS.red);
          doc.setLineWidth(0.8);
          doc.line(margin, y, pageWidth - margin, y);
          y += 10;
          
          const tableWidth = pageWidth - 2 * margin;
          const col1 = tableWidth * 0.10;  // PAGE column
          const col2 = tableWidth * 0.35;  // ITEM column
          const col3 = tableWidth * 0.12;  // QTY column
          const col4 = tableWidth * 0.20;  // UNIT PRICE column
          const col5 = tableWidth * 0.23;  // TOTAL column
          
          doc.setFontSize(8);
          doc.setTextColor(...COLORS.grey);
          doc.setFont(undefined, 'bold');
          doc.text('PAGE', margin + 2, y);
          doc.text('ITEM', margin + col1 + 2, y);
          doc.text('QTY', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
          doc.text('UNIT PRICE', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
          doc.text('TOTAL', margin + col1 + col2 + col3 + col4, y);
          
          y += 3;
          doc.setDrawColor(...COLORS.lightGrey);
          doc.line(margin, y, pageWidth - margin, y);
          y += 6;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          let totalAmount = 0;
          
          damagedItems.forEach((item) => {
            if (y > pageHeight - 40) {
              doc.addPage();
              y = 20;
            }
            
            // PAGE number (grey)
            doc.setTextColor(...COLORS.grey);
            doc.setFontSize(9);
            doc.text(item.page || 'N/A', margin + 2, y);
            
            // ITEM name (black)
            doc.setFontSize(10);
            doc.setTextColor(...COLORS.black);
            const itemName = sanitizeText(item.name) || '';
            doc.text(itemName, margin + col1 + 2, y);
            
            const qty = item.qty || 1;
            const unitPrice = parseFloat(item.price) || 0;
            const total = qty * unitPrice;
            totalAmount += total;
            
            doc.text(qty.toString(), margin + col1 + col2 + col3 / 2, y, { align: 'center' });
            doc.text(`€${unitPrice.toFixed(2)}`, margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
            
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...COLORS.red);
            doc.text(`€${total.toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });
            doc.setFont(undefined, 'normal');
            
            y += 7;
            doc.setDrawColor(...COLORS.lightGrey);
            doc.line(margin, y, pageWidth - margin, y);
            y += 7;
          });
          
          // VAT CALCULATION
          // Import VAT rate from authService (default 24%)
          let vatRate = 24;
          try {
            const authService = require('../authService');
            vatRate = authService.getVATRate ? authService.getVATRate() : 24;
          } catch (e) {
            console.warn('Could not load VAT rate, using default 24%');
          }

          const netTotal = totalAmount;
          const vatAmount = netTotal * (vatRate / 100);
          const totalWithVat = netTotal + vatAmount;

          y += 5;

          // NET TOTAL row
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 10, 'F');
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...COLORS.black);
          doc.text(lang === 'el' ? 'ΚΑΘΑΡΟ ΣΥΝΟΛΟ:' : 'NET TOTAL:', margin + 5, y + 2);
          doc.setFont(undefined, 'bold');
          doc.text(`€${netTotal.toFixed(2)}`, pageWidth - margin - 5, y + 2, { align: 'right' });
          y += 10;

          // VAT row
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 10, 'F');
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.setTextColor(...COLORS.black);
          doc.text(lang === 'el' ? `ΦΠΑ ${vatRate}%:` : `VAT ${vatRate}%:`, margin + 5, y + 2);
          doc.setFont(undefined, 'bold');
          doc.text(`€${vatAmount.toFixed(2)}`, pageWidth - margin - 5, y + 2, { align: 'right' });
          y += 10;

          // TOTAL WITH VAT row (highlighted)
          doc.setFillColor(254, 226, 226);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 12, 'F');

          doc.setDrawColor(...COLORS.red);
          doc.setLineWidth(1);
          doc.rect(margin, y - 4, pageWidth - 2 * margin, 12);

          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.setTextColor(...COLORS.red);
          doc.text(lang === 'el' ? 'ΣΥΝΟΛΟ ΜΕ ΦΠΑ:' : 'TOTAL WITH VAT:', margin + 5, y + 3);
          doc.setFontSize(14);
          doc.text(`€${totalWithVat.toFixed(2)}`, pageWidth - margin - 5, y + 3, { align: 'right' });

          y += 17;
        }
      } else {
        // CHECK-IN: Complete Inventory
        doc.setFontSize(14);
        doc.setTextColor(...COLORS.navy);
        doc.setFont(undefined, 'normal');
        doc.text(lang === 'el' ? 'Pliris Apografi' : 'Complete Inventory', margin, y);
        y += 2;
        doc.setDrawColor(...COLORS.gold);
        doc.setLineWidth(0.8);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        const tableWidth = pageWidth - 2 * margin;
        const col1 = tableWidth * 0.15;
        const col2 = tableWidth * 0.35;
        const col3 = tableWidth * 0.10;
        const col4 = tableWidth * 0.20;
        const col5 = tableWidth * 0.20;
        
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.grey);
        doc.setFont(undefined, 'bold');
        doc.text('PAGE', margin + 2, y);
        doc.text('ITEM', margin + col1 + 2, y);
        doc.text('QTY', margin + col1 + col2 + col3 / 2, y, { align: 'center' });
        doc.text('CHECK-IN', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
        doc.text('RATE', margin + col1 + col2 + col3 + col4, y);
        
        y += 3;
        doc.setDrawColor(...COLORS.lightGrey);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        let currentPage = '';
        let currentSection = '';
        
        additionalData.allItems.forEach((item) => {
          if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
          }
          
          if (item.page !== currentPage || item.section !== currentSection) {
            currentPage = item.page;
            currentSection = item.section;
            
            doc.setFillColor(...COLORS.lightGrey);
            doc.rect(margin, y - 4, pageWidth - 2 * margin, 6, 'F');
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(...COLORS.navy);
            doc.text(`${item.page} - ${item.section}`, margin + 2, y);
            y += 6;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
          }
          
          doc.setTextColor(...COLORS.grey);
          doc.text(item.page, margin + 2, y);
          
          doc.setTextColor(...COLORS.black);
          const itemName = sanitizeText(item.name) || '';
          doc.text(itemName, margin + col1 + 2, y);
          
          doc.text((item.qty || 1).toString(), margin + col1 + col2 + col3 / 2, y, { align: 'center' });
          
          if (item.inOk) {
            doc.setFontSize(12);
            doc.setFont('ZapfDingbats', 'normal');
            doc.setTextColor(...COLORS.green);
            doc.text('4', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
          } else {
            doc.setTextColor(...COLORS.red);
            doc.setFont(undefined, 'bold');
            doc.text('✗', margin + col1 + col2 + col3 + col4 / 2, y, { align: 'center' });
            doc.setFont(undefined, 'normal');
          }
          
          doc.setTextColor(...COLORS.grey);
          doc.setFont(undefined, 'normal');
          const price = item.price || 0;
          doc.text(`€${Number(price).toFixed(2)}`, pageWidth - margin - 2, y, { align: 'right' });
          
          y += 7;
          doc.setDrawColor(...COLORS.lightGrey);
          doc.line(margin, y, pageWidth - margin, y);
          y += 7;
        });
        
        y += 5;
      }
    }
    
    // Notes
    if (additionalData.notes) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.navy);
      doc.setFont(undefined, 'normal');
      doc.text(lang === 'el' ? 'Epiprosthetes Paratirisis' : 'Additional Remarks', margin, y);
      y += 2;
      doc.setDrawColor(...COLORS.gold);
      doc.setLineWidth(0.8);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.black);
      doc.setFont(undefined, 'normal');
      
      const lines = doc.splitTextToSize(sanitizeText(additionalData.notes), pageWidth - 2 * margin);
      lines.forEach(line => {
        if (y > pageHeight - 40) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += 5;
      });
      
      y += 10;
    }
    
    // Photos
    if (additionalData.photos && Object.keys(additionalData.photos).length > 0) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(...(mode === 'out' ? COLORS.red : COLORS.navy));
      const photoTitle = mode === 'out' 
        ? (lang === 'el' ? 'Fotografies Zimion' : 'Damage Photos')
        : (lang === 'el' ? 'Fotografies' : 'Photos');
      doc.text(photoTitle, margin, y);
      y += 2;
      doc.setDrawColor(...(mode === 'out' ? COLORS.red : COLORS.gold));
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      const photoWidth = 50;
      const photoHeight = 35;
      const photosPerRow = 3;
      const photoSpacing = 5;
      let photoIndex = 0;

      Object.entries(additionalData.photos).forEach(([itemName, photos]) => {
        const photoArray = Array.isArray(photos) ? photos : [photos];
        photoArray.forEach((photoUrl) => {
          const col = photoIndex % photosPerRow;
          const row = Math.floor(photoIndex / photosPerRow);
          
          const x = margin + col * (photoWidth + photoSpacing);
          const photoY = y + row * (photoHeight + 15);

          if (photoY + photoHeight > pageHeight - 40) {
            doc.addPage();
            y = 20;
            photoIndex = 0;
            return;
          }

          try {
            doc.addImage(photoUrl, 'JPEG', x, photoY, photoWidth, photoHeight);
          } catch (e) {
            console.error('Error adding image:', e);
          }

          doc.setFontSize(9);
          doc.setTextColor(...COLORS.black);
          doc.text(sanitizeText(itemName), x + photoWidth / 2, photoY + photoHeight + 4, { align: 'center' });

          photoIndex++;
        });
      });

      const totalRows = Math.ceil(photoIndex / photosPerRow);
      y += totalRows * (photoHeight + 15) + 10;
    }

    // 🔥🔥🔥 NEW: Payment Authorization BEFORE Signatures! 🔥🔥🔥
    if (mode === 'out' && additionalData.paymentAuthAccepted) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(...COLORS.navy);
      doc.setFont(undefined, 'bold');
      doc.text(lang === 'el' ? 'Exousiodotisi Plirosis *' : 'Payment Authorization *', margin, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.black);
      doc.setFont(undefined, 'normal');
      const authText = lang === 'el'
        ? 'O pelatis me tin synainesi tou mas epitrepei na paroyme hrimata apo tin proeggrafí pou ehei ginei stin karta tou gia zimies pou ehei kanei.'
        : 'The customer authorizes us to charge the pre-authorized amount on their card for any damages incurred.';
      const authLines = doc.splitTextToSize(authText, pageWidth - 2 * margin - 10);
      authLines.forEach(line => {
        doc.text(line, margin + 5, y);
        y += 5;
      });
      
      y += 5;
      
      // Green checkbox
      doc.setFillColor(...COLORS.green);
      doc.setDrawColor(...COLORS.green);
      doc.rect(margin + 5, y - 3, 4, 4, 'FD');
      
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(8);
      doc.text('✓', margin + 7, y, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.black);
      doc.setFont(undefined, 'bold');
      doc.text(lang === 'el' ? '✓ Exousodoto tin pliromi' : '✓ I authorize payment', margin + 12, y);
      
      y += 8;
      
      // Note about skipper signature
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.grey);
      doc.setFont(undefined, 'italic');
      const noteText = lang === 'el'
        ? '* I ypografi tou kyverniti parakato kalypatei kai aftin tin exousiodotisi'
        : '* The skipper signature below covers this authorization';
      doc.text(noteText, pageWidth / 2, y, { align: 'center' });
      
      y += 15;
    }

    // Signatures (NOW AFTER Payment Auth!)
    const sigWidth = 70;
    const sigHeight = 30;
    
    let skipperSigData = additionalData.skipperSignature;
    let employeeSigData = additionalData.employeeSignature;
    
    console.log('🔍 DEBUG - Skipper signature data:', skipperSigData ? 'EXISTS' : 'MISSING');
    console.log('🔍 DEBUG - Employee signature data:', employeeSigData ? 'EXISTS' : 'MISSING');
    
    if (skipperSigData && typeof skipperSigData === 'object') {
      skipperSigData = skipperSigData.url || skipperSigData.data || '';
    }
    if (employeeSigData && typeof employeeSigData === 'object') {
      employeeSigData = employeeSigData.url || employeeSigData.data || '';
    }
    
    console.log('🔍 DEBUG - After processing:');
    console.log('   Skipper:', skipperSigData ? 'HAS DATA' : 'NO DATA');
    console.log('   Employee:', employeeSigData ? 'HAS DATA' : 'NO DATA');
    
    const hasSkipperSig = !!skipperSigData;
    const hasEmployeeSig = !!employeeSigData;
    
    console.log('🔍 DEBUG - Will show signatures:', { hasSkipperSig, hasEmployeeSig });
    
    if (hasSkipperSig || hasEmployeeSig) {
      if (y > pageHeight - 50) {
        doc.addPage();
        y = 20;
      }
      
      const leftX = margin;
      const rightX = pageWidth / 2 + 10;
      
      if (hasSkipperSig) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.grey);
        doc.text(lang === 'el' ? "Ypografi Kyverniti" : "Skipper's Signature", leftX, y);
        
        try {
          doc.addImage(skipperSigData, 'PNG', leftX, y + 2, sigWidth, sigHeight);
          console.log('✅ Skipper signature added to PDF');
        } catch (e) {
          console.error('❌ Error adding skipper signature:', e);
        }
      }
      
      if (hasEmployeeSig) {
        doc.setFontSize(9);
        doc.setTextColor(...COLORS.grey);
        doc.text(lang === 'el' ? "Ypografi Ypalilou" : "Employee's Signature", rightX, y);
        
        try {
          doc.addImage(employeeSigData, 'PNG', rightX, y + 2, sigWidth, sigHeight);
          console.log('✅ Employee signature added to PDF');
        } catch (e) {
          console.error('❌ Error adding employee signature:', e);
        }
      }
      
      y += sigHeight + 15;
    }

    // Footer
    const footerY = pageHeight - 30;
    
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.grey);
    doc.setFont(undefined, 'normal');
    
    const footerLines = [
      'Leukosias 37, Alimos',
      'www.tailwindyachting.com',
      'Tel: +30 6978196009',
      'info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com'
    ];

    let fY = footerY;
    footerLines.forEach(line => {
      doc.text(line, pageWidth / 2, fY, { align: 'center' });
      fY += 4;
    });

    fY += 2;
    doc.setFontSize(7);
    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Document generated on ${timestamp}`, pageWidth / 2, fY, { align: 'center' });

    console.log('✅ Page 5 complete with PAYMENT AUTH FIX - EARLY RETURN');
    return doc;
  }
  // =================================================================
  // END OF PAGE 5 BLOCK WITH FIX
  // =================================================================

  // Remaining code for other pages (Pages 2, 3, 4 signatures and footer)
  // Photos - Pages 2, 3, 4
  if (!options.isPage1 && !options.isPage5 && additionalData.photos && Object.keys(additionalData.photos).length > 0) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setTextColor(...COLORS.navy);
    const photoTitle = mode === 'in' ? 'Photos (Pre-existing Conditions)' : 'Damage Photos';
    doc.text(photoTitle, margin, y);
    y += 2;
    doc.setDrawColor(...COLORS.gold);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    const photoWidth = 50;
    const photoHeight = 35;
    const photosPerRow = 3;
    const photoSpacing = 5;
    let photoIndex = 0;

    Object.entries(additionalData.photos).forEach(([itemName, photos]) => {
      photos.forEach((photoUrl) => {
        const col = photoIndex % photosPerRow;
        const row = Math.floor(photoIndex / photosPerRow);
        
        const x = margin + col * (photoWidth + photoSpacing);
        const photoY = y + row * (photoHeight + 15);

        if (photoY + photoHeight > pageHeight - 40) {
          doc.addPage();
          y = 20;
          photoIndex = 0;
          return;
        }

        try {
          doc.addImage(photoUrl, 'JPEG', x, photoY, photoWidth, photoHeight);
        } catch (e) {
          console.error('Error adding image:', e);
        }

        doc.setFontSize(9);
        doc.setTextColor(...COLORS.black);
        doc.text(sanitizeText(itemName), x + photoWidth / 2, photoY + photoHeight + 4, { align: 'center' });

        photoIndex++;
      });
    });

    const totalRows = Math.ceil(photoIndex / photosPerRow);
    y += totalRows * (photoHeight + 15) + 10;
  }

  // Signatures for Pages 2, 3, 4
  let signatureData = additionalData.skipperSignature;
  if (signatureData && typeof signatureData === 'object') {
    signatureData = signatureData.url || signatureData.data || '';
  }
  
  const showSignature = (options.isPage3 || options.isPage4 || !options.isPage1) && signatureData && !options.isPage5;
  
  if (showSignature) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    y += 5;

    const sigWidth = 70;
    const sigHeight = 30;

    if (mode === 'in') {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.grey);
      doc.text("Skipper's Signature", pageWidth / 2 - sigWidth / 2, y);
      
      if (signatureData) {
        try {
          doc.addImage(signatureData, 'PNG', pageWidth / 2 - sigWidth / 2, y + 2, sigWidth, sigHeight);
        } catch (e) {
          console.error('Error adding skipper signature:', e);
        }
      } else {
        doc.setDrawColor(...COLORS.lightGrey);
        doc.rect(pageWidth / 2 - sigWidth / 2, y + 2, sigWidth, sigHeight);
      }

      y += sigHeight + 10;
    }
    
    if (mode === 'out') {
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.grey);
      doc.text("Employee's Signature", pageWidth / 2 - sigWidth / 2, y);
      
      let empSignatureData = additionalData.employeeSignature;
      if (empSignatureData && typeof empSignatureData === 'object') {
        empSignatureData = empSignatureData.url || empSignatureData.data || '';
      }
      
      if (empSignatureData) {
        try {
          doc.addImage(empSignatureData, 'PNG', pageWidth / 2 - sigWidth / 2, y + 2, sigWidth, sigHeight);
        } catch (e) {
          console.error('Error adding employee signature:', e);
        }
      } else {
        doc.setDrawColor(...COLORS.lightGrey);
        doc.rect(pageWidth / 2 - sigWidth / 2, y + 2, sigWidth, sigHeight);
      }

      y += sigHeight + 10;
    }
  }

  // Footer for all pages
  const footerY = pageHeight - 30;
  
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.grey);
  doc.setFont(undefined, 'normal');
  
  const footerLines = [
    'Leukosias 37, Alimos',
    'www.tailwindyachting.com',
    'Tel: +30 6978196009',
    'info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com'
  ];

  let fY = footerY;
  footerLines.forEach(line => {
    doc.text(line, pageWidth / 2, fY, { align: 'center' });
    fY += 4;
  });

  fY += 2;
  doc.setFontSize(7);
  const timestamp = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.text(`Document generated on ${timestamp}`, pageWidth / 2, fY, { align: 'center' });

  return doc;
}

// =================================================================
// END OF PART 3 - COMPLETE!
// =================================================================
// 🔥 TO USE: Combine all 3 parts into src/utils/LuxuryPDFGenerator.js
// 🔥 THE FIX: Payment Authorization now appears BEFORE signatures in PDF!
// =================================================================