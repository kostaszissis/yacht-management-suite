import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService, { getOwnerByBoatId } from './authService';
import AdminDashboard from './AdminDashboard';
import { codeMatches, textMatches } from './utils/searchUtils';
import { saveBookingSync, getBookingSync, syncToFleetFormat, fleetToSyncFormat } from './utils/bookingSyncUtils';
// 🔥 FIX 6 & 7: Import API functions for charter sync and vessels
// 🔥 FIX 16: Added API loading functions for multi-device sync
import { saveBooking, getVessels, getBookingsByVessel, deleteBooking, updateCharterPayments, updateCharterStatus, getBooking, getAllBookings, getTasksByVessel, saveTask, deleteTask, migrateTasksFromLocalStorage, getInvoicesByVessel, saveInvoice, deleteInvoice, migrateInvoicesFromLocalStorage, checkDuplicateCharterCode, checkDateOverlap } from './services/apiService';
// 🔥 FIX 23: Charter Party DOCX generation
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
// 🔥 Auto-refresh now handled globally in App.tsx (every 3 minutes)
// import { useAutoRefresh } from './hooks/useAutoRefresh';
// 🔥 FIX 35: Professional PDF generation service
import { generateOwnerCharterPDF } from './services/pdfTemplateService';
// 🔥 FIX 36: Professional HTML email service (no PDF attachment)
import { sendOwnerCharterEmail } from './services/emailTemplateService';

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

      // 🔥 FIX 37: Include owner details when adding boat
      boats.push({
        id: boat.id.toUpperCase(),
        name: boat.name,
        type: boat.type,
        model: boat.model || '',
        ownerCode: boat.ownerCode || '',
        ownerName: boat.ownerName || '',
        ownerEmail: boat.ownerEmail || '',
        ownerCompany: boat.ownerCompany || '',
        ownerTaxId: boat.ownerTaxId || '',
        ownerPhone: boat.ownerPhone || '',
        ownerAddress: boat.ownerAddress || '',
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
  returnArrow: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 10 4 15 9 20"></polyline><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>),
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
  // 🔥 FIX 37: User icon for owner details
  user: (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>),
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

// 🔥 FIX 36: Enhanced email function using professional HTML template service
// 🔥 FIX 38: Updated to use getOwnerByBoatId for owner details from AdminPanel
const sendCharterEmail = async (charter, boat, action) => {
  const boatName = typeof boat === 'string' ? boat : (boat.name || boat.id);
  const boatId = typeof boat === 'string' ? boat : boat.id;

  console.log('📧 sendCharterEmail CALLED (using HTML template service)');
  console.log('📧 Charter:', charter.code);
  console.log('📧 Boat:', boatName, '(ID:', boatId, ')');
  console.log('📧 Action:', action);

  try {
    authService.logActivity(`send_charter_${action}`, charter.code);

    // Map action to status for the email template
    let emailStatus = action;
    if (action === 'option_accepted') emailStatus = 'Option Accepted';
    else if (action === 'pending_final_confirmation') emailStatus = 'Pending Final Confirmation';
    else if (action === 'confirmed') emailStatus = 'Confirmed';
    else if (action === 'cancelled') emailStatus = 'Cancelled';
    else if (action === 'expired') emailStatus = 'Expired';
    else if (action === 'new_charter') emailStatus = 'Option';

    // 🔥 FIX 38: Fetch owner details from AdminPanel-managed data
    const ownerFromAdmin = getOwnerByBoatId(boatId);
    console.log('📧 Owner from AdminPanel:', ownerFromAdmin);

    // Create boat object for email service
    const boatData = {
      name: boatName,
      id: boatId,
      ownerCompany: ownerFromAdmin?.ownerCompany || 'OWNER'
    };

    // Create owner object for email service with full details from AdminPanel
    const ownerData = {
      company: ownerFromAdmin?.ownerCompany || '',
      name: ownerFromAdmin?.ownerName || '',
      email: ownerFromAdmin?.ownerEmail || '',
      phone: ownerFromAdmin?.ownerPhone || '',
      taxId: ownerFromAdmin?.ownerTaxId || '',
      address: ownerFromAdmin?.ownerAddress || ''
    };

    console.log('📧 Owner email will be sent to:', ownerData.email || '(not set - admin notifications only)');

    // 🔥 FIX 36: Use professional HTML email service (NO PDF attachment)
    const success = await sendOwnerCharterEmail(charter, boatData, ownerData, emailStatus);

    if (success) {
      console.log('📧 ✅ Professional HTML email sent successfully!');
    } else {
      console.error('📧 ❌ Failed to send HTML email');
    }

    return success;
  } catch (error) {
    console.error('📧 Email send error:', error);
    return false;
  }
};

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

  // 🔥 NEW: State for Page 1 bookings notification
  const [page1BookingsNeedingAmount, setPage1BookingsNeedingAmount] = useState<{
    count: number;
    firstBooking: any | null;
    boatId: string | null;
  }>({ count: 0, firstBooking: null, boatId: null });

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
      // 🔥 FIX: Use sessionStorage to match authService
      sessionStorage.setItem('auth_current_user', JSON.stringify(ownerUser));
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

  // 🔥 NEW: Scan for Page 1 bookings needing financial details
  useEffect(() => {
    const scanForPage1Bookings = async () => {
      let totalCount = 0;
      let firstBookingFound: any = null;
      let firstBoatId: string | null = null;

      // Get all boats
      const boats = FleetService.getAllBoats();

      // 🔥 API-only: Get all bookings from API
      try {
        const allBookings = await getAllBookings();

        for (const boat of boats) {
          // Filter bookings for this boat
          const charters = allBookings.filter((b: any) =>
            b.vesselId === boat.id ||
            b.vesselName?.toLowerCase() === boat.name?.toLowerCase()
          );

          // Find Page 1 bookings without amount
          const page1BookingsNeedingDetails = charters.filter((c: any) =>
            (c.source === 'page1' || c.status === 'Draft') &&
            (!c.amount || c.amount === 0)
          );

          if (page1BookingsNeedingDetails.length > 0) {
            totalCount += page1BookingsNeedingDetails.length;

            // Save first booking found for quick navigation
            if (!firstBookingFound) {
              firstBookingFound = page1BookingsNeedingDetails[0];
              firstBoatId = boat.id;
            }

            console.log(`📋 Boat ${boat.name}: ${page1BookingsNeedingDetails.length} Page 1 booking(s) need financial details`);
          }
        }
      } catch (e) {
        console.warn('Error scanning for Page 1 bookings:', e);
      }

      setPage1BookingsNeedingAmount({
        count: totalCount,
        firstBooking: firstBookingFound,
        boatId: firstBoatId
      });

      if (totalCount > 0) {
        console.log(`🔔 NOTIFICATION: ${totalCount} Page 1 booking(s) need financial details`);
      }
    };

    // Scan on mount and when page changes
    scanForPage1Bookings();

    // Re-scan every 30 seconds for new bookings
    const interval = setInterval(scanForPage1Bookings, 30000);
    return () => clearInterval(interval);
  }, [page, allBoats]);

  // 🔥 Handler to navigate to first Page 1 booking needing details
  const handleNotificationClick = () => {
    if (page1BookingsNeedingAmount.boatId && page1BookingsNeedingAmount.firstBooking) {
      const boats = FleetService.getAllBoats();
      const boat = boats.find(b => b.id === page1BookingsNeedingAmount.boatId);

      if (boat) {
        setBoatData(boat);
        setSelectedCategory('ΝΑΥΛΑ');  // 🔥 FIX: Use string not object
        setPage('details');
        showMessage(`📝 Μεταφορά στο ${boat.name} - Ναύλος: ${page1BookingsNeedingAmount.firstBooking.code}`, 'info');
      }
    }
  };

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

    console.log('🔍 FleetManagement: Scanning for Page 1 bookings...');
    console.log('📦 Available boats:', allBoats.map(b => `${b.id}:${b.name}`));

    // Load all boats in parallel for better performance
    await Promise.all(allBoats.map(async (boat: any) => {
      // Load charters from API ONLY
      let charters: any[] = [];
      try {
        charters = await getBookingsByVessel(boat.id);
        console.log(`📂 ${boat.name}: ${charters.length} charters from API`);
      } catch (e) {
        console.error(`❌ ${boat.name}: API failed, no charters loaded`);
        charters = [];
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

      // 🔥 Count Page 1 bookings (Draft status or source=page1)
      const draftCount = charters.filter((c: any) => c.status === 'Draft' || c.source === 'page1').length;

      // 🔥 DEBUG: Log Page 1 bookings per boat
      if (draftCount > 0) {
        console.log(`📋 BOAT ${boat.name}: ${draftCount} Page 1 booking(s)`,
          charters.filter((c: any) => c.status === 'Draft' || c.source === 'page1').map((c: any) => c.code)
        );
      }

      totalIncome += boatIncome;
      totalExpenses += boatExpenses;

      boatsData.push({
        id: boat.id,
        name: boat.name,
        income: boatIncome,
        expenses: boatExpenses,
        net: boatNet,
        chartersCount: charters.length,
        invoicesCount: invoices.length,
        draftCount: draftCount  // 🔥 Page 1 booking count
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
    } else if (categoryName === 'ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ') {
      // 🔥 FIX 37: Navigate to owner details page
      setPage('ownerDetails');
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
          onHome={handleLogout}
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
      case 'ownerDetails':
        // 🔥 FIX 37: Owner details page
        return <OwnerDetailsPage boat={boatData} navigate={navigatePage} showMessage={showMessage} />;
      case 'fleetBookingPlan':
        return <FleetBookingPlanPage navigate={setPage} showMessage={showMessage} />;
      default:
        return <p>Unknown page</p>;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 font-sans">
      <MessageDisplay message={message} />

      {/* 🔥 NEW: Page 1 Bookings Notification Banner */}
      {page1BookingsNeedingAmount.count > 0 && (
        <div
          onClick={handleNotificationClick}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 cursor-pointer hover:from-blue-700 hover:to-blue-900 transition-all shadow-lg border-b-2 border-blue-400"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-bounce">🔔</span>
              <div>
                <p className="font-bold text-sm">
                  {page1BookingsNeedingAmount.count} νέα ναύλα από Check-in
                </p>
                <p className="text-xs text-blue-200">
                  Χρειάζονται συμπλήρωση τιμής - Πατήστε για επεξεργασία
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500 px-3 py-1 rounded-full text-sm font-bold">
                {page1BookingsNeedingAmount.count}
              </span>
              <span className="text-xl">→</span>
            </div>
          </div>
        </div>
      )}

      <div className={`h-full w-full max-w-lg mx-auto bg-gray-900 shadow-2xl overflow-hidden ${page1BookingsNeedingAmount.count > 0 ? 'pt-16' : ''}`}>
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

function Header({ title, onBack, onHome = null }) {
  const user = authService.getCurrentUser();

  return (
    <div className="bg-gray-800 p-4 shadow-md flex items-center justify-between sticky top-0 z-20 w-full max-w-lg mx-auto border-b border-gray-700">
      {/* LEFT: Home emoji - logout AND navigate to HomePage */}
      {onHome && (
        <button
          onClick={onHome}
          className="p-2 -ml-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center"
          title="Αποσύνδεση & Επιστροφή στην Αρχική"
        >
          <span className="text-2xl">🏠</span>
          <span className="text-[10px] text-red-400 mt-0.5">Home</span>
        </button>
      )}
      {!onHome && <div className="w-12"></div>}

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

      {/* RIGHT: Return arrow - just navigate back, NO logout */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-teal-400 p-2 -mr-2 hover:bg-gray-700 rounded-lg transition-colors flex flex-col items-center"
          title="Πίσω (παραμένετε συνδεδεμένοι)"
        >
          {icons.returnArrow}
          <span className="text-[10px] mt-0.5">Return</span>
        </button>
      )}
      {!onBack && <div className="w-12"></div>}
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
    model: '',
    // 🔥 FIX 37: Owner details fields
    ownerCode: '',
    ownerName: '',
    ownerEmail: '',
    ownerCompany: '',
    ownerTaxId: '',
    ownerPhone: '',
    ownerAddress: ''
  });
  const [error, setError] = useState('');
  const [existingOwners, setExistingOwners] = useState<any[]>([]);

  // 🔥 FIX 37: Load existing owners for auto-fill
  useEffect(() => {
    const owners = authService.getAllOwnerCodes();
    setExistingOwners(owners);
  }, []);

  // 🔥 FIX 37: Auto-fill owner details when owner code is selected
  const handleOwnerCodeChange = (code: string) => {
    setNewBoat(prev => ({ ...prev, ownerCode: code }));

    if (code) {
      // Find existing owner with this code
      const existingOwner = existingOwners.find(o => codeMatches(o.code, code));
      if (existingOwner) {
        setNewBoat(prev => ({
          ...prev,
          ownerCode: code,
          ownerName: existingOwner.ownerName || '',
          ownerEmail: existingOwner.ownerEmail || '',
          ownerCompany: existingOwner.ownerCompany || '',
          ownerTaxId: existingOwner.ownerTaxId || '',
          ownerPhone: existingOwner.ownerPhone || '',
          ownerAddress: existingOwner.ownerAddress || ''
        }));
      }
    }
  };

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

    // 🔥 FIX 37: Validate email if provided
    if (newBoat.ownerEmail && !newBoat.ownerEmail.includes('@')) {
      setError('Παρακαλώ εισάγετε έγκυρο email!');
      return;
    }

    try {
      // 🔥 FIX 37: Add boat with owner details
      FleetService.addBoat({
        id: newBoat.id.trim(),
        name: newBoat.name.trim(),
        type: newBoat.type,
        model: newBoat.model.trim(),
        ownerCode: newBoat.ownerCode.trim(),
        ownerName: newBoat.ownerName.trim(),
        ownerEmail: newBoat.ownerEmail.trim(),
        ownerCompany: newBoat.ownerCompany.trim(),
        ownerTaxId: newBoat.ownerTaxId.trim(),
        ownerPhone: newBoat.ownerPhone.trim(),
        ownerAddress: newBoat.ownerAddress.trim()
      });

      globalShowMessage(`Το σκάφος ${newBoat.id} προστέθηκε επιτυχώς!`, 'success');
      onBoatAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 my-8">
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

          {/* 🔥 FIX 37: Owner Details Section */}
          <div className="border-t border-cyan-500 pt-4 mt-4">
            <h3 className="text-lg font-bold text-cyan-400 mb-3">👤 Στοιχεία Ιδιοκτήτη</h3>

            {/* Owner Code Selection with Auto-fill */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Κωδικός Ιδιοκτήτη (υπάρχων)
              </label>
              <select
                value={newBoat.ownerCode}
                onChange={(e) => handleOwnerCodeChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="">-- Επιλέξτε ή εισάγετε νέο --</option>
                {existingOwners.map(owner => (
                  <option key={owner.code} value={owner.code}>
                    {owner.code} {owner.ownerName ? `(${owner.ownerName})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">Επιλέξτε για αυτόματη συμπλήρωση στοιχείων</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Όνομα Ιδιοκτήτη
                </label>
                <input
                  type="text"
                  value={newBoat.ownerName}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerName: e.target.value })}
                  placeholder="Ονοματεπώνυμο"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cyan-300 mb-2">
                  Email Ιδιοκτήτη ⭐
                </label>
                <input
                  type="email"
                  value={newBoat.ownerEmail}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerEmail: e.target.value })}
                  placeholder="owner@email.com"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border-2 border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Εταιρεία
                </label>
                <input
                  type="text"
                  value={newBoat.ownerCompany}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerCompany: e.target.value })}
                  placeholder="Εταιρεία ΕΠΕ"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ΑΦΜ
                </label>
                <input
                  type="text"
                  value={newBoat.ownerTaxId}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerTaxId: e.target.value })}
                  placeholder="123456789"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Τηλέφωνο
                </label>
                <input
                  type="tel"
                  value={newBoat.ownerPhone}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerPhone: e.target.value })}
                  placeholder="+30 697 1234567"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Διεύθυνση
                </label>
                <input
                  type="text"
                  value={newBoat.ownerAddress}
                  onChange={(e) => setNewBoat({ ...newBoat, ownerAddress: e.target.value })}
                  placeholder="Οδός, Πόλη, ΤΚ"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
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
    page1Charters: { enabled: false, mode: 'all', bookings: [] }, // 🔥 NEW: Page 1 bookings
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

  // 🔥 NEW: State for fetched bookings from API
  const [apiBookings, setApiBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // 🔥 NEW: Fetch bookings from API when page1Charters is expanded
  const fetchBookingsFromAPI = async () => {
    setLoadingBookings(true);
    try {
      const response = await fetch('/api/bookings.php');
      const data = await response.json();
      if (data.success && data.bookings) {
        const bookingsList = Array.isArray(data.bookings) ? data.bookings : Object.values(data.bookings);
        setApiBookings(bookingsList);
        console.log('✅ Fetched', bookingsList.length, 'bookings from API');
      } else {
        setApiBookings([]);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      setApiBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const dataTypes = [
    { key: 'charters', label: 'Ναύλοι (localStorage)', icon: '⚓', storageKey: 'ΝΑΥΛΑ', hasBoats: true },
    { key: 'page1Charters', label: 'Ναύλοι Page 1 (Database)', icon: '📝', hasBoats: false, hasBookings: true }, // 🔥 NEW
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

  // 🔥 NEW: Toggle individual booking selection for page1Charters
  const toggleBookingSelection = (bookingCode: string) => {
    setSelectedItems(prev => {
      const currentBookings = prev.page1Charters.bookings || [];
      const newBookings = currentBookings.includes(bookingCode)
        ? currentBookings.filter(code => code !== bookingCode)
        : [...currentBookings, bookingCode];
      return {
        ...prev,
        page1Charters: { ...prev.page1Charters, bookings: newBookings }
      };
    });
  };

  // 🔥 NEW: Select/deselect all bookings
  const selectAllBookings = () => {
    setSelectedItems(prev => {
      const currentBookings = prev.page1Charters.bookings || [];
      const newBookings = currentBookings.length === apiBookings.length
        ? []
        : apiBookings.map(b => b.code || b.bookingCode || b.id);
      return {
        ...prev,
        page1Charters: { ...prev.page1Charters, bookings: newBookings }
      };
    });
  };

  const getSelectedCount = () => {
    return Object.values(selectedItems).filter(item => item.enabled).length;
  };

  const isValidSelection = () => {
    for (const [key, value] of Object.entries(selectedItems)) {
      const item = value as any;
      // 🔥 Handle page1Charters separately (uses bookings instead of boats)
      if (key === 'page1Charters') {
        if (item.enabled && item.mode === 'selective' && (!item.bookings || item.bookings.length === 0)) {
          return false;
        }
      } else if (item.enabled && item.mode === 'selective' && item.boats?.length === 0) {
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

  const handleConfirmDelete = async () => {
    const employee = authService.getEmployeeByCode(adminCode);
    if (!employee || employee.role !== 'ADMIN') {
      setError('❌ Λάθος κωδικός Admin! Η διαγραφή ακυρώθηκε.');
      return;
    }

    let deletedCount = 0;
    const apiErrors: string[] = [];

    // Helper function to delete from database API
    const deleteFromDatabase = async (type: string): Promise<number> => {
      try {
        const response = await fetch('/api/delete-all.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type })
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Database delete (${type}):`, result);
          return result.deleted_count || 0;
        } else {
          console.error(`❌ Database delete (${type}) failed:`, result.error);
          apiErrors.push(`${type}: ${result.error}`);
          return 0;
        }
      } catch (error) {
        console.error(`❌ Database delete (${type}) error:`, error);
        apiErrors.push(`${type}: Network error`);
        return 0;
      }
    };

    // Process each data type
    for (const dataType of dataTypes) {
      const item = selectedItems[dataType.key];
      if (!item.enabled) continue;

      if (dataType.key === 'activityLogs') {
        authService.clearActivityLogs();
        deletedCount++;
        continue;
      }

      // 🔥 NEW: Handle page1Charters separately (deletes from database)
      if (dataType.key === 'page1Charters') {
        const page1Item = selectedItems.page1Charters;

        if (page1Item.mode === 'all') {
          // Delete ALL bookings from database
          const dbCount = await deleteFromDatabase('bookings');
          deletedCount += dbCount;
          console.log('🧹 Cleared all Page 1 bookings from database');
        } else if (page1Item.mode === 'selective' && page1Item.bookings?.length > 0) {
          // Delete selected bookings one by one from API
          for (const bookingCode of page1Item.bookings) {
            try {
              const response = await fetch(`/api/bookings.php?booking_number=${encodeURIComponent(bookingCode)}`, {
                method: 'DELETE'
              });
              const result = await response.json();
              if (result.success) {
                console.log(`✅ Deleted booking: ${bookingCode}`);
                deletedCount++;
              } else {
                console.error(`❌ Failed to delete ${bookingCode}:`, result.error);
                apiErrors.push(`${bookingCode}: ${result.error}`);
              }
            } catch (error) {
              console.error(`❌ Error deleting ${bookingCode}:`, error);
              apiErrors.push(`${bookingCode}: Network error`);
            }
          }
          console.log(`🧹 Deleted ${page1Item.bookings.length} selected bookings`);
        }
        continue;
      }

      // Skip page1Charters in regular processing (handled above)
      if (!dataType.storageKey) continue;

      // Delete from localStorage
      const boatsToDelete = item.mode === 'all' ? boats : boats.filter(b => item.boats.includes(b.id));

      boatsToDelete.forEach(boat => {
        const storageKey = `fleet_${boat.id}_${dataType.storageKey}`;
        localStorage.removeItem(storageKey);
        deletedCount++;
      });

      // Delete from database API (only for types that have database tables)
      if (item.mode === 'all') {
        if (dataType.key === 'charters') {
          // Delete ALL bookings from database
          const dbCount = await deleteFromDatabase('bookings');
          deletedCount += dbCount;
        } else if (dataType.key === 'messages') {
          // Delete ALL chats and messages from database
          const dbCount = await deleteFromDatabase('chats');
          deletedCount += dbCount;
        }
      }
    }

    authService.logActivity('clear_data', `Deleted ${deletedCount} data items`);

    // Data deleted from API - UI will refresh from API on next load

    if (apiErrors.length > 0) {
      globalShowMessage(`⚠️ Διαγράφηκαν ${deletedCount} στοιχεία (με σφάλματα: ${apiErrors.join(', ')})`, 'warning');
    } else {
      globalShowMessage(`✅ Διαγράφηκαν ${deletedCount} στοιχεία δεδομένων!`, 'success');
    }
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
      } else if (dataType.key === 'page1Charters') {
        // Handle page1Charters separately (uses bookings)
        if (item.mode === 'all') {
          summary.push({ icon: dataType.icon, label: dataType.label, detail: 'Όλες οι κρατήσεις' });
        } else {
          const count = selectedItems.page1Charters.bookings?.length || 0;
          summary.push({ icon: dataType.icon, label: dataType.label, detail: `${count} κρατήσεις` });
        }
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

                      {/* 🔥 NEW: Options for page1Charters (uses bookings instead of boats) */}
                      {item.enabled && dataType.hasBookings && (
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
                                if (apiBookings.length === 0) {
                                  fetchBookingsFromAPI();
                                }
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

                          {/* Booking selection */}
                          {item.mode === 'selective' && (
                            <div className="mt-3 p-2 bg-gray-800 rounded-lg max-h-60 overflow-y-auto">
                              {loadingBookings ? (
                                <div className="text-center py-4">
                                  <span className="text-gray-400">⏳ Φόρτωση κρατήσεων...</span>
                                </div>
                              ) : apiBookings.length === 0 ? (
                                <div className="text-center py-4">
                                  <span className="text-gray-400">Δεν υπάρχουν κρατήσεις</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">
                                      Επιλέξτε κρατήσεις ({selectedItems.page1Charters.bookings?.length || 0}/{apiBookings.length}):
                                    </span>
                                    <button
                                      onClick={selectAllBookings}
                                      className="text-xs text-teal-400 hover:text-teal-300"
                                    >
                                      {selectedItems.page1Charters.bookings?.length === apiBookings.length ? 'Κανένα' : 'Όλα'}
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {apiBookings.map(booking => {
                                      const bookingCode = booking.code || booking.bookingCode || booking.booking_number || booking.id;
                                      const isSelected = selectedItems.page1Charters.bookings?.includes(bookingCode);
                                      return (
                                        <button
                                          key={bookingCode}
                                          onClick={() => toggleBookingSelection(bookingCode)}
                                          className={`w-full p-2 rounded text-left text-xs ${
                                            isSelected
                                              ? 'bg-orange-600 text-white'
                                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                          }`}
                                        >
                                          <div className="flex justify-between items-center">
                                            <span className="font-bold">{bookingCode}</span>
                                            <span className={isSelected ? 'text-white' : 'text-gray-400'}>
                                              {isSelected ? '✓' : ''}
                                            </span>
                                          </div>
                                          <div className="text-xs opacity-75 mt-1">
                                            {booking.vesselName || booking.vessel_name || booking.vessel || '-'} | {
                                              booking.startDate || booking.start_date || booking.checkInDate || '-'
                                            }
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
                              {item.mode === 'selective' && selectedItems.page1Charters.bookings?.length === 0 && !loadingBookings && apiBookings.length > 0 && (
                                <p className="text-xs text-red-400 mt-2">⚠️ Επιλέξτε τουλάχιστον μία κράτηση</p>
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

  // Filter boats based on search (case-insensitive)
  const filteredBoats = financialsData.boats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const fullBoat = boats.find(b => b.id === boat.id);
    const boatText = `${boat.id} ${boat.name || ''} ${fullBoat?.type || ''} ${fullBoat?.model || ''}`;
    return textMatches(boatText, searchTerm);
  });

  // 🔥 API-first: Load boat details from API, with localStorage fallback
  const loadBoatDetails = async (boatId) => {
    setSelectedBoat(boatId);

    // Load charters from API ONLY
    let charters = [];
    try {
      charters = await getBookingsByVessel(boatId);
      console.log(`✅ Loaded ${charters.length} charters for boat ${boatId} from API`);
    } catch (e) {
      console.error(`❌ API failed for boat ${boatId}, no charters loaded`);
      charters = [];
    }

    // 🔥 Load invoices from API first, fallback to localStorage
    let invoices = [];
    try {
      invoices = await getInvoicesByVessel(boatId);
      console.log(`✅ Loaded ${invoices.length} invoices for boat ${boatId} from API`);
    } catch (e) {
      console.error(`❌ API failed for invoices, falling back to localStorage`);
      const invoicesKey = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
      const invoicesStored = localStorage.getItem(invoicesKey);
      invoices = invoicesStored ? JSON.parse(invoicesStored) : [];
    }

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
            {filteredBoats.map(boat => {
              const hasPage1Bookings = boat.draftCount > 0;

              return (
                <button
                  key={boat.id}
                  onClick={() => loadBoatDetails(boat.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                    selectedBoat === boat.id
                      ? 'bg-teal-700 border-teal-500'
                      : hasPage1Bookings
                        ? 'bg-blue-900/50 border-blue-500 hover:bg-blue-800/50'
                        : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                  }`}
                >
                  {/* 📝 Page 1 booking badge - prominent at top */}
                  {hasPage1Bookings && (
                    <div className="mb-2 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded inline-flex items-center gap-1">
                      📝 {boat.draftCount === 1 ? 'Νέο ναύλο από Check-in' : `${boat.draftCount} νέα ναύλα από Check-in`}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{boat.name || boat.id}</span>
                  </div>
                  <div className={`text-lg font-bold ${boat.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(boat.net)}
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-green-400">{formatCurrency(boat.income)}</span>
                    <span className="text-red-400">{formatCurrency(boat.expenses)}</span>
                  </div>
                </button>
              );
            })}
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
                              charter.status === 'CONFIRMED' || charter.status === 'confirmed' || charter.status === 'Confirmed' ? 'bg-green-500 text-white' :
                              charter.status === 'CANCELLED' || charter.status === 'cancelled' || charter.status === 'Cancelled' || charter.status === 'Canceled' ? 'bg-red-500 text-white' :
                              'bg-yellow-400 text-black'
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
    { name: 'ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ', icon: icons.user, description: 'Στοιχεία ιδιοκτήτη σκάφους' },  // 🔥 FIX 37
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
        // 🔥 FIX 37: ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ - μόνο για admin που μπορεί να διαχειριστεί στόλο
        if (cat.name === 'ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ') return authService.canManageFleet();
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

  // 🔥 FIX: Charter card colors - YELLOW (#FBBF24), GREEN (#10B981), RED
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Option':
      case 'option':
      case 'OPTION':
      case 'Pending':
      case 'pending':
      case 'PENDING':
      case 'Reservation':
      case 'reservation':
      case 'RESERVATION':
      case 'Option Accepted':
      case 'option_accepted':
      case 'OPTION_ACCEPTED':
      case 'Pending Final Confirmation':
      case 'pending_final_confirmation':
      case 'PENDING_FINAL_CONFIRMATION':
      case 'Accepted':
      case 'accepted':
      case 'ACCEPTED':
        return { bg: 'bg-yellow-400', text: 'text-black', status: 'text-black' }; // YELLOW #FBBF24
      case 'Confirmed':
      case 'confirmed':
      case 'CONFIRMED':
        return { bg: 'bg-green-500', text: 'text-white', status: 'text-white' }; // GREEN #10B981
      case 'Canceled':
      case 'Cancelled':
      case 'Rejected':
      case 'cancelled':
      case 'CANCELLED':
      case 'CANCELED':
      case 'REJECTED':
        return { bg: 'bg-red-500', text: 'text-white', status: 'text-white' }; // RED
      case 'Expired':
      case 'expired':
      case 'EXPIRED':
        return { bg: 'bg-gray-700', text: 'text-white', status: 'text-gray-300' };
      default:
        // 🔥 FALLBACK: Any unknown status defaults to YELLOW (pending)
        return { bg: 'bg-yellow-400', text: 'text-black', status: 'text-black' };
    }
  };

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      <div className="p-2 border-b border-sky-300" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        {/* 🔥 FIX: Legend colors - YELLOW (#FBBF24), GREEN (#10B981), RED */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className="text-yellow-600 font-semibold">Option</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-green-600 font-semibold">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-red-600 font-semibold">Canceled</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center p-2 border-b border-sky-300" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <button onClick={() => changeMonth(-1)} className="text-blue-800 p-2 hover:bg-blue-300/50 rounded transition-colors text-2xl">{icons.chevronLeft}</button>
        <h2 className="text-2xl font-bold text-blue-900 capitalize">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="text-blue-800 p-2 hover:bg-blue-300/50 rounded transition-colors text-2xl">{icons.chevronRight}</button>
      </div>

      <div className="flex-grow overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
              <th className="sticky left-0 p-3 border border-sky-300 text-left text-blue-900 text-base min-w-[100px] font-bold" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>Σκάφος</th>
              {weeks.map((week, index) => (
                <th key={index} className="p-2 border border-sky-300 text-sm text-blue-800 min-w-[120px]">
                  <div className="font-bold">ΕΒΔ. {index + 1}</div>
                  <div className="text-xs text-blue-700">{formatDate(week.start)} - {formatDate(week.end)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {boatIds.map((boatId) => {
              const boatData = allBoatsData[boatId];
              const charters = boatData?.charters || [];

              return (
                <tr key={boatId} className="hover:bg-sky-100">
                  {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                  <td className="sticky left-0 bg-sky-50 p-3 border border-sky-300 font-bold text-blue-800 text-base">{getBoatName(boatId)}</td>
                  
                  {weeks.map((week, index) => {
                    // 🔥 FIX 29: Charter displays ONLY in the week where check-in date falls (no spanning)
                    const charter = charters.find((c) => {
                      if (!c.startDate) return false;
                      const charterStart = new Date(c.startDate);
                      const weekStart = new Date(week.startDateString);
                      const weekEnd = new Date(weekStart.getTime() + 7*24*60*60*1000);

                      // Charter appears ONLY in the week where its START DATE falls
                      return charterStart.getTime() >= weekStart.getTime() && charterStart.getTime() < weekEnd.getTime();
                    });
                    const style = charter ? getStatusStyle(charter.status) : { bg: 'bg-sky-50', text: 'text-sky-400', status: 'text-sky-400' };
                    
                    // 🔥 FIXED: Payment status με ΚΕΙΜΕΝΟ
                    const paymentInfo = charter ? getPaymentStatusInfo(charter.paymentStatus) : null;
                    
                    return (
                      <td key={index} className={`p-2 border border-sky-300 text-center ${style.bg} relative`}>
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
                          <span className="text-sky-300">-</span>
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
  
  // Filter boatIds based on search (case-insensitive)
  const filteredBoatIds = boatIds.filter(boatId => {
    if (!searchTerm.trim()) return true;
    const boat = allBoats.find(b => b.id === boatId);
    const boatText = `${boatId} ${boat?.name || ''} ${boat?.type || ''} ${boat?.model || ''}`;
    return textMatches(boatText, searchTerm);
  });
  
  useEffect(() => {
    loadAllBoatsData();
  }, [boatIds]);

  // 🔥 FIX 16: Load boat data from API first, merge with localStorage
  const loadAllBoatsData = async () => {
    const data: { [key: string]: { charters: any[], invoices: any[], documents: any[] } } = {};

    // Load all boats in parallel for better performance
    await Promise.all(boatIds.map(async (boatId: any) => {
      // Load charters from API ONLY
      let charters = [];
      try {
        charters = await getBookingsByVessel(boatId);
        console.log(`✅ FleetSummary: Loaded ${charters.length} charters for boat ${boatId} from API`);
      } catch (e) {
        console.error(`❌ API failed for boat ${boatId}, no charters loaded`);
        charters = [];
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

  // 🔥 Auto-refresh: Memoized loadBookings function - API-only
  const loadBookings = useCallback(async () => {
    if (!boat) return;
    try {
      // 🔥 API-only: Load bookings from API
      const apiBookings = await getBookingsByVessel(boat.id);
      setBookings(apiBookings || []);
      setLoading(false);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Error loading bookings from API:', e);
      setBookings([]); // No localStorage fallback
      setLoading(false);
    }
  }, [boat]);

  // 🔥 REMOVED: Local 5-minute refresh - now using global 3-minute refresh from App.tsx
  // const { isRefreshing } = useAutoRefresh(loadBookings, 5);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔥 NEW: Listen for global refresh events from App.tsx (every 3 minutes)
  useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🔄 FleetManagement: Global refresh received, reloading bookings...');
      setIsRefreshing(true);
      loadBookings().finally(() => {
        setTimeout(() => setIsRefreshing(false), 1000);
      });
    };

    window.addEventListener('globalBookingsRefreshed', handleGlobalRefresh);
    return () => window.removeEventListener('globalBookingsRefreshed', handleGlobalRefresh);
  }, [loadBookings]);

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

  const cycleBookingStatus = async (booking) => {
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

    // 🔥 API-only: Update status via API
    try {
      const bookingNumber = booking.bookingNumber || booking.code || booking.id;
      const updatedBooking = {
        ...booking,
        status: newStatus,
        updatedBy: authService.getCurrentUser()?.name,
        updatedAt: new Date().toISOString()
      };
      await saveBooking(bookingNumber, { bookingData: updatedBooking });

      // Update local state
      const updated = bookings.map((b: any) =>
        b.id === booking.id ? updatedBooking : b
      );
      setBookings(updated);
      showMessage(`✅ Status άλλαξε σε ${newStatus}`, 'success');
    } catch (e) {
      console.error('Error updating status via API:', e);
      showMessage('❌ Σφάλμα αποθήκευσης status', 'error');
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
    
    // 🔥 FIX 29: Charter displays ONLY in the week where check-in date falls (no spanning)
    const booking = bookings.find((b) => {
      if (!b.startDate) return false;
      const charterStart = new Date(b.startDate);
      const weekStartTime = currentWeekStart.getTime();
      const weekEndTime = weekEnd.getTime();

      // Charter appears ONLY in the week where its START DATE falls
      return charterStart.getTime() >= weekStartTime && charterStart.getTime() < weekEndTime;
    });

    weeks.push({ start: new Date(currentWeekStart), end: weekEnd, booking: booking || null });
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  const formatDate = (date) => date.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit' });

  // 🔥 FIX: Charter card colors - YELLOW (#FBBF24), GREEN (#10B981), RED
  const getStatusColor = (status) => {
    switch(status) {
      case 'Option':
      case 'option':
      case 'OPTION':
      case 'Pending':
      case 'pending':
      case 'PENDING':
      case 'Reservation':
      case 'reservation':
      case 'RESERVATION':
      case 'Accepted':
      case 'accepted':
      case 'ACCEPTED':
      case 'Option Accepted':
      case 'option_accepted':
      case 'OPTION_ACCEPTED':
      case 'Pending Final Confirmation':
      case 'pending_final_confirmation':
      case 'PENDING_FINAL_CONFIRMATION':
        return 'bg-yellow-400 border-yellow-300'; // YELLOW #FBBF24
      case 'Confirmed':
      case 'confirmed':
      case 'CONFIRMED':
        return 'bg-green-500 border-green-400'; // GREEN #10B981
      case 'Canceled':
      case 'Cancelled':
      case 'Rejected':
      case 'cancelled':
      case 'CANCELLED':
      case 'CANCELED':
      case 'REJECTED':
        return 'bg-red-500 border-red-400'; // RED
      case 'Expired':
      case 'expired':
      case 'EXPIRED':
        return 'bg-gray-500 border-gray-400';
      default:
        // 🔥 FALLBACK: Any unknown status defaults to YELLOW (pending)
        return 'bg-yellow-400 border-yellow-300';
    }
  };

  // 🔥 FIX: Charter card colors - YELLOW (#FBBF24), GREEN (#10B981), RED
  const getStatusText = (status) => {
    switch(status) {
      case 'Option':
      case 'option':
      case 'OPTION':
      case 'Pending':
      case 'pending':
      case 'PENDING':
        return { text: 'OPTION', color: 'text-black', bg: 'bg-yellow-400' }; // YELLOW #FBBF24
      case 'Reservation':
      case 'reservation':
      case 'RESERVATION':
        return { text: 'RESERVATION', color: 'text-black', bg: 'bg-yellow-400' }; // YELLOW #FBBF24
      case 'Option Accepted':
      case 'option_accepted':
      case 'OPTION_ACCEPTED':
      case 'Accepted':
      case 'accepted':
      case 'ACCEPTED':
        return { text: 'OPTION ACCEPTED', color: 'text-black', bg: 'bg-yellow-400' }; // YELLOW #FBBF24
      case 'Pending Final Confirmation':
      case 'pending_final_confirmation':
      case 'PENDING_FINAL_CONFIRMATION':
        return { text: 'ΑΝΑΜΟΝΗ ΤΕΛΙΚΗΣ ΕΠΙΒΕΒΑΙΩΣΗΣ', color: 'text-black', bg: 'bg-yellow-400' }; // YELLOW #FBBF24
      case 'Confirmed':
      case 'confirmed':
      case 'CONFIRMED':
        return { text: 'CONFIRMED', color: 'text-white', bg: 'bg-green-500' }; // GREEN #10B981
      case 'Cancelled':
      case 'Canceled':
      case 'cancelled':
      case 'CANCELLED':
      case 'CANCELED':
        return { text: 'CANCELLED', color: 'text-white', bg: 'bg-red-500' }; // RED
      case 'Rejected':
      case 'REJECTED':
        return { text: 'REJECTED', color: 'text-white', bg: 'bg-red-500' }; // RED
      case 'Expired':
      case 'expired':
      case 'EXPIRED':
        return { text: 'EXPIRED', color: 'text-white', bg: 'bg-gray-500' };
      default:
        // 🔥 FALLBACK: Any unknown status defaults to YELLOW (pending)
        return { text: status?.toUpperCase() || 'PENDING', color: 'text-black', bg: 'bg-yellow-400' };
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
          <div className="flex items-center">
            <span className="text-xs text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</span>
            {isRefreshing && (
              <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full animate-pulse">
                🔄 Updating...
              </span>
            )}
          </div>
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
        {/* 🔥 FIX: Legend colors - YELLOW (#FBBF24), GREEN (#10B981), RED */}
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-yellow-400"></div>
            <span className="text-yellow-400">Option</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-green-400">Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-red-400">Canceled</span>
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
        // 🔥 FIX 37: Added all owner details fields
        const defaultDetails = {
          'Όνομα Ιδιοκτήτη': '',
          'Email Ιδιοκτήτη': '',
          'Εταιρεία': '',
          'ΑΦΜ': '',
          'Τηλέφωνο Ιδιοκτήτη': '',
          'Διεύθυνση Ιδιοκτήτη': '',
          'Flag': 'Greek',
          'Port of Registry': 'Piraeus',
          'Builder/Year': '',
          'LOA (Length)': '',
          'Beam (Width)': '',
          'Draft': '',
          'Engines': '',
          'Fuel Capacity': '',
          'Water Capacity': '',
          'Insurance Company': '',
          'Insurance Policy Number': ''
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

            {/* 🔥 FIX 37: Dedicated Owner Details Section */}
            <div className="mb-6 p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg border-2 border-cyan-500">
              <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
                👤 Στοιχεία Ιδιοκτήτη
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Owner Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Όνομα Ιδιοκτήτη</label>
                  <input
                    type="text"
                    value={boatDetails['Όνομα Ιδιοκτήτη'] || ''}
                    onChange={(e) => handleDetailChange('Όνομα Ιδιοκτήτη', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                    placeholder="Ονοματεπώνυμο"
                  />
                </div>
                {/* Owner Email */}
                <div>
                  <label className="block text-sm font-semibold text-cyan-300 mb-1">Email Ιδιοκτήτη ⭐</label>
                  <input
                    type="email"
                    value={boatDetails['Email Ιδιοκτήτη'] || ''}
                    onChange={(e) => handleDetailChange('Email Ιδιοκτήτη', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border-2 border-cyan-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-400 focus:outline-none'}`}
                    placeholder="owner@email.com"
                  />
                </div>
                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Εταιρεία</label>
                  <input
                    type="text"
                    value={boatDetails['Εταιρεία'] || ''}
                    onChange={(e) => handleDetailChange('Εταιρεία', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                    placeholder="Εταιρεία ΕΠΕ"
                  />
                </div>
                {/* Tax ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">ΑΦΜ</label>
                  <input
                    type="text"
                    value={boatDetails['ΑΦΜ'] || ''}
                    onChange={(e) => handleDetailChange('ΑΦΜ', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                    placeholder="123456789"
                  />
                </div>
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Τηλέφωνο</label>
                  <input
                    type="tel"
                    value={boatDetails['Τηλέφωνο Ιδιοκτήτη'] || ''}
                    onChange={(e) => handleDetailChange('Τηλέφωνο Ιδιοκτήτη', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                    placeholder="+30 697 1234567"
                  />
                </div>
                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Διεύθυνση</label>
                  <input
                    type="text"
                    value={boatDetails['Διεύθυνση Ιδιοκτήτη'] || ''}
                    onChange={(e) => handleDetailChange('Διεύθυνση Ιδιοκτήτη', e.target.value)}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                    placeholder="Οδός, Πόλη, ΤΚ"
                  />
                </div>
              </div>
            </div>

            {/* Other Technical Details */}
            <h4 className="text-md font-bold text-gray-400 mb-3 mt-4">📋 Τεχνικά Στοιχεία</h4>
            <div className="space-y-4">
              {Object.entries(boatDetails)
                .filter(([field]) => !['Όνομα Ιδιοκτήτη', 'Email Ιδιοκτήτη', 'Εταιρεία', 'ΑΦΜ', 'Τηλέφωνο Ιδιοκτήτη', 'Διεύθυνση Ιδιοκτήτη'].includes(field))
                .map(([field, value]) => (
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

// =====================================================
// 🔥 FIX 37: OWNER DETAILS PAGE - Dedicated page for owner information
// =====================================================
function OwnerDetailsPage({ boat, navigate, showMessage }) {
  const [ownerDetails, setOwnerDetails] = useState({
    'Όνομα Ιδιοκτήτη': '',
    'Email Ιδιοκτήτη': '',
    'Εταιρεία': '',
    'ΑΦΜ': '',
    'Τηλέφωνο Ιδιοκτήτη': '',
    'Διεύθυνση Ιδιοκτήτη': ''
  });
  const [ownerCode, setOwnerCode] = useState(''); // 🔥 FIX 37B: Track owner code for sync

  const canEdit = authService.canManageFleet();

  useEffect(() => {
    if (boat) {
      loadOwnerDetails();
    }
  }, [boat?.id]);

  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  // 🔥 FIX 37B: Load from authService FIRST (where Admin saves), then fallback to localStorage
  const loadOwnerDetails = () => {
    try {
      // PRIORITY 1: Load from authService (Admin Panel source)
      const ownerFromAuth = getOwnerByBoatId(boat.id);
      if (ownerFromAuth) {
        setOwnerCode(ownerFromAuth.code || '');
        setOwnerDetails({
          'Όνομα Ιδιοκτήτη': ownerFromAuth.ownerName || '',
          'Email Ιδιοκτήτη': ownerFromAuth.ownerEmail || '',
          'Εταιρεία': ownerFromAuth.ownerCompany || '',
          'ΑΦΜ': ownerFromAuth.ownerTaxId || '',
          'Τηλέφωνο Ιδιοκτήτη': ownerFromAuth.ownerPhone || '',
          'Διεύθυνση Ιδιοκτήτη': ownerFromAuth.ownerAddress || ''
        });
        console.log('✅ Loaded owner details from authService for boat:', boat.id);
        return;
      }

      // PRIORITY 2: Fallback to localStorage (boat-specific storage)
      const key = `fleet_${boat.id}_ownerDetails`;
      const stored = localStorage.getItem(key);
      if (stored) {
        setOwnerDetails(JSON.parse(stored));
        console.log('✅ Loaded owner details from localStorage for boat:', boat.id);
      }
    } catch (e) {
      console.error('Error loading owner details:', e);
    }
  };

  // 🔥 FIX 37B: Save to BOTH authService (for Admin sync) and localStorage
  const saveOwnerDetails = () => {
    if (!canEdit) {
      showMessage('❌ Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }

    try {
      // Save to localStorage (boat-specific)
      const key = `fleet_${boat.id}_ownerDetails`;
      localStorage.setItem(key, JSON.stringify(ownerDetails));

      // 🔥 FIX 37B: Also sync to authService if owner code exists
      if (ownerCode) {
        authService.updateOwnerCode(ownerCode, {
          ownerName: ownerDetails['Όνομα Ιδιοκτήτη'],
          ownerEmail: ownerDetails['Email Ιδιοκτήτη'],
          ownerCompany: ownerDetails['Εταιρεία'],
          ownerTaxId: ownerDetails['ΑΦΜ'],
          ownerPhone: ownerDetails['Τηλέφωνο Ιδιοκτήτη'],
          ownerAddress: ownerDetails['Διεύθυνση Ιδιοκτήτη']
        });
        console.log('✅ Synced owner details to authService for owner:', ownerCode);
      }

      authService.logActivity('update_owner_details', boat.id);
      showMessage('✅ Τα στοιχεία ιδιοκτήτη αποθηκεύτηκαν!', 'success');
    } catch (e) {
      console.error('Error saving owner details:', e);
      showMessage('❌ Σφάλμα αποθήκευσης!', 'error');
    }
  };

  const handleChange = (field, value) => {
    if (!canEdit) return;
    setOwnerDetails(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <Header title="ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ" onBack={() => navigate('boatDashboard')} />

      <div className="flex-grow p-4 overflow-y-auto pb-20">
        {/* Header with boat info */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="text-lg font-bold text-teal-400">{boat.name || boat.id}</div>
          <div className="text-sm text-gray-400">{boat.type} {boat.model && `• ${boat.model}`}</div>
        </div>

        {/* Save Button */}
        {canEdit && (
          <button
            onClick={saveOwnerDetails}
            className="w-full mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 shadow-lg"
          >
            <span>💾</span><span>Αποθήκευση Στοιχείων</span>
          </button>
        )}

        {/* Owner Details Form */}
        <div className="p-4 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 rounded-lg border-2 border-cyan-500">
          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
            👤 Στοιχεία Ιδιοκτήτη Σκάφους
          </h3>

          <div className="space-y-4">
            {/* Owner Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Όνομα Ιδιοκτήτη</label>
              <input
                type="text"
                value={ownerDetails['Όνομα Ιδιοκτήτη'] || ''}
                onChange={(e) => handleChange('Όνομα Ιδιοκτήτη', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                placeholder="Ονοματεπώνυμο ιδιοκτήτη"
              />
            </div>

            {/* Owner Email */}
            <div>
              <label className="block text-sm font-semibold text-cyan-300 mb-2">Email Ιδιοκτήτη ⭐</label>
              <input
                type="email"
                value={ownerDetails['Email Ιδιοκτήτη'] || ''}
                onChange={(e) => handleChange('Email Ιδιοκτήτη', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border-2 border-cyan-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-400 focus:outline-none'}`}
                placeholder="owner@email.com"
              />
              <p className="text-xs text-cyan-400 mt-1">Για αποστολή ειδοποιήσεων ναύλων</p>
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Εταιρεία</label>
              <input
                type="text"
                value={ownerDetails['Εταιρεία'] || ''}
                onChange={(e) => handleChange('Εταιρεία', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                placeholder="Εταιρεία ΕΠΕ"
              />
            </div>

            {/* Tax ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">ΑΦΜ</label>
              <input
                type="text"
                value={ownerDetails['ΑΦΜ'] || ''}
                onChange={(e) => handleChange('ΑΦΜ', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                placeholder="123456789"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Τηλέφωνο</label>
              <input
                type="tel"
                value={ownerDetails['Τηλέφωνο Ιδιοκτήτη'] || ''}
                onChange={(e) => handleChange('Τηλέφωνο Ιδιοκτήτη', e.target.value)}
                disabled={!canEdit}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                placeholder="+30 697 1234567"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Διεύθυνση</label>
              <textarea
                value={ownerDetails['Διεύθυνση Ιδιοκτήτη'] || ''}
                onChange={(e) => handleChange('Διεύθυνση Ιδιοκτήτη', e.target.value)}
                disabled={!canEdit}
                rows={3}
                className={`w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 ${!canEdit ? 'opacity-60' : 'focus:border-cyan-500 focus:outline-none'}`}
                placeholder="Οδός, Αριθμός, Πόλη, ΤΚ"
              />
            </div>
          </div>
        </div>
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
        const charters = await getBookingsByVessel(boat.id);
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
        return <TaskPage boat={boat} showMessage={showMessage} />;
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

// Expandable Task Categories Types
interface TaskCategoryItem {
  id: string;
  name: string;
  status: 'OK' | '#' | '?';
  comment: string;
  lastUpdatedBy: string | null;
  lastUpdatedAt: string | null;
}

interface TaskCategory {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  expanded: boolean;
  items: TaskCategoryItem[];
}

// Default task category definitions - Light Blue gradient styling
const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
  {
    id: 'engine',
    name: 'ΜΗΧΑΝΗ',
    shortName: 'Engine',
    icon: '⚙️',
    color: 'from-sky-400 to-cyan-400',
    expanded: false,
    items: [
      { id: 'eng_1', name: 'Έλεγχος λαδιού', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'eng_2', name: 'Φίλτρο καυσίμου', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'eng_3', name: 'Ψυκτικό υγρό', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'eng_4', name: 'Ιμάντες', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'eng_5', name: 'Αντλία νερού', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null }
    ]
  },
  {
    id: 'generator',
    name: 'ΓΕΝΝΗΤΡΙΑ',
    shortName: 'Generator',
    icon: '🔌',
    color: 'from-cyan-400 to-sky-500',
    expanded: false,
    items: [
      { id: 'gen_1', name: 'Λειτουργία', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'gen_2', name: 'Λάδι γεννήτριας', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'gen_3', name: 'Φίλτρο αέρα', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'gen_4', name: 'Ώρες λειτουργίας', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null }
    ]
  },
  {
    id: 'shaft',
    name: 'ΑΞΟΝΑΣ ΠΡΟΠΕΛΑ',
    shortName: 'Shaft',
    icon: '🔩',
    color: 'from-sky-500 to-blue-400',
    expanded: false,
    items: [
      { id: 'shaft_1', name: 'Τσιμούχα', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'shaft_2', name: 'Ανόδια', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'shaft_3', name: 'Προπέλα', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'shaft_4', name: 'Ευθυγράμμιση', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null }
    ]
  },
  {
    id: 'seavalves',
    name: 'ΒΑΝΕΣ ΘΑΛΑΣΣΗΣ',
    shortName: 'Sea Valves',
    icon: '🚿',
    color: 'from-blue-400 to-sky-400',
    expanded: false,
    items: [
      { id: 'valve_1', name: 'Βάνα κινητήρα', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'valve_2', name: 'Βάνα γεννήτριας', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'valve_3', name: 'Βάνα WC', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'valve_4', name: 'Βάνα νεροχύτη', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'valve_5', name: 'Βάνες air condition', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null }
    ]
  },
  {
    id: 'electrical',
    name: 'ΗΛΕΚΤΡΟΛΟΓΙΚΑ',
    shortName: 'Electrical',
    icon: '⚡',
    color: 'from-sky-400 to-cyan-400',
    expanded: false,
    items: [
      { id: 'elec_1', name: 'Καρβουνάκια εργάτη άγκυρας', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'elec_2', name: 'Μίζα μηχανής', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'elec_3', name: 'Blower (εξαερισμός)', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'elec_4', name: 'Φώτα ναυσιπλοΐας', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'elec_5', name: 'Φώτα σαλονιού', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null },
      { id: 'elec_6', name: 'Φώτα καμπινών', status: '#', comment: '', lastUpdatedBy: null, lastUpdatedAt: null }
    ]
  }
];

function TaskPage({ boat, showMessage }) {
  const [winterizationData, setWinterizationData] = useState<{
    completed: number;
    total: number;
    replacements: number;
    lastSaved: string | null;
  } | null>(null);

  // Expandable task categories state
  const [taskCategories, setTaskCategories] = useState<TaskCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddItemToCategory, setShowAddItemToCategory] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');

  const reactNavigate = useNavigate();

  const isOwnerUser = authService.isOwner();
  const canManageTasks = authService.canManageTasks() && !isOwnerUser;
  const canView = true;

  // Load winterization summary data
  useEffect(() => {
    if (!boat?.name) return;

    const vesselKey = boat.name.replace(/\s+/g, '_').toLowerCase();
    const savedData = localStorage.getItem(`winterization_${vesselKey}_data`);
    const savedCustom = localStorage.getItem(`winterization_${vesselKey}_custom_items`);

    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        let completed = 0;
        let total = 0;
        let replacements = 0;

        // Count from default items
        if (data.sections) {
          Object.values(data.sections).forEach((section: any) => {
            if (section.items) {
              section.items.forEach((item: any) => {
                total++;
                if (item.checked) completed++;
                if (item.replaceQty > 0) replacements += item.replaceQty;
              });
            }
          });
        }

        // Count custom items
        if (savedCustom) {
          const customData = JSON.parse(savedCustom);
          Object.values(customData).forEach((sectionItems: any) => {
            if (Array.isArray(sectionItems)) {
              sectionItems.forEach((item: any) => {
                total++;
                if (item.checked) completed++;
                if (item.replaceQty > 0) replacements += item.replaceQty;
              });
            }
          });
        }

        setWinterizationData({
          completed,
          total: total || 75, // Default 75 items if none saved
          replacements,
          lastSaved: data.lastSaved || null
        });
      } catch (e) {
        console.error('Error loading winterization data:', e);
        setWinterizationData(null);
      }
    } else {
      // No data saved yet - show empty state
      setWinterizationData({
        completed: 0,
        total: 75,
        replacements: 0,
        lastSaved: null
      });
    }
  }, [boat?.name]);

  // 🔥 API-only: Load task categories from API with migration
  const loadTaskCategories = useCallback(async () => {
    if (!boat?.id || !boat?.name) return;

    // First, migrate any existing localStorage data to API
    await migrateTasksFromLocalStorage(boat.id, boat.name);

    // Then load from API
    try {
      const apiTasks = await getTasksByVessel(boat.id);

      if (apiTasks && apiTasks.length > 0) {
        // Convert flat task list to categories format
        // For now, just use the default categories and merge API tasks
        const mergedCategories = JSON.parse(JSON.stringify(DEFAULT_TASK_CATEGORIES));
        // You can enhance this to properly map tasks to categories
        setTaskCategories(mergedCategories);
      } else {
        // Fallback: try localStorage for backwards compatibility during migration
        const vesselKey = boat.name.replace(/\s+/g, '_').toLowerCase();
        const savedCategories = localStorage.getItem(`task_categories_${vesselKey}`);
        if (savedCategories) {
          try {
            const parsed = JSON.parse(savedCategories);
            const mergedCategories = [...parsed];
            DEFAULT_TASK_CATEGORIES.forEach(defaultCat => {
              const exists = parsed.some((cat: any) => cat.id === defaultCat.id);
              if (!exists) {
                mergedCategories.push(JSON.parse(JSON.stringify(defaultCat)));
              }
            });
            setTaskCategories(mergedCategories);
          } catch (e) {
            setTaskCategories(JSON.parse(JSON.stringify(DEFAULT_TASK_CATEGORIES)));
          }
        } else {
          setTaskCategories(JSON.parse(JSON.stringify(DEFAULT_TASK_CATEGORIES)));
        }
      }
    } catch (e) {
      console.error('Error loading task categories from API:', e);
      setTaskCategories(JSON.parse(JSON.stringify(DEFAULT_TASK_CATEGORIES)));
    }
  }, [boat?.id, boat?.name]);

  useEffect(() => {
    loadTaskCategories();
  }, [loadTaskCategories]);

  // 🔥 NEW: Listen for global refresh events (every 3 minutes) - SYNC TASKS
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (boat?.id && boat?.name) {
        console.log('🔄 TaskPage: Global refresh received, syncing tasks...');
        loadTaskCategories();
      }
    };

    window.addEventListener('globalBookingsRefreshed', handleGlobalRefresh);
    return () => window.removeEventListener('globalBookingsRefreshed', handleGlobalRefresh);
  }, [boat?.id, boat?.name, loadTaskCategories]);

  // 🔥 API-only: Save task categories to API whenever they change
  useEffect(() => {
    if (!boat?.id || !boat?.name || taskCategories.length === 0) return;

    const saveTaskCategoriesToAPI = async () => {
      // Save each category as a task to API
      for (const category of taskCategories) {
        for (const item of category.items) {
          if (item.lastUpdatedAt) {
            // Only save items that have been updated
            await saveTask({
              taskCode: item.id,
              vesselId: boat.id,
              vesselName: boat.name,
              title: item.name,
              category: category.name,
              status: item.status === 'OK' ? 'completed' : item.status === '#' ? 'pending' : 'in_progress',
              notes: item.comment,
              createdBy: item.lastUpdatedBy || undefined
            });
          }
        }
      }
    };

    // Debounce the save to avoid too many API calls
    const timeoutId = setTimeout(saveTaskCategoriesToAPI, 2000);
    return () => clearTimeout(timeoutId);
  }, [taskCategories, boat?.id, boat?.name]);

  // Toggle category expansion
  const toggleCategoryExpand = (categoryId: string) => {
    setTaskCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  // Toggle item status within a category
  const toggleCategoryItemStatus = (categoryId: string, itemId: string) => {
    if (!canManageTasks) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }
    const statuses: Array<'OK' | '#' | '?'> = ['OK', '#', '?'];
    setTaskCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              const currentIndex = statuses.indexOf(item.status);
              const nextStatus = statuses[(currentIndex + 1) % statuses.length];
              return {
                ...item,
                status: nextStatus,
                lastUpdatedBy: authService.getCurrentUser()?.name || null,
                lastUpdatedAt: new Date().toISOString()
              };
            }
            return item;
          })
        };
      }
      return cat;
    }));
  };

  // Update item comment within a category
  const updateCategoryItemComment = (categoryId: string, itemId: string, comment: string) => {
    if (!canManageTasks) return;
    setTaskCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                comment,
                lastUpdatedBy: authService.getCurrentUser()?.name || null,
                lastUpdatedAt: new Date().toISOString()
              };
            }
            return item;
          })
        };
      }
      return cat;
    }));
  };

  // Add new item to a category
  const addItemToCategory = (categoryId: string) => {
    if (!canManageTasks || !newItemName.trim()) return;
    const newItem: TaskCategoryItem = {
      id: `item_${Date.now()}`,
      name: newItemName.trim(),
      status: '#',
      comment: '',
      lastUpdatedBy: authService.getCurrentUser()?.name || null,
      lastUpdatedAt: new Date().toISOString()
    };
    setTaskCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
    ));
    setNewItemName('');
    setShowAddItemToCategory(null);
    showMessage('✅ Το είδος προστέθηκε.', 'success');
  };

  // Delete item from a category
  const deleteItemFromCategory = (categoryId: string, itemId: string) => {
    if (!canManageTasks) return;
    setTaskCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, items: cat.items.filter(item => item.id !== itemId) } : cat
    ));
  };

  // Add new category
  const addNewCategory = () => {
    if (!canManageTasks || !newCategoryName.trim()) return;
    const newCat: TaskCategory = {
      id: `cat_${Date.now()}`,
      name: newCategoryName.trim().toUpperCase(),
      shortName: newCategoryName.trim().substring(0, 4).toUpperCase(),
      icon: '📋',
      color: 'from-sky-400 to-cyan-400',
      expanded: false,
      items: []
    };
    setTaskCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
    setShowAddCategory(false);
    showMessage('✅ Η κατηγορία προστέθηκε.', 'success');
  };

  // Delete category
  const deleteCategory = (categoryId: string) => {
    if (!canManageTasks) return;
    if (window.confirm('Διαγραφή κατηγορίας και όλων των εργασιών της;')) {
      setTaskCategories(prev => prev.filter(cat => cat.id !== categoryId));
      showMessage('✅ Η κατηγορία διαγράφηκε.', 'success');
    }
  };

  // Get category stats
  const getCategoryStats = (category: TaskCategory) => {
    const total = category.items.length;
    const completed = category.items.filter(i => i.status === 'OK').length;
    const repair = category.items.filter(i => i.status === '?').length;
    return { total, completed, repair };
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

      {/* ❄️ Winterization Summary Card */}
      {winterizationData && (
        <button
          onClick={() => {
            // Find vessel ID from VESSELS list
            const vesselId = [
              { id: 1, name: "Maria 1" },
              { id: 2, name: "Maria 2" },
              { id: 3, name: "Valesia" },
              { id: 4, name: "Bar Bar" },
              { id: 5, name: "Kalispera" },
              { id: 6, name: "Infinity" },
              { id: 7, name: "Perla" },
              { id: 8, name: "Bob" },
            ].find(v => v.name.toLowerCase() === boat?.name?.toLowerCase())?.id;

            if (vesselId) {
              localStorage.setItem('winterization_last_vessel', String(vesselId));
            }
            reactNavigate('/winterization');
          }}
          className="w-full mb-4 p-4 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-xl border border-sky-300 hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-400/40 hover:scale-[1.02] text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❄️</span>
              <div>
                <h4 className="font-bold text-white text-lg">INVENTORY WINTER</h4>
                <p className="text-xs text-sky-100">Χειμερινές Εργασίες</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-400">✅</span>
                <span className="font-bold text-white">{winterizationData.completed}/{winterizationData.total}</span>
              </div>
              {winterizationData.replacements > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <span>🔴</span>
                  <span className="text-sm">{winterizationData.replacements} αντ/σεις</span>
                </div>
              )}
            </div>
          </div>
          {winterizationData.lastSaved && (
            <div className="mt-2 text-xs text-gray-400">
              📅 Τελευταία ενημέρωση: {new Date(winterizationData.lastSaved).toLocaleDateString('el-GR')}
            </div>
          )}
          {!winterizationData.lastSaved && (
            <div className="mt-2 text-xs text-yellow-400">
              ⚠️ Δεν έχει ξεκινήσει - Πατήστε για να ξεκινήσετε
            </div>
          )}
        </button>
      )}

      {/* 🔧 Expandable Task Categories - Light Blue Theme */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between mb-2 p-2 rounded-lg" style={{ background: 'rgba(144, 202, 249, 0.3)' }}>
          <h3 className="text-sm font-bold text-gray-800">Κατηγορίες Εργασιών</h3>
          {canManageTasks && (
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-xs px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              + Κατηγορία
            </button>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="p-5 rounded-xl border border-sky-300 w-80 shadow-xl" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
              <h4 className="font-bold text-gray-800 mb-3 text-lg">Νέα Κατηγορία</h4>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Όνομα κατηγορίας..."
                className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-sky-300 mb-3 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                  className="flex-1 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={addNewCategory}
                  className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium"
                >
                  Προσθήκη
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Item to Category Modal */}
        {showAddItemToCategory && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="p-5 rounded-xl border border-sky-300 w-80 shadow-xl" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
              <h4 className="font-bold text-gray-800 mb-3 text-lg">Νέο Είδος</h4>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Όνομα είδους..."
                className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg border border-sky-300 mb-3 focus:ring-2 focus:ring-sky-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddItemToCategory(null); setNewItemName(''); }}
                  className="flex-1 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium"
                >
                  Ακύρωση
                </button>
                <button
                  onClick={() => addItemToCategory(showAddItemToCategory)}
                  className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium"
                >
                  Προσθήκη
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expandable Task Category Cards */}
        {taskCategories.map(category => {
          const catStats = getCategoryStats(category);
          return (
            <div key={category.id} className="rounded-xl border border-sky-300 overflow-hidden shadow-md hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
              {/* Category Header */}
              <button
                onClick={() => toggleCategoryExpand(category.id)}
                className={`w-full p-3 bg-gradient-to-r ${category.color} text-left flex items-center justify-between hover:opacity-90 hover:scale-[1.01] transition-all duration-300 border-b border-sky-300`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="font-bold text-white drop-shadow-sm">{category.name}</h4>
                    <p className="text-xs text-sky-100">{category.shortName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-green-100 text-sm font-medium">✅ {catStats.completed}/{catStats.total}</span>
                    </div>
                    {catStats.repair > 0 && (
                      <span className="text-orange-200 text-xs">🔧 {catStats.repair} επισκευή</span>
                    )}
                  </div>
                  <span className="text-white text-lg drop-shadow-sm">{category.expanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {/* Category Items (Expanded) */}
              {category.expanded && (
                <div className="p-3 space-y-2" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
                  {category.items.map(item => (
                    <div key={item.id} className="p-2 rounded-lg border border-sky-300 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleCategoryItemStatus(category.id, item.id)}
                          className={`flex-grow text-left flex items-center gap-2 ${canManageTasks ? 'cursor-pointer hover:bg-sky-100' : 'cursor-default'} p-1 rounded transition-colors`}
                          disabled={!canManageTasks}
                        >
                          {renderStatusIcon(item.status)}
                          <span className="text-gray-800 text-sm font-medium">{item.name}</span>
                        </button>
                        {canManageTasks && (
                          <button
                            onClick={() => deleteItemFromCategory(category.id, item.id)}
                            className="text-red-600 hover:text-red-500 p-1 hover:bg-red-100 rounded transition-colors text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {item.status === '?' && (
                        <div className="mt-2 pt-2 border-t border-sky-200">
                          <textarea
                            value={item.comment || ''}
                            onChange={(e) => updateCategoryItemComment(category.id, item.id, e.target.value)}
                            placeholder="Σχόλια επισκευής..."
                            className="w-full px-2 py-1 bg-white text-gray-800 rounded border border-sky-300 text-xs focus:ring-2 focus:ring-sky-400 focus:outline-none"
                            rows={2}
                            disabled={!canManageTasks}
                          />
                        </div>
                      )}
                      {item.lastUpdatedBy && (
                        <div className="mt-1 text-xs text-gray-600">
                          👤 {item.lastUpdatedBy} • {new Date(item.lastUpdatedAt!).toLocaleDateString('el-GR')}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Item Button */}
                  {canManageTasks && (
                    <button
                      onClick={() => setShowAddItemToCategory(category.id)}
                      className="w-full py-2 bg-white/80 hover:bg-white text-sky-700 border border-sky-300 rounded-lg text-sm transition-colors font-medium"
                    >
                      + Προσθήκη Είδους
                    </button>
                  )}

                  {/* Delete Category Button */}
                  {canManageTasks && (
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="w-full py-2 bg-red-100 hover:bg-red-200 text-red-600 border border-red-300 rounded-lg text-xs transition-colors"
                    >
                      🗑️ Διαγραφή Κατηγορίας
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 📦 Winter Maintenance Buttons - ΕΡΓΑΣΙΕΣ Section */}
      <div className="mb-4 space-y-2">
        <div className="p-2 rounded-lg mb-3" style={{ background: 'rgba(144, 202, 249, 0.3)' }}>
          <h3 className="text-sm font-bold text-gray-800">🔧 Εργαλεία Χειμερινής Συντήρησης</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
            {/* Χειμερινές Εργασίες Button */}
            <button
              onClick={() => reactNavigate('/winterization')}
              className="w-full p-3 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-xl border border-sky-300 hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-400/40 hover:scale-[1.02] text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h5 className="font-bold text-white">Χειμερινές Εργασίες</h5>
                  <p className="text-xs text-sky-100">Κατάσταση εξοπλισμού όλων των σκαφών</p>
                </div>
              </div>
              <span className="text-white">→</span>
            </button>

            {/* TakeOver Button */}
            <button
              onClick={() => reactNavigate('/winter-takeover')}
              className="w-full p-3 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-xl border border-sky-300 hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-400/40 hover:scale-[1.02] text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h5 className="font-bold text-white">Take Over</h5>
                  <p className="text-xs text-sky-100">Παρακολούθηση παραλαβών σκαφών</p>
                </div>
              </div>
              <span className="text-white">→</span>
            </button>

            {/* Safety Equipment Button */}
            <button
              onClick={() => reactNavigate('/winter-safety')}
              className="w-full p-3 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-xl border border-sky-300 hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-sky-400/40 hover:scale-[1.02] text-left flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩹</span>
                <div>
                  <h5 className="font-bold text-white">Safety Equipment</h5>
                  <p className="text-xs text-sky-100">Φαρμακείο & Πυροτεχνικά με ημερομηνίες λήξης</p>
                </div>
              </div>
              <span className="text-white">→</span>
            </button>
        </div>
      </div>

    </div>
  );
}

function CharterPage({ items, boat, showMessage, saveItems }) {
  console.log('🚀 CharterPage component mounted');
  const [selectedCharter, setSelectedCharter] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  // 🔥 NEW: Edit mode for Draft/Page1 charters
  const [editingCharter, setEditingCharter] = useState<any>(null);
  // 🔥 NEW: Filter for Page 1 bookings
  const [charterFilter, setCharterFilter] = useState<'all' | 'page1' | 'confirmed'>('all');

  // 🔥 FIX 9: Added 5 skipper fields
  const [newCharter, setNewCharter] = useState({
    code: '', startDate: '', endDate: '', startTime: '', endTime: '', amount: '', commissionPercent: '',
    departure: 'ALIMOS MARINA', arrival: 'ALIMOS MARINA', status: 'Option',
    skipperFirstName: '', skipperLastName: '', skipperAddress: '', skipperEmail: '', skipperPhone: ''
  });

  // 🔥 DEBUG: Log Page 1 bookings when loading
  useEffect(() => {
    const page1Bookings = items.filter(c => c.source === 'page1' || c.status === 'Draft');
    const confirmedBookings = items.filter(c => c.status === 'Confirmed');
    console.log('📋 CHARTER PAGE DEBUG:', {
      total: items.length,
      page1Bookings: page1Bookings.length,
      confirmedBookings: confirmedBookings.length,
      page1Details: page1Bookings.map(c => ({
        code: c.code,
        status: c.status,
        source: c.source,
        vesselName: c.vesselName
      }))
    });
  }, [items]);

  // 🔥 Filter charters based on selected filter
  const filteredItems = useMemo(() => {
    switch (charterFilter) {
      case 'page1':
        return items.filter(c => c.source === 'page1' || c.status === 'Draft');
      case 'confirmed':
        return items.filter(c => c.status === 'Confirmed');
      default:
        return items;
    }
  }, [items, charterFilter]);

  // 🔥 Count Page 1 bookings for badge
  const page1Count = useMemo(() =>
    items.filter(c => c.source === 'page1' || c.status === 'Draft').length,
    [items]
  );

  // 🔥 NEW: Validation error states
  const [charterCodeError, setCharterCodeError] = useState('');
  const [doubleBookingError, setDoubleBookingError] = useState('');
  const [dateRangeError, setDateRangeError] = useState('');

  // 🔥 NEW: Refs for validation scroll and highlight
  const charterCodeRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const skipperInfoRef = useRef<HTMLDivElement>(null);

  const isOwnerUser = authService.isOwner();
  const canViewCharters = true;
  const canEditCharters = (authService.isAdmin() || authService.isBooking()) && !isOwnerUser;
  const canViewFinancials = authService.canViewFinancials() || isOwnerUser;
  const canAcceptCharter = isOwnerUser || authService.isAdmin();

  // 🔥 TWO-WAY SYNC: Load sync data from Page 1 when add form opens
  useEffect(() => {
    if (showAddForm) {
      const syncData = getBookingSync();
      if (syncData && syncData.lastUpdatedBy === 'page1') {
        const fleetData = syncToFleetFormat(syncData);
        if (fleetData) {
          console.log('📥 FLEET: Loading sync data from Page 1:', fleetData);
          // Only populate fields that are empty in current form
          setNewCharter(prev => ({
            ...prev,
            code: prev.code || fleetData.code,
            startDate: prev.startDate || fleetData.startDate,
            startTime: prev.startTime || fleetData.startTime,
            endDate: prev.endDate || fleetData.endDate,
            endTime: prev.endTime || fleetData.endTime,
            skipperFirstName: prev.skipperFirstName || fleetData.skipperFirstName,
            skipperLastName: prev.skipperLastName || fleetData.skipperLastName,
            skipperAddress: prev.skipperAddress || fleetData.skipperAddress,
            skipperEmail: prev.skipperEmail || fleetData.skipperEmail,
            skipperPhone: prev.skipperPhone || fleetData.skipperPhone,
          }));
        }
      }
    }
  }, [showAddForm]);

  // 🔥 TWO-WAY SYNC: Save newCharter data to sync storage whenever it changes
  useEffect(() => {
    // Debug: Log exactly what we're trying to save
    console.log('🔄 FLEET SYNC - Values:', {
      showAddForm,
      boatName: boat?.name,
      code: newCharter.code,
      startDate: newCharter.startDate,
      endDate: newCharter.endDate,
      skipperFirstName: newCharter.skipperFirstName
    });

    // Only save if we have meaningful data and form is open
    if (showAddForm && (newCharter.code || newCharter.startDate)) {
      const syncData = fleetToSyncFormat(newCharter, boat?.name);
      console.log('🔄 FLEET SYNC - Converted syncData:', syncData);
      saveBookingSync(syncData, 'fleetManagement');
    }
  }, [showAddForm, newCharter.code, newCharter.startDate, newCharter.startTime,
      newCharter.endDate, newCharter.endTime, newCharter.skipperFirstName,
      newCharter.skipperLastName, newCharter.skipperAddress,
      newCharter.skipperEmail, newCharter.skipperPhone, boat?.name]);

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    console.log('📝 handleFormChange:', { name, value, type });

    if (type === 'number') {
      setNewCharter(prev => ({ ...prev, [name]: value === '' ? '' : value }));
    } else if (name === 'startDate' && value) {
      setNewCharter(prev => ({ ...prev, startDate: value, endDate: value }));
      setDateRangeError('');
      setDoubleBookingError('');
    } else if (name === 'endDate' && value) {
      // Simple date range validation
      if (newCharter.startDate && value < newCharter.startDate) {
        setDateRangeError('Η ημερομηνία λήξης δεν μπορεί να είναι πριν από την ημερομηνία έναρξης! / End date cannot be before start date!');
      } else {
        setDateRangeError('');
      }
      setNewCharter(prev => ({ ...prev, [name]: value }));
      setDoubleBookingError(''); // Clear double booking error when dates change
    } else if (name === 'code') {
      // 🔥 SIMPLIFIED: Just update state, validate only on blur and before save
      setNewCharter(prev => ({ ...prev, [name]: value }));
      setCharterCodeError(''); // Clear error when typing
    } else {
      setNewCharter(prev => ({ ...prev, [name]: value }));
    }
  };

  // 🔥 NEW: Highlight element in red for 3 seconds
  const highlightElement = (ref) => {
    if (ref && ref.current) {
      ref.current.style.border = '2px solid red';
      ref.current.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      setTimeout(() => {
        if (ref.current) {
          ref.current.style.border = '';
          ref.current.style.backgroundColor = '';
        }
      }, 3000);
    }
  };

  // 🔥 NEW: Validate required fields and scroll to missing field
  const validateAndScrollCharter = () => {
    // Check charter code
    if (!newCharter.code || !newCharter.code.trim()) {
      charterCodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(charterCodeRef);
      alert('Παρακαλώ συμπληρώστε τον κωδικό ναύλου! / Please fill in the charter code!');
      return false;
    }

    // Check if charter code has error (duplicate)
    if (charterCodeError) {
      charterCodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(charterCodeRef);
      alert(charterCodeError);
      return false;
    }

    // Check dates
    if (!newCharter.startDate || !newCharter.endDate) {
      datesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(datesRef);
      alert('Παρακαλώ συμπληρώστε τις ημερομηνίες! / Please fill in the dates!');
      return false;
    }

    // Check date range error
    if (dateRangeError) {
      datesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(datesRef);
      alert(dateRangeError);
      return false;
    }

    // Check double booking error
    if (doubleBookingError) {
      datesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightElement(datesRef);
      alert(doubleBookingError);
      return false;
    }

    return true; // All validations passed
  };

  // 🔥 NEW: Check for duplicate charter code (returns true if duplicate found)
  const checkDuplicateOnEnter = (code: string): boolean => {
    if (!code || !code.trim()) return false;

    const codeToCheck = code.trim();
    console.log('🔍 Checking duplicate for code:', codeToCheck);

    // Check locally first (items array contains current boat's charters)
    // 🔥 FIX: Use codeMatches for flexible matching (handles "charter party no 21" vs "21")
    const localDuplicate = items.some((charter: any) => {
      const existingCode = charter.code || charter.bookingCode || charter.charterCode;
      if (!existingCode) return false;
      const match = codeMatches(existingCode, codeToCheck);
      if (match) console.log('🔴 Found local duplicate:', existingCode, '≈', codeToCheck);
      return match;
    });

    if (localDuplicate) {
      console.log('❌ Local duplicate found!');
      return true;
    }

    // Also check all boats' charters in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_ΝΑΥΛΑ')) {
        try {
          const charters = JSON.parse(localStorage.getItem(key) || '[]');
          const found = charters.some((charter: any) => {
            const existingCode = charter.code || charter.bookingCode || charter.charterCode;
            if (!existingCode) return false;
            // 🔥 FIX: Use codeMatches for flexible matching
            const match = codeMatches(existingCode, codeToCheck);
            if (match) console.log('🔴 Found localStorage duplicate:', existingCode, '≈', codeToCheck, 'in', key);
            return match;
          });
          if (found) {
            console.log('❌ localStorage duplicate found!');
            return true;
          }
        } catch (e) {
          // Skip
        }
      }
    }

    console.log('✅ No duplicate found');
    return false;
  };

  // 🔥 NEW: Check for overlapping dates on same vessel (returns true if overlap found)
  const checkDoubleBookingOnEnter = (startDate: string, endDate: string): boolean => {
    if (!startDate || !endDate || !boat) return false;

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    // Check current boat's charters for overlap
    const hasOverlap = items.some((charter: any) => {
      const existingStart = new Date(charter.startDate);
      const existingEnd = new Date(charter.endDate);

      // Check for overlap: (start1 <= end2) AND (end1 >= start2)
      return newStart <= existingEnd && newEnd >= existingStart;
    });

    return hasOverlap;
  };

  // 🔥 NEW: Handle Enter key to move to next input field
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('⌨️ Enter pressed on field:', e.currentTarget.name);
      console.log('📋 Current newCharter:', newCharter);

      // 🔥 SPECIAL: If this is the charter code field, check for duplicates FIRST
      if (e.currentTarget.name === 'code' && newCharter.code) {
        console.log('🔍 Checking charter code duplicate...');
        const isDuplicate = checkDuplicateOnEnter(newCharter.code);
        console.log('🔍 isDuplicate:', isDuplicate);
        if (isDuplicate) {
          // Show error immediately
          console.log('❌ DUPLICATE! Showing alert...');
          setCharterCodeError('Αυτός ο αριθμός ναύλου υπάρχει ήδη');
          // 🔥 Apply INTENSE red highlight with glow
          if (charterCodeRef.current) {
            charterCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            charterCodeRef.current.style.border = '4px solid #ff0000';
            charterCodeRef.current.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            charterCodeRef.current.style.borderRadius = '12px';
            charterCodeRef.current.style.padding = '10px';
            charterCodeRef.current.style.boxShadow = '0 0 20px 5px rgba(255, 0, 0, 0.7)';
            const inputInside = charterCodeRef.current.querySelector('input');
            if (inputInside) {
              inputInside.style.border = '4px solid #ff0000';
              inputInside.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
              inputInside.style.boxShadow = '0 0 15px 3px rgba(255, 0, 0, 0.6)';
            }
            setTimeout(() => {
              if (charterCodeRef.current) {
                charterCodeRef.current.style.border = '';
                charterCodeRef.current.style.backgroundColor = '';
                charterCodeRef.current.style.borderRadius = '';
                charterCodeRef.current.style.padding = '';
                charterCodeRef.current.style.boxShadow = '';
                const inputInside = charterCodeRef.current.querySelector('input');
                if (inputInside) {
                  inputInside.style.border = '';
                  inputInside.style.backgroundColor = '';
                  inputInside.style.boxShadow = '';
                }
              }
            }, 3000);
          }
          alert(`❌ ΣΤΑΜΑΤΑ!\n\nΑυτός ο αριθμός ναύλου υπάρχει ήδη: "${newCharter.code}"!\n\nΔΕΝ ΜΠΟΡΕΙΤΕ ΝΑ ΑΠΟΘΗΚΕΥΣΕΤΕ!`);
          return; // DON'T move to next field
        } else {
          setCharterCodeError(''); // Clear error if no duplicate
        }
      }

      // 🔥 SPECIAL: If this is the endDate field, check for double booking
      if (e.currentTarget.name === 'endDate' && newCharter.startDate && newCharter.endDate) {
        console.log('🔍 Checking date overlap...');
        const hasOverlap = checkDoubleBookingOnEnter(newCharter.startDate, newCharter.endDate);
        console.log('🔍 hasOverlap:', hasOverlap);
        if (hasOverlap) {
          // Show error immediately
          console.log('❌ OVERLAP! Showing alert...');
          setDoubleBookingError('Υπάρχει ήδη ναύλο για αυτές τις ημερομηνίες!');
          // 🔥 Apply INTENSE red highlight with glow
          if (datesRef.current) {
            datesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            datesRef.current.style.border = '4px solid #ff0000';
            datesRef.current.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            datesRef.current.style.borderRadius = '12px';
            datesRef.current.style.padding = '10px';
            datesRef.current.style.boxShadow = '0 0 20px 5px rgba(255, 0, 0, 0.7)';
            const inputs = datesRef.current.querySelectorAll('input');
            inputs.forEach((input: HTMLInputElement) => {
              input.style.border = '4px solid #ff0000';
              input.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
              input.style.boxShadow = '0 0 15px 3px rgba(255, 0, 0, 0.6)';
            });
            setTimeout(() => {
              if (datesRef.current) {
                datesRef.current.style.border = '';
                datesRef.current.style.backgroundColor = '';
                datesRef.current.style.borderRadius = '';
                datesRef.current.style.padding = '';
                datesRef.current.style.boxShadow = '';
                const inputs = datesRef.current.querySelectorAll('input');
                inputs.forEach((input: HTMLInputElement) => {
                  input.style.border = '';
                  input.style.backgroundColor = '';
                  input.style.boxShadow = '';
                });
              }
            }, 3000);
          }
          alert(`❌ ΣΤΑΜΑΤΑ!\n\nΤο σκάφος "${boat?.name}" έχει ήδη κράτηση για αυτές τις ημερομηνίες!\n\nΔΕΝ ΜΠΟΡΕΙΤΕ ΝΑ ΑΠΟΘΗΚΕΥΣΕΤΕ!`);
          return; // DON'T move to next field
        } else {
          setDoubleBookingError(''); // Clear error if no overlap
        }
      }

      // Get all form inputs and selects
      const form = e.currentTarget.form;
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"]), select, textarea')) as HTMLElement[];
      const currentIndex = inputs.indexOf(e.currentTarget);

      if (currentIndex < inputs.length - 1) {
        // Focus next input
        inputs[currentIndex + 1].focus();
      } else {
        // Last input - trigger save button
        const saveButton = form.querySelector('button[type="button"]') as HTMLElement;
        if (saveButton) saveButton.click();
      }
    }
  };

  // 🔥 API VALIDATION: Check if charter code already exists (uses imported checkDuplicateCharterCode)
  const validateCharterCodeOnBlur = async (code: string, excludeId?: string) => {
    console.log('🔍 validateCharterCodeOnBlur called with code:', code);
    if (!code || !code.trim()) {
      setCharterCodeError('');
      return;
    }

    try {
      const result = await checkDuplicateCharterCode(code, excludeId);
      if (result.isDuplicate) {
        console.log('🚫 Duplicate found in API!');
        setCharterCodeError('Αυτός ο αριθμός ναύλου υπάρχει ήδη');
      } else {
        console.log('✅ Code is available');
        setCharterCodeError('');
      }
    } catch (error) {
      console.error('❌ Error checking duplicate charter code:', error);
    }
  };

  // 🔥 API VALIDATION: Check if vessel is already booked for overlapping dates (uses imported checkDateOverlap)
  const validateDatesOnBlur = async (startDate: string, endDate: string, excludeId?: string) => {
    if (!boat || !startDate || !endDate) {
      setDoubleBookingError('');
      return;
    }

    try {
      const result = await checkDateOverlap(boat.id, startDate, endDate, excludeId);
      if (result.hasOverlap) {
        console.log('🚫 Date overlap found in API!');
        setDoubleBookingError('Το σκάφος έχει ήδη κράτηση για αυτές τις ημερομηνίες');
      } else {
        console.log('✅ Dates are available');
        setDoubleBookingError('');
      }
    } catch (error) {
      console.error('❌ Error checking date overlap:', error);
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
  const hasValidationErrors = !!(charterCodeError || dateRangeError || doubleBookingError);

  // 🔥 DEBUG: Log form validity
  console.log('📊 Form Status:', {
    code: newCharter.code,
    startDate: newCharter.startDate,
    endDate: newCharter.endDate,
    amount: newCharter.amount,
    isFormValid,
    hasValidationErrors,
    charterCodeError,
    dateRangeError,
    doubleBookingError
  });

  // 🔥 FIX 6: Add saveBooking API sync
  // 🔥 NEW: Handles both ADD and EDIT modes
  const handleAddCharter = async () => {
    const isEditMode = !!editingCharter;
    console.log('🔥 handleAddCharter called - MODE:', isEditMode ? 'EDIT' : 'ADD');
    console.log('canEditCharters:', canEditCharters);
    console.log('isFormValid:', isFormValid);
    console.log('hasValidationErrors:', hasValidationErrors);
    console.log('newCharter:', newCharter);
    if (isEditMode) console.log('✏️ Editing charter:', editingCharter.code);

    if (!canEditCharters) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
      return;
    }

    // 🔥 NEW: Validate and scroll to missing/error fields
    if (!validateAndScrollCharter()) {
      return;
    }

    if (!isFormValid) {
      showMessage('❌ Παρακαλώ συμπληρώστε όλα τα πεδία.', 'error');
      return;
    }

    // 🔥 NEW: Check for validation errors before saving
    if (charterCodeError) {
      showMessage('❌ ' + charterCodeError, 'error');
      return;
    }

    if (dateRangeError) {
      showMessage('❌ ' + dateRangeError, 'error');
      return;
    }

    if (doubleBookingError) {
      showMessage('❌ ' + doubleBookingError, 'error');
      return;
    }

    // 🔥 CRITICAL: Final check for duplicate charter code before saving (using API)
    // 🔥 SKIP duplicate check if editing the SAME charter code
    const isCodeChanged = isEditMode && editingCharter.code !== newCharter.code;
    const shouldCheckDuplicate = !isEditMode || isCodeChanged;

    console.log('🛑🛑🛑 FINAL CHECK for duplicate code:', newCharter.code);
    console.log('🛑 isEditMode:', isEditMode, 'isCodeChanged:', isCodeChanged, 'shouldCheckDuplicate:', shouldCheckDuplicate);

    // 🔥 API VALIDATION: Check duplicate charter code in database
    let isDuplicateCode = false;
    if (shouldCheckDuplicate) {
      const excludeId = isEditMode ? editingCharter.id || editingCharter.code : undefined;
      const duplicateResult = await checkDuplicateCharterCode(newCharter.code, excludeId);
      isDuplicateCode = duplicateResult.isDuplicate;
      if (duplicateResult.existingBooking) {
        console.log('🛑 Found existing booking with same code:', duplicateResult.existingBooking.code);
      }
    }
    console.log('🛑 isDuplicateCode result:', isDuplicateCode);

    // 🔥🔥🔥 ABSOLUTE BLOCK - IF DUPLICATE FOUND, DO NOT CONTINUE
    if (isDuplicateCode === true) {
      console.log('🛑🛑🛑 BLOCKING SAVE - DUPLICATE DETECTED! STOPPING HERE!');
      setCharterCodeError('Αυτός ο αριθμός ναύλου υπάρχει ήδη');
      // 🔥 Apply INTENSE red highlight
      if (charterCodeRef.current) {
        charterCodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        charterCodeRef.current.style.border = '4px solid #ff0000';
        charterCodeRef.current.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        charterCodeRef.current.style.borderRadius = '12px';
        charterCodeRef.current.style.padding = '10px';
        charterCodeRef.current.style.boxShadow = '0 0 20px 5px rgba(255, 0, 0, 0.7)';
        const inputInside = charterCodeRef.current.querySelector('input');
        if (inputInside) {
          inputInside.style.border = '4px solid #ff0000';
          inputInside.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
          inputInside.style.boxShadow = '0 0 15px 3px rgba(255, 0, 0, 0.6)';
        }
        setTimeout(() => {
          if (charterCodeRef.current) {
            charterCodeRef.current.style.border = '';
            charterCodeRef.current.style.backgroundColor = '';
            charterCodeRef.current.style.borderRadius = '';
            charterCodeRef.current.style.padding = '';
            charterCodeRef.current.style.boxShadow = '';
            const inputInside = charterCodeRef.current.querySelector('input');
            if (inputInside) {
              inputInside.style.border = '';
              inputInside.style.backgroundColor = '';
              inputInside.style.boxShadow = '';
            }
          }
        }, 3000);
      }
      alert(`❌ ΣΤΑΜΑΤΑ!\n\nΑυτός ο αριθμός ναύλου υπάρχει ήδη: "${newCharter.code}"!\n\nΔΕΝ ΜΠΟΡΕΙΤΕ ΝΑ ΑΠΟΘΗΚΕΥΣΕΤΕ!`);
      console.log('🛑🛑🛑 RETURNING NOW - SAVE BLOCKED');
      return; // 🛑 ABSOLUTE BLOCK
    }

    // 🔥 Double-check: If we somehow got here with a duplicate, block again
    if (isDuplicateCode) {
      console.log('🛑 SECOND CHECK CAUGHT DUPLICATE - BLOCKING');
      alert('❌ Duplicate detected - save blocked!');
      return;
    }

    // 🔥 CRITICAL: Check for date overlap on same vessel (using API)
    // 🔥 SKIP overlap check for the same charter when editing
    console.log('🔍 FINAL CHECK for date overlap (API validation)');
    console.log('🔍 Dates:', newCharter.startDate, '-', newCharter.endDate);
    // Check against API database
    const excludeIdForDates = isEditMode ? editingCharter.id || editingCharter.code : undefined;
    const overlapResult = await checkDateOverlap(boat.id, newCharter.startDate, newCharter.endDate, excludeIdForDates);
    const hasDateOverlap = overlapResult.hasOverlap;
    if (overlapResult.overlappingBooking) {
      console.log('🛑 Found overlapping booking:', overlapResult.overlappingBooking.code);
    }
    console.log('🔍 hasDateOverlap result:', hasDateOverlap);
    if (hasDateOverlap) {
      console.log('❌❌❌ BLOCKING SAVE - DATE OVERLAP DETECTED!');
      setDoubleBookingError('Το σκάφος έχει ήδη κράτηση για αυτές τις ημερομηνίες');
      // 🔥 Apply INTENSE red highlight
      if (datesRef.current) {
        datesRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        datesRef.current.style.border = '4px solid #ff0000';
        datesRef.current.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        datesRef.current.style.borderRadius = '12px';
        datesRef.current.style.padding = '10px';
        datesRef.current.style.boxShadow = '0 0 20px 5px rgba(255, 0, 0, 0.7)';
        const inputs = datesRef.current.querySelectorAll('input');
        inputs.forEach((input: HTMLInputElement) => {
          input.style.border = '4px solid #ff0000';
          input.style.backgroundColor = 'rgba(255, 0, 0, 0.4)';
          input.style.boxShadow = '0 0 15px 3px rgba(255, 0, 0, 0.6)';
        });
        setTimeout(() => {
          if (datesRef.current) {
            datesRef.current.style.border = '';
            datesRef.current.style.backgroundColor = '';
            datesRef.current.style.borderRadius = '';
            datesRef.current.style.padding = '';
            datesRef.current.style.boxShadow = '';
            const inputs = datesRef.current.querySelectorAll('input');
            inputs.forEach((input: HTMLInputElement) => {
              input.style.border = '';
              input.style.backgroundColor = '';
              input.style.boxShadow = '';
            });
          }
        }, 3000);
      }
      alert(`❌ ΣΤΑΜΑΤΑ!\n\nΤο σκάφος "${boat?.name}" έχει ήδη κράτηση για αυτές τις ημερομηνίες!\n\nΔΕΝ ΜΠΟΡΕΙΤΕ ΝΑ ΑΠΟΘΗΚΕΥΣΕΤΕ!`);
      return; // BLOCK SAVE
    }

    console.log('✅✅✅ All checks passed - OK to save');

    // 🔥🔥🔥 FINAL SAFETY CHECK - One last verification before saving (skip for edit mode same code)
    if (shouldCheckDuplicate) {
      const finalDuplicateCheck = checkDuplicateOnEnter(newCharter.code);
      if (finalDuplicateCheck) {
        console.log('🛑🛑🛑 FINAL SAFETY CHECK CAUGHT DUPLICATE - ABSOLUTELY BLOCKING SAVE!');
        alert('❌ ΣΤΑΜΑΤΑ! Βρέθηκε διπλότυπο charter party code στον τελικό έλεγχο!\n\nΔεν αποθηκεύτηκε!');
        return;
      }
    }

    // 🔥 CREATE or UPDATE charter object
    const charter = {
      // Keep original id when editing, generate new when adding
      id: isEditMode ? editingCharter.id : uid(),
      code: newCharter.code,
      startDate: newCharter.startDate,
      endDate: newCharter.endDate,
      startTime: newCharter.startTime,
      endTime: newCharter.endTime,
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
      // 🔥 Keep existing payment data when editing, reset when adding
      paymentStatus: isEditMode ? (editingCharter.paymentStatus || 'Pending') : 'Pending',
      payments: isEditMode ? (editingCharter.payments || []) : [],
      // 🔥 FIX 9: Skipper fields
      skipperFirstName: newCharter.skipperFirstName,
      skipperLastName: newCharter.skipperLastName,
      skipperAddress: newCharter.skipperAddress,
      skipperEmail: newCharter.skipperEmail,
      skipperPhone: newCharter.skipperPhone,
      // 🔥 Keep original created data when editing
      createdBy: isEditMode ? editingCharter.createdBy : authService.getCurrentUser()?.name,
      createdAt: isEditMode ? editingCharter.createdAt : new Date().toISOString(),
      // 🔥 Add updated info
      updatedBy: authService.getCurrentUser()?.name,
      updatedAt: new Date().toISOString(),
      // 🔥 Keep source info when editing
      source: isEditMode ? editingCharter.source : undefined
    };

    // 🔥 FIX 6: Debug logging
    console.log(isEditMode ? '✏️ Updating charter:' : '📝 Adding charter:', charter);

    // Save locally - UPDATE existing or ADD new
    if (isEditMode) {
      // Update: replace the existing charter
      const updatedItems = items.map((item: any) => item.id === editingCharter.id ? charter : item);
      saveItems(updatedItems);
    } else {
      // Add: append new charter
      saveItems([...items, charter]);
    }

    // 🔥 FIX 6: Sync to API
    try {
      const apiResult = await saveBooking(charter.code, { bookingData: charter });
      console.log('✅ Charter synced to API:', apiResult);
    } catch (error) {
      console.error('❌ API sync error (charter saved locally):', error);
    }

    // 🔥 FIX 13 + FIX 38: Send email when new charter is created (skip email on edit unless status changed)
    // 🔥 FIX: Map status to correct email action
    if (!isEditMode || (isEditMode && editingCharter.status !== newCharter.status)) {
      let emailAction = 'new_charter'; // Default for Option status
      if (newCharter.status === 'Reservation' || newCharter.status === 'reservation') {
        emailAction = 'pending_final_confirmation';
        console.log('📧 Reservation status detected - sending pending_final_confirmation email');
      } else if (newCharter.status === 'Confirmed' || newCharter.status === 'confirmed') {
        emailAction = 'confirmed';
        console.log('📧 Confirmed status detected - sending confirmed email');
      }
      console.log('📧 Sending email with action:', emailAction, 'for status:', newCharter.status);
      await sendCharterEmail(charter, boat, emailAction);
    } else {
      console.log('📧 Skipping email - status unchanged during edit');
    }

    authService.logActivity(isEditMode ? 'edit_charter' : 'add_charter', `${boat.id}/${charter.code}`);

    // 🔥 Reset form and state
    setNewCharter({
      code: '', startDate: '', endDate: '', startTime: '', endTime: '', amount: '', commissionPercent: '',
      departure: 'ALIMOS MARINA', arrival: 'ALIMOS MARINA', status: 'Option',
      skipperFirstName: '', skipperLastName: '', skipperAddress: '', skipperEmail: '', skipperPhone: ''
    });
    setEditingCharter(null); // 🔥 Clear edit mode
    setShowAddForm(false);
    showMessage(isEditMode ? '✅ Ο ναύλος ενημερώθηκε.' : '✅ Ο ναύλος προστέθηκε.', 'success');
  };

  // 🔥 FIX 19 + FIX 40: Fixed delete to work locally even when API fails
  // Deletes from ALL possible localStorage keys (by ID and by vessel name)
  const handleDeleteCharter = async (charterKey) => {
    if (!canEditCharters) {
      showMessage('❌ View Only - Δεν έχετε δικαίωμα διαγραφής', 'error');
      return;
    }

    // Find charter by code first (API charters), then by id (local charters)
    const charter = items.find(c => c.code === charterKey || c.id === charterKey);
    const bookingCode = charter?.code || charterKey;

    console.log(`🗑️ Deleting charter: key=${charterKey}, code=${bookingCode}, found=${!!charter}`);

    // 1. Try to delete from API (don't block on failure)
    if (bookingCode) {
      try {
        const response = await fetch(`https://yachtmanagementsuite.com/api/bookings.php?booking_number=${encodeURIComponent(bookingCode)}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
          console.warn(`API delete failed (status ${response.status}), continuing with local delete`);
        } else {
          console.log('✅ Charter deleted from API:', bookingCode);
        }
      } catch (error) {
        console.warn('⚠️ API delete error (will still delete locally):', error);
      }
    }

    // 2. 🔥 FIX 40: Delete from ALL possible localStorage keys
    // Page 1 saves to fleet_{vesselName}_ΝΑΥΛΑ, FleetManagement saves to fleet_{boatId}_ΝΑΥΛΑ
    const keysToCheck = [
      `fleet_${boat.id}_ΝΑΥΛΑ`,                           // By numeric ID (e.g., fleet_7_ΝΑΥΛΑ)
      `fleet_${boat.name}_ΝΑΥΛΑ`,                         // By name exact (e.g., fleet_Perla_ΝΑΥΛΑ)
      `fleet_${boat.name?.toUpperCase()}_ΝΑΥΛΑ`,          // By name UPPER (e.g., fleet_PERLA_ΝΑΥΛΑ)
      `fleet_${boat.name?.toLowerCase()}_ΝΑΥΛΑ`,          // By name lower (e.g., fleet_perla_ΝΑΥΛΑ)
    ];

    // Also check the charter's vesselId in case it's different
    if (charter?.vesselId && !keysToCheck.includes(`fleet_${charter.vesselId}_ΝΑΥΛΑ`)) {
      keysToCheck.push(`fleet_${charter.vesselId}_ΝΑΥΛΑ`);
    }

    console.log('🗑️ Checking localStorage keys:', keysToCheck);

    keysToCheck.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const charters = JSON.parse(stored);
          const beforeCount = charters.length;
          const filtered = charters.filter((c: any) => c.code !== bookingCode && c.id !== charterKey);
          if (filtered.length < beforeCount) {
            localStorage.setItem(key, JSON.stringify(filtered));
            console.log(`   ✅ Removed from ${key} (${beforeCount} → ${filtered.length})`);
          }
        }
      } catch (e) {
        console.warn(`   ⚠️ Error cleaning key ${key}:`, e);
      }
    });

    // 3. Update React state
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

  // 🔥 NEW: Handle editing a charter (Draft/Page1 charters get full edit capability)
  const handleEditCharter = (charter) => {
    console.log('✏️ EDIT CHARTER:', charter.code, 'Status:', charter.status, 'Source:', charter.source);

    // Populate the form with existing charter data
    setNewCharter({
      code: charter.code || '',
      startDate: charter.startDate || '',
      endDate: charter.endDate || '',
      startTime: charter.startTime || '',
      endTime: charter.endTime || '',
      amount: charter.amount?.toString() || '',
      commissionPercent: charter.commissionPercent?.toString() || '',
      departure: charter.departure || 'ALIMOS MARINA',
      arrival: charter.arrival || 'ALIMOS MARINA',
      status: charter.status || 'Option',
      skipperFirstName: charter.skipperFirstName || '',
      skipperLastName: charter.skipperLastName || '',
      skipperAddress: charter.skipperAddress || '',
      skipperEmail: charter.skipperEmail || '',
      skipperPhone: charter.skipperPhone || ''
    });

    // Set editing mode
    setEditingCharter(charter);

    // Close detail modal and show form
    setSelectedCharter(null);
    setShowAddForm(true);

    showMessage('✏️ Επεξεργασία ναύλου: ' + charter.code, 'info');
  };

  // 🔥 FIX: Fetch latest status from API when opening charter modal
  const handleSelectCharter = async (charter) => {
    authService.logActivity('view_charter_details', `${boat.id}/${charter.code}`);

    // Try to fetch the latest status from API
    try {
      const bookingCode = charter.code || charter.id;
      const latestBooking = await getBooking(bookingCode);

      if (latestBooking && latestBooking.bookingData) {
        // Merge API status with local charter data
        const updatedCharter = {
          ...charter,
          status: latestBooking.bookingData.status || charter.status,
          // Also update local items state with the latest status
        };

        console.log('📋 Charter status from API:', latestBooking.bookingData.status, 'Local:', charter.status);

        // Update local state if status changed
        if (latestBooking.bookingData.status && latestBooking.bookingData.status !== charter.status) {
          const updated = items.map((item) =>
            item.id === charter.id ? { ...item, status: latestBooking.bookingData.status } : item
          );
          saveItems(updated);
          showMessage(`📋 Status updated from server: ${latestBooking.bookingData.status}`, 'info');
        }

        setSelectedCharter(updatedCharter);
      } else {
        // API returned no data, use local charter
        setSelectedCharter(charter);
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch latest status from API:', error);
      // Fallback to local charter data
      setSelectedCharter(charter);
    }
  };

  // 🔥 NEW: Refresh selected charter from API (for auto-refresh)
  const refreshSelectedCharter = useCallback(async () => {
    if (!selectedCharter) return;

    try {
      const bookingCode = selectedCharter.code || selectedCharter.id;
      const latestBooking = await getBooking(bookingCode);

      if (latestBooking && latestBooking.bookingData) {
        const newStatus = latestBooking.bookingData.status;

        // Only update if status changed
        if (newStatus && newStatus !== selectedCharter.status) {
          console.log('🔄 Modal auto-refresh: Status changed from', selectedCharter.status, 'to', newStatus);

          // Update modal with all latest data
          setSelectedCharter(prev => ({ ...prev, ...latestBooking.bookingData }));

          // Update list
          const updated = items.map((item) =>
            item.id === selectedCharter.id ? { ...item, status: newStatus } : item
          );
          saveItems(updated);

          showMessage(`📋 Status updated: ${newStatus}`, 'info');
        }
      }
    } catch (error) {
      console.warn('⚠️ Modal refresh error:', error);
    }
  }, [selectedCharter, items, saveItems, showMessage]);

  // 🔥 NEW: Auto-refresh modal every 30 seconds when open
  useEffect(() => {
    console.log('🔍 useEffect running, selectedCharter:', selectedCharter?.code);
    if (!selectedCharter) return;

    const interval = setInterval(() => {
      console.log('⏰ Modal 30-second refresh triggered');
      refreshSelectedCharter();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [selectedCharter?.id, refreshSelectedCharter]);

  // 🔥 NEW: Update modal when global refresh happens
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (selectedCharter) {
        console.log('🔄 CharterPage: Global refresh received, updating modal...');
        refreshSelectedCharter();
      }
    };

    window.addEventListener('globalBookingsRefreshed', handleGlobalRefresh);
    return () => window.removeEventListener('globalBookingsRefreshed', handleGlobalRefresh);
  }, [selectedCharter, refreshSelectedCharter]);

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
          <button onClick={() => {
            if (showAddForm) {
              // Cancel: clear form and editing state
              setShowAddForm(false);
              setEditingCharter(null);
              setNewCharter({
                code: '', startDate: '', endDate: '', startTime: '', endTime: '', amount: '', commissionPercent: '',
                departure: 'ALIMOS MARINA', arrival: 'ALIMOS MARINA', status: 'Option',
                skipperFirstName: '', skipperLastName: '', skipperAddress: '', skipperEmail: '', skipperPhone: ''
              });
            } else {
              setShowAddForm(true);
            }
          }} className={`flex items-center justify-center w-full ${editingCharter ? 'bg-blue-800 hover:bg-blue-700 border-blue-600' : 'bg-gray-800 hover:bg-gray-700 border-gray-700'} text-white font-bold py-3 px-4 rounded-lg transition duration-200 border`}>
            {editingCharter ? icons.edit : icons.plus} <span className="ml-2">{showAddForm ? 'Ακύρωση' : 'Προσθήκη Νέου Ναύλου'}</span>
          </button>
          
          {showAddForm && (
            <form onSubmit={(e) => e.preventDefault()} className={`mt-4 p-5 rounded-lg border-2 space-y-4 ${editingCharter ? 'bg-blue-900 border-blue-600' : 'bg-gray-800 border-gray-700'}`}>
              {/* 🔥 Edit mode header banner */}
              {editingCharter && (
                <div className="bg-blue-600 text-white p-3 rounded-lg text-center font-bold text-lg mb-2 border-2 border-blue-400">
                  ✏️ ΕΠΕΞΕΡΓΑΣΙΑ ΝΑΥΛΟΥ: {editingCharter.code}
                </div>
              )}
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-bold text-teal-400 mb-3">
                  {editingCharter ? '✏️ ΕΠΕΞΕΡΓΑΣΙΑ ΝΑΥΛΟΥ' : 'CHARTERING INFORMATION'}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div ref={charterCodeRef}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Κωδικός Ναύλου *</label>
                    {/* 🔥 FIX 30: Added autoComplete="off" to fix Chrome typing issue */}
                    <input
                      type="text"
                      name="code"
                      value={newCharter.code}
                      onChange={handleFormChange}
                      onKeyDown={handleFormKeyDown}
                      onBlur={() => newCharter.code && validateCharterCodeOnBlur(newCharter.code, editingCharter?.id)}
                      placeholder="π.χ. NAY-002"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className={`w-full px-3 py-2 bg-gray-600 text-white rounded-lg border ${charterCodeError ? 'border-red-500' : 'border-gray-500'} focus:border-teal-500 focus:outline-none`}
                    />
                    {charterCodeError && (
                      <p className="mt-2 text-sm text-red-400 font-medium">{charterCodeError}</p>
                    )}
                  </div>
                  <div ref={datesRef}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">CHECK-IN DATE *</label>
                        <input
                          type="date"
                          name="startDate"
                          value={newCharter.startDate}
                          onChange={handleFormChange}
                          onKeyDown={handleFormKeyDown}
                          onBlur={() => newCharter.startDate && newCharter.endDate && validateDatesOnBlur(newCharter.startDate, newCharter.endDate, editingCharter?.id)}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-3 py-2 bg-gray-600 text-white rounded-lg border ${doubleBookingError ? 'border-red-500' : 'border-gray-500'} focus:border-teal-500 focus:outline-none`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">CHECK-IN TIME</label>
                        <input
                          type="time"
                          name="startTime"
                          value={newCharter.startTime}
                          onChange={handleFormChange}
                          onKeyDown={handleFormKeyDown}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">CHECK-OUT DATE *</label>
                        <input
                          type="date"
                          name="endDate"
                          value={newCharter.endDate}
                          onChange={handleFormChange}
                          onKeyDown={handleFormKeyDown}
                          onBlur={() => newCharter.startDate && newCharter.endDate && validateDatesOnBlur(newCharter.startDate, newCharter.endDate, editingCharter?.id)}
                          min={newCharter.startDate || new Date().toISOString().split('T')[0]}
                          className={`w-full px-3 py-2 bg-gray-600 text-white rounded-lg border ${dateRangeError || doubleBookingError ? 'border-red-500' : 'border-gray-500'} focus:border-teal-500 focus:outline-none`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">CHECK-OUT TIME</label>
                        <input
                          type="time"
                          name="endTime"
                          value={newCharter.endTime}
                          onChange={handleFormChange}
                          onKeyDown={handleFormKeyDown}
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    {dateRangeError && (
                      <p className="mt-2 text-sm text-red-400 font-medium">{dateRangeError}</p>
                    )}
                    {doubleBookingError && (
                      <p className="mt-2 text-sm text-red-400 font-medium">{doubleBookingError}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">DEPARTURE</label>
                      <input type="text" name="departure" value={newCharter.departure} onChange={handleFormChange} onKeyDown={handleFormKeyDown} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">ARRIVAL</label>
                      <input type="text" name="arrival" value={newCharter.arrival} onChange={handleFormChange} onKeyDown={handleFormKeyDown} className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">STATUS</label>
                    <select name="status" value={newCharter.status} onChange={handleFormChange} onKeyDown={handleFormKeyDown} className="w-full px-3 py-3 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none font-bold">
                      <option value="Draft" className="bg-blue-400 text-white">📝 DRAFT (Από Check-in)</option>
                      <option value="Option" className="bg-yellow-400 text-black">🟡 OPTION (Αναμονή Owner)</option>
                      <option value="Reservation" className="bg-yellow-400 text-black">🟡 RESERVATION (Κράτηση)</option>
                      <option value="Pending Approval" className="bg-orange-400 text-black">🟠 PENDING APPROVAL (Προς Έγκριση)</option>
                      <option value="Confirmed" className="bg-green-500 text-white">🟢 CONFIRMED (Κλεισμένο)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 🔥 FIX 9: Skipper Information Section */}
              <div ref={skipperInfoRef} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-bold text-blue-400 mb-3">SKIPPER INFORMATION</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input type="text" name="skipperFirstName" value={newCharter.skipperFirstName} onChange={handleFormChange} onKeyDown={handleFormKeyDown} placeholder="Όνομα" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                      <input type="text" name="skipperLastName" value={newCharter.skipperLastName} onChange={handleFormChange} onKeyDown={handleFormKeyDown} placeholder="Επώνυμο" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                    <input type="text" name="skipperAddress" value={newCharter.skipperAddress} onChange={handleFormChange} onKeyDown={handleFormKeyDown} placeholder="Διεύθυνση" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input type="email" name="skipperEmail" value={newCharter.skipperEmail} onChange={handleFormChange} onKeyDown={handleFormKeyDown} placeholder="email@example.com" className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input type="tel" name="skipperPhone" value={newCharter.skipperPhone} onChange={handleFormChange} onKeyDown={handleFormKeyDown} placeholder="+30 69..." className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none" />
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
              
              {!isFormValid && (
                <div className="mb-3 p-3 bg-yellow-900 border border-yellow-600 rounded-lg text-yellow-200 text-sm">
                  ⚠️ Συμπληρώστε όλα τα υποχρεωτικά πεδία (*):
                  {!newCharter.code && <div>• Κωδικός Ναύλου</div>}
                  {!newCharter.startDate && <div>• FROM (Ημερομηνία έναρξης)</div>}
                  {!newCharter.endDate && <div>• TO (Ημερομηνία λήξης)</div>}
                  {!(parseFloat(newCharter.amount) > 0) && <div>• Charter Fee (Ποσό {'>'} 0)</div>}
                </div>
              )}

              <button
                type="button"
                id="save-charter-btn"
                onClick={handleAddCharter}
                className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition duration-200 ${isFormValid ? (editingCharter ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white') : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
              >
                {editingCharter ? '✏️ Ενημέρωση Ναύλου' : '💾 Αποθήκευση Ναύλου'} {!isFormValid && '(Συμπληρώστε τα υποχρεωτικά πεδία)'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 🔥 Filter Tabs for Page 1 bookings */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setCharterFilter('all')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            charterFilter === 'all'
              ? 'bg-teal-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Όλοι ({items.length})
        </button>
        <button
          onClick={() => setCharterFilter('page1')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            charterFilter === 'page1'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          📝 Από Check-in ({page1Count})
        </button>
        <button
          onClick={() => setCharterFilter('confirmed')}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
            charterFilter === 'confirmed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          ✅ Confirmed ({items.filter(c => c.status === 'Confirmed').length})
        </button>
      </div>

      <div className="space-y-3">
        {filteredItems.map(charter => {
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
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                    Status: <span className={
                      charter.status === 'Confirmed' ? 'text-green-400' :
                      charter.status === 'Draft' ? 'text-blue-400' :
                      charter.status === 'Pending Approval' ? 'text-orange-400' :
                      (charter.status === 'Rejected' || charter.status === 'Cancelled' || charter.status === 'Canceled') ? 'text-red-400' :
                      'text-yellow-400'
                    }>{charter.status}</span>
                    {/* Badge for Draft status or source=page1 (from Page 1 check-in) */}
                    {(charter.status === 'Draft' || charter.source === 'page1') && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded border border-blue-500/50">
                        📝 Από Check-in
                      </span>
                    )}
                    {/* Badge if financial details are missing */}
                    {(!charter.amount || charter.amount === 0) && charter.status !== 'Cancelled' && charter.status !== 'Canceled' && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded border border-orange-500/50">
                        💰 Χρειάζεται Ποσό
                      </span>
                    )}
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
          onEdit={handleEditCharter}
        />
      )}
    </div>
  );
}

function CharterDetailModal({ charter, boat, canViewFinancials, canEditCharters, canAcceptCharter, isOwnerUser, onClose, onDelete, onUpdateStatus, onUpdatePayments, showMessage, onEdit }) {
  // 🔥 DEBUG: Log permissions for troubleshooting
  console.log('🔍 CharterDetailModal - Permissions:', {
    charterCode: charter.code,
    charterStatus: charter.status,
    isOwnerUser,
    canAcceptCharter,
    canEditCharters,
    showOwnerButtons: canAcceptCharter && charter.status === 'Pending Final Confirmation'
  });

  const totalExpense = (charter.commission || 0) + (charter.vat_on_commission || 0);
  const netIncome = (charter.amount || 0) - totalExpense;
  const [payments, setPayments] = useState(charter.payments || []);
  const [newPayDate, setNewPayDate] = useState('');
  const [newPayAmount, setNewPayAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // 🔥 FIX 28: Inline status messages inside modal
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'loading' | 'success' | 'error' } | null>(null);

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

  // 🔥 FIX 28: Helper to clear status message after delay
  const clearStatusAfterDelay = () => {
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // OWNER: Option → Option Accepted (accept) or Cancelled (reject)
  // 🔥 FIX 8 + FIX 28: Added inline status messages
  const handleOwnerAcceptOption = async () => {
    if (!canAcceptCharter) { showMessage('❌ Δεν έχετε δικαίωμα αποδοχής', 'error'); return; }
    setIsProcessing(true);
    setStatusMessage({ text: 'Αποστολή emails...', type: 'loading' });
    console.log('📝 Owner accepting option:', charter.code);
    const success = await sendCharterEmail(charter, boat, 'option_accepted');
    if (success) {
      onUpdateStatus(charter, 'Option Accepted');
      try {
        const updatedCharter = { ...charter, status: 'option_accepted', vesselId: boat.id };
        await saveBooking(charter.code, { bookingData: updatedCharter });
        console.log('✅ Charter acceptance synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      setStatusMessage({ text: '✅ Charter επιβεβαιώθηκε!', type: 'success' });
      clearStatusAfterDelay();
    } else {
      setStatusMessage({ text: '❌ Σφάλμα', type: 'error' });
      clearStatusAfterDelay();
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 8 + FIX 28: Added inline status messages
  const handleOwnerRejectOption = async () => {
    if (!canAcceptCharter) { showMessage('❌ Δεν έχετε δικαίωμα απόρριψης', 'error'); return; }
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ΑΠΟΡΡΙΨΕΤΕ αυτόν τον ναύλο;')) return;
    setIsProcessing(true);
    setStatusMessage({ text: 'Αποστολή emails...', type: 'loading' });
    console.log('📝 Owner rejecting option:', charter.code);
    const success = await sendCharterEmail(charter, boat, 'cancelled');
    if (success) {
      onUpdateStatus(charter, 'Cancelled');
      try {
        const updatedCharter = { ...charter, status: 'Cancelled', vesselId: boat.id };
        await saveBooking(charter.code, { bookingData: updatedCharter });
        console.log('✅ Charter rejection synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      setStatusMessage({ text: '❌ Ναύλος ακυρώθηκε!', type: 'success' });
      clearStatusAfterDelay();
    } else {
      setStatusMessage({ text: '❌ Σφάλμα', type: 'error' });
      clearStatusAfterDelay();
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 29: OWNER: Pending Final Confirmation → Confirmed (ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ)
  const handleOwnerFinalConfirmation = async () => {
    console.log('🔥 handleOwnerFinalConfirmation CALLED');
    console.log('🔥 canAcceptCharter:', canAcceptCharter);
    console.log('🔥 charter:', charter?.code, 'status:', charter?.status);
    console.log('🔥 boat:', boat?.id, boat?.name);

    if (!canAcceptCharter) {
      console.log('❌ canAcceptCharter is FALSE - blocking');
      showMessage('❌ Δεν έχετε δικαίωμα επιβεβαίωσης', 'error');
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ text: 'Αποστολή emails...', type: 'loading' });

    console.log('📧 CALLING sendCharterEmail with action: confirmed');
    const success = await sendCharterEmail(charter, boat, 'confirmed');
    console.log('📧 sendCharterEmail RESULT:', success);

    if (success) {
      onUpdateStatus(charter, 'Confirmed');
      try {
        const updatedCharter = { ...charter, status: 'Confirmed', vesselId: boat.id };
        await saveBooking(charter.code, { bookingData: updatedCharter });
        console.log('✅ Final confirmation synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      setStatusMessage({ text: '✅ Ναύλος επιβεβαιώθηκε τελικά!', type: 'success' });
      clearStatusAfterDelay();
    } else {
      console.log('❌ sendCharterEmail returned FALSE');
      setStatusMessage({ text: '❌ Σφάλμα αποστολής email', type: 'error' });
      clearStatusAfterDelay();
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 29: ADMIN: Option Accepted → Pending Final Confirmation (ΑΠΟΣΤΟΛΗ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ)
  const handleAdminSendForFinalApproval = async () => {
    setIsProcessing(true);
    setStatusMessage({ text: 'Αποστολή emails...', type: 'loading' });
    console.log('📝 Admin sending for final approval:', charter.code);
    const success = await sendCharterEmail(charter, boat, 'pending_final_confirmation');
    if (success) {
      onUpdateStatus(charter, 'Pending Final Confirmation');
      try {
        const updatedCharter = { ...charter, status: 'Pending Final Confirmation', vesselId: boat.id };
        await saveBooking(charter.code, { bookingData: updatedCharter });
        console.log('✅ Sent for final approval - synced to API');
      } catch (error) {
        console.error('❌ API sync error:', error);
      }
      setStatusMessage({ text: '✅ Αποστάλθηκε για τελική επιβεβαίωση!', type: 'success' });
      clearStatusAfterDelay();
    } else {
      setStatusMessage({ text: '❌ Σφάλμα', type: 'error' });
      clearStatusAfterDelay();
    }
    setIsProcessing(false);
  };

  // 🔥 FIX 28: Added inline status messages
  const handleAdminCancelCharter = async () => {
    if (!window.confirm('Είστε σίγουροι ότι θέλετε να ΑΚΥΡΩΣΕΤΕ αυτόν τον ναύλο;')) return;
    setIsProcessing(true);
    setStatusMessage({ text: 'Αποστολή emails...', type: 'loading' });
    const success = await sendCharterEmail(charter, boat, 'cancelled');
    if (success) {
      onDelete(charter.id);
      setStatusMessage({ text: '❌ Ναύλος ακυρώθηκε!', type: 'success' });
      clearStatusAfterDelay();
    } else {
      setStatusMessage({ text: '❌ Σφάλμα', type: 'error' });
      clearStatusAfterDelay();
    }
    setIsProcessing(false);
  };

  const handleDownloadSpecimen = () => { generateSpecimenPdf(charter, boat); };

  // 🔥 FIX 35: Professional PDF download handler
  const handleDownloadProfessionalPDF = async () => {
    try {
      showMessage('Generating PDF...', 'info');
      await generateOwnerCharterPDF(charter, boat, { company: boat.ownerCompany || boat.name || 'OWNER' });
      showMessage('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showMessage('Error generating PDF', 'error');
    }
  };

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

        {/* 🔥 FIX 28: Inline status message display */}
        {statusMessage && (
          <div className={`mb-4 p-3 rounded-lg text-center font-semibold ${
            statusMessage.type === 'loading' ? 'bg-blue-600 text-white animate-pulse' :
            statusMessage.type === 'success' ? 'bg-green-600 text-white' :
            'bg-red-600 text-white'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* 🔥 EDIT BUTTON - TOP OF MODAL - FORCED TO SHOW FOR TESTING */}
        {console.log('🔥 EDIT BUTTON RENDER - canEditCharters:', canEditCharters, 'onEdit:', !!onEdit, 'status:', charter?.status, 'source:', charter?.source)}

        {/* 🔥 TEST: Always show edit button if onEdit exists */}
        {onEdit && (
          <button
            onClick={() => {
              console.log('🔥 EDIT BUTTON CLICKED!', charter);
              onEdit(charter);
            }}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center mb-4 border-2 border-blue-400 shadow-xl text-lg"
            style={{ animation: 'pulse 2s infinite' }}
          >
            <span className="text-xl">✏️ ΕΠΕΞΕΡΓΑΣΙΑ ΝΑΥΛΟΥ</span>
          </button>
        )}

        {/* 🔥 FALLBACK: If onEdit is missing, show why */}
        {!onEdit && (
          <div className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg mb-4 text-center">
            ⚠️ onEdit prop is missing - Edit button disabled
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
          <div className="flex justify-between"><span className="text-gray-300">FROM:</span><span className="font-bold">{charter.startDate}{charter.startTime && ` @ ${charter.startTime}`}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">TO:</span><span className="font-bold">{charter.endDate}{charter.endTime && ` @ ${charter.endTime}`}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">DEPARTURE:</span><span className="font-bold">{charter.departure || 'ALIMOS MARINA'}</span></div>
          <div className="flex justify-between"><span className="text-gray-300">ARRIVAL:</span><span className="font-bold">{charter.arrival || 'ALIMOS MARINA'}</span></div>
          {/* Status badge for Draft bookings */}
          {charter.status === 'Draft' && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-600">
              <span className="text-gray-300">STATUS:</span>
              <span className="px-3 py-1 bg-blue-500/30 text-blue-400 rounded-lg text-sm font-bold border border-blue-500/50">
                📝 DRAFT - Από Check-in
              </span>
            </div>
          )}
          {/* Show skipper info if available */}
          {(charter.skipperFirstName || charter.skipperLastName) && (
            <div className="pt-2 border-t border-gray-600">
              <div className="flex justify-between"><span className="text-gray-300">SKIPPER:</span><span className="font-bold">{charter.skipperFirstName} {charter.skipperLastName}</span></div>
              {charter.skipperEmail && <div className="flex justify-between"><span className="text-gray-300">EMAIL:</span><span className="text-sm">{charter.skipperEmail}</span></div>}
              {charter.skipperPhone && <div className="flex justify-between"><span className="text-gray-300">PHONE:</span><span className="text-sm">{charter.skipperPhone}</span></div>}
            </div>
          )}
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

        {/* ADMIN: Option → Show waiting message */}
        {!isOwnerUser && (charter.status === 'Option' || charter.status === 'option' || charter.status === 'OPTION' || charter.status === 'Pending' || charter.status === 'pending') && (
          <div className="w-full bg-yellow-400 text-black font-bold py-3 px-4 rounded-lg mb-3 flex flex-col items-center justify-center">
            <div className="flex items-center">🟡 <span className="ml-2">OPTION - Αναμονή αποδοχής Owner</span></div>
            <span className="text-xs font-normal mt-1">Ο Owner πρέπει να αποδεχτεί πρώτα</span>
          </div>
        )}

        {/* OWNER: Option → ΑΠΟΔΟΧΗ / ΜΗ ΑΠΟΔΟΧΗ */}
        {isOwnerUser && (charter.status === 'Option' || charter.status === 'option' || charter.status === 'OPTION' || charter.status === 'Pending' || charter.status === 'pending') && (
          <div className="space-y-2 mb-4">
            <div className="text-center text-sm mb-2 p-2 rounded-lg bg-yellow-400 text-black">
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

        {/* 🔥 FIX 29: ADMIN: Option Accepted → ΑΠΟΣΤΟΛΗ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ / ΑΚΥΡΟ */}
        {!isOwnerUser && (charter.status === 'Option Accepted' || charter.status === 'option_accepted' || charter.status === 'OPTION_ACCEPTED') && (
          <div className="space-y-2 mb-4">
            <div className="text-center text-sm mb-2 p-2 rounded-lg bg-yellow-400 text-black">
              ⏳ Owner αποδέχτηκε - Στείλτε για τελική επιβεβαίωση
            </div>
            {/* 🔥 FIX 29: Admin button sends to owner for final approval */}
            <button onClick={handleAdminSendForFinalApproval} disabled={isProcessing} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.checkCircle} <span className="ml-2">📤 ΑΠΟΣΤΟΛΗ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ</span></>}
            </button>
            <button onClick={handleAdminCancelCharter} disabled={isProcessing} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
              {isProcessing ? 'Processing...' : <>{icons.xCircle} <span className="ml-2">❌ ΑΚΥΡΟ</span></>}
            </button>
          </div>
        )}

        {/* 🔥 FIX: OWNER ONLY: Pending Final Confirmation → BIG CLICKABLE YELLOW BUTTON */}
        {isOwnerUser && (charter.status === 'Pending Final Confirmation' || charter.status === 'pending_final_confirmation' || charter.status === 'PENDING_FINAL_CONFIRMATION') && (
          <div className="space-y-3 mb-4">
            {/* 🔥 BIG CLICKABLE YELLOW BUTTON - Primary action for owner */}
            <button
              onClick={handleOwnerFinalConfirmation}
              disabled={isProcessing}
              className="w-full bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600 text-black font-bold py-5 px-4 rounded-lg flex flex-col items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border-4 border-yellow-600 transform hover:scale-[1.02] transition-all duration-200 animate-pulse"
            >
              {isProcessing ? (
                <span className="text-xl">⏳ Processing...</span>
              ) : (
                <>
                  <span className="text-2xl mb-1">👆 ΚΛΙΚ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ</span>
                  <span className="text-sm font-normal">Πατήστε για να επιβεβαιώσετε τον ναύλο</span>
                </>
              )}
            </button>
            {/* 🔥 NO reject button here - only admin can cancel after option is accepted */}
            <div className="text-center text-xs text-gray-500">
              Για ακύρωση επικοινωνήστε με τον Admin
            </div>
          </div>
        )}

        {/* Status displays - NOT CLICKABLE, just informational */}
        {(charter.status === 'Option Accepted' || charter.status === 'option_accepted' || charter.status === 'OPTION_ACCEPTED') && isOwnerUser && (
          <div className="w-full bg-yellow-400/70 text-black font-bold py-3 px-4 rounded-lg mb-3 flex flex-col items-center justify-center cursor-not-allowed border-2 border-dashed border-yellow-600">
            <div className="flex items-center">{icons.checkCircle} <span className="ml-2">⏳ OPTION ACCEPTED</span></div>
            <span className="text-xs font-normal mt-1">Αναμονή ενέργειας από Admin...</span>
          </div>
        )}

        {/* 🔥 FIX 29: Show pending status to Admin - NOT CLICKABLE */}
        {(charter.status === 'Pending Final Confirmation' || charter.status === 'pending_final_confirmation' || charter.status === 'PENDING_FINAL_CONFIRMATION') && !isOwnerUser && (
          <div className="w-full bg-yellow-400/70 text-black font-bold py-3 px-4 rounded-lg mb-3 flex flex-col items-center justify-center cursor-not-allowed border-2 border-dashed border-yellow-600">
            <div className="flex items-center">{icons.checkCircle} <span className="ml-2">⏳ ΑΝΑΜΟΝΗ ΤΕΛΙΚΗΣ ΕΠΙΒΕΒΑΙΩΣΗΣ</span></div>
            <span className="text-xs font-normal mt-1">Αναμονή επιβεβαίωσης από Owner...</span>
          </div>
        )}

        {(charter.status === 'Confirmed' || charter.status === 'confirmed' || charter.status === 'CONFIRMED') && (
          <div className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center">{icons.checkCircle} <span className="ml-2">✅ ΕΠΙΒΕΒΑΙΩΜΕΝΟΣ</span></div>
        )}

        {(charter.status === 'Cancelled' || charter.status === 'Canceled' || charter.status === 'Rejected' || charter.status === 'cancelled' || charter.status === 'canceled' || charter.status === 'rejected' || charter.status === 'CANCELLED' || charter.status === 'CANCELED' || charter.status === 'REJECTED') && (
          <div className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center">{icons.xCircle} <span className="ml-2">❌ ΑΚΥΡΩΜΕΝΟΣ</span></div>
        )}

        {/* 🔥 FIX 35: Professional PDF Download Button */}
        <button onClick={handleDownloadProfessionalPDF} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-blue-400 shadow-lg">
          {icons.download} <span className="ml-2">📥 Download PDF (Professional)</span>
        </button>

        <button onClick={handleDownloadSpecimen} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-gray-600">
          {icons.download} <span className="ml-2">Download Specimen</span>
        </button>

        {/* 🔥 FIX 23: Charter Party DOCX Button */}
        <button onClick={handleDownloadCharterParty} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg mb-3 flex items-center justify-center border border-indigo-500">
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

        {/* Edit button moved to top of modal */}

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

  // 🔥 NEW: Listen for global refresh events (every 3 minutes) - SYNC INVOICES
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (boat && canViewFinancials) {
        console.log('🔄 FinancialsPage: Global refresh received, syncing invoices...');
        loadData();
      }
    };

    window.addEventListener('globalBookingsRefreshed', handleGlobalRefresh);
    return () => window.removeEventListener('globalBookingsRefreshed', handleGlobalRefresh);
  }, [boat?.id, canViewFinancials]);

  // 🔥 FIX 3: Null check AFTER all hooks
  if (!boat) {
    return (
      <div className="flex flex-col h-full bg-gray-900 items-center justify-center">
        <div className="text-teal-400 text-xl">Loading...</div>
      </div>
    );
  }

  // 🔥 API-first: Load data from API, migrate localStorage on first load
  const loadData = async () => {
    try {
      // Load charters from API ONLY
      let chartersData: any[] = [];
      try {
        chartersData = await getBookingsByVessel(boat.id);
        console.log(`✅ FinancialsPage: Loaded ${chartersData.length} charters from API`);
      } catch (apiError) {
        console.error(`❌ API failed, no charters loaded`);
        chartersData = [];
      }

      // Sort charters by date
      chartersData.sort((a: any, b: any) => (b.startDate && a.startDate) ? new Date(b.startDate).getTime() - new Date(a.startDate).getTime() : 0);
      setCharters(chartersData);

      // 🔥 Migrate localStorage invoices to API (one-time migration)
      await migrateInvoicesFromLocalStorage(boat.id, boat.name || String(boat.id));

      // 🔥 Load invoices from API first
      let invoicesData: any[] = [];
      try {
        invoicesData = await getInvoicesByVessel(boat.id);
        console.log(`✅ FinancialsPage: Loaded ${invoicesData.length} invoices from API`);
      } catch (apiError) {
        console.error(`❌ API failed for invoices, falling back to localStorage`);
        // Fallback to localStorage if API fails
        const invoicesKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ`;
        const invoicesStored = localStorage.getItem(invoicesKey);
        if (invoicesStored) {
          invoicesData = JSON.parse(invoicesStored);
        }
      }

      // Also check for any pending_sync items in localStorage
      const pendingSyncKey = `fleet_${boat.id}_ΤΙΜΟΛΟΓΙΑ_pending`;
      const pendingStored = localStorage.getItem(pendingSyncKey);
      if (pendingStored) {
        try {
          const pendingItems = JSON.parse(pendingStored);
          // Merge pending items (they should be uploaded to API)
          for (const pendingInvoice of pendingItems) {
            const exists = invoicesData.some((inv: any) => inv.id === pendingInvoice.id || inv.invoiceCode === pendingInvoice.invoiceCode);
            if (!exists) {
              invoicesData.push(pendingInvoice);
              // Try to upload to API
              try {
                await saveInvoice({
                  invoiceCode: pendingInvoice.invoiceCode || pendingInvoice.id,
                  vesselId: boat.id,
                  vesselName: boat.name || String(boat.id),
                  invoiceNumber: pendingInvoice.code,
                  description: pendingInvoice.description,
                  amount: pendingInvoice.amount || 0,
                  invoiceDate: pendingInvoice.date,
                  createdBy: pendingInvoice.createdBy
                });
                console.log(`✅ Synced pending invoice: ${pendingInvoice.code}`);
              } catch (syncError) {
                console.warn(`⚠️ Failed to sync pending invoice: ${pendingInvoice.code}`);
              }
            }
          }
          // Clear pending after successful sync attempt
          localStorage.removeItem(pendingSyncKey);
        } catch (e) {
          console.error('Error processing pending invoices:', e);
        }
      }

      // Sort invoices by date
      invoicesData.sort((a: any, b: any) => {
        const dateA = a.date || a.invoiceDate || a.createdAt;
        const dateB = b.date || b.invoiceDate || b.createdAt;
        return (dateB && dateA) ? new Date(dateB).getTime() - new Date(dateA).getTime() : 0;
      });
      setInvoices(invoicesData);

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

  const handleAddInvoice = async () => {
    if (!canEditFinancials) { showMessage('❌ View Only - Δεν έχετε δικαίωμα', 'error'); return; }
    if (!newInvoice.code || !newInvoice.date || !newInvoice.description) {
      showMessage("❌ Παρακαλώ συμπληρώστε όλα τα πεδία.", "error");
      return;
    }

    const invoiceId = uid();
    const invoice = {
      id: invoiceId,
      invoiceCode: `INV-${boatId}-${invoiceId}`,
      ...newInvoice,
      createdAt: new Date().toISOString(),
      createdBy: authService.getCurrentUser()?.name
    };

    // 🔥 Step 1: Save to localStorage FIRST (immediate, never lost)
    const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    const updated = [...invoices, invoice];
    localStorage.setItem(key, JSON.stringify(updated));
    setInvoices(updated);

    // 🔥 Step 2: Try to POST to API
    try {
      const result = await saveInvoice({
        invoiceCode: invoice.invoiceCode,
        vesselId: boatId,
        vesselName: invoice.vesselName || String(boatId),
        invoiceNumber: invoice.code,
        description: invoice.description,
        amount: invoice.amount || 0,
        invoiceDate: invoice.date,
        notes: invoice.notes,
        createdBy: invoice.createdBy
      });

      if (result.success) {
        console.log(`✅ Invoice saved to API: ${invoice.code}`);
        showMessage("✅ Το τιμολόγιο αποθηκεύτηκε.", "success");
      } else {
        // API failed, mark as pending_sync
        const pendingKey = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ_pending`;
        const pendingStored = localStorage.getItem(pendingKey);
        const pendingItems = pendingStored ? JSON.parse(pendingStored) : [];
        pendingItems.push({ ...invoice, pending_sync: true });
        localStorage.setItem(pendingKey, JSON.stringify(pendingItems));
        console.warn(`⚠️ Invoice saved locally, pending sync: ${invoice.code}`);
        showMessage("✅ Αποθηκεύτηκε τοπικά (θα συγχρονιστεί).", "success");
      }
    } catch (apiError) {
      // 🔥 Step 3: If API fails (offline), mark as "pending_sync" in localStorage
      console.error('API save failed:', apiError);
      const pendingKey = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ_pending`;
      const pendingStored = localStorage.getItem(pendingKey);
      const pendingItems = pendingStored ? JSON.parse(pendingStored) : [];
      pendingItems.push({ ...invoice, pending_sync: true });
      localStorage.setItem(pendingKey, JSON.stringify(pendingItems));
      console.warn(`⚠️ Invoice saved locally, pending sync: ${invoice.code}`);
      showMessage("✅ Αποθηκεύτηκε τοπικά (offline mode).", "success");
    }

    authService.logActivity('add_invoice', `${boatId}/${invoice.code}`);
    setNewInvoice({ code: '', date: '', description: '', amount: 0 });
    setShowAddForm(false);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!canEditFinancials) { showMessage('❌ View Only - Δεν έχετε δικαίωμα', 'error'); return; }
    const invoice = invoices.find(inv => inv.id === invoiceId);

    // 🔥 Step 1: Delete from localStorage FIRST
    const updated = invoices.filter((inv) => inv.id !== invoiceId);
    const key = `fleet_${boatId}_ΤΙΜΟΛΟΓΙΑ`;
    localStorage.setItem(key, JSON.stringify(updated));
    setInvoices(updated);

    // 🔥 Step 2: Try to DELETE from API
    try {
      const invoiceCode = invoice?.invoiceCode || invoice?.id;
      if (invoiceCode) {
        const success = await deleteInvoice(invoiceCode);
        if (success) {
          console.log(`✅ Invoice deleted from API: ${invoice?.code}`);
        } else {
          console.warn(`⚠️ Invoice deleted locally only: ${invoice?.code}`);
        }
      }
    } catch (apiError) {
      console.error('API delete failed:', apiError);
      // Local delete already done, API will be cleaned on next sync
    }

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
              {/* 🔥 FIX 30: Added autoComplete="off" to fix Chrome typing issue */}
              <input type="text" name="code" value={newInvoice.code} onChange={handleFormChange} placeholder="Κωδικός (π.χ. TIM-001)" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-teal-500 focus:outline-none" />
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

  // Filter boats based on search (case-insensitive)
  const filteredBoats = allBoats.filter(boat => {
    if (!searchTerm.trim()) return true;
    const boatText = `${boat.id} ${boat.name} ${boat.type} ${boat.model || ''}`;
    return textMatches(boatText, searchTerm);
  });
  
  useEffect(() => {
    // TECHNICAL, ADMIN, OWNER μπορούν να δουν
    if (authService.isAdmin() || authService.isOwner() || authService.isTechnical()) { loadAllData(); }
  }, []);

  // Μόνο αν ΔΕΝ είναι ADMIN, OWNER ή TECHNICAL -> Access Denied
  if (!authService.isAdmin() && !authService.isOwner() && !authService.isTechnical()) {
    return (
      <div className="flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
        <Header title="Fleet Booking Plan" onBack={() => navigate('adminDashboard')} />
        <div className="flex-grow flex items-center justify-center p-8">
          <div className="text-center"><div className="text-8xl mb-6">🔒</div><h2 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h2><p className="text-blue-700 mb-6">Only Administrators can view Fleet Booking Plan.</p></div>
        </div>
      </div>
    );
  }

  const loadAllData = async () => {
    try {
      const boats = FleetService.getAllBoats();
      setAllBoats(boats);

      // Load all bookings from API for all boats
      let allBookingsData: any[] = [];
      await Promise.all(boats.map(async (boat: any) => {
        try {
          const bookings = await getBookingsByVessel(boat.id);
          bookings.forEach((booking: any) => { allBookingsData.push({ ...booking, boatId: boat.id }); });
        } catch (e) {
          console.error(`❌ Failed to load bookings for boat ${boat.id}`);
        }
      }));
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
    <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      <Header title="Fleet Booking Plan" onBack={() => navigate('adminDashboard')} />
      <FullScreenLoader />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0 z-50" style={{ background: 'linear-gradient(135deg, #e0f7ff 0%, #b3e5fc 50%, #81d4fa 100%)' }}>
      <div className="p-2 flex items-center justify-between border-b border-sky-300" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <button onClick={() => navigate('adminDashboard')} className="text-blue-800 p-2 hover:bg-blue-300/50 rounded-lg">{icons.chevronLeft}</button>
        <h1 className="text-lg font-bold text-blue-900">Fleet Booking Plan</h1>
        <div className="w-10"></div>
      </div>

      {isTechnicalUser && (
        <div className="p-2 border-b border-sky-300 text-center" style={{ background: 'linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%)' }}>
          <div className="flex items-center justify-center gap-2 text-blue-800 text-sm">
            {icons.eye}
            <span>Technical View - Μόνο ημερομηνίες & status</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center p-2 border-b border-sky-300" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <button onClick={() => changeMonth(-1)} className="text-blue-800 p-2 hover:bg-blue-300/50 rounded transition-colors text-2xl">{icons.chevronLeft}</button>
        <h2 className="text-2xl font-bold text-blue-900 capitalize">{monthName} {year}</h2>
        <button onClick={() => changeMonth(1)} className="text-blue-800 p-2 hover:bg-blue-300/50 rounded transition-colors text-2xl">{icons.chevronRight}</button>
      </div>

      <div className="p-2 border-b border-sky-300" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
        <div className="flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-yellow-400"></div><span className="text-yellow-600 font-semibold">Option</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-green-500"></div><span className="text-green-600 font-semibold">Confirmed</span></div>
          <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-red-500"></div><span className="text-red-600 font-semibold">Canceled</span></div>
        </div>
      </div>

      {/* Search Box */}
      <div className="p-2 border-b border-sky-300 bg-sky-50">
        <div className="relative max-w-md mx-auto">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Αναζήτηση σκάφους (όνομα, τύπος, μοντέλο...)"
            className="w-full px-4 py-2 bg-white text-blue-900 rounded-lg border border-sky-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-800"
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="text-center text-xs text-blue-600 mt-1">
            Βρέθηκαν {filteredBoats.length} από {allBoats.length} σκάφη
          </div>
        )}
      </div>

      <div className="flex-grow overflow-auto p-2">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>
              <th className="sticky left-0 p-3 border border-sky-300 text-left text-blue-900 text-base min-w-[100px] font-bold" style={{ background: 'linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)' }}>Σκάφος</th>
              {weeks.map((week, index) => (
                <th key={index} className="p-2 border border-sky-300 text-sm text-blue-800 min-w-[120px]">
                  <div className="font-bold">ΕΒΔ. {index + 1}</div>
                  <div className="text-xs text-blue-700">{formatDate(week.start)} - {formatDate(week.end)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredBoats.map((boat) => (
              <tr key={boat.id} className="hover:bg-sky-100">
                {/* 🔥 BUG FIX: Display boat NAME instead of ID */}
                <td className="sticky left-0 bg-sky-50 hover:bg-sky-100 p-3 border border-sky-300 font-bold text-blue-800 text-base">{boat.name}</td>
                
                {weeks.map((week, index) => {
                    // 🔥 FIX 29: Charter displays ONLY in the week where check-in date falls (no spanning)
                    const booking = allBookings.find((b) => {
                      if (b.boatId !== boat.id || !b.startDate) return false;
                      const charterStart = new Date(b.startDate);
                      const weekStart = new Date(week.startDateString);
                      const weekEnd = new Date(weekStart.getTime() + 7*24*60*60*1000);
                      // Charter appears ONLY in the week where its START DATE falls
                      return charterStart.getTime() >= weekStart.getTime() && charterStart.getTime() < weekEnd.getTime();
                    });
                    const isBooked = !!booking;
                    const status = booking?.status || 'Pending';
                    
                    let bgColor = 'bg-sky-50 hover:bg-sky-100';
                    let textColor = 'text-sky-400';
                    let statusColor = 'text-sky-400';
                    
                    if (isBooked) {
                      switch(status) {
                        // 🔥 FIX: YELLOW for all pending statuses (all case variations)
                        case 'Option': case 'option': case 'OPTION':
                        case 'Pending': case 'pending': case 'PENDING':
                        case 'Reservation': case 'reservation': case 'RESERVATION':
                          bgColor = 'bg-yellow-400'; textColor = 'text-black'; statusColor = 'text-black'; break;
                        case 'Accepted': case 'accepted': case 'ACCEPTED':
                        case 'Option Accepted': case 'option_accepted': case 'OPTION_ACCEPTED':
                        case 'Pending Final Confirmation': case 'pending_final_confirmation': case 'PENDING_FINAL_CONFIRMATION':
                          bgColor = 'bg-yellow-400'; textColor = 'text-black'; statusColor = 'text-black'; break;
                        // 🔥 FIX: GREEN for confirmed (all case variations)
                        case 'Confirmed': case 'confirmed': case 'CONFIRMED':
                          bgColor = 'bg-green-500'; textColor = 'text-white'; statusColor = 'text-green-100'; break;
                        // 🔥 FIX: RED for cancelled (all case variations)
                        case 'Canceled': case 'Cancelled': case 'cancelled': case 'CANCELLED': case 'CANCELED':
                        case 'Rejected': case 'rejected': case 'REJECTED':
                          bgColor = 'bg-red-500'; textColor = 'text-white'; statusColor = 'text-red-100'; break;
                        // 🔥 FALLBACK: Default to YELLOW (pending)
                        default: bgColor = 'bg-yellow-400'; textColor = 'text-black'; statusColor = 'text-black';
                      }
                    }
                    
                    // 🔥 FIXED: Payment status με ΚΕΙΜΕΝΟ
                    const paymentInfo = isBooked ? getPaymentStatusInfo(booking.paymentStatus) : null;
                    
                    return (
                       <td key={index} className={`p-2 border border-sky-300 text-center ${bgColor} relative`}>
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
                           <span className="text-sky-300">-</span>
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