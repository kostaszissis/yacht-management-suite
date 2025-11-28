// =====================================================
// PDF TEMPLATE SERVICE - PROFESSIONAL PDF GENERATION
// =====================================================
// Generates professional PDFs matching email template styling
// Uses jsPDF library

import jsPDF from 'jspdf';

// Company Information
const COMPANY_INFO = {
  name: 'TAILWIND YACHTING',
  address: 'Leukosias 37, Alimos',
  phone: '+30 6978196009',
  emails: {
    info: 'info@tailwindyachting.com',
    charter: 'charter@tailwindyachting.com'
  },
  logoUrl: 'https://drive.google.com/uc?export=download&id=1DOmo-MO9ZsfmZm7ac4olSF8nl3dJAAer'
};

// Colors matching email template
const COLORS = {
  navy: { r: 30, g: 58, b: 95 },          // #1e3a5f
  green: { r: 74, g: 222, b: 128 },        // #4ade80
  red: { r: 248, g: 113, b: 113 },         // #f87171
  lightGray: { r: 243, g: 244, b: 246 },   // #f3f4f6
  yellow: { r: 251, g: 191, b: 36 },       // #fbbf24
  white: { r: 255, g: 255, b: 255 },
  black: { r: 0, g: 0, b: 0 },
  darkGreen: { r: 22, g: 163, b: 74 },     // #16a34a
  darkRed: { r: 220, g: 38, b: 38 }        // #dc2626
};

// Helper to set color
const setColor = (doc: jsPDF, color: { r: number; g: number; b: number }, type: 'text' | 'fill' | 'draw' = 'text') => {
  if (type === 'text') {
    doc.setTextColor(color.r, color.g, color.b);
  } else if (type === 'fill') {
    doc.setFillColor(color.r, color.g, color.b);
  } else {
    doc.setDrawColor(color.r, color.g, color.b);
  }
};

// Format date for display
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
};

// Get status text in Greek
const getStatusText = (status: string): string => {
  switch (status) {
    case 'Option':
    case 'Pending':
      return 'OPTION - ΑΝΑΜΟΝΗ ΑΠΟΦΑΣΗΣ';
    case 'Option Accepted':
      return 'OPTION ACCEPTED - ΕΠΙΒΕΒΑΙΩΘΗΚΕ';
    case 'Pending Final Confirmation':
      return 'ΑΝΑΜΟΝΗ ΤΕΛΙΚΗΣ ΕΠΙΒΕΒΑΙΩΣΗΣ';
    case 'Confirmed':
      return 'ΟΡΙΣΤΙΚΟΠΟΙΗΜΕΝΟΣ';
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
      return 'ΑΚΥΡΩΜΕΝΟΣ';
    case 'Expired':
      return 'ΕΛΗΞΕ';
    default:
      return status;
  }
};

// Generate footer text based on status
const getFooterText = (status: string): string => {
  switch (status) {
    case 'Option':
    case 'Pending':
      return 'Ενημερώνουμε ότι ο ναύλος είναι option και αναμένει την απόφασή σας.';
    case 'Option Accepted':
      return 'Ο ναύλος έχει γίνει αποδεκτός (option) και αναμένει οριστικοποίηση.';
    case 'Pending Final Confirmation':
      return 'Ο ναύλος αναμένει την τελική σας επιβεβαίωση για οριστικοποίηση.';
    case 'Confirmed':
      return 'Ο ναύλος έχει οριστικοποιηθεί. Ευχαριστούμε για την συνεργασία!';
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
      return 'Ο ναύλος έχει ακυρωθεί.';
    default:
      return 'Παρακαλούμε επικοινωνήστε μαζί μας για περισσότερες πληροφορίες.';
  }
};

interface CharterData {
  code?: string;
  charterCode?: string;
  startDate?: string;
  endDate?: string;
  departure?: string;
  arrival?: string;
  checkinLocation?: string;
  checkoutLocation?: string;
  amount?: number;
  commission?: number;
  vat_on_commission?: number;
  status?: string;
}

interface BoatData {
  id?: string;
  name?: string;
  model?: string;
  type?: string;
}

interface OwnerData {
  company?: string;
  name?: string;
  ownerCompany?: string;
}

/**
 * Generate professional Owner Charter PDF matching email template
 */
export const generateOwnerCharterPDF = async (
  charter: CharterData,
  boat: BoatData,
  owner?: OwnerData
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Charter data
      const charterCode = charter.code || charter.charterCode || 'N/A';
      const year = new Date().getFullYear();
      const charterAmount = charter.amount || 0;
      const commission = charter.commission || 0;
      const vatOnCommission = charter.vat_on_commission || 0;
      const netIncome = charterAmount - commission - vatOnCommission;
      const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || 'OWNER';
      const status = charter.status || 'Option';
      const vesselName = boat.name || boat.id || 'N/A';
      const vesselModel = boat.model || '';

      // Try to load logo, with fallback
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      let logoLoaded = false;

      const generatePDFContent = (hasLogo: boolean) => {
        let yPos = margin;

        // =====================================================
        // HEADER SECTION
        // =====================================================

        // Logo (left side)
        if (hasLogo) {
          try {
            doc.addImage(logoImg, 'PNG', margin, yPos, 40, 18);
          } catch (e) {
            // Fallback to text
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            setColor(doc, COLORS.navy);
            doc.text('TAILWIND', margin, yPos + 10);
          }
        } else {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          setColor(doc, COLORS.navy);
          doc.text('TAILWIND', margin, yPos + 10);
        }

        // Company info (right side)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.black);
        doc.text(COMPANY_INFO.name, pageWidth - margin, yPos + 5, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(COMPANY_INFO.address, pageWidth - margin, yPos + 10, { align: 'right' });
        doc.text(`Tel: ${COMPANY_INFO.phone}`, pageWidth - margin, yPos + 15, { align: 'right' });
        doc.text(COMPANY_INFO.emails.info, pageWidth - margin, yPos + 20, { align: 'right' });
        doc.text(COMPANY_INFO.emails.charter, pageWidth - margin, yPos + 25, { align: 'right' });

        yPos += 35;

        // =====================================================
        // TITLE BAR (Navy Blue Background)
        // =====================================================
        setColor(doc, COLORS.navy, 'fill');
        doc.rect(margin, yPos, contentWidth, 14, 'F');

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.white);
        doc.text(`CHARTERING INFORMATION - OPTION ${charterCode}`, pageWidth / 2, yPos + 9, { align: 'center' });

        yPos += 20;

        // =====================================================
        // BODY SECTION (Light Gray Background)
        // =====================================================
        setColor(doc, COLORS.lightGray, 'fill');
        doc.rect(margin, yPos, contentWidth, 55, 'F');

        doc.setFontSize(10);
        setColor(doc, COLORS.black);

        // Company & Boat Info
        doc.setFont('helvetica', 'bold');
        doc.text('COMPANY:', margin + 5, yPos + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(ownerCompany, margin + 35, yPos + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('BOAT:', margin + 5, yPos + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(`${vesselName}${vesselModel ? ' ' + vesselModel : ''}`, margin + 35, yPos + 16);

        // Dates and Locations
        doc.setFont('helvetica', 'bold');
        doc.text('FROM:', margin + 5, yPos + 28);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(charter.startDate || ''), margin + 35, yPos + 28);

        doc.setFont('helvetica', 'bold');
        doc.text('DEPARTURE:', margin + 80, yPos + 28);
        doc.setFont('helvetica', 'normal');
        doc.text(charter.departure || charter.checkinLocation || 'ALIMOS MARINA', margin + 110, yPos + 28);

        doc.setFont('helvetica', 'bold');
        doc.text('TILL:', margin + 5, yPos + 38);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(charter.endDate || ''), margin + 35, yPos + 38);

        doc.setFont('helvetica', 'bold');
        doc.text('ARRIVAL:', margin + 80, yPos + 38);
        doc.setFont('helvetica', 'normal');
        doc.text(charter.arrival || charter.checkoutLocation || 'ALIMOS MARINA', margin + 110, yPos + 38);

        yPos += 65;

        // =====================================================
        // FINANCIAL TERMS BOX
        // =====================================================
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.black);
        doc.text('Financial Terms:', margin + 5, yPos);

        yPos += 8;

        // Financial box with border
        setColor(doc, COLORS.white, 'fill');
        setColor(doc, COLORS.navy, 'draw');
        doc.setLineWidth(0.5);
        doc.rect(margin, yPos, contentWidth, 65, 'FD');

        let finYPos = yPos + 10;
        const labelX = margin + 10;
        const valueX = pageWidth - margin - 10;

        // NET CHARTERING AMOUNT (Green)
        doc.setFontSize(11);
        setColor(doc, COLORS.darkGreen);
        doc.setFont('helvetica', 'normal');
        doc.text('NET CHARTERING AMOUNT', labelX, finYPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`\u20AC${charterAmount.toFixed(2)}`, valueX, finYPos, { align: 'right' });

        finYPos += 10;

        // minus COMMISSION (Red)
        setColor(doc, COLORS.darkRed);
        doc.setFont('helvetica', 'normal');
        doc.text('minus COMMISSION', labelX, finYPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`-\u20AC${commission.toFixed(2)}`, valueX, finYPos, { align: 'right' });

        finYPos += 10;

        // minus VAT (Red)
        doc.setFont('helvetica', 'normal');
        doc.text('minus VAT (24%)', labelX, finYPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`-\u20AC${vatOnCommission.toFixed(2)}`, valueX, finYPos, { align: 'right' });

        finYPos += 15;

        // Separator line
        doc.setLineWidth(0.3);
        setColor(doc, COLORS.navy, 'draw');
        doc.line(labelX, finYPos - 5, valueX, finYPos - 5);

        // Owner company name in yellow box
        setColor(doc, COLORS.yellow, 'fill');
        doc.rect(labelX, finYPos - 2, 70, 8, 'F');
        setColor(doc, COLORS.black);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(ownerCompany, labelX + 2, finYPos + 4);

        finYPos += 12;

        // WILL RECEIVE IN CASH (Green background)
        setColor(doc, COLORS.darkGreen, 'fill');
        doc.rect(labelX - 5, finYPos - 5, contentWidth - 10, 12, 'F');

        setColor(doc, COLORS.white);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('WILL RECEIVE IN CASH', labelX, finYPos + 3);
        doc.text(`\u20AC${netIncome.toFixed(2)}`, valueX, finYPos + 3, { align: 'right' });

        yPos += 75;

        // =====================================================
        // STATUS SECTION
        // =====================================================
        const statusText = getStatusText(status);
        let statusColor = COLORS.yellow;
        if (status === 'Confirmed') statusColor = COLORS.darkGreen;
        if (status === 'Cancelled' || status === 'Canceled' || status === 'Rejected') statusColor = COLORS.darkRed;

        setColor(doc, statusColor, 'fill');
        doc.rect(margin, yPos, contentWidth, 12, 'F');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        setColor(doc, status === 'Confirmed' || status === 'Cancelled' || status === 'Canceled' || status === 'Rejected' ? COLORS.white : COLORS.black);
        doc.text(`Status: ${statusText}`, pageWidth / 2, yPos + 8, { align: 'center' });

        yPos += 20;

        // =====================================================
        // FOOTER SECTION
        // =====================================================
        const footerText = getFooterText(status);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.black);

        // Word wrap footer text
        const footerLines = doc.splitTextToSize(footerText, contentWidth - 10);
        footerLines.forEach((line: string, index: number) => {
          doc.text(line, pageWidth / 2, yPos + (index * 5), { align: 'center' });
        });

        yPos += footerLines.length * 5 + 10;

        // Thank you message
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Thank you,', pageWidth / 2, yPos, { align: 'center' });
        doc.text(COMPANY_INFO.name, pageWidth / 2, yPos + 6, { align: 'center' });

        // =====================================================
        // PAGE FOOTER (Bottom of page)
        // =====================================================
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(doc, { r: 128, g: 128, b: 128 });
        doc.text(`Generated: ${new Date().toLocaleString('el-GR')}`, pageWidth / 2, footerY, { align: 'center' });
        doc.text(`Charter Code: ${charterCode}/${year}`, pageWidth / 2, footerY + 4, { align: 'center' });

        // Save PDF
        const filename = `Charter_Party_${charterCode}_${year}.pdf`;
        doc.save(filename);
        resolve();
      };

      // Try to load logo
      logoImg.onload = () => {
        logoLoaded = true;
        generatePDFContent(true);
      };

      logoImg.onerror = () => {
        console.warn('Logo failed to load, using text fallback');
        generatePDFContent(false);
      };

      // Timeout for logo loading
      setTimeout(() => {
        if (!logoLoaded) {
          console.warn('Logo timeout, using text fallback');
          generatePDFContent(false);
        }
      }, 3000);

      logoImg.src = COMPANY_INFO.logoUrl;

    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

/**
 * Generate PDF as Blob (for email attachments)
 */
export const generateOwnerCharterPDFBlob = async (
  charter: CharterData,
  boat: BoatData,
  owner?: OwnerData
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      // Charter data
      const charterCode = charter.code || charter.charterCode || 'N/A';
      const year = new Date().getFullYear();
      const charterAmount = charter.amount || 0;
      const commission = charter.commission || 0;
      const vatOnCommission = charter.vat_on_commission || 0;
      const netIncome = charterAmount - commission - vatOnCommission;
      const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || 'OWNER';
      const status = charter.status || 'Option';
      const vesselName = boat.name || boat.id || 'N/A';
      const vesselModel = boat.model || '';

      let yPos = margin;

      // Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      setColor(doc, COLORS.navy);
      doc.text('TAILWIND', margin, yPos + 10);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(doc, COLORS.black);
      doc.text(COMPANY_INFO.name, pageWidth - margin, yPos + 5, { align: 'right' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY_INFO.address, pageWidth - margin, yPos + 10, { align: 'right' });
      doc.text(`Tel: ${COMPANY_INFO.phone}`, pageWidth - margin, yPos + 15, { align: 'right' });
      doc.text(COMPANY_INFO.emails.info, pageWidth - margin, yPos + 20, { align: 'right' });
      doc.text(COMPANY_INFO.emails.charter, pageWidth - margin, yPos + 25, { align: 'right' });

      yPos += 35;

      // Title Bar
      setColor(doc, COLORS.navy, 'fill');
      doc.rect(margin, yPos, contentWidth, 14, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      setColor(doc, COLORS.white);
      doc.text(`CHARTERING INFORMATION - OPTION ${charterCode}`, pageWidth / 2, yPos + 9, { align: 'center' });

      yPos += 20;

      // Body Section
      setColor(doc, COLORS.lightGray, 'fill');
      doc.rect(margin, yPos, contentWidth, 55, 'F');

      doc.setFontSize(10);
      setColor(doc, COLORS.black);

      doc.setFont('helvetica', 'bold');
      doc.text('COMPANY:', margin + 5, yPos + 8);
      doc.setFont('helvetica', 'normal');
      doc.text(ownerCompany, margin + 35, yPos + 8);

      doc.setFont('helvetica', 'bold');
      doc.text('BOAT:', margin + 5, yPos + 16);
      doc.setFont('helvetica', 'normal');
      doc.text(`${vesselName}${vesselModel ? ' ' + vesselModel : ''}`, margin + 35, yPos + 16);

      doc.setFont('helvetica', 'bold');
      doc.text('FROM:', margin + 5, yPos + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(charter.startDate || ''), margin + 35, yPos + 28);

      doc.setFont('helvetica', 'bold');
      doc.text('DEPARTURE:', margin + 80, yPos + 28);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.departure || charter.checkinLocation || 'ALIMOS MARINA', margin + 110, yPos + 28);

      doc.setFont('helvetica', 'bold');
      doc.text('TILL:', margin + 5, yPos + 38);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(charter.endDate || ''), margin + 35, yPos + 38);

      doc.setFont('helvetica', 'bold');
      doc.text('ARRIVAL:', margin + 80, yPos + 38);
      doc.setFont('helvetica', 'normal');
      doc.text(charter.arrival || charter.checkoutLocation || 'ALIMOS MARINA', margin + 110, yPos + 38);

      yPos += 65;

      // Financial Terms
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      setColor(doc, COLORS.black);
      doc.text('Financial Terms:', margin + 5, yPos);

      yPos += 8;

      setColor(doc, COLORS.white, 'fill');
      setColor(doc, COLORS.navy, 'draw');
      doc.setLineWidth(0.5);
      doc.rect(margin, yPos, contentWidth, 65, 'FD');

      let finYPos = yPos + 10;
      const labelX = margin + 10;
      const valueX = pageWidth - margin - 10;

      setColor(doc, COLORS.darkGreen);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('NET CHARTERING AMOUNT', labelX, finYPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`\u20AC${charterAmount.toFixed(2)}`, valueX, finYPos, { align: 'right' });

      finYPos += 10;

      setColor(doc, COLORS.darkRed);
      doc.setFont('helvetica', 'normal');
      doc.text('minus COMMISSION', labelX, finYPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`-\u20AC${commission.toFixed(2)}`, valueX, finYPos, { align: 'right' });

      finYPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.text('minus VAT (24%)', labelX, finYPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`-\u20AC${vatOnCommission.toFixed(2)}`, valueX, finYPos, { align: 'right' });

      finYPos += 15;

      doc.setLineWidth(0.3);
      setColor(doc, COLORS.navy, 'draw');
      doc.line(labelX, finYPos - 5, valueX, finYPos - 5);

      setColor(doc, COLORS.yellow, 'fill');
      doc.rect(labelX, finYPos - 2, 70, 8, 'F');
      setColor(doc, COLORS.black);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(ownerCompany, labelX + 2, finYPos + 4);

      finYPos += 12;

      setColor(doc, COLORS.darkGreen, 'fill');
      doc.rect(labelX - 5, finYPos - 5, contentWidth - 10, 12, 'F');

      setColor(doc, COLORS.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('WILL RECEIVE IN CASH', labelX, finYPos + 3);
      doc.text(`\u20AC${netIncome.toFixed(2)}`, valueX, finYPos + 3, { align: 'right' });

      yPos += 75;

      // Status
      const statusText = getStatusText(status);
      let statusColor = COLORS.yellow;
      if (status === 'Confirmed') statusColor = COLORS.darkGreen;
      if (status === 'Cancelled' || status === 'Canceled' || status === 'Rejected') statusColor = COLORS.darkRed;

      setColor(doc, statusColor, 'fill');
      doc.rect(margin, yPos, contentWidth, 12, 'F');

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      setColor(doc, status === 'Confirmed' || status === 'Cancelled' || status === 'Canceled' || status === 'Rejected' ? COLORS.white : COLORS.black);
      doc.text(`Status: ${statusText}`, pageWidth / 2, yPos + 8, { align: 'center' });

      yPos += 20;

      // Footer
      const footerText = getFooterText(status);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      setColor(doc, COLORS.black);

      const footerLines = doc.splitTextToSize(footerText, contentWidth - 10);
      footerLines.forEach((line: string, index: number) => {
        doc.text(line, pageWidth / 2, yPos + (index * 5), { align: 'center' });
      });

      yPos += footerLines.length * 5 + 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Thank you,', pageWidth / 2, yPos, { align: 'center' });
      doc.text(COMPANY_INFO.name, pageWidth / 2, yPos + 6, { align: 'center' });

      // Page footer
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      setColor(doc, { r: 128, g: 128, b: 128 });
      doc.text(`Generated: ${new Date().toLocaleString('el-GR')}`, pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Charter Code: ${charterCode}/${year}`, pageWidth / 2, footerY + 4, { align: 'center' });

      // Return as blob
      const blob = doc.output('blob');
      resolve(blob);

    } catch (error) {
      console.error('Error generating PDF blob:', error);
      reject(error);
    }
  });
};

export default {
  generateOwnerCharterPDF,
  generateOwnerCharterPDFBlob
};
