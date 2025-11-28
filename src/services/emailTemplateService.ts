// =====================================================
// EMAIL TEMPLATE SERVICE - PROFESSIONAL HTML EMAILS
// =====================================================
// Generates professional HTML emails matching PDF template styling
// NO PDF attachments - HTML email only

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

// Email API endpoint
const EMAIL_API_URL = 'https://yachtmanagementsuite.com/email/send-charter-email';

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
const getStatusText = (status: string): { text: string; bgColor: string; textColor: string } => {
  switch (status) {
    case 'Option':
    case 'Pending':
      return { text: 'OPTION - ΑΝΑΜΟΝΗ ΑΠΟΦΑΣΗΣ', bgColor: '#fbbf24', textColor: '#000000' };
    case 'Option Accepted':
      return { text: 'OPTION ACCEPTED - ΕΠΙΒΕΒΑΙΩΘΗΚΕ', bgColor: '#fbbf24', textColor: '#000000' };
    case 'Pending Final Confirmation':
      return { text: 'ΑΝΑΜΟΝΗ ΤΕΛΙΚΗΣ ΕΠΙΒΕΒΑΙΩΣΗΣ', bgColor: '#fbbf24', textColor: '#000000' };
    case 'Confirmed':
      return { text: 'ΟΡΙΣΤΙΚΟΠΟΙΗΜΕΝΟΣ', bgColor: '#16a34a', textColor: '#ffffff' };
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
      return { text: 'ΑΚΥΡΩΜΕΝΟΣ', bgColor: '#dc2626', textColor: '#ffffff' };
    case 'Expired':
      return { text: 'ΕΛΗΞΕ', bgColor: '#6b7280', textColor: '#ffffff' };
    default:
      return { text: status, bgColor: '#6b7280', textColor: '#ffffff' };
  }
};

// Get footer text based on status
const getFooterText = (status: string): string => {
  switch (status) {
    case 'Option':
    case 'Pending':
      return 'Ενημερώνουμε ότι ο ναύλος είναι option και αναμένει την απόφασή σας.';
    case 'Option Accepted':
    case 'option_accepted':
      return 'Ο ναύλος έχει γίνει αποδεκτός (option) και αναμένει οριστικοποίηση.';
    case 'Pending Final Confirmation':
    case 'pending_final_confirmation':
      return 'Ο ναύλος αναμένει την τελική σας επιβεβαίωση για οριστικοποίηση.';
    case 'Confirmed':
    case 'confirmed':
      return 'Ο ναύλος έχει οριστικοποιηθεί. Ευχαριστούμε για την συνεργασία!';
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
    case 'cancelled':
      return 'Ο ναύλος έχει ακυρωθεί.';
    case 'Expired':
    case 'expired':
      return 'Η επιλογή έληξε αυτόματα μετά από 6 ημέρες χωρίς απόφαση.';
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
  ownerCompany?: string;
}

interface OwnerData {
  company?: string;
  name?: string;
  ownerCompany?: string;
  email?: string;
}

/**
 * Generate professional HTML email matching PDF template design
 */
export const generateOwnerCharterEmailHTML = (
  charter: CharterData,
  boat: BoatData,
  owner?: OwnerData,
  status?: string
): string => {
  const charterCode = charter.code || charter.charterCode || 'N/A';
  const year = new Date().getFullYear();
  const charterAmount = charter.amount || 0;
  const commission = charter.commission || 0;
  const vatOnCommission = charter.vat_on_commission || 0;
  const netIncome = charterAmount - commission - vatOnCommission;
  const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || boat.ownerCompany || 'OWNER';
  const currentStatus = status || charter.status || 'Option';
  const vesselName = boat.name || boat.id || 'N/A';
  const vesselModel = boat.model || '';
  const statusInfo = getStatusText(currentStatus);
  const footerText = getFooterText(currentStatus);

  const html = `
<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CHARTERING INFORMATION - OPTION ${charterCode}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #e5e7eb;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%);
      color: #ffffff;
      padding: 25px 30px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
    }
    .company-info {
      text-align: right;
      font-size: 12px;
      line-height: 1.6;
    }
    .company-name {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .title-bar {
      background-color: #1e3a5f;
      color: #ffffff;
      padding: 15px 30px;
      text-align: center;
    }
    .title-bar h2 {
      margin: 0;
      font-size: 18px;
      letter-spacing: 0.5px;
    }
    .body-section {
      background-color: #f3f4f6;
      padding: 25px 30px;
    }
    .info-row {
      margin-bottom: 12px;
      display: flex;
    }
    .info-label {
      font-weight: bold;
      color: #374151;
      width: 120px;
      flex-shrink: 0;
    }
    .info-value {
      color: #111827;
    }
    .yellow-box {
      background-color: #fbbf24;
      padding: 12px 15px;
      border-radius: 6px;
      margin-bottom: 15px;
      font-weight: bold;
      color: #000000;
    }
    .financial-section {
      background-color: #ffffff;
      border: 2px solid #1e3a5f;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
    }
    .financial-title {
      font-size: 16px;
      font-weight: bold;
      color: #1e3a5f;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .financial-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .financial-row:last-child {
      border-bottom: none;
    }
    .green-text {
      color: #16a34a;
      font-weight: bold;
    }
    .red-text {
      color: #dc2626;
      font-weight: bold;
    }
    .owner-box {
      background-color: #fbbf24;
      padding: 8px 12px;
      border-radius: 4px;
      display: inline-block;
      font-weight: bold;
      margin-top: 10px;
    }
    .total-row {
      background-color: #16a34a;
      color: #ffffff;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      display: flex;
      justify-content: space-between;
      font-weight: bold;
      font-size: 16px;
    }
    .status-bar {
      text-align: center;
      padding: 12px 20px;
      font-weight: bold;
      font-size: 14px;
      margin-top: 20px;
      border-radius: 6px;
    }
    .footer-section {
      padding: 25px 30px;
      text-align: center;
      background-color: #ffffff;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 15px;
    }
    .thank-you {
      font-weight: bold;
      color: #1e3a5f;
      font-size: 16px;
    }
    .page-footer {
      background-color: #f9fafb;
      padding: 15px 30px;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="vertical-align: top;">
            <div class="logo">TAILWIND</div>
          </td>
          <td width="50%" style="vertical-align: top; text-align: right;">
            <div class="company-name">${COMPANY_INFO.name}</div>
            <div style="font-size: 12px; line-height: 1.6;">
              ${COMPANY_INFO.address}<br>
              Tel: ${COMPANY_INFO.phone}<br>
              ${COMPANY_INFO.emails.info}<br>
              ${COMPANY_INFO.emails.charter}
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Title Bar -->
    <div class="title-bar">
      <h2>CHARTERING INFORMATION - OPTION ${charterCode}</h2>
    </div>

    <!-- Body Section -->
    <div class="body-section">
      <!-- Owner Company Yellow Box -->
      <div class="yellow-box">
        COMPANY: ${ownerCompany}
      </div>

      <!-- Charter Info -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
        <tr>
          <td width="100" style="font-weight: bold; color: #374151; padding: 6px 0;">BOAT:</td>
          <td style="color: #111827; padding: 6px 0;">${vesselName}${vesselModel ? ' ' + vesselModel : ''}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #374151; padding: 6px 0;">FROM:</td>
          <td style="color: #111827; padding: 6px 0;">${formatDate(charter.startDate || '')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #374151; padding: 6px 0;">DEPARTURE:</td>
          <td style="color: #111827; padding: 6px 0;">${charter.departure || charter.checkinLocation || 'ALIMOS MARINA'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #374151; padding: 6px 0;">TILL:</td>
          <td style="color: #111827; padding: 6px 0;">${formatDate(charter.endDate || '')}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #374151; padding: 6px 0;">ARRIVAL:</td>
          <td style="color: #111827; padding: 6px 0;">${charter.arrival || charter.checkoutLocation || 'ALIMOS MARINA'}</td>
        </tr>
      </table>

      <!-- Financial Section -->
      <div class="financial-section">
        <div class="financial-title">Financial Terms:</div>

        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 10px 0; color: #16a34a;">NET CHARTERING AMOUNT</td>
            <td style="padding: 10px 0; text-align: right; color: #16a34a; font-weight: bold;">€${charterAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #dc2626;">minus COMMISSION</td>
            <td style="padding: 10px 0; text-align: right; color: #dc2626; font-weight: bold;">-€${commission.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #dc2626;">minus VAT (24%)</td>
            <td style="padding: 10px 0; text-align: right; color: #dc2626; font-weight: bold;">-€${vatOnCommission.toFixed(2)}</td>
          </tr>
        </table>

        <div style="border-top: 2px solid #1e3a5f; margin: 15px 0;"></div>

        <!-- Owner Company Box -->
        <div class="owner-box">${ownerCompany}</div>

        <!-- Total Row -->
        <div class="total-row">
          <span>WILL RECEIVE IN CASH</span>
          <span>€${netIncome.toFixed(2)}</span>
        </div>
      </div>

      <!-- Status Bar -->
      <div class="status-bar" style="background-color: ${statusInfo.bgColor}; color: ${statusInfo.textColor};">
        Status: ${statusInfo.text}
      </div>
    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <p class="footer-text">${footerText}</p>
      <p class="footer-text">Παρακαλώ πολύ επιβεβαιώστε για την λήψη του email.</p>
      <p class="thank-you">Ευχαριστούμε Πολύ</p>
      <p class="thank-you">${COMPANY_INFO.name}</p>
    </div>

    <!-- Page Footer -->
    <div class="page-footer">
      Generated: ${new Date().toLocaleString('el-GR')}<br>
      Charter Code: ${charterCode}/${year}
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
};

/**
 * Send professional HTML charter email (NO PDF attachment)
 */
export const sendOwnerCharterEmail = async (
  charter: CharterData,
  boat: BoatData,
  owner?: OwnerData,
  status?: string
): Promise<boolean> => {
  try {
    const charterCode = charter.code || charter.charterCode || 'N/A';
    const year = new Date().getFullYear();
    const currentStatus = status || charter.status || 'Option';
    const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || boat.ownerCompany || 'OWNER';

    // Generate HTML email
    const htmlContent = generateOwnerCharterEmailHTML(charter, boat, owner, currentStatus);

    // Recipients
    const recipients = [
      COMPANY_INFO.emails.info,
      COMPANY_INFO.emails.charter
    ];

    // Add owner email if provided
    if (owner?.email) {
      recipients.push(owner.email);
    }

    // Email subject based on status
    let subject = `CHARTERING INFORMATION - OPTION ${charterCode}/${year}`;
    if (currentStatus === 'Confirmed' || currentStatus === 'confirmed') {
      subject = `CHARTER CONFIRMED ${charterCode}/${year}`;
    } else if (currentStatus === 'Option Accepted' || currentStatus === 'option_accepted') {
      subject = `CHARTER OPTION ACCEPTED ${charterCode}/${year}`;
    } else if (currentStatus === 'Pending Final Confirmation' || currentStatus === 'pending_final_confirmation') {
      subject = `CHARTER PENDING FINAL CONFIRMATION ${charterCode}/${year}`;
    } else if (currentStatus === 'Cancelled' || currentStatus === 'cancelled' || currentStatus === 'Rejected') {
      subject = `CHARTER CANCELLED ${charterCode}/${year}`;
    } else if (currentStatus === 'Expired' || currentStatus === 'expired') {
      subject = `⚠️ OPTION EXPIRED ${charterCode}/${year}`;
    }

    // Calculate financial terms for legacy API fields
    const charterAmount = charter.amount || 0;
    const commission = charter.commission || 0;
    const vatOnCommission = charter.vat_on_commission || 0;
    const netIncome = charterAmount - commission - vatOnCommission;

    // Send email via API
    const emailPayload = {
      to: recipients,
      subject: subject,
      html: htmlContent,
      text: `TAILWIND YACHTING - CHARTERING INFORMATION\n\nOPTION: ${charterCode}/${year}\nCOMPANY: ${ownerCompany}\nBOAT: ${boat.name || boat.id}\n\nFROM: ${charter.startDate || ''}\nDEPARTURE: ${charter.departure || 'ALIMOS MARINA'}\n\nTILL: ${charter.endDate || ''}\nARRIVAL: ${charter.arrival || 'ALIMOS MARINA'}\n\nFINANCIAL TERMS:\nNET CHARTERING AMOUNT: €${charterAmount.toFixed(2)}\nminus COMMISSION: -€${commission.toFixed(2)}\nminus VAT (24%): -€${vatOnCommission.toFixed(2)}\n\n${ownerCompany} WILL RECEIVE IN CASH: €${netIncome.toFixed(2)}\n\nStatus: ${currentStatus}\n\nΕυχαριστούμε Πολύ\nTailwind Yachting`,
      // Legacy fields for backwards compatibility
      code: charter.code,
      boatName: boat.name || boat.id,
      action: currentStatus,
      startDate: charter.startDate,
      endDate: charter.endDate,
      amount: charter.amount,
      netIncome: netIncome
    };

    console.log('📧 Sending HTML email to:', recipients);
    console.log('📧 Subject:', subject);

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('📧 API Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('📧 API Error:', response.status, responseText);
      return false;
    }

    console.log('📧 ✅ HTML email sent successfully!');
    return true;

  } catch (error) {
    console.error('📧 Email send error:', error);
    return false;
  }
};

/**
 * Send charter status change email with professional HTML template
 */
export const sendCharterStatusChangeEmail = async (
  charter: CharterData,
  boat: BoatData,
  newStatus: string,
  owner?: OwnerData
): Promise<boolean> => {
  console.log('📧 sendCharterStatusChangeEmail called:', {
    charterCode: charter.code,
    boatName: boat.name,
    newStatus,
    ownerEmail: owner?.email
  });

  return sendOwnerCharterEmail(charter, boat, owner, newStatus);
};

export default {
  generateOwnerCharterEmailHTML,
  sendOwnerCharterEmail,
  sendCharterStatusChangeEmail
};
