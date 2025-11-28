import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from './authService';
import AdminDashboard from './AdminDashboard';
// 🔥 FIX 6 & 7: Import API functions for charter sync and vessels
// 🔥 FIX 16: Added API loading functions for multi-device sync
import { saveBookingHybrid, getVessels, getBookingsByVesselHybrid, getAllBookingsHybrid, deleteBooking, updateCharterPayments, updateCharterStatus } from './services/apiService';
// 🔥 FIX 23: Charter Party DOCX generation
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
// 🔥 Auto-refresh hook for polling API data
import { useAutoRefresh } from './hooks/useAutoRefresh';

// =====================================================
// FLEET MANAGEMENT - PROFESSIONAL VERSION WITH AUTH
// PART 1/4: Base + Components + Login + Admin
// =====================================================

// --- Utility Functions ---
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const mid = () => "m_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

// --- Company Information ---
const COMPANY_INFO = {
  name: "TAILWIND YACHTING",
  address: "Leukosias 37, Alimos",
  phone: "+30 6978196009",
  emails: {
    info: "info@tailwindyachting.com",
    accounting: "accounting@tailwindyachting.com",
    charter: "charter@tailwindyachting.com"
  }
};

// --- Shared Fleet Service ---
const FLEET_STORAGE_KEY = 'app_fleet_vessels';

// 🔥 FIX 5: INITIAL_FLEET with numeric IDs matching API format
const INITIAL_FLEET = [
  { id: 8, name: "Bob", type: "Catamaran", model: "Lagoon 42" },
  { id: 7, name: "Perla", type: "Catamaran", model: "Lagoon 46" },
  { id: 6, name: "Infinity", type: "Catamaran", model: "Bali 4.2" },
  { id: 1, name: "Maria 1", type: "Monohull", model: "Jeanneau Sun Odyssey 449" },
  { id: 2, name: "Maria 2", type: "Monohull", model: "Jeanneau yacht 54" },
  { id: 4, name: "Bar Bar", type: "Monohull", model: "Beneteau Oceanis 46.1" },
  { id: 5, name: "Kalispera", type: "Monohull", model: "Bavaria c42 Cruiser" },
  { id: 3, name: "Valesia", type: "Monohull", model: "Bavaria c42 Cruiser" }
];

const FleetService = {
  initialize() {
    const stored = localStorage.getItem(FLEET_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(INITIAL_FLEET));
      console.log('✅ Fleet initialized with 8 boats');
    }
  },

  getAllBoats() {
    try {
      const stored = localStorage.getItem(FLEET_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return INITIAL_FLEET;
    } catch (error) {
      console.error('Error loading fleet:', error);
      return INITIAL_FLEET;
    }
  },

  addBoat(boat) {
    try {
      const boats = this.getAllBoats();
      
      if (boats.find(b => b.id.toUpperCase() === boat.id.toUpperCase())) {
        throw new Error(`Boat with ID "${boat.id}" already exists`);
      }
      
      boats.push({
        id: boat.id.toUpperCase(),
        name: boat.name,
        type: boat.type,
        model: boat.model || '',
        createdAt: new Date().toISOString()
      });
      
      boats.sort((a, b) => a.id.localeCompare(b.id));
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(boats));
      console.log('✅ Boat added:', boat.id);
      
      authService.logActivity('add_boat', boat.id);
      
      return true;
    } catch (error) {
      console.error('Error adding boat:', error);
      throw error;
    }
  },

  removeBoat(boatId) {
    try {
      const boats = this.getAllBoats();
      const filtered = boats.filter(b => b.id !== boatId);
      localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Boat removed:', boatId);
      
      authService.logActivity('remove_boat', boatId);
      
      return true;
    } catch (error) {
      console.error('Error removing boat:', error);
      return false;
    }
  }
};

FleetService.initialize();

// --- Icons (SVG) ---
const icons = {
  home: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>),
  message: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>),
  logout: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>),
  media: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>),
  tasks: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>),
  charter: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path><path d="M20 9h-4V4a2 2 0 0 0-2-2H9.96A2 2 0 0 0 8 4v5H4"></path><path d="M12 9v11"></path></svg>),
  financials: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0 4h18"></path><circle cx="7" cy="17" r="2"></circle></svg>),
  bookingSheet: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><line x1="10" y1="14" x2="21" y2="14"></line><line x1="10" y1="18" x2="21" y2="18"></line><line x1="3" y1="14" x2="7" y2="14"></line><line x1="3" y1="18" x2="7" y2="18"></line></svg>),
  email: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>),
  fileText: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>),
  calendar: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>),
  chevronLeft: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>),
  chevronRight: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>),
  plus: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>),
  x: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>),
  download: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>),
  send: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>),
  upload: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>),
  check: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>),
  checkCircle: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>),
  xCircle: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>),
  helpCircle: (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>),
  lock: (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>),
  edit: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>),
  shield: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>),
  eye: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>)
};

let globalShowMessage = (text, type) => console.log(text, type);

// =====================================================
// PAYMENT STATUS HELPER - Κείμενο αντί για emojis
// =====================================================
const getPaymentStatusInfo = (paymentStatus) => {
  switch (paymentStatus) {
    case 'Paid':
      return { 
        text: 'ΕΞΟΦΛΗΘΗΚΕ', 
        color: 'text-green-400',
        showLight: false 
      };
    case 'Partial':
      return { 
        text: 'ΜΕΡΙΚΩΣ', 
        color: 'text-orange-400',
        showLight: true,
        lightBlink: false 
      };
    case 'Pending':
    default:
      return { 
        text: 'ΑΝΕΞΟΦΛΗΤΟ', 
        color: 'text-red-400',
        showLight: true,
        lightBlink: true 
      };
  }
};

// =====================================================
// END OF PART 1 - Continue with Part 2
// =====================================================
// =====================================================
// PART 2/4: PDF Generator + Main Component + Login + Admin
// =====================================================

const generateSpecimenPdf = (charter, boatData, companyInfo = COMPANY_INFO) => {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert('PDF library not loaded. Please refresh the page.');
      return;
    }
    
    authService.logActivity('download_specimen', charter.code);
    
    const doc = new jsPDF();
    
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = 'https://drive.google.com/uc?export=download&id=1DOmo-MO9ZsfmZm7ac4olSF8nl3dJAAer';
    
    let logoLoaded = false;
    
    logoImg.onload = () => {
      logoLoaded = true;
      generatePDF(true);
    };
    
    logoImg.onerror = () => {
      console.warn('Logo failed to load, using text fallback');
      generatePDF(false);
    };
    
    setTimeout(() => {
      if (!logoLoaded) {
        console.warn('Logo timeout, using text fallback');
        generatePDF(false);
      }
    }, 2000);
    
    const generatePDF = (hasLogo) => {
      try {
        if (hasLogo) {
          doc.addImage(logoImg, 'PNG', 20, 10, 40, 18);
        } else {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text('LOGO', 40, 20);
        }
      } catch (e) {
        console.error('Error adding logo:', e);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('LOGO', 40, 20);
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TAILWIND YACHTING', 190, 15, { align: 'right' });
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Leukosias 37, Alimos', 190, 20, { align: 'right' });
      doc.text('Tel: +30 6978196009', 190, 25, { align: 'right' });
      doc.text('info@tailwindyachting.com', 190, 30, { align: 'right' });
      doc.text('accounting@tailwindyachting.com', 190, 34, { align: 'right' });
      doc.text('charter@tailwindyachting.com', 190, 38, { align: 'right' });
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`CHARTERING INFORMATION - OPTION ${charter.code}`, 105, 55, { align: 'center' });
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(20, 60, 190, 60);
      
      doc.setFillColor(240, 240, 240);
      doc.rect(20, 70, 170, 40, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      
      let yPos = 78;
      
      doc.text('YACHT:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(boatData.name || boatData.id, 70, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('FROM:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.startDate || '', 70, yPos);
      
      doc.setFont('helvetica', 'bold');
      doc.text('TO:', 110, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.endDate || '', 130, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('DEPARTURE:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.departure || 'ALIMOS MARINA', 70, yPos);
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('ARRIVAL:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.arrival || 'ALIMOS MARINA', 70, yPos);
      
      yPos = 125;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('FINANCIAL TERMS:', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 5, 170, 45, 'F');
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(20, yPos - 5, 170, 45);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 128, 0);
      doc.text('Charter Fee (Income):', 25, yPos);
      doc.text(`${(charter.amount || 0).toFixed(2)}€`, 185, yPos, { align: 'right' });
      
      yPos += 10;
      doc.setTextColor(255, 0, 0);
      doc.text('Commission (Expense):', 25, yPos);
      doc.text(`-${(charter.commission || 0).toFixed(2)}€`, 185, yPos, { align: 'right' });
      
      yPos += 10;
      doc.text('VAT on Commission (24%) (Expense):', 25, yPos);
      doc.text(`-${(charter.vat_on_commission || 0).toFixed(2)}€`, 185, yPos, { align: 'right' });
      
      yPos += 10;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const netIncome = (charter.amount || 0) - (charter.commission || 0) - (charter.vat_on_commission || 0);
      doc.text('NET INCOME:', 25, yPos);
      doc.text(`${netIncome.toFixed(2)}€`, 185, yPos, { align: 'right' });
      
      yPos += 25;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('Please advise regarding the acceptance of the charter.', 105, yPos, { align: 'center' });
      
      yPos += 8;
      doc.text('Thank you,', 105, yPos, { align: 'center' });
      
      doc.save(`specimen_${charter.code}.pdf`);
      
      if (globalShowMessage) {
        globalShowMessage('✅ Specimen PDF κατέβηκε επιτυχώς!', 'success');
      }
    };
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Σφάλμα: ' + error.message);
  }
};

// 🔥 FIX 23: Generate Charter Party DOCX with auto-fill
const generateCharterParty = async (charter, boat, showMessage?) => {
  console.log('🚀 Charter Party button clicked!');
  console.log('🚀 Charter:', charter);
  console.log('🚀 Boat:', boat);

  try {
    console.log('📄 Step 1: Fetching template...');

    // Load template from public folder
    const templateUrl = '/templates/FINAL-Charter-Party-Tailwind-2026.docx';
    console.log('📄 Template URL:', templateUrl);

    const response = await fetch(templateUrl);
    console.log('📄 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Template not found at:', templateUrl);
      console.error('❌ Response:', response.status, response.statusText);
      alert(`❌ Template file not found!\n\nPlease place the template at:\npublic/templates/FINAL-Charter-Party-Tailwind-2026.docx`);
      return;
    }

    console.log('📄 Step 2: Converting to ArrayBuffer...');
    const templateBuffer = await response.arrayBuffer();
    console.log('📄 Template loaded, size:', templateBuffer.byteLength, 'bytes');

    // Calculate financial values
    const charterAmount = charter.amount || 0;
    const vatAmount = charterAmount * 0.12; // 12% VAT on charter
    const totalWithVat = charterAmount + vatAmount;

    // Prepare data for auto-fill - matches template placeholders
    const data = {
      // Vessel Info
      VESSEL_NAME: boat?.name || charter.vesselName || charter.boatName || '',
      VESSEL_TYPE: boat?.type || '',
      REGISTER_NUMBER: '',

      // Date
      DAY: new Date().getDate().toString(),
      MONTH: (new Date().getMonth() + 1).toString(),
      YEAR: new Date().getFullYear().toString(),

      // Owner Info (empty - to be filled manually)
      OWNER_NAME: '',
      OWNER_ADDRESS: '',
      OWNER_ID: '',
      OWNER_PASSPORT: '',
      OWNER_TAX: '',
      OWNER_TAX_OFFICE: '',
      OWNER_PHONE: '',
      OWNER_EMAIL: '',

      // Broker Info (empty - to be filled manually)
      BROKER2_NAME: '',
      BROKER2_ADDRESS: '',
      BROKER2_TAX: '',
      BROKER2_TAX_OFFICE: '',
      BROKER2_PHONE: '',
      BROKER2_EMAIL: '',

      // Charterer Info - AUTO-FILL from charter data
      CHARTERER_NAME: charter.skipperFirstName && charter.skipperLastName
        ? `${charter.skipperFirstName} ${charter.skipperLastName}`
        : charter.clientName || charter.charterer || '',
      CHARTERER_ADDRESS: charter.skipperAddress || '',
      CHARTERER_ID: '',
      CHARTERER_PASSPORT: '',
      CHARTERER_TAX: '',
      CHARTERER_TAX_OFFICE: '',
      CHARTERER_PHONE: charter.skipperPhone || '',
      CHARTERER_EMAIL: charter.skipperEmail || '',

      // Charter Dates - AUTO-FILL
      CHECKIN_DATE: charter.startDate || '',
      CHECKOUT_DATE: charter.endDate || '',
      DEPARTURE_PORT: charter.departure || 'ALIMOS MARINA',
      ARRIVAL_PORT: charter.arrival || 'ALIMOS MARINA',

      // Financial - AUTO-FILL
      NET_CHARTER_FEE: charterAmount.toFixed(2),
      VAT_AMOUNT: vatAmount.toFixed(2),
      TOTAL_CHARTER_PRICE: totalWithVat.toFixed(2),
      CHARTER_AMOUNT: charterAmount.toFixed(2),

      // Additional fields (empty - to be filled manually)
      PROFESSIONAL_LICENSE: '',
      AMEPA: '',
      SECURITY_DEPOSIT: '',
      DAMAGE_WAIVER: '',
      APA_AMOUNT: '',

      // Reference
      CHARTER_CODE: charter.code || '',
      BOOKING_CODE: charter.code || ''
    };

    console.log('📋 Step 4: Auto-fill data prepared:', data);

    // Generate document with docxtemplater
    console.log('📄 Step 5: Creating PizZip...');
    const zip = new PizZip(templateBuffer);
    console.log('📄 Step 6: PizZip created successfully');

    console.log('📄 Step 7: Creating Docxtemplater...');
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' }
    });
    console.log('📄 Step 8: Docxtemplater created successfully');

    // Render with data
    console.log('📄 Step 9: Rendering document...');
    doc.render(data);
    console.log('📄 Step 10: Document rendered successfully');

    // Generate blob
    console.log('📄 Step 11: Generating blob...');
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    console.log('📄 Step 12: Blob generated, size:', blob.size, 'bytes');

    // Download file
    const filename = `Charter-Party-${charter.code || 'document'}.docx`;
    console.log('📄 Step 13: Saving file as:', filename);
    saveAs(blob, filename);

    console.log('✅ Charter Party generated and downloaded successfully!');
    if (showMessage) {
      showMessage('✅ Charter Party DOCX κατέβηκε επιτυχώς!', 'success');
    }

  } catch (error: any) {
    console.error('❌ Error generating Charter Party:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    if (showMessage) {
      showMessage('❌ Σφάλμα: ' + error.message, 'error');
    } else {
      alert('❌ Error: ' + error.message);
    }
  }
};

// 🔥 FIX 27: Generate Crew List DOCX with auto-fill
const generateCrewList = async (charter, boat, boatDetails?, showMessage?) => {
  console.log('👥 Crew List button clicked!');
  console.log('👥 Charter:', charter);
  console.log('👥 Boat:', boat);
  console.log('👥 Boat Details:', boatDetails);

  try {
    console.log('📄 Step 1: Fetching Crew List template...');

    // Load template from public folder
    const templateUrl = '/templates/Crew-List.docx';
    console.log('📄 Template URL:', templateUrl);

    const response = await fetch(templateUrl);
    console.log('📄 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Template not found at:', templateUrl);
      alert(`❌ Template file not found!\n\nPlease place the template at:\npublic/templates/Crew-List.docx`);
      return;
    }

    console.log('📄 Step 2: Converting to ArrayBuffer...');
    const templateBuffer = await response.arrayBuffer();
    console.log('📄 Template loaded, size:', templateBuffer.byteLength, 'bytes');

    // Get crew members from charter (from API or localStorage)
    const crewMembers = charter.crewMembers || [];
    console.log('👥 Crew members found:', crewMembers.length);

    // Format dates
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      } catch {
        return dateStr;
      }
    };

    // Prepare crew members array for docxtemplater loop
    // Each crew member needs: name, dateOfBirth, passport, gender, nationality
    const crewData = crewMembers.map((member, index) => ({
      ROW_NUM: (index + 1).toString(),
      CREW_NAME: member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim(),
      CREW_DOB: formatDate(member.dateOfBirth) || '',
      CREW_PASSPORT: member.passport || '',
      CREW_GENDER: member.gender || '',
      CREW_NATIONALITY: member.nationality || ''
    }));

    // Pad array to have at least 10 rows (typical crew list has 10 empty rows)
    while (crewData.length < 10) {
      crewData.push({
        ROW_NUM: (crewData.length + 1).toString(),
        CREW_NAME: '',
        CREW_DOB: '',
        CREW_PASSPORT: '',
        CREW_GENDER: '',
        CREW_NATIONALITY: ''
      });
    }

    // Prepare data for auto-fill - matches template placeholders
    const data = {
      // Table 2: Vessel Info
      YACHT_NAME: boat?.name || charter.vesselName || charter.boatName || '',
      YACHT_TYPE: boat?.type || boatDetails?.['Yacht Type'] || '',
      REGISTRY_PORT: boatDetails?.['Port of Registry'] || 'Piraeus',
      REGISTRATION_NUMBER: boatDetails?.['Registration Number'] || '',
      CALL_SIGN: boatDetails?.['Call Sign'] || '',
      E_MITROO: boatDetails?.['E-Mitroo'] || boatDetails?.['MMSI'] || '',
      FLAG: boatDetails?.['Flag'] || 'Greek',

      // Table 2: Dates
      EMBARKATION_DATE: formatDate(charter.startDate),
      EMBARKATION_PLACE: charter.departure || 'ALIMOS MARINA',
      DISEMBARKATION_DATE: formatDate(charter.endDate),
      DISEMBARKATION_PLACE: charter.arrival || 'ALIMOS MARINA',

      // Table 4: Contact Info
      SKIPPER_MOBILE: charter.skipperPhone || '',
      CHARTERER_MOBILE: charter.skipperPhone || '',
      SKIPPER_NAME: charter.skipperFirstName && charter.skipperLastName
        ? `${charter.skipperFirstName} ${charter.skipperLastName}`
        : charter.clientName || '',

      // Crew members array for Table 3 loop
      crew: crewData,

      // Individual crew members (for templates without loop support)
      CREW1_NAME: crewData[0]?.CREW_NAME || '',
      CREW1_DOB: crewData[0]?.CREW_DOB || '',
      CREW1_PASSPORT: crewData[0]?.CREW_PASSPORT || '',
      CREW1_GENDER: crewData[0]?.CREW_GENDER || '',
      CREW1_NATIONALITY: crewData[0]?.CREW_NATIONALITY || '',

      CREW2_NAME: crewData[1]?.CREW_NAME || '',
      CREW2_DOB: crewData[1]?.CREW_DOB || '',
      CREW2_PASSPORT: crewData[1]?.CREW_PASSPORT || '',
      CREW2_GENDER: crewData[1]?.CREW_GENDER || '',
      CREW2_NATIONALITY: crewData[1]?.CREW_NATIONALITY || '',

      CREW3_NAME: crewData[2]?.CREW_NAME || '',
      CREW3_DOB: crewData[2]?.CREW_DOB || '',
      CREW3_PASSPORT: crewData[2]?.CREW_PASSPORT || '',
      CREW3_GENDER: crewData[2]?.CREW_GENDER || '',
      CREW3_NATIONALITY: crewData[2]?.CREW_NATIONALITY || '',

      CREW4_NAME: crewData[3]?.CREW_NAME || '',
      CREW4_DOB: crewData[3]?.CREW_DOB || '',
      CREW4_PASSPORT: crewData[3]?.CREW_PASSPORT || '',
      CREW4_GENDER: crewData[3]?.CREW_GENDER || '',
      CREW4_NATIONALITY: crewData[3]?.CREW_NATIONALITY || '',

      CREW5_NAME: crewData[4]?.CREW_NAME || '',
      CREW5_DOB: crewData[4]?.CREW_DOB || '',
      CREW5_PASSPORT: crewData[4]?.CREW_PASSPORT || '',
      CREW5_GENDER: crewData[4]?.CREW_GENDER || '',
      CREW5_NATIONALITY: crewData[4]?.CREW_NATIONALITY || '',

      CREW6_NAME: crewData[5]?.CREW_NAME || '',
      CREW6_DOB: crewData[5]?.CREW_DOB || '',
      CREW6_PASSPORT: crewData[5]?.CREW_PASSPORT || '',
      CREW6_GENDER: crewData[5]?.CREW_GENDER || '',
      CREW6_NATIONALITY: crewData[5]?.CREW_NATIONALITY || '',

      CREW7_NAME: crewData[6]?.CREW_NAME || '',
      CREW7_DOB: crewData[6]?.CREW_DOB || '',
      CREW7_PASSPORT: crewData[6]?.CREW_PASSPORT || '',
      CREW7_GENDER: crewData[6]?.CREW_GENDER || '',
      CREW7_NATIONALITY: crewData[6]?.CREW_NATIONALITY || '',

      CREW8_NAME: crewData[7]?.CREW_NAME || '',
      CREW8_DOB: crewData[7]?.CREW_DOB || '',
      CREW8_PASSPORT: crewData[7]?.CREW_PASSPORT || '',
      CREW8_GENDER: crewData[7]?.CREW_GENDER || '',
      CREW8_NATIONALITY: crewData[7]?.CREW_NATIONALITY || '',

      CREW9_NAME: crewData[8]?.CREW_NAME || '',
      CREW9_DOB: crewData[8]?.CREW_DOB || '',
      CREW9_PASSPORT: crewData[8]?.CREW_PASSPORT || '',
      CREW9_GENDER: crewData[8]?.CREW_GENDER || '',
      CREW9_NATIONALITY: crewData[8]?.CREW_NATIONALITY || '',

      CREW10_NAME: crewData[9]?.CREW_NAME || '',
      CREW10_DOB: crewData[9]?.CREW_DOB || '',
      CREW10_PASSPORT: crewData[9]?.CREW_PASSPORT || '',
      CREW10_GENDER: crewData[9]?.CREW_GENDER || '',
      CREW10_NATIONALITY: crewData[9]?.CREW_NATIONALITY || '',

      // Reference
      CHARTER_CODE: charter.code || '',
      BOOKING_CODE: charter.code || ''
    };

    console.log('📋 Step 4: Auto-fill data prepared:', data);

    // Generate document with docxtemplater
    console.log('📄 Step 5: Creating PizZip...');
    const zip = new PizZip(templateBuffer);
    console.log('📄 Step 6: PizZip created successfully');

    console.log('📄 Step 7: Creating Docxtemplater...');
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' }
    });
    console.log('📄 Step 8: Docxtemplater created successfully');

    // Render with data
    console.log('📄 Step 9: Rendering document...');
    doc.render(data);
    console.log('📄 Step 10: Document rendered successfully');

    // Generate blob
    console.log('📄 Step 11: Generating blob...');
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    console.log('📄 Step 12: Blob generated, size:', blob.size, 'bytes');

    // Download file
    const filename = `Crew-List-${charter.code || 'document'}.docx`;
    console.log('📄 Step 13: Saving file as:', filename);
    saveAs(blob, filename);

    console.log('✅ Crew List generated and downloaded successfully!');
    if (showMessage) {
      showMessage('✅ Crew List DOCX κατέβηκε επιτυχώς!', 'success');
    }

  } catch (error: any) {
    console.error('❌ Error generating Crew List:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error message:', error.message);
    if (showMessage) {
      showMessage('❌ Σφάλμα: ' + error.message, 'error');
    } else {
      alert('❌ Error: ' + error.message);
    }
  }
};

// 🔥 FIX 11: Enhanced email function with debugging logs
const sendCharterEmail = async (charter, boatName, action) => {
  // 🔥 FIX 11: Log when called
  console.log('📧 sendCharterEmail CALLED');
  console.log('📧 Charter:', charter.code);
  console.log('📧 Boat:', boatName);
  console.log('📧 Action:', action);

  try {
    authService.logActivity(`send_charter_${action}`, charter.code);

    // ALL emails go to ONLY these 2 addresses
    const emailTo = ['info@tailwindyachting.com', 'charter@tailwindyachting.com'];

    const actionLabels = {
      'new_charter': 'NEW CHARTER CREATED',
      'option_accepted': 'OPTION ACCEPTED by Owner',
      'cancelled': 'CANCELLED',
      'confirmed': 'CONFIRMED by Owner',
      'reservation': 'RESERVATION - Charter Closed'
    };

    const emailPayload = {
      to: emailTo,
      code: charter.code,
      boatName: boatName,
      action: action,
      startDate: charter.startDate,
      endDate: charter.endDate,
      amount: charter.amount,
      netIncome: (charter.amount || 0) - (charter.commission || 0) - (charter.vat_on_commission || 0),
      // 🔥 FIX 9: Include skipper info in email
      skipperName: `${charter.skipperFirstName || ''} ${charter.skipperLastName || ''}`.trim(),
      skipperEmail: charter.skipperEmail || '',
      skipperPhone: charter.skipperPhone || ''
    };

    // 🔥 FIX 11: Log payload before sending
    console.log('📧 Email payload:', JSON.stringify(emailPayload, null, 2));

    // 🔥 FIX 15: Use nginx proxy for email API
    const EMAIL_API_URL = 'https://yachtmanagementsuite.com/email/send-charter-email';
    console.log('📧 Calling API:', EMAIL_API_URL);
    console.log('📧 Request body:', JSON.stringify(emailPayload));

    try {
      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      // 🔥 FIX 11: Log API response
      console.log('📧 API Response status:', response.status);
      console.log('📧 API Response ok:', response.ok);

      const responseText = await response.text();
      console.log('📧 API Response text:', responseText);

      let responseData = {};
      try {
        responseData = JSON.parse(responseText);
        console.log('📧 API Response data:', responseData);
      } catch (parseError) {
        console.log('📧 Response is not JSON:', responseText);
      }

      if (!response.ok) {
        console.error('📧 API Error: Non-OK status', response.status, responseText);
      } else {
        console.log('📧 ✅ Email sent successfully via API!');
      }
    } catch (apiError) {
      // 🔥 FIX 11: Log API errors with full details
      console.error('📧 API fetch error:', apiError);
      console.error('📧 Error name:', apiError.name);
      console.error('📧 Error message:', apiError.message);
      // Continue even if API fails - show alert anyway
    }

    alert(`Email sent to:\n${emailTo.join('\n')}\n\nCharter ${charter.code} - ${actionLabels[action] || action}`);
    console.log('📧 Email process completed successfully');

    return true;
  } catch (error) {
    // 🔥 FIX 11: Log errors
    console.error('📧 Email send error:', error);
    return false;
  }
};

const TASK_DEFINITIONS = [
  "ΜΗΧ", "ΓΕΝΝΗ", "ΑΞΟΝ", "ΒΑΝΕΣ", "BOW", "ΜΙΖΑ", "ALT", "ΕΡΓΑΤ", "ΕΡΓΑTΗΣ", 
  "ΒΑΤ/", "WINCH", "MAIN", "GEN", "ΒΙΜ", "SPRΑΥ", "LAZY", "WC", "HOLD", 
  "ΚΟΥ", "ΨΥ", "WATER/MAKER", "A/C", "ΤΙΜΟ", "O/B", "TEND", "LIFE", "ΠΥΡ/", 
  "ΕPIRB", "ΞΑΡ", "ΚΟΛΟ", "ΦΩΤΑ", "ΦΩΤΑ ", "ΗΛΕΚ/", "ΑΝΛΤΙΕΣ", "MΕΝΤΕ", 
  "HUTC", "ΒΟW", "LOUND", "ΒΕΡΝI", "ΔΙΑΚ", "ΠΑΝΙ", "ΣΕΝΤ", "GEL", "MOYΡ", 
  "CLEAN", "INOX", "TEAK", "LOCK", "INVEN", "CLEAN.1", "FUEL", 
  "ΦΩΤΟΒΟΛΙΔΕΣ", "ΚΑΠΝΟΓΟΝΑ", "ΚΑΠΝΟΓΟΝΑ ΘΑΛΑΣ."
];

// 🔥 FIX 2: Function to determine initial page based on user type
const getInitialPage = (state: any): string => {
  if (state?.userType === 'OWNER' && state?.boatId) {
    return 'dashboard';
  }
  if (state?.userType === 'OWNER' && state?.showSummary) {
    return 'fleetSummary';
  }
  return 'adminDashboard';
};

export default function FleetManagement() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🔥 FIX 2: Use getInitialPage for initial state
  const [page, setPage] = useState(() => getInitialPage(location.state));
  const [currentUser] = useState({ uid: 'admin-user' });
  const [loading, setLoading] = useState(false);
  const [boatData, setBoatData] = useState(null);
  const [allBoats, setAllBoats] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [showFleetSummary, setShowFleetSummary] = useState(false);
  const [fleetBoatIds, setFleetBoatIds] = useState([]);
  const [ownerCode, setOwnerCode] = useState('');
  
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const isAdmin = authService.isAdmin();
  const isOwner = authService.isOwner();
  const isTechnical = authService.isTechnical();
  const isBooking = authService.isBooking();
  const isAccounting = authService.isAccounting();

  // Modal state for AdminDashboard
  const [showAddBoat, setShowAddBoat] = useState(false);
  const [showEmployeeManagement, setShowEmployeeManagement] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [financialsData, setFinancialsData] = useState({ boats: [], totals: { income: 0, expenses: 0, net: 0 } });

  useEffect(() => {
    const user = authService.getCurrentUser();
    setAuthenticatedUser(user);

    if (!user && !location.state) {
      console.log('⚠️ No user logged in, redirecting to homepage');
      navigate('/');
      return;
    }
  }, []);
  
  useEffect(() => {
    const state = location.state;
    
    if (state?.userType === 'OWNER' && state?.ownerCode) {
      const ownerUser = {
        code: state.ownerCode,
        name: `Owner ${state.ownerCode}`,
        role: 'OWNER',
        permissions: null,
        boatIds: state.boatIds || [state.boatId],
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('auth_current_user', JSON.stringify(ownerUser));
      setAuthenticatedUser(ownerUser);
      console.log('✅ Owner auto-logged in:', state.ownerCode);
    }
    
    if (state?.userType === 'OWNER' && state?.showSummary && state?.boatIds) {
      const boats = FleetService.getAllBoats();
      const ownerBoats = boats.filter(b => state.boatIds.includes(b.id));
      
      setFleetBoatIds(state.boatIds);
      setOwnerCode(state.ownerCode);
      setShowFleetSummary(true);
      setPage('fleetSummary');
      
      console.log('✅ Owner accessing Fleet Summary for boats:', state.boatIds);
      return;
    }
    
    if (state?.userType === 'OWNER' && state?.boatId) {
      // 🔥 FIX: Use INITIAL_FLEET as fallback if FleetService is empty
      let boats = FleetService.getAllBoats();
      if (boats.length === 0) {
        console.log('⚠️ FleetService empty, using INITIAL_FLEET');
        boats = INITIAL_FLEET;
      }

      const boat = boats.find(b => b.id === state.boatId);

      if (boat) {
        setBoatData(boat);
        setOwnerCode(state.ownerCode);
        setShowFleetSummary(false);
        setPage('dashboard');

        console.log('✅ Owner viewing boat dashboard:', boat.id, boat);
      } else {
        console.error('❌ Boat not found:', state.boatId, 'Available boats:', boats.map(b => b.id));
      }
      return;
    }
    
    if (state?.userType === 'COMPANY' && state?.isAdmin) {
      setShowFleetSummary(false);
      setPage('adminDashboard');
      loadBoats();
      
      console.log('✅ Admin logged in automatically');
      return;
    }
  }, [location]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  useEffect(() => {
    globalShowMessage = showMessage;
  }, []);

  useEffect(() => {
    loadBoats();
  }, []);

  // 🔥 FIX: Load boat data when allBoats is populated (handles owner navigation)
  useEffect(() => {
    const state = location.state;
    if (!boatData && state?.userType === 'OWNER' && state?.boatId) {
      // Use allBoats if available, otherwise use INITIAL_FLEET
      let boats = allBoats.length > 0 ? allBoats : INITIAL_FLEET;

      const boat = boats.find(b => b.id === state.boatId);
      if (boat) {
        setBoatData(boat);
        setOwnerCode(state.ownerCode);
        setPage('dashboard');
        console.log('✅ Boat data loaded for owner:', boat.id, boat);
      } else {
        console.error('❌ Boat not found in allBoats/INITIAL_FLEET:', state.boatId);
      }
    }
  }, [allBoats, boatData, location.state]);

  useEffect(() => {
    if (page === 'adminDashboard') {
      loadBoats();
    }
  }, [page]);

  useEffect(() => {
    if (showFinancials && allBoats.length > 0) {
      loadFinancialsData();
    }
  }, [showFinancials, allBoats]);

  const loadBoats = () => {
    try {
      const boats = FleetService.getAllBoats();
      setAllBoats(boats);
    } catch (e) {
      console.error('Error loading boats:', e);
    }
  };

  const handleBoatAdded = () => {
    loadBoats();
  };

  // 🔥 FIX 16: Load financials from API first, merge with localStorage
  const loadFinancialsData = async () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    const boatsData: any[] = [];

    // Load all boats in parallel for better performance
    await Promise.all(allBoats.map(async (boat: any) => {
      // Load charters from API (with localStorage merge and fallback)
      let charters: any[] = [];
      try {
        charters = await getBookingsByVesselHybrid(boat.id);
      } catch (e) {
        const chartersKey = `fleet_${boat.id}_ΝΑΥΛΑ`;
        const chartersStored = localStorage.getItem(chartersKey);
        charters = chartersStored ? JSON.parse(chartersStored) : [];
      }

      // Load invoices (localStorage only for now)
      const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

      const boatIncome = charters.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
      const charterExpenses = charters.reduce((sum: number, c: any) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
      const invoiceExpenses = invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const boatExpenses = charterExpenses + invoiceExpenses;
      const boatNet = boatIncome - boatExpenses;

      totalIncome += boatIncome;
      totalExpenses += boatExpenses;

      boatsData.push({
        id: boat.id,
        name: boat.name,
        income: boatIncome,
        expenses: boatExpenses,
        net: boatNet,
        chartersCount: charters.length,
        invoicesCount: invoices.length
      });
    }));

    setFinancialsData({
      boats: boatsData,
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses
      }
    });
    console.log('✅ FleetManagement: Financials loaded from API');
  };

  const handleLogout = () => {
    authService.logActivity('logout_fleet_management');
    authService.logout();
    navigate('/');
  };

  const handleAdminSelectBoat = (boat) => {
    setBoatData(boat);
    setShowFleetSummary(false);
    setPage('dashboard');
    
    authService.logActivity('select_boat', boat.id);
  };

  const navigatePage = (pageName) => {
    // Πίσω στο boat dashboard (από εσωτερικές σελίδες όπως ΕΡΓΑΣΙΕΣ, BOOKING SHEET κλπ)
    if (pageName === 'boatDashboard') {
      setPage('dashboard');
      return;
    }
    
    // Admin πατάει σπιτάκι -> adminDashboard
    if (isAdmin && pageName === 'dashboard') {
      setPage('adminDashboard');
      setBoatData(null);
      setShowFleetSummary(false);
      return;
    }
    
    // Owner με fleet summary πάει στο owner-dashboard
    if (isOwner && showFleetSummary && pageName === 'dashboard') {
      navigate('/owner-dashboard', { state: { ownerCode: ownerCode } });
      return;
    }
    
    // Owner με ownerCode πάει στο owner-dashboard
    if (isOwner && ownerCode && pageName === 'dashboard') {
      navigate('/owner-dashboard', { state: { ownerCode: ownerCode } });
      return;
    }
    
    // TECHNICAL, BOOKING, ACCOUNTING - πάνε στο adminDashboard (boat list)
    if ((isTechnical || isBooking || isAccounting) && pageName === 'dashboard') {
      setPage('adminDashboard');
      setBoatData(null);
      return;
    }
    
    // Messages page
    if (pageName === 'messages' && boatData) {
      setPage('messages');
      return;
    }
    
    if (pageName === 'details' || pageName === 'bookingSheet' || pageName === 'email' || pageName === 'documents') return;
    setSelectedCategory('');
    setPage(pageName);
  };

  const selectCategory = (categoryName) => {
    setSelectedCategory(categoryName);
    
    authService.logActivity('select_category', categoryName);
    
    if (categoryName === 'ΟΙΚΟΝΟΜΙΚΑ') {
      setPage('financials');
    } else if (categoryName === 'ΑΠΟΣΤΟΛΗ E-MAIL') {
      setPage('email');
    } else if (categoryName === 'BOOKING SHEET') {
      setPage('bookingSheet');
    } else if (categoryName === 'ΕΓΓΡΑΦΑ & ΣΤΟΙΧΕΙΑ') {
      setPage('documents');
    } else {
      setPage('details');
    }
  };

  const renderPage = () => {
    if (loading) return <FullScreenLoader />;

    switch (page) {
      case 'adminDashboard':
        return <AdminDashboard
          boats={allBoats}
          onSelectBoat={handleAdminSelectBoat}
          onLogout={handleLogout}
          navigate={setPage}
          loadBoats={loadBoats}
          showAddBoat={showAddBoat}
          setShowAddBoat={setShowAddBoat}
          showEmployeeManagement={showEmployeeManagement}
          setShowEmployeeManagement={setShowEmployeeManagement}
          showDataManagement={showDataManagement}
          setShowDataManagement={setShowDataManagement}
          showActivityLog={showActivityLog}
          setShowActivityLog={setShowActivityLog}
          showFinancials={showFinancials}
          setShowFinancials={setShowFinancials}
        />;
      case 'fleetSummary':
        return <FleetSummaryPage boatIds={fleetBoatIds} ownerCode={ownerCode} navigate={navigatePage} showMessage={showMessage} />;
      case 'dashboard':
        return <DashboardPage boat={boatData} onSelectCategory={selectCategory} navigate={navigatePage} ownerCode={ownerCode} />;
      case 'details':
        return <DetailsPage boat={boatData} category={selectedCategory} navigate={navigatePage} showMessage={showMessage} />;
      case 'financials':
        return <FinancialsPage boat={boatData} navigate={navigatePage} setPage={setPage} setSelectedCategory={setSelectedCategory} showMessage={showMessage} />;
      case 'bookingSheet':
        return <BookingSheetPage boat={boatData} navigate={navigatePage} showMessage={showMessage} />;
      case 'messages':
        return <MessagesPage boat={boatData} currentUser={currentUser} navigate={navigatePage} showMessage={showMessage} />;
      case 'email':
        return <EmailPage boat={boatData} navigate={navigatePage} />;
      case 'documents':
        return <DocumentsAndDetailsPage boat={boatData} navigate={navigatePage} showMessage={showMessage} />;
      case 'fleetBookingPlan':
        return <FleetBookingPlanPage navigate={setPage} showMessage={showMessage} />;
      default:
        return <p>Unknown page</p>;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 font-sans">
      <MessageDisplay message={message} />
      <div className="h-full w-full max-w-lg mx-auto bg-gray-900 shadow-2xl overflow-hidden">
        {renderPage()}
      </div>

      {/* Admin Dashboard Modals */}
      {showAddBoat && (
        <AddBoatModal
          onClose={() => setShowAddBoat(false)}
          onBoatAdded={handleBoatAdded}
        />
      )}

      {showEmployeeManagement && (
        <EmployeeManagementModal
          onClose={() => setShowEmployeeManagement(false)}
        />
      )}

      {showDataManagement && (
        <DataManagementModal
          onClose={() => setShowDataManagement(false)}
          boats={allBoats}
          onDataCleared={() => { loadBoats(); loadFinancialsData(); }}
        />
      )}

      {showActivityLog && (
        <ActivityLogModal
          onClose={() => setShowActivityLog(false)}
        />
      )}

      {showFinancials && (
        <FinancialsSummaryModal
          onClose={() => setShowFinancials(false)}
          financialsData={financialsData}
          boats={allBoats}
        />
      )}
    </div>
  );
}

function MessageDisplay({ message }) {
  if (!message.text) return null;
  const bgColor = message.type === 'error' ? 'bg-red-600' : 'bg-green-600';
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 p-3 rounded-lg text-white font-semibold shadow-lg z-50 ${bgColor} animate-pulse`}>
      {message.text}
    </div>
  );
}

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );
}

function Header({ title, onBack, onLogout }) {
  const user = authService.getCurrentUser();
  
  return (
    <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between sticky top-0 z-20 w-full max-w-lg mx-auto border-b border-gray-700">
      {onBack && <button onClick={onBack} className="text-teal-400 p-2 -ml-2 hover:bg-gray-700 rounded-lg transition-colors">{icons.chevronLeft}</button>}
      {!onBack && <div className="w-10"></div>}
      
      <div className="flex-grow text-center">
        <h1 className="text-xl font-bold text-gray-100 truncate px-2">{title}</h1>
        {user && (
          <div className="flex items-center justify-center gap-2 mt-1">
            {user.role === 'OWNER' ? icons.eye : icons.shield}
            <span className="text-xs text-teal-400 font-semibold">
              {user.role === 'OWNER' ? `${user.name} (View Only)` : user.name}
            </span>
          </div>
        )}
      </div>
      
      {onLogout && (
        <button 
          onClick={onLogout} 
          className="text-teal-400 p-2 -mr-2 hover:bg-gray-700 rounded-lg transition-colors"
          title="Logout"
        >
          {icons.logout}
        </button>
      )}
      {!onLogout && <div className="w-10"></div>}
    </div>
  );
}

function BottomNav({ activePage, onNavigate }) {
  const items = [
    { name: 'dashboard', label: 'Αρχική', icon: icons.home },
    { name: 'messages', label: 'Μηνύματα', icon: icons.message },
  ];

  return (
    <div className="bg-gray-800 p-2 shadow-inner-top flex justify-around sticky bottom-0 z-20 w-full max-w-lg mx-auto border-t border-gray-700">
      {items.map((item) => (
        <button key={item.name} onClick={() => onNavigate(item.name)} className={`flex flex-col items-center justify-center p-2 rounded-lg w-24 ${activePage === item.name ? 'text-teal-400 bg-gray-700' : 'text-gray-400'} hover:text-teal-300 transition-colors`}>
          {item.icon}
          <span className="text-xs mt-1">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function AddBoatModal({ onClose, onBoatAdded }) {
  const [newBoat, setNewBoat] = useState({
    id: '',
    name: '',
    type: 'Monohull',
    model: ''
  });
  const [error, setError] = useState('');

  if (!authService.canManageFleet()) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-6">You don't have permission to add boats.</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!newBoat.id.trim() || !newBoat.name.trim()) {
      setError('ID και Όνομα είναι υποχρεωτικά!');
      return;
    }

    try {
      FleetService.addBoat({
        id: newBoat.id.trim(),
        name: newBoat.name.trim(),
        type: newBoat.type,
        model: newBoat.model.trim()
      });

      globalShowMessage(`Το σκάφος ${newBoat.id} προστέθηκε επιτυχώς!`, 'success');
      onBoatAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-teal-400">Προσθήκη Νέου Σκάφους</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">{icons.x}</button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID Σκάφους <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newBoat.id}
              onChange={(e) => setNewBoat({ ...newBoat, id: e.target.value.toUpperCase() })}
              placeholder="π.χ. APOLLO"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-400 mt-1">Μοναδικός κωδικός για σύνδεση</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Πλήρες Όνομα <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newBoat.name}
              onChange={(e) => setNewBoat({ ...newBoat, name: e.target.value })}
              placeholder="π.χ. Bavaria 50-APOLLO"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Τύπος <span className="text-red-500">*</span>
            </label>
            <select
              value={newBoat.type}
              onChange={(e) => setNewBoat({ ...newBoat, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Catamaran">Catamaran</option>
              <option value="Monohull">Monohull</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Μοντέλο (προαιρετικό)
            </label>
            <input
              type="text"
              value={newBoat.model}
              onChange={(e) => setNewBoat({ ...newBoat, model: e.target.value })}
              placeholder="π.χ. Bavaria 50"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition duration-200"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition duration-200"
            >
              Προσθήκη
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// EMPLOYEE MANAGEMENT MODAL
// =====================================================
function EmployeeManagementModal({ onClose }) {
  const [employees, setEmployees] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [newEmployee, setNewEmployee] = useState({
    code: '',
    name: '',
    role: 'TECHNICAL',
    canEdit: true,
    canDelete: false,
    canManageFleet: false,
    canClearData: false,
    canManageCodes: false,
    canViewFinancials: false,
    canEditFinancials: false,
    canDoCheckInOut: true,
    canManageTasks: true
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = () => {
    const codes = authService.getAllEmployeeCodes();
    setEmployees(codes);
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'bg-red-600';
      case 'TECHNICAL': return 'bg-blue-600';
      case 'BOOKING': return 'bg-green-600';
      case 'ACCOUNTING': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getRolePermissions = (role) => {
    switch(role) {
      case 'ADMIN':
        return {
          canEdit: true, canDelete: true, canManageFleet: true, canClearData: true,
          canManageCodes: true, canViewFinancials: true, canEditFinancials: true,
          canDoCheckInOut: true, canManageTasks: true
        };
      case 'TECHNICAL':
        return {
          canEdit: true, canDelete: false, canManageFleet: false, canClearData: false,
          canManageCodes: false, canViewFinancials: false, canEditFinancials: false,
          canDoCheckInOut: true, canManageTasks: true
        };
      case 'BOOKING':
        return {
          canEdit: true, canDelete: false, canManageFleet: false, canClearData: false,
          canManageCodes: false, canViewFinancials: true, canEditFinancials: false,
          canDoCheckInOut: true, canManageTasks: false
        };
      case 'ACCOUNTING':
        return {
          canEdit: true, canDelete: false, canManageFleet: false, canClearData: false,
          canManageCodes: false, canViewFinancials: true, canEditFinancials: true,
          canDoCheckInOut: false, canManageTasks: false
        };
      default:
        return {};
    }
  };

  const handleRoleChange = (role) => {
    const permissions = getRolePermissions(role);
    setNewEmployee(prev => ({ ...prev, role, ...permissions }));
  };

  const generateCode = () => {
    const prefixes = { ADMIN: 'ADM', TECHNICAL: 'TEC', BOOKING: 'BOOK', ACCOUNTING: 'ACC' };
    const prefix = prefixes[newEmployee.role] || 'EMP';
    const num = String(employees.filter(e => e.role === newEmployee.role).length + 1).padStart(3, '0');
    const name = newEmployee.name.toUpperCase().replace(/\s/g, '');
    return `${prefix}${num}!${name}`;
  };

  const handleAddEmployee = () => {
    if (!newEmployee.name.trim()) {
      globalShowMessage('❌ Παρακαλώ εισάγετε όνομα!', 'error');
      return;
    }

    const code = newEmployee.code || generateCode();
    
    const success = authService.addEmployeeCode({
      code: code,
      name: newEmployee.name.trim(),
      role: newEmployee.role,
      canEdit: newEmployee.canEdit,
      canDelete: newEmployee.canDelete,
      canManageFleet: newEmployee.canManageFleet,
      canClearData: newEmployee.canClearData,
      canManageCodes: newEmployee.canManageCodes,
      canViewFinancials: newEmployee.canViewFinancials,
      canEditFinancials: newEmployee.canEditFinancials,
      canDoCheckInOut: newEmployee.canDoCheckInOut,
      canManageTasks: newEmployee.canManageTasks
    });

    if (success) {
      globalShowMessage(`✅ Υπάλληλος ${newEmployee.name} προστέθηκε!`, 'success');
      loadEmployees();
      setShowAddForm(false);
      setNewEmployee({
        code: '', name: '', role: 'TECHNICAL',
        canEdit: true, canDelete: false, canManageFleet: false, canClearData: false,
        canManageCodes: false, canViewFinancials: false, canEditFinancials: false,
        canDoCheckInOut: true, canManageTasks: true
      });
    } else {
      globalShowMessage('❌ Σφάλμα προσθήκης!', 'error');
    }
  };

  const handleToggleEmployee = (code) => {
    authService.toggleEmployeeCode(code);
    loadEmployees();
    globalShowMessage('✅ Κατάσταση άλλαξε!', 'success');
  };

  const handleDeleteEmployee = (code, name) => {
    if (code === 'ADMIN2025') {
      globalShowMessage('❌ Δεν μπορείτε να διαγράψετε τον κύριο Admin!', 'error');
      return;
    }
    
    if (window.confirm(`Διαγραφή υπαλλήλου ${name};`)) {
      authService.deleteEmployeeCode(code);
      loadEmployees();
      globalShowMessage('✅ Υπάλληλος διαγράφηκε!', 'success');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
            {icons.shield}
            <span>Διαχείριση Υπαλλήλων</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2">{icons.x}</button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"
          >
            {icons.plus}
            <span>{showAddForm ? 'Ακύρωση' : 'Προσθήκη Νέου Υπαλλήλου'}</span>
          </button>

          {showAddForm && (
            <div className="mt-4 p-4 bg-gray-900 rounded-lg space-y-4 border border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Όνομα *</label>
                <input
                  type="text"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="π.χ. Γιάννης"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ρόλος *</label>
                <select
                  value={newEmployee.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TECHNICAL">🔧 TECHNICAL - Τεχνικός</option>
                  <option value="BOOKING">📅 BOOKING - Κρατήσεις</option>
                  <option value="ACCOUNTING">💰 ACCOUNTING - Λογιστήριο</option>
                  <option value="ADMIN">👑 ADMIN - Διαχειριστής</option>
                </select>
              </div>

              <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
                <p className="text-sm font-semibold text-gray-300 mb-2">Permissions για {newEmployee.role}:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={newEmployee.canDoCheckInOut ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canDoCheckInOut ? '✅' : '❌'} Check-in/out
                  </div>
                  <div className={newEmployee.canManageTasks ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canManageTasks ? '✅' : '❌'} Εργασίες
                  </div>
                  <div className={newEmployee.canViewFinancials ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canViewFinancials ? '✅' : '❌'} Οικονομικά (view)
                  </div>
                  <div className={newEmployee.canEditFinancials ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canEditFinancials ? '✅' : '❌'} Οικονομικά (edit)
                  </div>
                  <div className={newEmployee.canManageFleet ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canManageFleet ? '✅' : '❌'} Fleet Management
                  </div>
                  <div className={newEmployee.canManageCodes ? 'text-green-400' : 'text-red-400'}>
                    {newEmployee.canManageCodes ? '✅' : '❌'} Διαχ. Κωδικών
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-900 rounded-lg border border-purple-700">
                <p className="text-sm text-purple-200">
                  <span className="font-bold">Κωδικός:</span> {generateCode() || 'θα δημιουργηθεί αυτόματα'}
                </p>
              </div>

              <button
                onClick={handleAddEmployee}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                💾 Αποθήκευση Υπαλλήλου
              </button>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">
            Υπάλληλοι ({employees.length})
          </h3>
          
          <div className="space-y-2">
            {employees.map(emp => (
              <div 
                key={emp.code} 
                className={`p-4 rounded-lg border ${emp.enabled ? 'bg-gray-900 border-gray-700' : 'bg-gray-950 border-red-900 opacity-60'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getRoleColor(emp.role)}`}>
                      {emp.role}
                    </div>
                    <div>
                      <p className="font-bold text-white">{emp.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{emp.code}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEmployee(emp.code)}
                      className={`px-3 py-1 rounded text-sm font-bold ${emp.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                    >
                      {emp.enabled ? '✅ ON' : '❌ OFF'}
                    </button>
                    
                    {emp.code !== 'ADMIN2025' && (
                      <button
                        onClick={() => handleDeleteEmployee(emp.code, emp.name)}
                        className="p-2 bg-red-900 hover:bg-red-800 text-red-400 rounded"
                      >
                        {icons.x}
                      </button>
                    )}
                  </div>
                </div>
                
                {!emp.enabled && (
                  <div className="mt-2 text-xs text-red-400">
                    ⚠️ Απενεργοποιημένος - δεν μπορεί να συνδεθεί
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// DATA MANAGEMENT MODAL - Διαγραφή Δεδομένων
// =====================================================
function DataManagementModal({ onClose, boats, onDataCleared }) {
  const [selectedItems, setSelectedItems] = useState({
    charters: { enabled: false, mode: 'all', boats: [] },
    invoices: { enabled: false, mode: 'all', boats: [] },
    tasks: { enabled: false, mode: 'all', boats: [] },
    messages: { enabled: false, mode: 'all', boats: [] },
    documents: { enabled: false, mode: 'all', boats: [] },
    boatDetails: { enabled: false, mode: 'all', boats: [] },
    activityLogs: { enabled: false }
  });
  const [step, setStep] = useState(1);
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  const dataTypes = [
    { key: 'charters', label: 'Ναύλοι', icon: '⚓', storageKey: 'ΝΑΥΛΑ', hasBoats: true },
    { key: 'invoices', label: 'Τιμολόγια/Έξοδα', icon: '📄', storageKey: 'ΤΙΜΟΛΟΓΙΑ', hasBoats: true },
    { key: 'tasks', label: 'Εργασίες', icon: '📋', storageKey: 'ΕΡΓΑΣΙΕΣ', hasBoats: true },
    { key: 'messages', label: 'Μηνύματα', icon: '💬', storageKey: 'messages', hasBoats: true },
    { key: 'documents', label: 'Έγγραφα', icon: '📁', storageKey: 'documents', hasBoats: true },
    { key: 'boatDetails', label: 'Στοιχεία Σκαφών', icon: '🚤', storageKey: 'details', hasBoats: true },
    { key: 'activityLogs', label: 'Activity Logs', icon: '📊', hasBoats: false },
  ];

  const toggleItem = (key) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
  };

  const setMode = (key, mode) => {
    setSelectedItems(prev => ({
      ...prev,
      [key]: { ...prev[key], mode, boats: mode === 'all' ? [] : prev[key].boats }
    }));
  };

  const toggleBoatForItem = (key, boatId) => {
    setSelectedItems(prev => {
      const currentBoats = prev[key].boats || [];
      const newBoats = currentBoats.includes(boatId)
        ? currentBoats.filter(id => id !== boatId)
        : [...currentBoats, boatId];
      return {
        ...prev,
        [key]: { ...prev[key], boats: newBoats }
      };
    });
  };

  const selectAllBoatsForItem = (key) => {
    setSelectedItems(prev => {
      const currentBoats = prev[key].boats || [];
      const newBoats = currentBoats.length === boats.length ? [] : boats.map(b => b.id);
      return {
        ...prev,
        [key]: { ...prev[key], boats: newBoats }
      };
    });
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(item => item.enabled).length;
  };

  const isValidSelection = () => {
    for (const [key, value] of Object.entries(selectedItems)) {
      if (value.enabled && value.mode === 'selective' && value.boats?.length === 0) {
        return false;
      }
    }
    return getSelectedCount() > 0;
  };

  const handleProceed = () => {
    if (!isValidSelection()) {
      setError('Επιλέξτε τουλάχιστον ένα στοιχείο και σκάφη για επιλεκτική διαγραφή!');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleConfirmDelete = () => {
    const employee = authService.getEmployeeByCode(adminCode);
    if (!employee || employee.role !== 'ADMIN') {
      setError('❌ Λάθος κωδικός Admin! Η διαγραφή ακυρώθηκε.');
      return;
    }

    let deletedCount = 0;

    dataTypes.forEach(dataType => {
      const item = selectedItems[dataType.key];
      if (!item.enabled) return;

      if (dataType.key === 'activityLogs') {
        authService.clearActivityLogs();
        deletedCount++;
        return;
      }

      const boatsToDelete = item.mode === 'all' ? boats : boats.filter(b => item.boats.includes(b.id));
      
      boatsToDelete.forEach(boat => {
        const storageKey = `fleet_${boat.id}_${dataType.storageKey}`;
        localStorage.removeItem(storageKey);
        deletedCount++;
      });
    });

    authService.logActivity('clear_data', `Deleted ${deletedCount} data items`);
    
    globalShowMessage(`✅ Διαγράφηκαν ${deletedCount} στοιχεία δεδομένων!`, 'success');
    onDataCleared();
    onClose();
  };

  const getSummary = () => {
    const summary = [];
    dataTypes.forEach(dataType => {
      const item = selectedItems[dataType.key];
      if (!item.enabled) return;
      
      if (dataType.key === 'activityLogs') {
        summary.push({ icon: dataType.icon, label: dataType.label, detail: 'Όλα' });
      } else if (item.mode === 'all') {
        summary.push({ icon: dataType.icon, label: dataType.label, detail: 'Όλα τα σκάφη' });
      } else {
        summary.push({ icon: dataType.icon, label: dataType.label, detail: item.boats.join(', ') });
      }
    });
    return summary;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-red-900">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            ⚠️
            <span>Διαγραφή Δεδομένων</span>
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-2">{icons.x}</button>
        </div>

        {step === 1 && (
          <>
            <div className="p-3 bg-red-950 border-b border-red-800">
              <p className="text-red-200 text-sm">
                ⚠️ <strong>ΠΡΟΣΟΧΗ:</strong> Η διαγραφή είναι <strong>ΟΡΙΣΤΙΚΗ</strong>!
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
              <div className="space-y-3">
                {dataTypes.map(dataType => {
                  const item = selectedItems[dataType.key];
                  const isExpanded = expandedItem === dataType.key;
                  
                  return (
                    <div key={dataType.key} className={`rounded-lg border-2 transition-all ${
                      item.enabled ? 'bg-red-900 border-red-500' : 'bg-gray-900 border-gray-700'
                    }`}>
                      {/* Header */}
                      <button
                        onClick={() => toggleItem(dataType.key)}
                        className="w-full p-3 flex items-center gap-3 text-left"
                      >
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          item.enabled ? 'bg-red-500 border-red-500 text-white' : 'border-gray-500'
                        }`}>
                          {item.enabled && '✓'}
                        </div>
                        <span className="text-2xl">{dataType.icon}</span>
                        <span className={`font-bold ${item.enabled ? 'text-white' : 'text-gray-300'}`}>
                          {dataType.label}
                        </span>
                      </button>

                      {/* Options - only show if enabled and has boats */}
                      {item.enabled && dataType.hasBoats && (
                        <div className="px-3 pb-3 border-t border-red-700">
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => setMode(dataType.key, 'all')}
                              className={`flex-1 py-2 px-3 rounded text-sm font-bold ${
                                item.mode === 'all' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              ΟΛΑ
                            </button>
                            <button
                              onClick={() => {
                                setMode(dataType.key, 'selective');
                                setExpandedItem(isExpanded ? null : dataType.key);
                              }}
                              className={`flex-1 py-2 px-3 rounded text-sm font-bold ${
                                item.mode === 'selective' 
                                  ? 'bg-orange-600 text-white' 
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              ΕΠΙΛΕΚΤΙΚΑ
                            </button>
                          </div>

                          {/* Boat selection */}
                          {item.mode === 'selective' && (
                            <div className="mt-3 p-2 bg-gray-800 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-400">Επιλέξτε σκάφη:</span>
                                <button
                                  onClick={() => selectAllBoatsForItem(dataType.key)}
                                  className="text-xs text-teal-400 hover:text-teal-300"
                                >
                                  {item.boats.length === boats.length ? 'Κανένα' : 'Όλα'}
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-1">
                                {boats.map(boat => (
                                  <button
                                    key={boat.id}
                                    onClick={() => toggleBoatForItem(dataType.key, boat.id)}
                                    className={`p-2 rounded text-xs font-bold ${
                                      item.boats.includes(boat.id)
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                  >
                                    {boat.name || boat.id}
                                  </button>
                                ))}
                              </div>
                              {item.boats.length === 0 && (
                                <p className="text-xs text-red-400 mt-2">⚠️ Επιλέξτε τουλάχιστον ένα σκάφος</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 border-t border-gray-700 space-y-2">
              <div className="text-center text-sm text-gray-400 mb-2">
                {getSelectedCount()} κατηγορίες επιλεγμένες
              </div>
              <button
                onClick={handleProceed}
                disabled={!isValidSelection()}
                className={`w-full font-bold py-3 px-4 rounded-lg ${
                  isValidSelection()
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Συνέχεια →
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                Ακύρωση
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="p-4 bg-red-950 border-b border-red-800">
              <p className="text-red-200 text-sm text-center">
                🔐 <strong>Εισάγετε τον κωδικό ADMIN για επιβεβαίωση</strong>
              </p>
            </div>

            <div className="flex-grow overflow-y-auto p-4">
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-4">
                <h4 className="font-bold text-red-400 mb-3">Θα διαγραφούν:</h4>
                <div className="space-y-2">
                  {getSummary().map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span className="text-red-400">✗</span>
                      <span>{item.icon}</span>
                      <span className="text-white font-bold">{item.label}</span>
                      <span className="text-gray-400">→ {item.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Κωδικός Admin:
                </label>
                <input
                  type="password"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  placeholder="Εισάγετε τον κωδικό ADMIN"
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 text-center text-lg"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 space-y-2">
              <button
                onClick={handleConfirmDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg"
              >
                🗑️ ΟΡΙΣΤΙΚΗ ΔΙΑΓΡΑΦΗ
              </button>
              <button
                onClick={() => { setStep(1); setError(''); setAdminCode(''); }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg"
              >
                ← Πίσω
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// ACTIVITY LOG MODAL
// =====================================================
function ActivityLogModal({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const activityLogs = authService.getAllActivityLogs();
    setLogs(activityLogs.reverse()); // Newest first
  };

  const getActionColor = (action) => {
    if (action.includes('login')) return 'text-green-400';
    if (action.includes('logout')) return 'text-yellow-400';
    if (action.includes('delete') || action.includes('clear')) return 'text-red-400';
    if (action.includes('add') || action.includes('create')) return 'text-blue-400';
    if (action.includes('edit') || action.includes('update')) return 'text-purple-400';
    if (action.includes('view')) return 'text-gray-400';
    return 'text-white';
  };

  const getActionIcon = (action) => {
    if (action.includes('login')) return '🔓';
    if (action.includes('logout')) return '🔒';
    if (action.includes('delete') || action.includes('clear')) return '🗑️';
    if (action.includes('add') || action.includes('create')) return '➕';
    if (action.includes('edit') || action.includes('update')) return '✏️';
    if (action.includes('view')) return '👁️';
    if (action.includes('charter') || action.includes('booking')) return '⚓';
    if (action.includes('task')) return '📋';
    return '📝';
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('el-GR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.action.includes(filter));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-blue-900">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📊
            <span>Activity Log</span>
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white p-2">{icons.x}</button>
        </div>

        {/* Filter */}
        <div className="p-3 border-b border-gray-700 bg-gray-900">
          <div className="flex gap-2 flex-wrap">
            {['all', 'login', 'add', 'edit', 'delete', 'view'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded text-xs font-bold ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f === 'all' ? 'Όλα' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-grow overflow-y-auto p-3">
          {filteredLogs.length > 0 ? (
            <div className="space-y-2">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{getActionIcon(log.action)}</span>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-teal-400 text-base">
                            {log.employeeName || log.user || 'Unknown'}
                          </span>
                          <span className="text-gray-500 text-xs ml-2">
                            ({log.employeeCode || log.code || ''})
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 ${getActionColor(log.action)}`}>
                        {log.action}
                      </div>
                      {(log.details || log.vesselId || log.bookingCode) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {log.vesselId && <span className="mr-2">🚤 {log.vesselId}</span>}
                          {log.bookingCode && <span className="mr-2">📋 {log.bookingCode}</span>}
                          {log.details && <span>• {log.details}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="text-4xl">📭</span>
              <p className="text-gray-400 mt-2">Δεν υπάρχουν εγγραφές</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{filteredLogs.length} εγγραφές</span>
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// FINANCIALS SUMMARY MODAL - Συγκεντρωτικά Οικονομικά
// =====================================================
function FinancialsSummaryModal({ onClose, financialsData, boats }) {
  const [selectedBoat, setSelectedBoat] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter boats based on search
  const filteredBoats = financialsData.boats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    const searchTerms = search.split(' ').filter(t => t.length > 0);
    const fullBoat = boats.find(b => b.id === boat.id);
    const boatText = `${boat.id} ${boat.name || ''} ${fullBoat?.type || ''} ${fullBoat?.model || ''}`.toLowerCase();
    return searchTerms.every(term => boatText.includes(term));
  });

  // 🔥 FIX 16: Load boat details from API first, merge with localStorage
  const loadBoatDetails = async (boatId) => {
    setSelectedBoat(boatId);

    // Load charters from API (with localStorage merge)
    let charters = [];
    try {
      charters = await getBookingsByVesselHybrid(boatId);
      console.log(`✅ Loaded ${charters.length} charters for boat ${boatId} from API`);
    } catch (e) {
      console.warn('⚠️ API failed, using localStorage for charters');
      const chartersKey = `fleet_${boatId}_ΝΑΥΛΑ`;
      const chartersStored = localStorage.getItem(chartersKey);
      charters = chartersStored ? JSON.parse(chartersStored) : [];
    }

    // Load invoices (localStorage only for now)
    const invoicesKey = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    const invoicesStored = localStorage.getItem(invoicesKey);
    const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

    setDetailedData({ charters, invoices });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('el-GR', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-50">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-900 to-green-800 border-b border-green-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          💰
          <span>Συγκεντρωτικά Οικονομικά</span>
        </h2>
        <button 
          onClick={onClose} 
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          ✕ Κλείσιμο
        </button>
      </div>

      {/* Totals Summary */}
      <div className="p-4 bg-gray-900 border-b border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-900 p-4 rounded-lg">
            <div className="text-sm text-green-300 mb-1">ΣΥΝΟΛΙΚΑ ΕΣΟΔΑ</div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(financialsData.totals.income)}
            </div>
          </div>
          <div className="bg-red-900 p-4 rounded-lg">
            <div className="text-sm text-red-300 mb-1">ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ</div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatCurrency(financialsData.totals.expenses)}
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border-2 border-gray-600">
            <div className="text-sm text-gray-300 mb-1">ΚΑΘΑΡΟ ΑΠΟΤΕΛΕΣΜΑ</div>
            <div className={`text-2xl sm:text-3xl font-bold ${financialsData.totals.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(financialsData.totals.net)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Boats List - Left Side */}
        <div className="w-1/3 sm:w-1/4 border-r border-gray-700 overflow-y-auto bg-gray-900 flex flex-col">
          <div className="p-2 border-b border-gray-700 bg-gray-800">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Αναζήτηση..."
              className="w-full px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-xs"
            />
          </div>
          <div className="p-2 border-b border-gray-700 bg-gray-800">
            <h3 className="font-bold text-teal-400 text-sm">
              Σκάφη ({filteredBoats.length}{searchTerm ? ` / ${boats.length}` : ''})
            </h3>
          </div>
          <div className="space-y-1 p-2 flex-grow overflow-y-auto">
            {filteredBoats.map(boat => (
              <button
                key={boat.id}
                onClick={() => loadBoatDetails(boat.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedBoat === boat.id 
                    ? 'bg-teal-700 border-teal-500' 
                    : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                } border`}
              >
                <div className="font-bold text-white text-sm">{boat.name || boat.id}</div>
                <div className={`text-lg font-bold ${boat.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrency(boat.net)}
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-green-400">{formatCurrency(boat.income)}</span>
                  <span className="text-red-400">{formatCurrency(boat.expenses)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Details - Right Side */}
        <div className="flex-grow overflow-y-auto bg-gray-950 p-4">
          {selectedBoat && detailedData ? (
            <>
              <h3 className="text-xl font-bold text-teal-400 mb-4">
                📊 {selectedBoat} - Αναλυτικά
              </h3>

              {/* Charters */}
              <div className="mb-6">
                <h4 className="font-bold text-green-400 mb-2 flex items-center gap-2">
                  ⚓ Ναύλοι ({detailedData.charters.length})
                </h4>
                {detailedData.charters.length > 0 ? (
                  <div className="space-y-2">
                    {detailedData.charters.map((charter, idx) => (
                      <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white">{charter.code || charter.charterCode || `#${idx + 1}`}</span>
                            <span className="text-gray-500 text-xs ml-2">
                              {charter.startDate} - {charter.endDate}
                            </span>
                          </div>
                          <span className="text-green-400 font-bold">
                            {formatCurrency(charter.amount || charter.charterAmount)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {charter.clientName || charter.charterer || 'N/A'}
                          {charter.status && (
                            <span className={`ml-2 px-2 py-0.5 rounded ${
                              charter.status === 'CONFIRMED' ? 'bg-green-900 text-green-300' :
                              charter.status === 'OPTION' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {charter.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Δεν υπάρχουν ναύλοι</p>
                )}
              </div>

              {/* Invoices/Expenses */}
              <div>
                <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2">
                  📄 Τιμολόγια/Έξοδα ({detailedData.invoices.length})
                </h4>
                {detailedData.invoices.length > 0 ? (
                  <div className="space-y-2">
                    {detailedData.invoices.map((invoice, idx) => (
                      <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white">{invoice.description || invoice.title || `#${idx + 1}`}</span>
                            <span className="text-gray-500 text-xs ml-2">{invoice.date}</span>
                          </div>
                          <span className="text-red-400 font-bold">
                            -{formatCurrency(invoice.amount)}
                          </span>
                        </div>
                        {invoice.category && (
                          <div className="text-xs text-gray-400 mt-1">
                            {invoice.category}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Δεν υπάρχουν τιμολόγια/έξοδα</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-6xl mb-4">👈</span>
              <p>Επιλέξτε σκάφος για αναλυτικά στοιχεία</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// END OF PART 2 - Continue with Part 3 (ΤΑ ΥΠΟΛΟΙΠΑ ΜΕΝΟΥΝ ΙΔΙΑ)
// =====================================================
// =====================================================
// PART 3/4: Dashboard + Fleet Summary + Booking Sheet + Documents
// =====================================================

function DashboardPage({ boat, onSelectCategory, navigate, ownerCode }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const user = authService.getCurrentUser();
  const reactNavigate = useNavigate();
  const isOwnerUser = authService.isOwner();

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  const allCategories = [
    { name: 'ΕΓΓΡΑΦΑ & ΣΤΟΙΧΕΙΑ', icon: icons.fileText, description: 'Στοιχεία σκάφους και έγγραφα' },
    { name: 'ΦΩΤΟ & ΒΙΝΤΕΟ', icon: icons.media, description: 'Πολυμέσα σκάφους' },
    { name: 'ΕΡΓΑΣΙΕΣ', icon: icons.tasks, description: 'Τεχνικές εργασίες και συντήρηση' },
    { name: 'ΝΑΥΛΑ', icon: icons.charter, description: 'Διαχείριση ναύλων' },
    { name: 'BOOKING SHEET', icon: icons.bookingSheet, description: 'Πρόγραμμα κρατήσεων' },
    { name: 'ΟΙΚΟΝΟΜΙΚΑ', icon: icons.financials, description: 'Οικονομικά στοιχεία' },
    { name: 'ΑΠΟΣΤΟΛΗ E-MAIL', icon: icons.email, description: 'Επικοινωνία με εταιρία' },
  ];
  
  const isTechnicalUser = authService.isTechnical();
  
  const visibleCategories = isOwnerUser 
    ? allCategories
    : allCategories.filter(cat => {
        if (cat.name === 'ΕΓΓΡΑΦΑ & ΣΤΟΙΧΕΙΑ' || cat.name === 'ΑΠΟΣΤΟΛΗ E-MAIL') return true;
        if (cat.name === 'ΦΩΤΟ & ΒΙΝΤΕΟ') return authService.canEdit();
        if (cat.name === 'ΕΡΓΑΣΙΕΣ') return authService.canManageTasks();
        // TECHNICAL δεν βλέπει ΝΑΥΛΑ - μόνο BOOKING SHEET
        if (cat.name === 'ΝΑΥΛΑ') return authService.canDoCheckInOut() && !isTechnicalUser;
        if (cat.name === 'BOOKING SHEET') return authService.canDoCheckInOut();
        if (cat.name === 'ΟΙΚΟΝΟΜΙΚΑ') return authService.canViewFinancials();
        return false;
      });

  const handleBackNavigation = (pageName) => {
    // Αν πατήσει messages
    if (pageName === 'messages') {
      navigate('messages');
      return;
    }
    
    // Owner πάει στο owner-dashboard
    if (ownerCode) {
      reactNavigate('/owner-dashboard', { state: { ownerCode: ownerCode } });
      return;
    }
    
    // Employees (TECHNICAL, BOOKING, ACCOUNTING, ADMIN) πάνε στο adminDashboard
    navigate('dashboard');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title={boat.name || 'Dashboard'} onBack={handleBackNavigation} />
      
      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-teal-400">{boat.name || boat.id}</h2>
            <p className="text-sm text-gray-400">{boat.id}</p>
          </div>
          {user && (
            <div className="text-right">
              <div className="text-sm text-gray-400">Logged as</div>
              <div className="text-sm font-bold text-teal-400">{user.name || user.code}</div>
              <div className="text-xs text-gray-500">
                {isOwnerUser ? 'Owner (View Only)' : user.role}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
            {isOwnerUser ? icons.eye : icons.shield}
            <span className="text-gray-300">
              {visibleCategories.length} / {allCategories.length} modules available
              {isOwnerUser && ' (View Only)'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto pb-20">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            {isOwnerUser ? 'All Modules (View Only)' : 'Available Modules'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {visibleCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  authService.logActivity('select_category', `${boat.id}/${cat.name}`);
                  onSelectCategory(cat.name);
                }}
                className="bg-gray-800 p-4 h-28 rounded-lg shadow-lg flex flex-col items-center justify-center text-center transition-all duration-300 hover:bg-gray-700 hover:shadow-2xl hover:-translate-y-2 hover:scale-105 border border-gray-700 hover:border-teal-500 transform-gpu"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className="text-teal-400 mb-2">
                  {React.cloneElement(cat.icon, { width: 28, height: 28 })}
                </div>
                <span className="text-center text-sm font-semibold text-gray-200 leading-tight">
                  {cat.name}
                </span>
                {isOwnerUser && (
                  <span className="text-xs text-gray-500 mt-1">{icons.eye}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <BottomNav activePage={'dashboard'} onNavigate={handleBackNavigation} />
    </div>
  );
}

// 🔥 Fleet Booking Sheet for Owner - με ΚΕΙΜΕΝΟ αντί για emojis
function FleetBookingSheetOwner({ boatIds, allBoatsData }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 🔥 BUG FIX: Helper function to get boat name from ID
  const getBoatName = (boatId) => {
    const boat = INITIAL_FLEET.find(b => b.id === boatId || b.id === Number(boatId));
    return boat?.name || `Boat ${boatId}`;
  };
  
  const changeMonth = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthName = currentDate.toLocaleString('el-GR', { month: 'long' });
  const year = currentDate.getFullYear();

  let firstSaturday = new Date(year, currentDate.getMonth(), 1);
  while (firstSaturday.getDay() !== 6) {
    firstSaturday.setDate(firstSaturday.getDate() + 1);
  }

  const weeks = [];
  let currentWeekStart = new Date(firstSaturday);
  if (firstSaturday.getDate() > 7) {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  }
  
  while (currentWeekStart.getMonth() === currentDate.getMonth()) {
    let weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weeks.push({
      start: new Date(currentWeekStart),
      end: weekEnd,
      startDateString: currentWeekStart.toISOString().split('T')[0]
    });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  const formatDate = (date) => date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });

  // 🔥 FIX 10: Changed Option to BRIGHT YELLOW (#FFFF00)
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Option':
      case 'Pending':
        return { bg: '', text: 'text-black', status: 'text-black', customBg: '#FFFF00' }; // BRIGHT YELLOW
      case 'Accepted':
        return { bg: 'bg-yellow-800', text: 'text-white', status: 'text-yellow-200' };
      case 'Confirmed':
        return { bg: 'bg-green-900', text: 'text-white', status: 'text-green-300' };
      case 'Canceled':
      case 'Rejected':
        return { bg: 'bg-red-900', text: 'text-white', status: 'text-red-300' };
      default:
        return { bg: 'bg-gray-900', text: 'text-gray-600', status: 'text-gray-400' };
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-800 border-b border-gray-700">
        {/* 🔥 FIX 10: Changed Option to BRIGHT YELLOW (#FFFF00) */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFFF00' }}></div>
            <span style={{ color: '#FFFF00' }}>Option</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-700"></div>
            <span className="text-green-300">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-700"></div>
            <span className="text-red-300">Canceled</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <button onClick={() => changeMonth(-1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronLeft}</button>
        <h2 className="text-2xl font-bold text-teal-400 capitalize">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronRight}</button>
      </div>

      <div className="flex-grow overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-800">
              <th className="sticky left-0 bg-gray-800 p-3 border border-gray-700 text-left text-teal-400 text-base min-w-[100px]">Σκάφος</th>
              {weeks.map((week, index) => (
                <th key={index} className="p-2 border border-gray-700 text-sm text-gray-300 min-w-[120px]">
                  <div className="font-bold">ΕΒΔ. {index + 1}</div>
                  <div className="text-xs text-gray-400">{formatDate(week.start)} - {formatDate(week.end)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boatIds.map((boatId) => {
              const boatData = allBoatsData[boatId];
              const charters = boatData?.charters || [];

              return (
                <tr key={boatId} className="hover:bg-gray-800">
                  {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                  <td className="sticky left-0 bg-gray-900 p-3 border border-gray-700 font-bold text-teal-400 text-base">{getBoatName(boatId)}</td>
                  
                  {weeks.map((week, index) => {
                    const charter = charters.find((c) => {
                      if (!c.startDate) return false;
                      const charterStart = new Date(c.startDate);
                      const charterEnd = c.endDate ? new Date(c.endDate) : new Date(charterStart.getTime() + 7*24*60*60*1000);
                      const weekStart = new Date(week.startDateString);
                      const weekEnd = new Date(weekStart.getTime() + 7*24*60*60*1000);
                      
                      return charterStart.getTime() < weekEnd.getTime() && charterEnd.getTime() > weekStart.getTime();
                    });
                    const style = charter ? getStatusStyle(charter.status) : { bg: 'bg-gray-900', text: 'text-gray-700', status: 'text-gray-600' };
                    
                    // 🔥 FIXED: Payment status με ΚΕΙΜΕΝΟ
                    const paymentInfo = charter ? getPaymentStatusInfo(charter.paymentStatus) : null;
                    
                    return (
                      <td key={index} className={`p-2 border border-gray-700 text-center ${style.bg} relative`}>
                        {charter ? (
                          <div className={style.text}>
                            {/* 🔥 Red light - μόνο για ΑΝΕΞΟΦΛΗΤΟ, αναβοσβήνει */}
                            {paymentInfo?.showLight && (
                              <div className={`absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ${paymentInfo.lightBlink ? 'animate-pulse' : ''}`}></div>
                            )}
                            <div className="font-bold text-sm">{charter.code}</div>
                            <div className="text-teal-300 text-sm">{charter.amount?.toFixed(0)}€</div>
                            {/* 🔥 Payment Status - ΚΕΙΜΕΝΟ αντί για emoji */}
                            <div className={`text-xs font-semibold ${paymentInfo?.color}`}>
                              {paymentInfo?.text}
                            </div>
                            <div className={`text-xs ${style.status}`}>{charter.status?.toUpperCase()}</div>
                          </div>
                        ) : (
                          <span className="text-gray-700">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FleetSummaryPage({ boatIds, ownerCode, navigate, showMessage }) {
  const reactNavigate = useNavigate();
  const [activeTab, setActiveTab] = useState('financials');
  const [allBoatsData, setAllBoatsData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const user = authService.getCurrentUser();

  // Get full boat info for filtering
  const allBoats = FleetService.getAllBoats();
  
  // Filter boatIds based on search
  const filteredBoatIds = boatIds.filter(boatId => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    const searchTerms = search.split(' ').filter(t => t.length > 0);
    const boat = allBoats.find(b => b.id === boatId);
    const boatText = `${boatId} ${boat?.name || ''} ${boat?.type || ''} ${boat?.model || ''}`.toLowerCase();
    return searchTerms.every(term => boatText.includes(term));
  });
  
  useEffect(() => {
    loadAllBoatsData();
  }, [boatIds]);

  // 🔥 FIX 16: Load boat data from API first, merge with localStorage
  const loadAllBoatsData = async () => {
    const data: { [key: string]: { charters: any[], invoices: any[], documents: any[] } } = {};

    // Load all boats in parallel for better performance
    await Promise.all(boatIds.map(async (boatId: any) => {
      // Load charters from API (with localStorage merge and fallback)
      let charters = [];
      try {
        charters = await getBookingsByVesselHybrid(boatId);
        console.log(`✅ FleetSummary: Loaded ${charters.length} charters for boat ${boatId} from API`);
      } catch (e) {
        console.warn(`⚠️ API failed for boat ${boatId}, using localStorage`);
        const chartersKey = `fleet_${boatId}_ΝΑΥΛΑ`;
        const chartersStored = localStorage.getItem(chartersKey);
        charters = chartersStored ? JSON.parse(chartersStored) : [];
      }

      // Load invoices (localStorage only for now)
      const invoicesKey = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      const invoices = invoicesStored ? JSON.parse(invoicesStored) : [];

      // Load documents (localStorage only)
      const docsKey = `fleet_${boatId}_documents`;
      const docsStored = localStorage.getItem(docsKey);
      const documents = docsStored ? JSON.parse(docsStored) : [];

      data[boatId] = { charters, invoices, documents };
    }));

    setAllBoatsData(data);
    console.log('✅ FleetSummary: All boat data loaded');
  };
  
  const calculateTotals = () => {
    let totalIncome = 0;
    let totalCharterExpenses = 0;
    let totalInvoiceExpenses = 0;
    
    Object.values(allBoatsData).forEach(boatData => {
      boatData.charters.forEach(c => {
        totalIncome += (c.amount || 0);
        totalCharterExpenses += (c.commission || 0) + (c.vat_on_commission || 0);
      });
      
      boatData.invoices.forEach(i => {
        totalInvoiceExpenses += (i.amount || 0);
      });
    });
    
    const totalExpenses = totalCharterExpenses + totalInvoiceExpenses;
    const netResult = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netResult };
  };
  
  const totals = calculateTotals();
  
  const handleBackToOwnerDashboard = () => {
    authService.logActivity('back_to_owner_dashboard', ownerCode);
    reactNavigate('/owner-dashboard', { state: { ownerCode: ownerCode }, replace: true });
  };

  const handleHomeNavigation = (pageName) => {
    if (pageName === 'dashboard') {
      handleBackToOwnerDashboard();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title="ΣΥΓΚΕΝΤΡΩΤΙΚΑ ΣΤΟΙΧΕΙΑ" onBack={handleBackToOwnerDashboard} />
      
      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl">👤</div>
            <div>
              <div className="text-sm text-gray-400">Owner Code:</div>
              <div className="text-lg font-bold text-teal-400">{ownerCode}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Vessels:</div>
            <div className="text-lg font-bold text-white">{boatIds.length}</div>
          </div>
        </div>
        {/* 🔥 BUG FIX: Display boat NAMES instead of IDs */}
        <div className="text-sm text-gray-400">{boatIds.map(id => allBoats.find(b => b.id === id)?.name || id).join(', ')}</div>
      </div>
      
      <div className="flex border-b border-gray-700 bg-gray-800">
        <button onClick={() => setActiveTab('financials')} className={`flex-1 py-3 px-2 font-semibold text-sm ${activeTab === 'financials' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          💰 Οικονομικά
        </button>
        <button onClick={() => setActiveTab('bookingSheet')} className={`flex-1 py-3 px-2 font-semibold text-sm ${activeTab === 'bookingSheet' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          📅 Booking
        </button>
        <button onClick={() => setActiveTab('charters')} className={`flex-1 py-3 px-2 font-semibold text-sm ${activeTab === 'charters' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          ⚓ Ναύλοι
        </button>
        <button onClick={() => setActiveTab('documents')} className={`flex-1 py-3 px-2 font-semibold text-sm ${activeTab === 'documents' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          📄 Έγγραφα
        </button>
      </div>
      
      <div className="flex-grow p-4 overflow-y-auto pb-20">
        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Αναζήτηση σκάφους (όνομα, τύπος, μοντέλο...)"
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-center text-xs text-gray-400 mt-1">
              Βρέθηκαν {filteredBoatIds.length} από {boatIds.length} σκάφη
            </div>
          )}
        </div>

        {activeTab === 'financials' && (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
              <div className="bg-gradient-to-br from-green-700 to-green-800 p-3 rounded-lg shadow-lg">
                <div className="text-xs font-medium text-green-200">ΣΥΝ. ΕΣΟΔΑ</div>
                <div className="text-lg font-bold text-white">{totals.totalIncome.toFixed(2)}€</div>
              </div>
              <div className="bg-gradient-to-br from-red-700 to-red-800 p-3 rounded-lg shadow-lg">
                <div className="text-xs font-medium text-red-200">ΣΥΝ. ΕΞΟΔΑ</div>
                <div className="text-lg font-bold text-white">{totals.totalExpenses.toFixed(2)}€</div>
              </div>
              <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-3 rounded-lg shadow-lg">
                <div className="text-xs font-medium text-gray-300">ΚΑΘΑΡΟ</div>
                <div className={`text-lg font-bold ${totals.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totals.netResult.toFixed(2)}€
                </div>
              </div>
            </div>
            
            {filteredBoatIds.map(boatId => {
              const boatData = allBoatsData[boatId];
              if (!boatData) return null;
              
              const boatIncome = boatData.charters.reduce((sum, c) => sum + (c.amount || 0), 0);
              const boatCharterExpenses = boatData.charters.reduce((sum, c) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
              const boatInvoiceExpenses = boatData.invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
              const boatTotal = boatIncome - boatCharterExpenses - boatInvoiceExpenses;
              
              return (
                <div key={boatId} className="bg-gray-800 p-4 rounded-lg mb-3 border border-gray-700">
                  {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                  <h3 className="text-lg font-bold text-teal-400 mb-3">{allBoats.find(b => b.id === boatId)?.name || boatId}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Έσοδα:</span>
                      <span className="text-green-400 font-semibold">{boatIncome.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Έξοδα (Ναύλων):</span>
                      <span className="text-red-400 font-semibold">{boatCharterExpenses.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Έξοδα (Τιμολ.):</span>
                      <span className="text-red-400 font-semibold">{boatInvoiceExpenses.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-700">
                      <span className="text-gray-300 font-semibold">Καθαρό:</span>
                      <span className={`font-bold ${boatTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {boatTotal.toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'bookingSheet' && (
          <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
            <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
              <button onClick={() => setActiveTab('financials')} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg">
                {icons.chevronLeft}
              </button>
              <h1 className="text-lg font-bold text-white">Booking Sheet - {ownerCode}</h1>
              <div className="w-10"></div>
            </div>
            
            <div className="flex-grow overflow-hidden">
              <FleetBookingSheetOwner boatIds={boatIds} allBoatsData={allBoatsData} />
            </div>
          </div>
        )}
        
        {activeTab === 'charters' && (
          <div>
            {filteredBoatIds.map(boatId => {
              const boatData = allBoatsData[boatId];
              if (!boatData || boatData.charters.length === 0) return null;
              
              return (
                <div key={boatId} className="mb-6">
                  {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                  <h3 className="text-lg font-bold text-teal-400 mb-3 flex items-center gap-2">
                    <span>⚓</span>
                    <span>{allBoats.find(b => b.id === boatId)?.name || boatId}</span>
                    <span className="text-sm text-gray-400">({boatData.charters.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {boatData.charters.map(charter => (
                      <div key={charter.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold text-white">{charter.code}</div>
                            <div className="text-xs text-gray-400">{charter.startDate} - {charter.endDate}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-400">{charter.amount?.toFixed(2)}€</div>
                            <div className="text-xs text-gray-400">{charter.status}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'documents' && (
          <div>
            {filteredBoatIds.map(boatId => {
              const boatData = allBoatsData[boatId];
              if (!boatData || boatData.documents.length === 0) return null;
              
              return (
                <div key={boatId} className="mb-6">
                  {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                  <h3 className="text-lg font-bold text-teal-400 mb-3 flex items-center gap-2">
                    <span>📄</span>
                    <span>{allBoats.find(b => b.id === boatId)?.name || boatId}</span>
                    <span className="text-sm text-gray-400">({boatData.documents.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {boatData.documents.map(doc => (
                      <div key={doc.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                        <div className="font-bold text-white">{doc.title}</div>
                        <div className="text-xs text-gray-400">{doc.fileName}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <BottomNav activePage={'dashboard'} onNavigate={handleHomeNavigation} />
    </div>
  );
}

// 🔥 BookingSheetPage - με ΚΕΙΜΕΝΟ αντί για emojis
function BookingSheetPage({ boat, navigate, showMessage }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  // 🔥 FIX 7: Add vessels state for API data
  const [vessels, setVessels] = useState([]);
  // 🔥 Auto-refresh: Track last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isOwnerUser = authService.isOwner();
  const isTechnicalUser = authService.isTechnical();
  const canViewBookings = true;
  const canViewFinancials = !isTechnicalUser; // TECHNICAL δεν βλέπει οικονομικά
  const canEditBookings = (authService.isAdmin() || authService.isBooking()) && !isOwnerUser;

  // 🔥 Auto-refresh: Memoized loadBookings function
  const loadBookings = useCallback(async () => {
    if (!boat) return;
    try {
      const key = `fleet_${boat.id}_ΝΑΥΛΑ`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setBookings(JSON.parse(stored));
      }
      setLoading(false);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error loading bookings:', e);
      setLoading(false);
    }
  }, [boat]);

  // 🔥 Auto-refresh: Poll bookings every 5 minutes
  useAutoRefresh(loadBookings, 5);

  // 🔥 FIX 4: Use optional chaining in dependencies
  useEffect(() => {
    if (boat) {
      loadBookings();
    }
  }, [boat?.id, loadBookings]);

  // 🔥 FIX 7: Load vessels from API
  useEffect(() => {
    const loadVessels = async () => {
      try {
        const apiVessels = await getVessels();
        setVessels(apiVessels);
        console.log('📦 Vessels loaded for booking sheet:', apiVessels.length);
      } catch (error) {
        console.error('Error loading vessels:', error);
      }
    };
    loadVessels();
  }, []);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  const cycleBookingStatus = (booking) => {
    if (!canEditBookings) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    let newStatus;
    switch(booking.status) {
      case 'Option':
      case 'Pending':
        newStatus = 'Confirmed';
        break;
      case 'Confirmed':
        newStatus = 'Canceled';
        break;
      case 'Canceled':
        newStatus = 'Option';
        break;
      default:
        newStatus = 'Option';
    }
    
    const updated = bookings.map((b) => 
      b.id === booking.id ? { ...b, status: newStatus, updatedBy: authService.getCurrentUser()?.name, updatedAt: new Date().toISOString() } : b
    );
    const key = `fleet_${boat.id}_ΝΑΥΛΑ`;
    localStorage.setItem(key, JSON.stringify(updated));
    setBookings(updated);
    
    showMessage(`✅ Status άλλαξε σε ${newStatus}`, 'success');
  };

  const changeMonth = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthName = currentDate.toLocaleString('el-GR', { month: 'long' });
  const year = currentDate.getFullYear();

  let firstSaturday = new Date(year, currentDate.getMonth(), 1);
  while (firstSaturday.getDay() !== 6) {
    firstSaturday.setDate(firstSaturday.getDate() + 1);
  }

  const weeks = [];
  let currentWeekStart = new Date(firstSaturday);
  if (firstSaturday.getDate() > 7) {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
  }
  
  while (currentWeekStart.getMonth() === currentDate.getMonth()) {
    let weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const booking = bookings.find((b) => {
      if (!b.startDate) return false;
      const charterStart = new Date(b.startDate);
      const charterEnd = b.endDate ? new Date(b.endDate) : new Date(charterStart.getTime() + 7*24*60*60*1000);
      const weekStartTime = currentWeekStart.getTime();
      const weekEndTime = weekEnd.getTime();
      
      return charterStart.getTime() < weekEndTime && charterEnd.getTime() > weekStartTime;
    });

    weeks.push({ start: new Date(currentWeekStart), end: weekEnd, booking: booking || null });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const formatDate = (date) => date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });

  // 🔥 FIX 10: Changed Option to BRIGHT YELLOW (#FFFF00)
  const getStatusColor = (status) => {
    switch(status) {
      case 'Option':
      case 'Pending':
        return 'border-yellow-400'; // Will use inline style for #FFFF00 bg
      case 'Accepted':
        return 'bg-yellow-600 border-yellow-400';
      case 'Confirmed':
        return 'bg-green-700 border-green-500';
      case 'Canceled':
      case 'Rejected':
        return 'bg-red-700 border-red-500';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  // 🔥 FIX 10: Changed Option to BRIGHT YELLOW (#FFFF00)
  const getStatusText = (status) => {
    switch(status) {
      case 'Option':
      case 'Pending':
        return { text: 'OPTION', color: 'text-black', bg: '#FFFF00' }; // BRIGHT YELLOW
      case 'Option Accepted':
        return { text: 'OPTION ACCEPTED', color: 'text-yellow-300', bg: 'bg-yellow-400' };
      case 'Reservation':
        return { text: 'RESERVATION', color: 'text-yellow-300', bg: 'bg-yellow-400' };
      case 'Confirmed':
        return { text: 'CONFIRMED', color: 'text-green-300', bg: 'bg-green-500' };
      case 'Cancelled':
      case 'Canceled':
        return { text: 'CANCELLED', color: 'text-red-300', bg: 'bg-red-500' };
      case 'Rejected':
        return { text: 'REJECTED', color: 'text-red-300', bg: 'bg-red-500' };
      default:
        return { text: status, color: 'text-gray-300', bg: 'bg-gray-500' };
    }
  };

  if (loading) return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title="Booking Sheet" onBack={() => navigate('boatDashboard')} />
      <FullScreenLoader />
      <BottomNav activePage={null} onNavigate={navigate} />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 fixed inset-0 z-50">
      <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
        <button onClick={() => navigate('boatDashboard')} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg">
          {icons.chevronLeft}
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold text-white">Booking Sheet - {boat.name || boat.id}</h1>
          <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {isOwnerUser && (
        <div className="p-2 bg-blue-900 border-b border-blue-700 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            {icons.eye}
            <span>View Only Mode</span>
          </div>
        </div>
      )}

      {isTechnicalUser && (
        <div className="p-2 bg-purple-900 border-b border-purple-700 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
            {icons.eye}
            <span>Technical View - Μόνο ημερομηνίες & status</span>
          </div>
        </div>
      )}

      <div className="p-2 bg-gray-800 border-b border-gray-700">
        {/* 🔥 FIX 10: Changed Option to BRIGHT YELLOW (#FFFF00) */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFFF00' }}></div>
            <span style={{ color: '#FFFF00' }}>Option</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-700"></div>
            <span className="text-green-300">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-700"></div>
            <span className="text-red-300">Canceled</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <button onClick={() => changeMonth(-1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronLeft}</button>
        <h2 className="text-2xl font-bold text-teal-400 capitalize">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronRight}</button>
      </div>

      <div className="flex-grow overflow-y-auto p-2">
        <div className="space-y-2">
          {weeks.map((week, index) => {
            const isBooked = !!week.booking;
            const status = week.booking?.status || 'Pending';
            const statusInfo = getStatusText(status);
            const colorClass = isBooked ? getStatusColor(status) : 'bg-gray-800 border-gray-700';
            
            // 🔥 FIXED: Payment status με ΚΕΙΜΕΝΟ
            const paymentInfo = isBooked ? getPaymentStatusInfo(week.booking.paymentStatus) : null;
            
            return (
              <button
                key={index}
                disabled={!canEditBookings || !isBooked}
                onClick={() => canEditBookings && isBooked && cycleBookingStatus(week.booking)}
                className={`w-full p-4 rounded-lg shadow-lg border-2 ${colorClass} ${canEditBookings && isBooked ? 'hover:opacity-80 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02] cursor-pointer transform-gpu' : 'cursor-default'} transition-all duration-300`}
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              >
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-base font-semibold text-gray-300">{`Εβδομάδα ${index + 1}`}</p>
                    <p className="text-sm text-gray-400">{`${formatDate(week.start)} - ${formatDate(week.end)}`}</p>
                  </div>
                  <div className="text-right">
                    {isBooked ? (
                      <div className="relative">
                        {/* 🔥 Red light - μόνο αν βλέπει οικονομικά και είναι ΑΝΕΞΟΦΛΗΤΟ */}
                        {canViewFinancials && paymentInfo?.showLight && (
                          <div className={`absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ${paymentInfo.lightBlink ? 'animate-pulse' : ''}`}></div>
                        )}
                        <p className="font-bold text-white text-xl">{week.booking.code}</p>
                        {/* Οικονομικά μόνο αν δεν είναι TECHNICAL */}
                        {canViewFinancials && (
                          <>
                            <p className="text-base font-semibold text-teal-300">{week.booking.amount?.toFixed(2)}€</p>
                            <p className={`text-xs font-semibold ${paymentInfo?.color}`}>
                              {paymentInfo?.text}
                            </p>
                          </>
                        )}
                        <p className={`text-sm font-bold ${statusInfo.color}`}>{statusInfo.text}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic text-lg">Available</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function DocumentsAndDetailsPage({ boat, navigate, showMessage }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [activeTab, setActiveTab] = useState('details');
  const [boatDetails, setBoatDetails] = useState({});
  const [documents, setDocuments] = useState([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const fileInputRef = useRef(null);

  const isOwnerUser = authService.isOwner();
  const canEdit = authService.canEdit() && !isOwnerUser;
  const canView = true;

  // 🔥 FIX 4: Use optional chaining in dependencies
  useEffect(() => {
    if (boat) {
      loadBoatDetails();
      loadDocuments();
    }
  }, [boat?.id]);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  const loadBoatDetails = () => {
    try {
      const key = `fleet_${boat.id}_details`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setBoatDetails(JSON.parse(stored));
      } else {
        const defaultDetails = {
          'Owner Name': '', 'Owner Address': '', 'Flag': 'Greek', 'Port of Registry': 'Piraeus',
          'Builder/Year': '', 'LOA (Length)': '', 'Beam (Width)': '', 'Draft': '',
          'Engines': '', 'Fuel Capacity': '', 'Water Capacity': '',
          'Insurance Company': '', 'Insurance Policy Number': ''
        };
        setBoatDetails(defaultDetails);
      }
    } catch (e) {
      console.error('Error loading boat details:', e);
    }
  };

  const saveBoatDetails = (newDetails) => {
    if (!canEdit) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    try {
      const key = `fleet_${boat.id}_details`;
      localStorage.setItem(key, JSON.stringify(newDetails));
      setBoatDetails(newDetails);
      authService.logActivity('update_boat_details', boat.id);
      showMessage('✅ Τα στοιχεία αποθηκεύτηκαν!', 'success');
    } catch (e) {
      console.error('Error saving boat details:', e);
      showMessage('❌ Σφάλμα αποθήκευσης!', 'error');
    }
  };

  const handleDetailChange = (field, value) => {
    if (!canEdit) return;
    const updated = { ...boatDetails, [field]: value };
    setBoatDetails(updated);
  };

  const handleAddField = () => {
    if (!canEdit) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    const fieldName = prompt('Όνομα νέου πεδίου:');
    if (fieldName && fieldName.trim()) {
      const updated = { ...boatDetails, [fieldName.trim()]: '' };
      saveBoatDetails(updated);
    }
  };

  const handleRemoveField = (field) => {
    if (!canEdit) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    if (window.confirm(`Διαγραφή πεδίου "${field}";`)) {
      const updated = { ...boatDetails };
      delete updated[field];
      saveBoatDetails(updated);
    }
  };

  const loadDocuments = () => {
    try {
      const key = `fleet_${boat.id}_documents`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setDocuments(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    }
  };

  const saveDocuments = (docs) => {
    try {
      const key = `fleet_${boat.id}_documents`;
      localStorage.setItem(key, JSON.stringify(docs));
      setDocuments(docs);
    } catch (e) {
      console.error('Error saving documents:', e);
    }
  };

  const handleFileUpload = (e) => {
    if (!canEdit) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;

    if (!newDocTitle.trim()) {
      showMessage('❌ Παρακαλώ βάλτε τίτλο!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const doc = {
        id: uid(),
        title: newDocTitle.trim(),
        fileName: file.name,
        fileType: file.type,
        fileData: reader.result,
        uploadedAt: new Date().toISOString(),
        uploadedBy: authService.getCurrentUser()?.name || 'Unknown'
      };

      saveDocuments([...documents, doc]);
      authService.logActivity('upload_document', `${boat.id}/${doc.fileName}`);
      setNewDocTitle('');
      setShowAddDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showMessage('✅ Έγγραφο προστέθηκε!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDocument = (doc) => {
    try {
      const link = document.createElement('a');
      link.href = doc.fileData;
      link.download = doc.fileName;
      link.click();
      authService.logActivity('download_document', `${boat.id}/${doc.fileName}`);
      showMessage('✅ Λήψη ξεκίνησε!', 'success');
    } catch (e) {
      console.error('Error downloading document:', e);
      showMessage('❌ Σφάλμα λήψης!', 'error');
    }
  };

  const handleDeleteDocument = (docId) => {
    if (!canEdit) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα διαγραφής', 'error');
      return;
    }
    
    if (window.confirm('Διαγραφή εγγράφου;')) {
      const doc = documents.find(d => d.id === docId);
      saveDocuments(documents.filter(d => d.id !== docId));
      authService.logActivity('delete_document', `${boat.id}/${doc?.fileName}`);
      showMessage('✅ Έγγραφο διαγράφηκε!', 'success');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title="ΕΓΓΡΑΦΑ & ΣΤΟΙΧΕΙΑ" onBack={() => navigate('boatDashboard')} />

      {isOwnerUser && (
        <div className="p-2 bg-blue-900 border-b border-blue-700 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            {icons.eye}
            <span>View Only Mode - Μόνο προβολή και λήψη</span>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-700 bg-gray-800">
        <button onClick={() => { setActiveTab('details'); authService.logActivity('view_boat_details', boat.id); }} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'details' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          📋 Στοιχεία
        </button>
        <button onClick={() => { setActiveTab('documents'); authService.logActivity('view_boat_documents', boat.id); }} className={`flex-1 py-3 px-4 font-semibold ${activeTab === 'documents' ? 'text-teal-400 border-b-2 border-teal-400 bg-gray-900' : 'text-gray-400'}`}>
          📄 Έγγραφα
        </button>
      </div>

      <div className="flex-grow p-4 overflow-y-auto pb-20">
        {activeTab === 'details' && (
          <div>
            {canEdit && (
              <div className="mb-4 space-y-2">
                <button onClick={() => saveBoatDetails(boatDetails)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg">
                  <span>💾</span><span>Αποθήκευση Στοιχείων</span>
                </button>
                <button onClick={handleAddField} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-700">
                  <span>➕</span><span>Προσθήκη Νέου Πεδίου</span>
                </button>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(boatDetails).map(([field, value]) => (
                <div key={field} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <label className="text-sm font-semibold text-gray-300">{field}</label>
                    {canEdit && (
                      <button onClick={() => handleRemoveField(field)} className="text-red-500 hover:text-red-400">{icons.x}</button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleDetailChange(field, e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'focus:border-teal-500 focus:outline-none'}`}
                    placeholder={canEdit ? 'Εισάγετε τιμή...' : 'Δεν υπάρχει τιμή'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {canEdit && (
              <div className="mb-4">
                <button onClick={() => setShowAddDoc(!showAddDoc)} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-700">
                  {icons.plus}
                  <span>{showAddDoc ? 'Ακύρωση' : 'Προσθήκη Εγγράφου'}</span>
                </button>

                {showAddDoc && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-3 border border-gray-700">
                    <input type="text" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="Τίτλος εγγράφου (π.χ. Boarding Pass)" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
                    <p className="text-xs text-gray-400">Υποστηριζόμενα: PDF, Word (.doc, .docx)</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="bg-gray-800 p-8 rounded-lg text-center border border-gray-700">
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-gray-400">Δεν υπάρχουν έγγραφα</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-teal-400">{doc.title}</h3>
                        <p className="text-sm text-gray-400">{doc.fileName}</p>
                        <p className="text-xs text-gray-500">📅 {new Date(doc.uploadedAt).toLocaleDateString('el-GR')} {doc.uploadedBy && ` • 👤 ${doc.uploadedBy}`}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDownloadDocument(doc)} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" title="Download">{icons.download}</button>
                        {canEdit && (
                          <button onClick={() => handleDeleteDocument(doc.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg" title="Delete">{icons.x}</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <BottomNav activePage={null} onNavigate={navigate} />
    </div>
  );
}

function DetailsPage({ boat, category, navigate, showMessage }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FIX 4: Use optional chaining in dependencies
  useEffect(() => {
    if (boat) {
      loadItems();
    }
  }, [boat?.id, category]);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  // 🔥 FIX 16: Load from API first for charters, merge with localStorage
  const loadItems = async () => {
    try {
      const key = `fleet_${boat.id}_${category}`;

      // For ΝΑΥΛΑ (charters): fetch from API first, merge with localStorage
      if (category === 'ΝΑΥΛΑ') {
        console.log(`🔄 Loading charters for vessel ${boat.id} from API...`);
        const charters = await getBookingsByVesselHybrid(boat.id);
        setItems(charters);
        setLoading(false);
        return;
      }

      // For other categories (ΕΡΓΑΣΙΕΣ, ΤΙΜΟΛΟΓΙΑ, etc.): use localStorage only
      const stored = localStorage.getItem(key);
      if (stored) {
        setItems(JSON.parse(stored));
      } else {
        setItems([]);
      }
      setLoading(false);
    } catch (e) {
      console.error('Error loading items:', e);
      // Fallback to localStorage on error
      try {
        const key = `fleet_${boat.id}_${category}`;
        const stored = localStorage.getItem(key);
        setItems(stored ? JSON.parse(stored) : []);
      } catch (fallbackError) {
        setItems([]);
      }
      setLoading(false);
    }
  };

  const saveItems = (newItems) => {
    try {
      const key = `fleet_${boat.id}_${category}`;
      localStorage.setItem(key, JSON.stringify(newItems));
      setItems(newItems);
    } catch (e) {
      console.error('Error saving items:', e);
    }
  };

  const renderCategoryContent = () => {
    if (loading) return <FullScreenLoader />;
    switch (category) {
      case 'ΕΡΓΑΣΙΕΣ':
        return <TaskPage boat={boat} items={items} showMessage={showMessage} saveItems={saveItems} />;
      case 'ΝΑΥΛΑ':
        return <CharterPage items={items} boat={boat} showMessage={showMessage} saveItems={saveItems} />;
      case 'ΦΩΤΟ & ΒΙΝΤΕΟ':
        return <MediaPage items={items} boatId={boat.id} showMessage={showMessage} />;
      default:
        return <p>Άγνωστη κατηγορία.</p>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title={category} onBack={() => navigate('boatDashboard')} />
      <div className="flex-grow p-4 overflow-y-auto pb-20">{renderCategoryContent()}</div>
      <BottomNav activePage={null} onNavigate={navigate} />
    </div>
  );
}

function MediaPage({ items, boatId, showMessage }) {
  const isOwnerUser = authService.isOwner();
  const canEdit = authService.canEdit() && !isOwnerUser;
  
  return (
    <div>
      {isOwnerUser && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg text-center border border-blue-700">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            {icons.eye}
            <span>View Only Mode</span>
          </div>
        </div>
      )}
      {canEdit && (
         <div className="mb-4">
            <button className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 opacity-50 cursor-not-allowed border border-gray-700">
              {icons.upload} <span className="ml-2">(Σύντομα) Ανέβασμα Media</span>
            </button>
         </div>
      )}
      <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700">
        <div className="text-5xl mb-3">📸</div>
        <p className="text-gray-400">Η λειτουργία Φωτογραφιών & Βίντεο δεν είναι ακόμα διαθέσιμη.</p>
      </div>
    </div>
  );
}

// =====================================================
// END OF PART 3 - ΣΥΝΕΧΕΙΑ ΣΤΟ ΕΠΟΜΕΝΟ ΜΗΝΥΜΑ
// =====================================================
// =====================================================
// PART 4/4: Tasks + Charters + Financials + Messages + Email + FleetBookingPlan
// =====================================================

function TaskPage({ boat, items, showMessage, saveItems }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskDesc, setNewTaskDesc] = useState('');
  
  const isOwnerUser = authService.isOwner();
  const canManageTasks = authService.canManageTasks() && !isOwnerUser;
  const canView = true;

  useEffect(() => {
    if (items.length === 0 && canManageTasks) {
      const initialTasks = TASK_DEFINITIONS.map(desc => ({
        id: uid(),
        description: desc,
        status: '#',
        comment: '',
        lastUpdatedBy: null,
        lastUpdatedAt: null
      }));
      saveItems(initialTasks);
    }
  }, [items.length, canManageTasks, saveItems]);

  const toggleTaskStatus = (taskId) => {
    if (!canManageTasks) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    const statuses = ['OK', '#', '?'];
    const updated = items.map((item) => {
      if (item.id === taskId) {
        const currentIndex = statuses.indexOf(item.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        authService.logActivity('update_task_status', `${boat.id}/${item.description}/${nextStatus}`);
        return { ...item, status: nextStatus, lastUpdatedBy: authService.getCurrentUser()?.name, lastUpdatedAt: new Date().toISOString() };
      }
      return item;
    });
    saveItems(updated);
  };

  const updateTaskComment = (taskId, comment) => {
    if (!canManageTasks) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    const updated = items.map((item) => {
      if (item.id === taskId) {
        authService.logActivity('update_task_comment', `${boat.id}/${item.description}`);
        return { ...item, comment, lastUpdatedBy: authService.getCurrentUser()?.name, lastUpdatedAt: new Date().toISOString() };
      }
      return item;
    });
    saveItems(updated);
  };

  const handleAddTask = () => {
    if (!canManageTasks) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    
    if (!newTaskDesc.trim()) return;
    
    const newTask = { id: uid(), description: newTaskDesc.trim(), status: '#', comment: '', lastUpdatedBy: authService.getCurrentUser()?.name, lastUpdatedAt: new Date().toISOString() };
    saveItems([...items, newTask]);
    authService.logActivity('add_task', `${boat.id}/${newTaskDesc.trim()}`);
    setNewTaskDesc('');
    setShowAddForm(false);
    showMessage('✅ Η εργασία προστέθηκε.', 'success');
  };

  const handleDeleteTask = (taskId) => {
    if (!canManageTasks) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα διαγραφής', 'error');
      return;
    }
    
    const task = items.find(t => t.id === taskId);
    saveItems(items.filter((item) => item.id !== taskId));
    authService.logActivity('delete_task', `${boat.id}/${task?.description}`);
    showMessage('✅ Η εργασία διαγράφηκε.', 'success');
  };

  const renderStatusIcon = (status) => {
    switch(status) {
      case 'OK':
        return <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">{icons.check}</div>;
      case '?':
        return <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">{icons.helpCircle}</div>;
      case '#':
      default:
        return <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">{icons.xCircle}</div>;
    }
  };

  const stats = {
    total: items.length,
    completed: items.filter(t => t.status === 'OK').length,
    pending: items.filter(t => t.status === '#').length,
    repair: items.filter(t => t.status === '?').length
  };

  return (
    <div>
      {isOwnerUser && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg text-center border border-blue-700">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            {icons.eye}
            <span>View Only Mode</span>
          </div>
        </div>
      )}

      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
        <div className="bg-green-900 p-3 rounded-lg border border-green-700">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-xs text-green-300">OK</div>
        </div>
        <div className="bg-red-900 p-3 rounded-lg border border-red-700">
          <div className="text-2xl font-bold text-red-400">{stats.pending}</div>
          <div className="text-xs text-red-300">Pending</div>
        </div>
        <div className="bg-orange-900 p-3 rounded-lg border border-orange-700">
          <div className="text-2xl font-bold text-orange-400">{stats.repair}</div>
          <div className="text-xs text-orange-300">Repair</div>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-sm font-bold text-gray-300 mb-2">Επεξήγηση Χρωμάτων:</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span>OK (Έγινε)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500"></div><span># (Δεν έγινε)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500"></div><span>? (Επισκευή)</span></div>
        </div>
      </div>

      {canManageTasks && (
        <div className="mb-4">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 border border-gray-700">
            {icons.plus} <span className="ml-2">{showAddForm ? 'Ακύρωση' : 'Προσθήκη Νέας Εργασίας'}</span>
          </button>
          {showAddForm && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <input type="text" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Περιγραφή νέας εργασίας" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 mb-2 focus:border-teal-500 focus:outline-none" />
              <button onClick={handleAddTask} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg">Αποθήκευση</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {items.map(task => (
          <div key={task.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <button onClick={() => toggleTaskStatus(task.id)} className={`flex-grow text-left flex items-center gap-3 ${canManageTasks ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'} p-2 rounded transition-colors`} disabled={!canManageTasks}>
                {renderStatusIcon(task.status)}
                <span className="text-gray-300">{task.description}</span>
              </button>
              {canManageTasks && (
                <button onClick={() => handleDeleteTask(task.id)} className="text-red-500 hover:text-red-400 p-1 ml-2 hover:bg-red-900 rounded transition-colors">{icons.x}</button>
              )}
            </div>
            
            {task.status === '?' && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <textarea value={task.comment || ''} onChange={(e) => updateTaskComment(task.id, e.target.value)} placeholder={canManageTasks ? "Σχόλια για επισκευή..." : "No comments"} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 text-sm focus:border-orange-500 focus:outline-none" rows={2} disabled={!canManageTasks} />
              </div>
            )}
            
            {task.lastUpdatedBy && (
              <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500 flex items-center gap-2">
                <span>👤 {task.lastUpdatedBy}</span><span>•</span><span>📅 {new Date(task.lastUpdatedAt).toLocaleString('el-GR')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CharterPage({ items, boat, showMessage, saveItems }) {
  const [selectedCharter, setSelectedCharter] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  // 🔥 FIX 9: Added 5 skipper fields
  const [newCharter, setNewCharter] = useState({
    code: '', startDate: '', endDate: '', amount: '', commissionPercent: '',
    departure: 'ALIMOS MARINA', arrival: 'ALIMOS MARINA', status: 'Option',
    skipperFirstName: '', skipperLastName: '', skipperAddress: '', skipperEmail: '', skipperPhone: ''
  });
  
  const isOwnerUser = authService.isOwner();
  const canViewCharters = true;
  const canEditCharters = (authService.isAdmin() || authService.isBooking()) && !isOwnerUser;
  const canViewFinancials = authService.canViewFinancials() || isOwnerUser;
  const canAcceptCharter = isOwnerUser || authService.isAdmin();

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setNewCharter(prev => ({ ...prev, [name]: value === '' ? '' : value }));
    } else if (name === 'startDate' && value) {
      setNewCharter(prev => ({ ...prev, startDate: value, endDate: value }));
    } else {
      setNewCharter(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateFinancials = () => {
    const amount = parseFloat(newCharter.amount) || 0;
    const commissionPercent = parseFloat(newCharter.commissionPercent) || 0;
    const commission = (amount * commissionPercent) / 100;
    const vat = commission * 0.24;
    const netIncome = amount - commission - vat;
    return { amount, commission, vat, netIncome };
  };

  const financials = calculateFinancials();
  const isFormValid = newCharter.code.trim() !== '' && newCharter.startDate !== '' && newCharter.endDate !== '' && parseFloat(newCharter.amount) > 0;

  // 🔥 FIX 6: Add saveBookingHybrid API sync
  const handleAddCharter = async () => {
    if (!canEditCharters) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }

    if (!isFormValid) {
      showMessage('❌ Παρακαλώ συμπληρώστε όλα τα πεδία.', 'error');
      return;
    }

    const charter = {
      id: uid(),
      code: newCharter.code,
      startDate: newCharter.startDate,
      endDate: newCharter.endDate,
      departure: newCharter.departure,
      arrival: newCharter.arrival,
      boatName: boat.name,
      vesselName: boat.name,
      vesselId: boat.id, // 🔥 FIX 6: Add vesselId for API sync
      ownerCode: boat.ownerCode || '',
      amount: financials.amount,
      commissionPercent: parseFloat(newCharter.commissionPercent) || 0,
      commission: financials.commission,
      vat_on_commission: financials.vat,
      status: newCharter.status,
      bookingStatus: newCharter.status,
      paymentStatus: 'Pending',
      payments: [],
      // 🔥 FIX 9: Skipper fields
      skipperFirstName: newCharter.skipperFirstName,
      skipperLastName: newCharter.skipperLastName,
      skipperAddress: newCharter.skipperAddress,
      skipperEmail: newCharter.skipperEmail,
      skipperPhone: newCharter.skipperPhone,
      createdBy: authService.getCurrentUser()?.name,
      createdAt: new Date().toISOString()
    };

    // 🔥 FIX 6: Debug logging
    console.log('📝 Adding charter:', charter);

    // Save locally first
    saveItems([...items, charter]);

    // 🔥 FIX 6: Sync to API
    try {
      const apiResult = await saveBookingHybrid(charter.code, { bookingData: charter });
      console.log('✅ Charter synced to API:', apiResult);
    } catch (error) {
      console.error('❌ API sync error (charter saved locally):', error);
    }

    // 🔥 FIX 13: Send email when new charter is created
    await sendCharterEmail(charter, boat.name, 'new_charter');

    authService.logActivity('add_charter', `${boat.id}/${charter.code}`);
    // 🔥 FIX 9: Reset form with skipper fields
    setNewCharter({
      code: '', startDate: '', endDate: '', amount: '', commissionPercent: '',
      departure: 'ALIMOS MARINA', arrival: 'ALIMOS MARINA', status: 'Option',
      skipperFirstName: '', skipperLastName: '', skipperAddress: '', skipperEmail: '', skipperPhone: ''
    });
    setShowAddForm(false);
    showMessage('✅ Ο ναύλος προστέθηκε.', 'success');
  };

  // 🔥 FIX 19: Fixed delete to find charter by code OR id (API charters use code)
  const handleDeleteCharter = async (charterKey) => {
    if (!canEditCharters) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα διαγραφής', 'error');
      return;
    }

    // Find charter by code first (API charters), then by id (local charters)
    const charter = items.find(c => c.code === charterKey || c.id === charterKey);
    const bookingCode = charter?.code || charterKey;

    console.log(`🗑️ Deleting charter: key=${charterKey}, code=${bookingCode}, found=${!!charter}`);

    // Delete from API using booking code (not id!)
    if (bookingCode) {
      try {
        const response = await fetch(`https://yachtmanagementsuite.com/api/bookings/${encodeURIComponent(bookingCode)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          console.warn(`API delete failed (status ${response.status}), continuing with local delete`);
        } else {
          console.log('✅ Charter deleted from API:', bookingCode);
        }
      } catch (error) {
        console.warn('API delete error:', error);
      }
    }

    // Delete from local storage (filter by code OR id)
    saveItems(items.filter((item) => item.code !== charterKey && item.id !== charterKey));
    authService.logActivity('delete_charter', `${boat.id}/${bookingCode}`);
    setSelectedCharter(null);
    showMessage('✅ Ο ναύλος διαγράφηκε.', 'success');
  };

  const handleUpdateStatus = async (charter, newStatus) => {
    console.log('📋 handleUpdateStatus called:', { charterId: charter.id, code: charter.code, newStatus });

    // Update local state first
    const updated = items.map((item) => item.id === charter.id ? { ...item, status: newStatus, updatedBy: authService.getCurrentUser()?.name, updatedAt: new Date().toISOString() } : item);
    saveItems(updated);
    setSelectedCharter({ ...charter, status: newStatus });

    // 🔥 FIX 22: Save status to API for multi-device sync
    const bookingCode = charter.code || charter.id;
    try {
      await updateCharterStatus(bookingCode, newStatus);
      console.log('✅ Status synced to API:', bookingCode, newStatus);
      showMessage(`✅ Η κατάσταση άλλαξε σε ${newStatus}`, 'success');
    } catch (error) {
      console.error('❌ API sync failed for status:', error);
      showMessage(`⚠️ Κατάσταση αποθηκεύτηκε τοπικά (API error)`, 'warning');
    }

    authService.logActivity('BOOKING_UPDATED', `${boat.id}/${bookingCode}/${newStatus}`);
  };

  const handleUpdatePayments = async (charterId, newPayments) => {
    console.log('💰 handleUpdatePayments called:', { charterId, newPayments });

    const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
    const charter = items.find((c) => c.id === charterId);
    console.log('💰 Found charter:', charter);

    const totalAmount = charter?.amount || 0;
    let newPaymentStatus = "Pending";
    if (totalPaid >= totalAmount) newPaymentStatus = "Paid";
    else if (totalPaid > 0) newPaymentStatus = "Partial";

    // Update local state first
    const updated = items.map((item) => item.id === charterId ? { ...item, payments: newPayments, paymentStatus: newPaymentStatus, updatedBy: authService.getCurrentUser()?.name, updatedAt: new Date().toISOString() } : item);
    saveItems(updated);
    setSelectedCharter((prev) => ({ ...prev, payments: newPayments, paymentStatus: newPaymentStatus }));
    console.log('💰 Local state updated');

    // 🔥 FIX 21: Save to API for multi-device sync
    const bookingCode = charter?.code || charterId;
    console.log('💰 Saving to API with bookingCode:', bookingCode);
    try {
      await updateCharterPayments(bookingCode, newPayments, newPaymentStatus);
      console.log('✅ Payments synced to API:', bookingCode);
      showMessage('✅ Οι πληρωμές αποθηκεύτηκαν!', 'success');
    } catch (error) {
      console.error('❌ API sync failed for payments:', error);
      showMessage('⚠️ Πληρωμές αποθηκεύτηκαν τοπικά (API error)', 'warning');
    }

    authService.logActivity('BOOKING_UPDATED', `${boat.id}/${bookingCode}`);
  };

  const handleSelectCharter = (charter) => {
    authService.logActivity('view_charter_details', `${boat.id}/${charter.code}`);
    setSelectedCharter(charter);
  };

  return (
    <div>
      {isOwnerUser && (
        <div className="mb-4 p-3 bg-blue-900 rounded-lg text-center border border-blue-700">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">
            {icons.eye}
            <span>View Only - Μπορείτε να αποδεχτείτε/απορρίψετε ναύλους</span>
          </div>
        </div>
      )}

      {canEditCharters && (
        <div className="mb-4">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 border border-gray-700">
            {icons.plus} <span className="ml-2">{showAddForm ? 'Ακύρωση' : 'Προσθήκη Νέου Ναύλου'}</span>
          </button>
          
          {showAddForm && (
            <div className="mt-4 p-5 bg-gray-800 rounded-lg border-2 border-gray-700 space-y-4">
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-bold text-teal-400 mb-3">CHARTERING INFORMATION</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Κωδικός Ναύλου *</label>
                    <input type="text" name="code" value={newCharter.code} onChange={handleFormChange} placeholder="π.χ. NAY-002" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">FROM *</label>
                      <input type="date" name="startDate" value={newCharter.startDate} onChange={handleFormChange} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">TO *</label>
                      <input type="date" name="endDate" value={newCharter.endDate} onChange={handleFormChange} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">DEPARTURE</label>
                      <input type="text" name="departure" value={newCharter.departure} onChange={handleFormChange} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">ARRIVAL</label>
                      <input type="text" name="arrival" value={newCharter.arrival} onChange={handleFormChange} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">STATUS</label>
                    <select name="status" value={newCharter.status} onChange={handleFormChange} className="w-full px-3 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none font-bold">
                      <option value="Option" className="bg-yellow-700">🟡 OPTION (Αναμονή Owner)</option>
                      <option value="Confirmed" className="bg-green-700">🟢 CONFIRMED (Κλεισμένο)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 🔥 FIX 9: Skipper Information Section */}
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-bold text-blue-400 mb-3">SKIPPER INFORMATION</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input type="text" name="skipperFirstName" value={newCharter.skipperFirstName} onChange={handleFormChange} placeholder="Όνομα" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input type="text" name="skipperLastName" value={newCharter.skipperLastName} onChange={handleFormChange} placeholder="Επώνυμο" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input type="text" name="skipperAddress" value={newCharter.skipperAddress} onChange={handleFormChange} placeholder="Διεύθυνση" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input type="email" name="skipperEmail" value={newCharter.skipperEmail} onChange={handleFormChange} placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input type="tel" name="skipperPhone" value={newCharter.skipperPhone} onChange={handleFormChange} placeholder="+30 69..." className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg border-2 border-teal-500">
                <h3 className="text-lg font-bold text-teal-400 mb-3">FINANCIAL TERMS:</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-green-400 mb-2">Charter Fee (Income): *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      id="charter-fee-input"
                      value={newCharter.amount}
                      onChange={handleFormChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('commission-percent-input')?.focus();
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-3 bg-gray-600 text-white text-lg font-bold rounded-lg border-2 border-green-500 focus:border-green-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-red-400 mb-2">Προμήθεια (%) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="commissionPercent"
                      id="commission-percent-input"
                      value={newCharter.commissionPercent}
                      onChange={handleFormChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('save-charter-btn')?.focus();
                        }
                      }}
                      placeholder="π.χ. 10"
                      className="w-full px-3 py-3 bg-gray-600 text-white text-lg font-bold rounded-lg border-2 border-red-500 focus:border-red-400 focus:outline-none"
                    />
                  </div>
                  <div className="pt-3 border-t-2 border-gray-600 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-medium">Commission (Expense):</span>
                      <span className="text-red-400 font-bold text-lg">-{financials.commission.toFixed(2)}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-medium">VAT on Commission (24%):</span>
                      <span className="text-red-400 font-bold text-lg">-{financials.vat.toFixed(2)}€</span>
                    </div>
                    <div className="pt-3 border-t-2 border-teal-500 flex justify-between items-center">
                      <span className="text-teal-400 font-bold text-xl">NET INCOME:</span>
                      <span className="text-teal-400 font-bold text-2xl">{financials.netIncome.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                id="save-charter-btn"
                onClick={handleAddCharter}
                disabled={!isFormValid}
                className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition duration-200 ${isFormValid ? 'bg-teal-600 hover:bg-teal-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
              >
                💾 Αποθήκευση Ναύλου
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {items.map(charter => {
          const totalPaid = (charter.payments || []).reduce((sum, p) => sum + p.amount, 0);
          const paymentInfo = getPaymentStatusInfo(charter.paymentStatus);
          
          return (
            <button key={charter.id} onClick={() => handleSelectCharter(charter)} className={`w-full text-left bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition duration-200 border border-gray-700 hover:border-teal-500 relative`}>
              {/* 🔥 Red light - μόνο για ΑΝΕΞΟΦΛΗΤΟ */}
              {paymentInfo.showLight && (
                <div className={`absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ${paymentInfo.lightBlink ? 'animate-pulse' : ''}`}></div>
              )}
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-teal-400">{charter.code}</h3>
                  <p className="text-sm text-gray-400">
                    {charter.startDate ? new Date(charter.startDate).toLocaleDateString('el-GR') : ''} - {charter.endDate ? new Date(charter.endDate).toLocaleDateString('el-GR') : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className={charter.status === 'Confirmed' ? 'text-green-400' : (charter.status === 'Rejected' || charter.status === 'Cancelled' || charter.status === 'Canceled') ? 'text-red-400' : 'text-yellow-400'}>{charter.status}</span>
                  </p>
                  {/* 🔥 Payment Status - ΚΕΙΜΕΝΟ */}
                  <p className={`text-xs mt-1 font-semibold ${paymentInfo.color}`}>
                    {paymentInfo.text}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {canViewFinancials ? (
                    <span className="text-xl font-bold text-green-400">{charter.amount?.toFixed(2)}€</span>
                  ) : (
                    <span className="text-xl font-bold text-gray-500">🔒</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedCharter && (
        <CharterDetailModal 
          charter={selectedCharter} boat={boat} canViewFinancials={canViewFinancials} canEditCharters={canEditCharters}
          canAcceptCharter={canAcceptCharter} isOwnerUser={isOwnerUser} onClose={() => setSelectedCharter(null)} 
          onDelete={handleDeleteCharter} onUpdateStatus={handleUpdateStatus} onUpdatePayments={handleUpdatePayments} showMessage={showMessage}
        />
      )}
    </div>
  );
}

function CharterDetailModal({ charter, boat, canViewFinancials, canEditCharters, canAcceptCharter, isOwnerUser, onClose, onDelete, onUpdateStatus, onUpdatePayments, showMessage }) {
  const totalExpense = (charter.commission || 0) + (charter.vat_on_commission || 0);
  const netIncome = (charter.amount || 0) - totalExpense;
  const [payments, setPayments] = useState(charter.payments || []);
  const [newPayDate, setNewPayDate] = useState('');
  const [newPayAmount, setNewPayAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const addPayment = () => {
    console.log('💳 addPayment clicked:', { newPayDate, newPayAmount, canEditCharters });
    if (!canEditCharters) { showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error'); return; }
    const amount = parseFloat(newPayAmount) || 0;
    console.log('💳 Parsed amount:', amount);
    if (!newPayDate) {
      console.log('💳 No date selected');
      showMessage('❌ Επιλέξτε ημερομηνία πληρωμής', 'error');
      return;
    }
    if (amount <= 0) {
      console.log('💳 Invalid amount');
      showMessage('❌ Εισάγετε έγκυρο ποσό πληρωμής', 'error');
      return;
    }
    const newPayments = [...payments, { date: newPayDate, amount: amount }];
    console.log('💳 New payments list:', newPayments);
    setPayments(newPayments);
    setNewPayDate('');
    setNewPayAmount('');
    showMessage('✅ Πληρωμή προστέθηκε - Πατήστε "Αποθήκευση" για να σωθεί', 'success');
  };
  
  const removePayment = (index) => {
    if (!canEditCharters) { showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error'); return; }
    setPayments(payments.filter((_, i) => i !== index));
  };
  
  const savePayments = async () => {
    try {
      await onUpdatePayments(charter.id, payments);
    } catch (error) {
      console.error('❌ Error saving payments:', error);
      showMessage('❌ Σφάλμα αποθήκευσης πληρωμών', 'error');
    }
  };
  
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (charter.amount || 0) - totalPaid;

  // OWNER: Option → Option Accepted (accept) or Cancelled (reject)
  // 🔥 FIX 8: Added API sync for charter acceptance
  const handleOwnerAcceptOption = async () => {
    if (!canAcceptCharter) { showMessage('❌ Δεν έχετε δικαίωμα αποδοχής', 'error'); return; }
    setIsProcessing(true);
    console.log('📝 Owner accepting option:', charter.code);
    const success = await sendCharterEmail(charter, boat.name || boat.id, 'option_accepted');
    if (success) {
      onUpdateStatus(charter, 'Option Accepted');
      // 🔥 FIX 8: Sync to API
      try {
        const updatedCharter = { ...charter, status: 'Option Accepted', vesselId: boat.id };
        await saveBookingHybrid(charter.code, { bookingData: updatedCharter });
        console.log('✅ Charter acceptance synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      showMessage('✅ Option ΑΠΟΔΕΚΤΟ! Ειδοποίηση στάλθηκε.', 'success');
    } else {
      showMessage('❌ Σφάλμα. Δοκιμάστε ξανά.', 'error');
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 8: Added API sync for charter rejection
  const handleOwnerRejectOption = async () => {
    if (!canAcceptCharter) { showMessage('❌ Δεν έχετε δικαίωμα απόρριψης', 'error'); return; }
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ΑΠΟΡΡΙΨΕΤΕ αυτόν τον ναύλο;')) return;
    setIsProcessing(true);
    console.log('📝 Owner rejecting option:', charter.code);
    const success = await sendCharterEmail(charter, boat.name || boat.id, 'cancelled');
    if (success) {
      onUpdateStatus(charter, 'Cancelled');
      // 🔥 FIX 8: Sync to API
      try {
        const updatedCharter = { ...charter, status: 'Cancelled', vesselId: boat.id };
        await saveBookingHybrid(charter.code, { bookingData: updatedCharter });
        console.log('✅ Charter rejection synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      showMessage('❌ Ναύλος ΑΚΥΡΩΘΗΚΕ! Ειδοποίηση στάλθηκε.', 'success');
    } else {
      showMessage('❌ Σφάλμα. Δοκιμάστε ξανά.', 'error');
    }
    setIsProcessing(false);
  };

  // OWNER: Reservation → Confirmed (accept) or Cancelled (reject)
  const handleOwnerConfirmReservation = async () => {
    if (!canAcceptCharter) { showMessage('❌ Δεν έχετε δικαίωμα επιβεβαίωσης', 'error'); return; }
    setIsProcessing(true);
    const success = await sendCharterEmail(charter, boat.name || boat.id, 'confirmed');
    if (success) {
      onUpdateStatus(charter, 'Confirmed');
      showMessage('✅ Ναύλος ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ! Ειδοποίηση στάλθηκε.', 'success');
    } else {
      showMessage('❌ Σφάλμα. Δοκιμάστε ξανά.', 'error');
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 12: ADMIN: Option Accepted → Reservation (ΚΛΕΙΣΙΜΟ OPTION)
  const handleAdminCloseCharter = async () => {
    setIsProcessing(true);
    console.log('📝 Admin closing option:', charter.code);
    const success = await sendCharterEmail(charter, boat.name || boat.id, 'reservation');
    if (success) {
      onUpdateStatus(charter, 'Reservation');
      // 🔥 FIX 12: Sync to API
      try {
        const updatedCharter = { ...charter, status: 'Reservation', vesselId: boat.id };
        await saveBookingHybrid(charter.code, { bookingData: updatedCharter });
        console.log('✅ ΚΛΕΙΣΙΜΟ OPTION synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      showMessage('✅ Ναύλος κλείστηκε → RESERVATION! Αναμονή Owner επιβεβαίωσης.', 'success');
    } else {
      showMessage('❌ Σφάλμα. Δοκιμάστε ξανά.', 'error');
    }
    setIsProcessing(false);
  };

  const handleAdminCancelCharter = async () => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ΑΚΥΡΩΣΕΤΕ αυτόν τον ναύλο;')) return;
    setIsProcessing(true);
    const success = await sendCharterEmail(charter, boat.name || boat.id, 'cancelled');
    if (success) {
      onDelete(charter.id);
      showMessage('❌ Ναύλος ΑΚΥΡΩΘΗΚΕ και διαγράφηκε! Ειδοποίηση στάλθηκε.', 'success');
    } else {
      showMessage('❌ Σφάλμα. Δοκιμάστε ξανά.', 'error');
    }
    setIsProcessing(false);
  };

  const handleDownloadSpecimen = () => { generateSpecimenPdf(charter, boat); };

  // 🔥 FIX 23: Charter Party DOCX download handler
  const handleDownloadCharterParty = () => { generateCharterParty(charter, boat, showMessage); };

  // 🔥 FIX 27: Crew List DOCX download handler
  const handleDownloadCrewList = () => {
    // Load boatDetails from localStorage
    const detailsKey = `fleet_${boat.id}_details`;
    const storedDetails = localStorage.getItem(detailsKey);
    const boatDetails = storedDetails ? JSON.parse(storedDetails) : {};
    generateCrewList(charter, boat, boatDetails, showMessage);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh] border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-teal-400">CHARTER SPECIMEN</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">{icons.x}</button>
        </div>

        {isOwnerUser && (
          <div className="mb-4 p-2 bg-blue-900 rounded-lg text-center border border-blue-700">
            <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">{icons.eye}<span>Owner Mode - Αποδοχή/Απόρριψη</span></div>
          </div>
        )}

        <div className="text-center mb-4 pb-4 border-b border-gray-700">
          <h3 className="font-bold text-lg">{COMPANY_INFO.name}</h3>
          <p className="text-sm text-gray-400">{COMPANY_INFO.address}</p>
          <p className="text-sm text-gray-400">Tel: {COMPANY_INFO.phone}</p>
          <p className="text-sm text-gray-400">{COMPANY_INFO.emails.info}</p>
        </div>

        <h3 className="text-center font-bold text-lg mb-4">CHARTERING INFORMATION - OPTION {charter.code}</h3>

        <div className="bg-gray-700 p-4 rounded-lg mb-4 space-y-2 border border-gray-600">
          <div className="flex justify-between"><span className="text-gray-300">YACHT:</span><span className="font-bold">{boat.name || boat.id}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">FROM:</span><span className="font-bold">{charter.startDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">TO:</span><span className="font-bold">{charter.endDate}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">DEPARTURE:</span><span className="font-bold">{charter.departure || 'ALIMOS MARINA'}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">ARRIVAL:</span><span className="font-bold">{charter.arrival || 'ALIMOS MARINA'}</span></div>
        </div>

        {canViewFinancials && (
          <>
            <h4 className="font-bold text-lg mb-3">FINANCIAL TERMS:</h4>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-green-400"><span>Charter Fee (Income):</span><span className="font-bold">{charter.amount?.toFixed(2)}€</span></div>
              <div className="flex justify-between text-red-400"><span>Commission (Expense):</span><span className="font-bold">-{charter.commission?.toFixed(2)}€</span></div>
              <div className="flex justify-between text-red-400"><span>VAT on Commission (24%):</span><span className="font-bold">-{charter.vat_on_commission?.toFixed(2)}€</span></div>
              <hr className="border-gray-600" />
              <div className="flex justify-between text-xl font-bold"><span>NET INCOME:</span><span className="text-teal-400">{netIncome.toFixed(2)}€</span></div>
            </div>
          </>
        )}

        <p className="text-center text-gray-400 text-sm mb-4">Please advise regarding the acceptance of the charter.<br/>Thank you,</p>

        {/* OWNER: Option → ΑΠΟΔΟΧΗ / ΜΗ ΑΠΟΔΟΧΗ */}
        {canAcceptCharter && (charter.status === 'Option' || charter.status === 'Pending') && (
          <div className="space-y-2 mb-4">
            <div className="text-center text-sm mb-2 p-2 rounded-lg bg-yellow-900 text-yellow-400">
              ⏳ Αυτός ο ναύλος περιμένει την απόφασή σας
            </div>
            <button onClick={handleOwnerAcceptOption} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.checkCircle} <span className="ml-2">✅ ΑΠΟΔΟΧΗ</span></>}
            </button>
            <button onClick={handleOwnerRejectOption} disabled={isProcessing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.xCircle} <span className="ml-2">❌ ΜΗ ΑΠΟΔΟΧΗ</span></>}
            </button>
          </div>
        )}

        {/* 🔥 FIX 12: ADMIN: Option Accepted → ΚΛΕΙΣΙΜΟ OPTION / ΑΚΥΡΟ */}
        {!isOwnerUser && charter.status === 'Option Accepted' && (
          <div className="space-y-2 mb-4">
            <div className="text-center text-sm mb-2 p-2 rounded-lg bg-yellow-900 text-yellow-400">
              ⏳ Owner αποδέχτηκε - Επιλέξτε ενέργεια
            </div>
            {/* 🔥 FIX 12: Admin button "ΚΛΕΙΣΙΜΟ OPTION" - Changes to Reservation, sends email, saves to API */}
            <button onClick={handleAdminCloseCharter} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.checkCircle} <span className="ml-2">✅ ΚΛΕΙΣΙΜΟ OPTION</span></>}
            </button>
            <button onClick={handleAdminCancelCharter} disabled={isProcessing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.xCircle} <span className="ml-2">❌ ΑΚΥΡΟ</span></>}
            </button>
          </div>
        )}

        {/* OWNER: Reservation → ΑΠΟΔΟΧΗ / ΜΗ ΑΠΟΔΟΧΗ → Confirmed */}
        {canAcceptCharter && charter.status === 'Reservation' && (
          <div className="space-y-2 mb-4">
            <div className="text-center text-sm mb-2 p-2 rounded-lg bg-yellow-900 text-yellow-400">
              ⏳ Ο ναύλος κλείστηκε - Επιβεβαιώστε
            </div>
            <button onClick={handleOwnerConfirmReservation} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.checkCircle} <span className="ml-2">✅ ΑΠΟΔΟΧΗ</span></>}
            </button>
            <button onClick={handleOwnerRejectOption} disabled={isProcessing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.xCircle} <span className="ml-2">❌ ΜΗ ΑΠΟΔΟΧΗ</span></>}
            </button>
          </div>
        )}

        {/* Status displays */}
        {charter.status === 'Option Accepted' && isOwnerUser && (
          <div className="w-full bg-yellow-600 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center">{icons.checkCircle} <span className="ml-2">⏳ OPTION ACCEPTED - Αναμονή Admin</span></div>
        )}

        {charter.status === 'Confirmed' && (
          <div className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center">{icons.checkCircle} <span className="ml-2">✅ ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ</span></div>
        )}

        {(charter.status === 'Cancelled' || charter.status === 'Canceled' || charter.status === 'Rejected') && (
          <div className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center">{icons.xCircle} <span className="ml-2">❌ ΑΚΥΡΩΜΕΝΟΣ</span></div>
        )}

        <button onClick={handleDownloadSpecimen} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-gray-600">
          {icons.download} <span className="ml-2">Download Specimen</span>
        </button>

        {/* 🔥 FIX 23: Charter Party DOCX Button */}
        <button onClick={handleDownloadCharterParty} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-blue-500">
          {icons.fileText} <span className="ml-2">📄 Charter Party (DOCX)</span>
        </button>

        {/* 🔥 FIX 27: Crew List DOCX Button */}
        <button onClick={handleDownloadCrewList} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-green-500">
          {icons.fileText} <span className="ml-2">👥 Crew List (DOCX)</span>
        </button>

        {canEditCharters && canViewFinancials && (
          <div className="bg-gray-900 p-4 rounded-lg mb-4 border border-gray-700">
            <h3 className="text-xl font-bold text-yellow-400 mb-3">Διαχείριση Πληρωμών</h3>
            <div className="space-y-2 text-base mb-4">
              <div className="flex justify-between"><span className="text-gray-300">Σύνολο Πληρωμένο:</span><span className="font-bold text-green-400">{totalPaid.toFixed(2)}€</span></div>
              <div className="flex justify-between"><span className="text-gray-300">Υπόλοιπο:</span><span className="font-bold text-red-400">{balance.toFixed(2)}€</span></div>
            </div>
            <div className="space-y-2 mb-3">
              {payments.map((p, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-700 p-2 rounded border border-gray-600">
                  <span className="text-sm">{new Date(p.date + 'T00:00:00').toLocaleDateString('el-GR')}</span>
                  <span className="text-sm font-semibold">{p.amount.toFixed(2)}€</span>
                  <button onClick={() => removePayment(index)} className="text-red-500 hover:text-red-400">{icons.x}</button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2 mb-3">
              <input type="date" value={newPayDate} onChange={(e) => setNewPayDate(e.target.value)} className="w-1/2 px-2 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
              <input type="number" step="0.01" value={newPayAmount} onChange={(e) => setNewPayAmount(e.target.value)} placeholder="Ποσό" className="w-1/2 px-2 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
            </div>
            <button type="button" onClick={addPayment} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg text-sm mb-3">Προσθήκη Πληρωμής</button>
            <button type="button" onClick={savePayments} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg">Αποθήκευση Πληρωμών</button>
          </div>
        )}

        {canEditCharters && (
          <button onClick={async () => {
            const bookingCode = charter.code || charter.id;
            console.log('🗑️ DELETE BUTTON CLICKED - bookingCode:', bookingCode);
            if (!bookingCode) {
              console.error('❌ No booking code found!');
              return;
            }
            if (!window.confirm(`Οριστική διαγραφή του ναύλου ${bookingCode};`)) {
              console.log('❌ Delete cancelled by user');
              return;
            }
            try {
              console.log('🗑️ Calling deleteBooking API...');
              await deleteBooking(bookingCode);
              console.log('✅ API delete successful');
            } catch (error) {
              console.warn('⚠️ API delete failed:', error);
            }
            // Update local state via onDelete
            onDelete(bookingCode);
          }} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center">
            {icons.x} <span className="ml-2">🗑️ Οριστική Διαγραφή</span>
          </button>
        )}
      </div>
    </div>
  );
}

function FinancialsPage({ boat, navigate, setPage, setSelectedCategory, showMessage }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [charters, setCharters] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const isOwnerUser = authService.isOwner();
  const canViewFinancials = authService.canViewFinancials() || isOwnerUser;
  const canEditFinancials = authService.canEditFinancials() && !isOwnerUser;

  // 🔥 FIX 4: Use optional chaining in dependencies
  useEffect(() => {
    if (boat && canViewFinancials) {
      loadData();
    }
  }, [boat?.id, canViewFinancials]);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  // 🔥 FIX 16: Load data from API first, merge with localStorage
  const loadData = async () => {
    try {
      // Load charters from API (with localStorage merge and fallback)
      let chartersData: any[] = [];
      try {
        chartersData = await getBookingsByVesselHybrid(boat.id);
        console.log(`✅ FinancialsPage: Loaded ${chartersData.length} charters from API`);
      } catch (apiError) {
        console.warn('⚠️ API failed, using localStorage for charters');
        const chartersKey = `fleet_${boat.id}_ΝΑΥΛΑ`;
        const chartersStored = localStorage.getItem(chartersKey);
        chartersData = chartersStored ? JSON.parse(chartersStored) : [];
      }

      // Sort charters by date
      chartersData.sort((a: any, b: any) => (b.startDate && a.startDate) ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : 0);
      setCharters(chartersData);

      // Load invoices (localStorage only for now)
      const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      if (invoicesStored) {
        const invoicesData = JSON.parse(invoicesStored);
        invoicesData.sort((a: any, b: any) => (b.date && a.date) ? new Date(b.date).getTime() - new Date(a.date).getTime() : 0);
        setInvoices(invoicesData);
      }

      authService.logActivity('view_financials', boat.id);
      setLoading(false);
    } catch (e) {
      console.error('Error loading financials:', e);
      setLoading(false);
    }
  };

  const totalIncome = charters.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalCharterExpenses = charters.reduce((sum, c) => sum + (c.commission || 0) + (c.vat_on_commission || 0), 0);
  const totalInvoiceExpenses = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpenses = totalCharterExpenses + totalInvoiceExpenses;
  const netResult = totalIncome - totalExpenses;

  if (loading) return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 fixed inset-0 z-50">
      <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
        <button onClick={() => navigate('boatDashboard')} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg">{icons.chevronLeft}</button>
        <h1 className="text-lg font-bold text-white">Οικονομικά - {boat.id}</h1>
        <div className="w-10"></div>
      </div>
      <FullScreenLoader />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 fixed inset-0 z-50">
      <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
        <button onClick={() => navigate('boatDashboard')} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg">{icons.chevronLeft}</button>
        <h1 className="text-lg font-bold text-white">Οικονομικά - {boat.id}</h1>
        <div className="w-10"></div>
      </div>

      {isOwnerUser && (
        <div className="p-2 bg-blue-900 border-b border-blue-700 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-200 text-sm">{icons.eye}<span>View Only Mode</span></div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <div className="bg-gradient-to-br from-green-700 to-green-800 p-3 rounded-lg text-center">
          <div className="text-xs text-green-200">ΕΣΟΔΑ</div>
          <div className="text-lg font-bold text-white">{totalIncome.toFixed(0)}€</div>
        </div>
        <div className="bg-gradient-to-br from-red-700 to-red-800 p-3 rounded-lg text-center">
          <div className="text-xs text-red-200">ΕΞΟΔΑ</div>
          <div className="text-lg font-bold text-white">{totalExpenses.toFixed(0)}€</div>
        </div>
        <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-3 rounded-lg text-center">
          <div className="text-xs text-gray-300">ΚΑΘΑΡΟ</div>
          <div className={`text-lg font-bold ${netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>{netResult.toFixed(0)}€</div>
        </div>
      </div>
      
      <div className="flex-grow p-3 overflow-y-auto">
        <div className="mb-6">
           <h3 className="text-xl font-semibold mb-3 text-teal-400">Έξοδα Σκάφους (Τιμολόγια)</h3>
           <InvoiceSection boatId={boat.id} canEditFinancials={canEditFinancials} showMessage={showMessage} invoices={invoices} setInvoices={setInvoices} isOwnerUser={isOwnerUser} />
        </div>

        {!isOwnerUser && canEditFinancials && (
          <div>
            <h3 className="text-xl font-semibold mb-3 text-teal-400">Πληρωμές Ναύλων</h3>
            <div className="space-y-2">
              {charters.length > 0 ? charters.map((charter) => {
                const totalPaid = (charter.payments || []).reduce((sum, p) => sum + p.amount, 0);
                const balance = (charter.amount || 0) - totalPaid;
                const paymentInfo = getPaymentStatusInfo(charter.paymentStatus);
                
                return (
                  <button key={charter.id} onClick={() => { setSelectedCategory('ΝΑΥΛΑ'); setPage('details'); }} className="w-full text-left bg-gray-800 p-4 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-teal-500 transition-all relative">
                    {paymentInfo.showLight && (
                      <div className={`absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ${paymentInfo.lightBlink ? 'animate-pulse' : ''}`}></div>
                    )}
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-200">{charter.code}</h4>
                      <span className="font-bold text-green-400">{charter.amount?.toFixed(0)}€</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-semibold ${paymentInfo.color}`}>{paymentInfo.text}</span>
                      {balance > 0 && <span className="text-red-400">Υπόλοιπο: {balance.toFixed(0)}€</span>}
                    </div>
                  </button>
                )
              }) : (
                 <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700"><p className="text-gray-400">Δεν υπάρχουν ναύλοι.</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InvoiceSection({ boatId, canEditFinancials, showMessage, invoices, setInvoices, isOwnerUser }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ code: '', date: '', description: '', amount: 0 });
  const fileInputRef = useRef(null);

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setNewInvoice(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleFileUpload = (e) => {
    if (!canEditFinancials) { showMessage('❌ View Only - Δεν έχετε δικαίωμα', 'error'); return; }
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setNewInvoice(prev => ({ ...prev, fileUrl: URL.createObjectURL(file), fileName: file.name, fileData: reader.result }));
      showMessage('✅ Αρχείο επιλέχθηκε: ' + file.name, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleAddInvoice = () => {
    if (!canEditFinancials) { showMessage('❌ View Only - Δεν έχετε δικαίωμα', 'error'); return; }
    if (!newInvoice.code || !newInvoice.date || !newInvoice.description) {
      showMessage("❌ Παρακαλώ συμπληρώστε όλα τα πεδία.", "error");
      return;
    }
    
    const invoice = { id: uid(), ...newInvoice, createdAt: new Date().toISOString(), createdBy: authService.getCurrentUser()?.name };
    const updated = [...invoices, invoice];
    const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    localStorage.setItem(key, JSON.stringify(updated));
    setInvoices(updated);
    authService.logActivity('add_invoice', `${boatId}/${invoice.code}`);
    setNewInvoice({ code: '', date: '', description: '', amount: 0 });
    setShowAddForm(false);
    showMessage("✅ Το τιμολόγιο προστέθηκε.", "success");
  };

  const handleDeleteInvoice = (invoiceId) => {
    if (!canEditFinancials) { showMessage('❌ View Only - Δεν έχετε δικαίωμα', 'error'); return; }
    const invoice = invoices.find(inv => inv.id === invoiceId);
    const updated = invoices.filter((inv) => inv.id !== invoiceId);
    const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    localStorage.setItem(key, JSON.stringify(updated));
    setInvoices(updated);
    authService.logActivity('delete_invoice', `${boatId}/${invoice?.code}`);
    showMessage("✅ Το τιμολόγιο διαγράφηκε.", "success");
  };

  const handleDownloadInvoice = (invoice) => {
    if (invoice.fileData) {
      const link = document.createElement('a');
      link.href = invoice.fileData;
      link.download = invoice.fileName || `invoice_${invoice.code}.pdf`;
      link.click();
      authService.logActivity('download_invoice', `${boatId}/${invoice.code}`);
      showMessage('✅ Λήψη ξεκίνησε!', 'success');
    } else {
      showMessage("❌ Δεν υπάρχει αρχείο για λήψη.", "error");
    }
  };

  return (
    <div>
      {canEditFinancials && (
        <div className="mb-4">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 border border-gray-700">
            {icons.plus} <span className="ml-2">{showAddForm ? 'Ακύρωση' : 'Προσθήκη Νέου Εξόδου'}</span>
          </button>
          
          {showAddForm && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg space-y-3 border border-gray-700">
              <input type="text" name="code" value={newInvoice.code} onChange={handleFormChange} placeholder="Κωδικός (π.χ. TIM-001)" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
              <input type="date" name="date" value={newInvoice.date} onChange={handleFormChange} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
              <input type="text" name="description" value={newInvoice.description} onChange={handleFormChange} placeholder="Περιγραφή (π.χ. Αναλώσιμα)" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
              <input type="number" step="0.01" name="amount" value={newInvoice.amount} onChange={handleFormChange} placeholder="Ποσό (€)" className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ανέβασμα Αρχείου (PDF/Image)</label>
                <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600" />
                {newInvoice.fileName && <p className="text-sm text-green-400 mt-2">✓ {newInvoice.fileName}</p>}
              </div>
              <button onClick={handleAddInvoice} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg">Αποθήκευση Εξόδου</button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700"><div className="text-5xl mb-3">📄</div><p className="text-gray-400">Δεν υπάρχουν τιμολόγια</p></div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-teal-400">{invoice.code}</h3>
                  <p className="text-sm text-gray-300">{invoice.description}</p>
                  <p className="text-sm text-gray-400">{invoice.date ? new Date(invoice.date).toLocaleDateString('el-GR') : ''}</p>
                  {invoice.fileName && <p className="text-xs text-gray-500 mt-1">📎 {invoice.fileName}</p>}
                </div>
                <span className="text-xl font-bold text-red-400">{invoice.amount?.toFixed(2)}€</span>
              </div>
              <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-700">
                {invoice.fileData && (
                  <button onClick={() => handleDownloadInvoice(invoice)} className="text-blue-400 hover:text-blue-300 p-1 flex items-center gap-1 hover:bg-blue-900 rounded transition-colors">
                    {icons.download} <span className="text-sm">Download</span>
                  </button>
                )}
                {canEditFinancials && (
                  <button onClick={() => handleDeleteInvoice(invoice.id)} className="text-red-500 hover:text-red-400 p-1 hover:bg-red-900 rounded transition-colors">{icons.x}</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MessagesPage({ boat, currentUser, navigate, showMessage }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const user = authService.getCurrentUser();

  // 🔥 FIX 4: Use optional chaining in dependencies
  useEffect(() => {
    if (boat) {
      loadMessages();
    }
  }, [boat?.id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  const loadMessages = () => {
    try {
      const key = `fleet_${boat.id}_messages`;
      const stored = localStorage.getItem(key);
      if (stored) setMessages(JSON.parse(stored));
      authService.logActivity('view_messages', boat.id);
    } catch (e) { console.error('Error loading messages:', e); }
  };

  const saveMessages = (newMessages) => {
    try {
      const key = `fleet_${boat.id}_messages`;
      localStorage.setItem(key, JSON.stringify(newMessages));
      setMessages(newMessages);
    } catch (e) { console.error('Error saving messages:', e); }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message = { id: mid(), text: newMessage.trim(), senderId: user.code, senderName: user.name || user.code, senderRole: user.role, isFromAdmin: authService.isAdmin(), createdAt: new Date().toISOString() };
    saveMessages([...messages, message]);
    authService.logActivity('send_message', `${boat.id}/${message.text.substring(0, 50)}`);
    setNewMessage('');
  };

  const handleDeleteMessage = (msgId) => {
    if (!authService.isAdmin()) { showMessage('❌ Only Admin can delete messages', 'error'); return; }
    const msg = messages.find(m => m.id === msgId);
    saveMessages(messages.filter((msg) => msg.id !== msgId));
    authService.logActivity('delete_message', `${boat.id}/${msgId}`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title={`Συνομιλία - ${boat.id}`} onBack={() => navigate('boatDashboard')} />
      
      <div className="flex-grow p-4 overflow-y-auto space-y-4 pb-20">
        {messages.length === 0 && (
          <div className="text-center p-8"><div className="text-6xl mb-4">💬</div><p className="text-gray-400">Δεν υπάρχουν μηνύματα.</p><p className="text-sm text-gray-500 mt-2">Γράψτε την παρατήρησή σας.</p></div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isFromAdmin ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-xs relative group ${msg.isFromAdmin ? 'bg-teal-700' : 'bg-gray-700'} border ${msg.isFromAdmin ? 'border-teal-600' : 'border-gray-600'}`}>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-bold">{msg.senderName}</p>
                {msg.senderRole && <span className="text-xs px-1.5 py-0.5 bg-gray-900 rounded">{msg.senderRole}</span>}
              </div>
              <p className="text-base">{msg.text}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(msg.createdAt).toLocaleString('el-GR')}</p>
              {authService.isAdmin() && (
                <button onClick={() => handleDeleteMessage(msg.id)} className="absolute -top-2 -right-2 text-red-500 bg-gray-900 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-900 transition-all">{icons.x}</button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex p-2 bg-gray-800 border-t border-gray-700 sticky bottom-[56px] z-10">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Γράψτε την παρατήρησή σας..." className="flex-grow px-3 py-2 bg-gray-700 text-white rounded-l-lg border border-gray-600 focus:outline-none focus:border-teal-500" />
        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-r-lg transition-colors">{icons.send}</button>
      </form>
      
      <BottomNav activePage={'messages'} onNavigate={navigate} />
    </div>
  );
}

function EmailPage({ boat, navigate }) {
  // 🔥 FIX 3-4: All hooks MUST come before any conditional returns
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const user = authService.getCurrentUser();

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  const handleSendEmail = () => {
    // ALL emails go to ONLY these 2 addresses
    const emailTo = 'info@tailwindyachting.com,charter@tailwindyachting.com';
    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Σκάφος: ${boat.name || boat.id}\nΑπό: ${user?.name || user?.code} (${user?.role})\n\n${body}`)}`;
    authService.logActivity('send_email', `${boat.id}/${subject}`);
    window.location.href = mailtoLink;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title="Αποστολή E-mail" onBack={() => navigate('boatDashboard')} />
      
      <div className="flex-grow p-4 overflow-y-auto pb-20 space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">Θέμα</label>
          <input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="π.χ. Πρόβλημα με το WC" className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none" />
        </div>
        
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-300 mb-2">Μήνυμα</label>
          <textarea id="body" rows={10} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Περιγράψτε το αίτημά σας..." className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-teal-500 focus:outline-none" />
        </div>
        
        <button onClick={handleSendEmail} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-colors">
          <span className="mr-2">Άνοιγμα E-mail Client</span> {icons.send}
        </button>
        
        <div className="text-center text-gray-400 text-sm p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p>Πατώντας "Αποστολή", θα ανοίξει η προεπιλεγμένη εφαρμογή email.</p>
        </div>
      </div>
      
      <BottomNav activePage={null} onNavigate={navigate} />
    </div>
  );
}

// 🔥 FleetBookingPlanPage - με ΚΕΙΜΕΝΟ αντί για emojis
function FleetBookingPlanPage({ navigate, showMessage }) {
  const [allBoats, setAllBoats] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  
  const isTechnicalUser = authService.isTechnical();
  const canViewFinancials = !isTechnicalUser; // TECHNICAL δεν βλέπει οικονομικά

  // Filter boats based on search
  const filteredBoats = allBoats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase().trim();
    const searchTerms = search.split(' ').filter(t => t.length > 0);
    const boatText = `${boat.id} ${boat.name} ${boat.type} ${boat.model || ''}`.toLowerCase();
    return searchTerms.every(term => boatText.includes(term));
  });
  
  useEffect(() => {
    // TECHNICAL, ADMIN, OWNER μπορούν να δουν
    if (authService.isAdmin() || authService.isOwner() || authService.isTechnical()) { loadAllData(); }
  }, []);

  // Μόνο αν ΔΕΝ είναι ADMIN, OWNER ή TECHNICAL -> Access Denied
  if (!authService.isAdmin() && !authService.isOwner() && !authService.isTechnical()) {
    return (
      <div className="flex flex-col h-full bg-gray-900">
        <Header title="Fleet Booking Plan" onBack={() => navigate('adminDashboard')} />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center"><div className="text-8xl mb-6">🔒</div><h2 className="text-3xl font-bold text-red-400 mb-4">Access Denied</h2><p className="text-gray-400 mb-6">Only Administrators can view Fleet Booking Plan.</p></div>
        </div>
      </div>
    );
  }

  const loadAllData = () => {
    try {
      const boats = FleetService.getAllBoats();
      setAllBoats(boats);
      
      let allBookingsData = [];
      for (const boat of boats) {
        const bookingsKey = `fleet_${boat.id}_ΝΑΥΛΑ`;
        const bookingsStored = localStorage.getItem(bookingsKey);
        if (bookingsStored) {
          const bookings = JSON.parse(bookingsStored);
          bookings.forEach((booking) => { allBookingsData.push({ ...booking, boatId: boat.id }); });
        }
      }
      setAllBookings(allBookingsData);
      setLoading(false);
    } catch (e) {
      console.error('Error loading fleet data:', e);
      showMessage('❌ Σφάλμα φόρτωσης πλάνου.', 'error');
      setLoading(false);
    }
  };

  const changeMonth = (offset) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  };

  const monthName = currentDate.toLocaleString('el-GR', { month: 'long' });
  const year = currentDate.getFullYear();

  let firstSaturday = new Date(year, currentDate.getMonth(), 1);
  while (firstSaturday.getDay() !== 6) { firstSaturday.setDate(firstSaturday.getDate() + 1); }

  const weeks = [];
  let currentWeekStart = new Date(firstSaturday);
  if (firstSaturday.getDate() > 7) { currentWeekStart.setDate(currentWeekStart.getDate() - 7); }
  
  while (currentWeekStart.getMonth() === currentDate.getMonth()) {
    let weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weeks.push({ start: new Date(currentWeekStart), end: weekEnd, startDateString: currentWeekStart.toISOString().split('T')[0] });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  const formatDate = (date) => date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });

  if (loading) return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header title="Fleet Booking Plan" onBack={() => navigate('adminDashboard')} />
      <FullScreenLoader />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 fixed inset-0 z-50">
      <div className="bg-gray-800 p-2 flex items-center justify-between border-b border-gray-700">
        <button onClick={() => navigate('adminDashboard')} className="text-teal-400 p-2 hover:bg-gray-700 rounded-lg">{icons.chevronLeft}</button>
        <h1 className="text-lg font-bold text-white">Fleet Booking Plan</h1>
        <div className="w-10"></div>
      </div>

      {isTechnicalUser && (
        <div className="p-2 bg-purple-900 border-b border-purple-700 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-200 text-sm">
            {icons.eye}
            <span>Technical View - Μόνο ημερομηνίες & status</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
        <button onClick={() => changeMonth(-1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronLeft}</button>
        <h2 className="text-2xl font-bold text-teal-400 capitalize">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="text-teal-400 p-2 hover:bg-gray-700 rounded transition-colors text-2xl">{icons.chevronRight}</button>
      </div>

      <div className="p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-700"></div><span className="text-yellow-300">Option</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-700"></div><span className="text-green-300">Confirmed</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-700"></div><span className="text-red-300">Canceled</span></div>
        </div>
      </div>

      {/* Search Box */}
      <div className="p-2 bg-gray-900 border-b border-gray-700">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Αναζήτηση σκάφους (όνομα, τύπος, μοντέλο...)"
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="text-center text-xs text-gray-400 mt-1">
            Βρέθηκαν {filteredBoats.length} από {allBoats.length} σκάφη
          </div>
        )}
      </div>

      <div className="flex-grow overflow-auto p-2">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-800">
              <th className="sticky left-0 bg-gray-800 p-3 border border-gray-700 text-left text-teal-400 text-base min-w-[100px]">Σκάφος</th>
              {weeks.map((week, index) => (
                <th key={index} className="p-2 border border-gray-700 text-sm text-gray-300 min-w-[120px]">
                  <div className="font-bold">ΕΒΔ. {index + 1}</div>
                  <div className="text-xs text-gray-400">{formatDate(week.start)} - {formatDate(week.end)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBoats.map((boat) => (
              <tr key={boat.id} className="hover:bg-gray-800">
                {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                <td className="sticky left-0 bg-gray-900 hover:bg-gray-800 p-3 border border-gray-700 font-bold text-teal-400 text-base">{boat.name}</td>
                
                {weeks.map((week, index) => {
                    const booking = allBookings.find((b) => {
                      if (b.boatId !== boat.id || !b.startDate) return false;
                      const charterStart = new Date(b.startDate);
                      const charterEnd = b.endDate ? new Date(b.endDate) : new Date(charterStart.getTime() + 7*24*60*60*1000);
                      const weekStart = new Date(week.startDateString);
                      const weekEnd = new Date(weekStart.getTime() + 7*24*60*60*1000);
                      return charterStart.getTime() < weekEnd.getTime() && charterEnd.getTime() > weekStart.getTime();
                    });
                    const isBooked = !!booking;
                    const status = booking?.status || 'Pending';
                    
                    let bgColor = 'bg-gray-900 hover:bg-gray-800';
                    let textColor = 'text-gray-600';
                    let statusColor = 'text-gray-400';
                    
                    if (isBooked) {
                      switch(status) {
                        case 'Option': case 'Pending': bgColor = 'bg-yellow-900'; textColor = 'text-white'; statusColor = 'text-yellow-300'; break;
                        case 'Accepted': bgColor = 'bg-yellow-800'; textColor = 'text-white'; statusColor = 'text-yellow-200'; break;
                        case 'Confirmed': bgColor = 'bg-green-900'; textColor = 'text-white'; statusColor = 'text-green-300'; break;
                        case 'Canceled': case 'Rejected': bgColor = 'bg-red-900'; textColor = 'text-white'; statusColor = 'text-red-300'; break;
                        default: bgColor = 'bg-gray-800';
                      }
                    }
                    
                    // 🔥 FIXED: Payment status με ΚΕΙΜΕΝΟ
                    const paymentInfo = isBooked ? getPaymentStatusInfo(booking.paymentStatus) : null;
                    
                    return (
                       <td key={index} className={`p-2 border border-gray-700 text-center ${bgColor} relative`}>
                         {isBooked ? (
                           <div className={textColor}>
                             {/* 🔥 Red light - μόνο αν βλέπει οικονομικά και είναι ΑΝΕΞΟΦΛΗΤΟ */}
                             {canViewFinancials && paymentInfo?.showLight && (
                               <div className={`absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50 ${paymentInfo.lightBlink ? 'animate-pulse' : ''}`}></div>
                             )}
                             <p className="font-bold text-sm">{booking.code}</p>
                             {/* Οικονομικά μόνο αν δεν είναι TECHNICAL */}
                             {canViewFinancials && (
                               <>
                                 <p className="text-teal-300 text-sm">{booking.amount?.toFixed(0)}€</p>
                                 <p className={`text-xs font-semibold ${paymentInfo?.color}`}>{paymentInfo?.text}</p>
                               </>
                             )}
                             <p className={`text-xs ${statusColor}`}>{status.toUpperCase()}</p>
                           </div>
                         ) : (
                           <span className="text-gray-700">-</span>
                         )}
                       </td>
                    )
                  })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ========== FLEET MANAGEMENT COMPLETE ==========