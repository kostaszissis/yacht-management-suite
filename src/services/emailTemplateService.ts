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
const EMAIL_API_URL = 'https://yachtmanagementsuite.com/email/send-email';

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
    case 'option':
    case 'new_charter':
      return { text: 'OPTION', bgColor: '#F59E0B', textColor: '#000000' };
    case 'Option Accepted':
    case 'option_accepted':
      return { text: 'ΕΠΙΒΕΒΑΙΩΘΗΚΕ (OPTION)', bgColor: '#F59E0B', textColor: '#000000' };
    case 'Pending Final Confirmation':
    case 'pending_final_confirmation':
      return { text: 'ΑΝΑΜΟΝΗ ΤΕΛΙΚΗΣ ΕΠΙΒΕΒΑΙΩΣΗΣ', bgColor: '#F59E0B', textColor: '#000000' };
    case 'Confirmed':
    case 'confirmed':
    case 'finalized':
    case 'reservation':
      return { text: 'ΤΟ ΝΑΥΛΟ ΚΛΕΙΣΤΗΚΕ', bgColor: '#10B981', textColor: '#ffffff' };
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
    case 'cancelled':
    case 'rejected':
      return { text: 'ΤΟ ΝΑΥΛΟ ΑΚΥΡΩΘΗΚΕ', bgColor: '#EF4444', textColor: '#ffffff' };
    case 'Expired':
    case 'expired':
      return { text: 'ΕΛΗΞΕ', bgColor: '#6B7280', textColor: '#ffffff' };
    default:
      return { text: status.toUpperCase(), bgColor: '#6B7280', textColor: '#ffffff' };
  }
};

// Get footer text based on status
const getFooterText = (status: string): string => {
  switch (status) {
    case 'Option':
    case 'Pending':
    case 'option':
    case 'new_charter':
      return 'Ενημερώνουμε ότι το ναύλο είναι option. Παρακαλώ επιβεβαιώστε την λήψη του email.';
    case 'Option Accepted':
    case 'option_accepted':
      return 'Ενημερώνουμε ότι το ναύλο είναι option και επιβεβαιώθηκε. Παρακαλώ επιβεβαιώστε την λήψη του email.';
    case 'Pending Final Confirmation':
    case 'pending_final_confirmation':
      return 'Ενημερώνουμε ότι το ναύλο αναμένει τελική επιβεβαίωση. Παρακαλώ επιβεβαιώστε την λήψη του email.';
    case 'Confirmed':
    case 'confirmed':
    case 'finalized':
    case 'reservation':
      return 'Ενημερώνουμε ότι το ναύλο κλείστηκε. Παρακαλώ επιβεβαιώστε την λήψη του email.';
    case 'Cancelled':
    case 'Canceled':
    case 'Rejected':
    case 'cancelled':
    case 'rejected':
      return 'Ενημερώνουμε ότι το ναύλο ακυρώθηκε.';
    case 'Expired':
    case 'expired':
      return 'Ενημερώνουμε ότι το option έληξε αυτόματα μετά από 6 ημέρες.';
    default:
      return 'Παρακαλώ επιβεβαιώστε την λήψη του email.';
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
  foreignBrokerPercent?: number;
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
  const grossAmount = charter.amount || 0;
  const commission = charter.commission || 0;
  const vatOnCommission = charter.vat_on_commission || 0;
  const foreignBrokerPercent = charter.foreignBrokerPercent || 0;

  // Calculate net fare (without 12% VAT)
  const netFare = grossAmount / 1.12;
  // Calculate foreign broker commission (percentage of net fare)
  const foreignBrokerCommission = netFare * (foreignBrokerPercent / 100);
  // Amount received by foreign broker (what goes to our bank)
  const charterAmount = grossAmount - foreignBrokerCommission;
  const netIncome = charterAmount - commission - vatOnCommission;
  const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || boat.ownerCompany || 'OWNER';
  const ownerName = owner?.name || '-';
  const ownerTaxId = owner?.taxId || '-';
  const ownerPhone = owner?.phone || '-';
  const ownerAddress = owner?.address || '-';
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
      <!-- Status Banner -->
      <div style="background-color: ${statusInfo.bgColor}; color: ${statusInfo.textColor}; padding: 15px 20px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
        ${statusInfo.text}
      </div>

      <!-- Owner/Company Section -->
      <div style="background-color: #ffffff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ΣΤΟΙΧΕΙΑ ΙΔΙΟΚΤΗΤΗ</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="120" style="font-weight: bold; color: #374151; padding: 4px 0;">ΕΤΑΙΡΕΙΑ:</td>
            <td style="color: #111827; padding: 4px 0;">${ownerCompany}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 4px 0;">ΟΝΟΜΑ:</td>
            <td style="color: #111827; padding: 4px 0;">${ownerName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 4px 0;">ΑΦΜ:</td>
            <td style="color: #111827; padding: 4px 0;">${ownerTaxId}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 4px 0;">ΤΗΛΕΦΩΝΟ:</td>
            <td style="color: #111827; padding: 4px 0;">${ownerPhone}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 4px 0;">ΔΙΕΥΘΥΝΣΗ:</td>
            <td style="color: #111827; padding: 4px 0;">${ownerAddress}</td>
          </tr>
        </table>
      </div>

      <!-- Charter Info -->
      <div style="background-color: #ffffff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ΣΤΟΙΧΕΙΑ ΝΑΥΛΟΥ</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="120" style="font-weight: bold; color: #374151; padding: 6px 0;">ΚΩΔΙΚΟΣ:</td>
            <td style="color: #111827; padding: 6px 0;">${charterCode}/${year}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 6px 0;">ΣΚΑΦΟΣ:</td>
            <td style="color: #111827; padding: 6px 0;">${vesselName}${vesselModel ? ' ' + vesselModel : ''}</td>
          </tr>
        </table>
      </div>

      <!-- Period Info -->
      <div style="background-color: #ffffff; border: 2px solid #1e3a5f; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">ΠΕΡΙΟΔΟΣ ΝΑΥΛΟΥ</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="120" style="font-weight: bold; color: #374151; padding: 6px 0;">CHECK-IN:</td>
            <td style="color: #111827; padding: 6px 0;">${formatDate(charter.startDate || '')} - ${charter.departure || charter.checkinLocation || 'ALIMOS MARINA'}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; color: #374151; padding: 6px 0;">CHECK-OUT:</td>
            <td style="color: #111827; padding: 6px 0;">${formatDate(charter.endDate || '')} - ${charter.arrival || charter.checkoutLocation || 'ALIMOS MARINA'}</td>
          </tr>
        </table>
      </div>

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
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px;">
          <tr style="background-color: #10B981; color: white; border-radius: 6px;">
            <td style="padding: 15px; font-size: 18px; text-align: left; border-radius: 6px 0 0 6px;">WILL RECEIVE IN CASH</td>
            <td style="padding: 15px; font-size: 18px; text-align: right; font-weight: bold; border-radius: 0 6px 6px 0;">€${netIncome.toLocaleString('el-GR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
          </tr>
        </table>
      </div>

      <!-- EMAIL 1: Option - GREEN button "ΑΠΟΔΟΧΗ ΝΑΥΛΟΥ" -->
      ${(currentStatus === 'Option' || currentStatus === 'option' || currentStatus === 'new_charter' || currentStatus === 'Pending' || currentStatus === 'pending') ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yachtmanagementsuite.com/email/accept-charter?code=${encodeURIComponent(charter.code || charter.charterCode || '')}&action=accept"
           style="display: inline-block; background-color: #10B981; color: white; padding: 15px 40px;
                  font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ✅ ΑΠΟΔΟΧΗ ΝΑΥΛΟΥ
        </a>
      </div>
      ` : ''}

      <!-- EMAIL 3: Pending Final Confirmation - GREEN button "ΚΛΙΚ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ" -->
      ${(currentStatus === 'Pending Final Confirmation' || currentStatus === 'pending_final_confirmation') ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://yachtmanagementsuite.com/email/accept-charter?code=${encodeURIComponent(charter.code || charter.charterCode || '')}&action=accept"
           style="display: inline-block; background-color: #10B981; color: white; padding: 15px 40px;
                  font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          👆 ΚΛΙΚ ΓΙΑ ΤΕΛΙΚΗ ΕΠΙΒΕΒΑΙΩΣΗ
        </a>
      </div>
      ` : ''}

    </div>

    <!-- Footer Section -->
    <div class="footer-section">
      <p class="footer-text" style="font-size: 15px; color: #374151; margin-bottom: 20px;">${footerText}</p>
      <p class="thank-you" style="font-size: 18px; color: #1e3a5f; margin-bottom: 5px;">Ευχαριστούμε πολύ!</p>
      <p style="font-size: 14px; color: #6b7280;">${COMPANY_INFO.name}</p>
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
  console.log('🔥 sendOwnerCharterEmail CALLED');
  console.log('🔥 Input status:', status);
  console.log('🔥 Charter code:', charter?.code);
  console.log('🔥 Charter status:', charter?.status);
  console.log('🔥 Boat:', boat?.name, boat?.id);
  console.log('🔥 Owner email:', owner?.email);

  try {
    const charterCode = charter.code || charter.charterCode || 'N/A';
    const year = new Date().getFullYear();
    const currentStatus = status || charter.status || 'Option';
    const ownerCompany = owner?.company || owner?.name || owner?.ownerCompany || boat.ownerCompany || 'OWNER';

    console.log('🔥 Final currentStatus:', currentStatus);
    console.log('🔥 charterCode:', charterCode);

    // Generate HTML email
    const htmlContent = generateOwnerCharterEmailHTML(charter, boat, owner, currentStatus);

    // Recipients - always include company emails
    const recipients: string[] = [
      COMPANY_INFO.emails.info,
      COMPANY_INFO.emails.charter
    ];

    // Add owner email from multiple possible sources (avoid duplicates)
    const ownerEmail = owner?.email || charter.ownerEmail || boat.ownerEmail;
    if (ownerEmail && !recipients.includes(ownerEmail)) {
      recipients.push(ownerEmail);
      console.log('📧 Added owner email to recipients:', ownerEmail);
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
    const grossAmount = charter.amount || 0;
    const commission = charter.commission || 0;
    const vatOnCommission = charter.vat_on_commission || 0;
    const foreignBrokerPercent = charter.foreignBrokerPercent || 0;

    // Calculate net fare (without 12% VAT)
    const netFare = grossAmount / 1.12;
    // Calculate foreign broker commission (percentage of net fare)
    const foreignBrokerCommission = netFare * (foreignBrokerPercent / 100);
    // Amount received by foreign broker (what goes to our bank)
    const charterAmount = grossAmount - foreignBrokerCommission;
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

    console.log('📧 ========== EMAIL SEND START ==========');
    console.log('📧 Sending HTML email to:', recipients);
    console.log('📧 Subject:', subject);
    console.log('📧 EMAIL_API_URL:', EMAIL_API_URL);
    console.log('📧 Payload action/status:', emailPayload.action);
    console.log('📧 Payload keys:', Object.keys(emailPayload));

    try {
      console.log('📧 Starting fetch request...');
      const response = await fetch(EMAIL_API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(emailPayload)
      });

      console.log('📧 Fetch completed. Response status:', response.status);
      console.log('📧 Response ok:', response.ok);
      console.log('📧 Response statusText:', response.statusText);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('📧 ❌ API Error:', response.status, responseText);
        console.log('📧 ========== EMAIL SEND FAILED ==========');
        return false;
      }

      const responseData = await response.text();
      console.log('📧 Response data:', responseData);
      console.log('📧 ✅ HTML email sent successfully!');
      console.log('📧 ========== EMAIL SEND SUCCESS ==========');
      return true;

    } catch (fetchError) {
      console.error('📧 ❌ Fetch error:', fetchError);
      console.error('📧 Fetch error name:', fetchError.name);
      console.error('📧 Fetch error message:', fetchError.message);
      console.log('📧 ========== EMAIL SEND FETCH ERROR ==========');
      return false;
    }

  } catch (error) {
    console.error('📧 ❌ Email send error:', error);
    console.error('📧 Error name:', error.name);
    console.error('📧 Error message:', error.message);
    console.log('📧 ========== EMAIL SEND ERROR ==========');
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
