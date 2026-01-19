// =====================================================
// EMAIL SERVICE - CENTRALIZED EMAIL MANAGEMENT
// =====================================================
// Sends emails via local Node.js server (localhost:3001)
// Sends to: Customer, Company, Base Manager, Owners

import { getVATRate } from '../authService';

// Email Server URL (change this when you go to production)
const EMAIL_SERVER_URL = 'https://yachtmanagementsuite.com/email';

// Email Recipients
export const EMAIL_RECIPIENTS = {
  company: 'info@tailwindyachting.com',
  baseManager: 'tailwindbase@gmail.com',
  charter: 'charter@tailwindyachting.com',
  accounting: 'accounting@tailwindyachting.com'
};

// =====================================================
// SEND CHARTER EMAIL (Accept/Reject)
// =====================================================
export async function sendCharterEmail(
  charter: any,
  boatName: string,
  action: 'accepted' | 'rejected',
  ownerEmail?: string,
  boatType?: string
): Promise<{ success: boolean; error?: any }> {
  try {
    // Build recipients list: company, charter, and owner (NO technical manager for financial data)
    const recipients = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.charter];
    if (ownerEmail) {
      recipients.push(ownerEmail);
    }

    const response = await fetch(`${EMAIL_SERVER_URL}/send-charter-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        charter: {
          code: charter.code || charter.charterCode || '',
          startDate: charter.startDate || '',
          endDate: charter.endDate || '',
          amount: charter.amount || charter.charterAmount || 0
        },
        boatName,
        boatType: boatType || '',
        action,
        recipients
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Charter email sent successfully');
      return { success: true };
    } else {
      console.error('❌ Charter email failed:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Charter email error:', error);
    return { success: false, error };
  }
}

// =====================================================
// CHECK-IN EMAIL - MATCHES PDF TEMPLATE EXACTLY
// =====================================================
export async function sendCheckInEmail(
  customerEmail: string,
  bookingData: any,
  pdfBlob: Blob,
  additionalData?: any
): Promise<{ success: boolean; results: any[] }> {
  try {
    console.log('📧 ========== CHECK-IN EMAIL START ==========');

    // Convert PDF to base64 for attachment
    const pdfBase64 = await blobToBase64(pdfBlob);
    console.log('PDF Base64 length:', pdfBase64?.length || 0);

    console.log('📧 DEBUG - customerEmail:', customerEmail);
    console.log('📧 DEBUG - bookingData keys:', Object.keys(bookingData || {}));
    console.log('📧 DEBUG - additionalData keys:', additionalData ? Object.keys(additionalData) : 'undefined');
    console.log('📧 DEBUG - Charter fields:', {
      bookingNumber: bookingData?.bookingNumber,
      bookingCode: bookingData?.bookingCode,
      code: bookingData?.code,
      charterCode: bookingData?.charterCode
    });
    console.log('📧 DEBUG - Signature fields in bookingData:', {
      skipperSignature: bookingData?.skipperSignature ? 'EXISTS' : 'undefined',
      customerSignature: bookingData?.customerSignature ? 'EXISTS' : 'undefined',
      employeeSignature: bookingData?.employeeSignature ? 'EXISTS' : 'undefined',
      staffSignature: bookingData?.staffSignature ? 'EXISTS' : 'undefined'
    });
    console.log('📧 DEBUG - Signature fields in additionalData:', {
      skipperSignature: additionalData?.skipperSignature ? 'EXISTS' : 'undefined',
      customerSignature: additionalData?.customerSignature ? 'EXISTS' : 'undefined',
      employeeSignature: additionalData?.employeeSignature ? 'EXISTS' : 'undefined',
      staffSignature: additionalData?.staffSignature ? 'EXISTS' : 'undefined'
    });

    // Build recipients list
    const recipients: string[] = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail && !recipients.includes(customerEmail)) {
      recipients.unshift(customerEmail);
    }

    // Extract booking details - bookingNumber is where Page1 stores the charter code
    const charterParty = bookingData.bookingNumber || bookingData.bookingCode || bookingData.code || bookingData.charterCode || '';
    console.log('📧 DEBUG CHECKIN - charterParty extracted:', charterParty);
    const vesselName = bookingData.vesselName || bookingData.selectedVessel || bookingData.vessel || '';
    const skipperFirstName = bookingData.skipperFirstName || '';
    const skipperLastName = bookingData.skipperLastName || '';
    const skipperName = `${skipperFirstName} ${skipperLastName}`.trim();
    const skipperAddress = bookingData.skipperAddress || '';
    const skipperEmail = bookingData.skipperEmail || '';
    const skipperPhone = bookingData.skipperPhone ? `${bookingData.phoneCountryCode || ''} ${bookingData.skipperPhone}`.trim() : '';
    const checkInDate = formatDateForEmail(bookingData.checkInDate) || '';
    const checkOutDate = formatDateForEmail(bookingData.checkOutDate) || '';
    const checkInTime = bookingData.checkInTime || '';
    const checkOutTime = bookingData.checkOutTime || '';

    // Extract additional data
    const inventoryItems = additionalData?.allItems || [];
    const agreements = additionalData?.agreements || {};
    const notes = additionalData?.notes || '';
    const warningAccepted = additionalData?.warningAccepted || false;
    const timestamp = additionalData?.timestamp || new Date().toISOString();

    // Colors matching PDF
    const COLORS = {
      navy: '#0B1D51',
      gold: '#C6A664',
      grey: '#6B7280',
      lightGrey: '#E8E8E8',
      black: '#1A1A1A',
      green: '#10B981',
      red: '#EF4444',
      orange: '#D97706'
    };

    // Generate Agreements HTML
    let agreementsHTML = '';
    const agreementsList = [
      { key: 'return', label: 'Return Condition Acknowledgement' },
      { key: 'terms', label: 'Terms & Conditions' },
      { key: 'privacy', label: 'Privacy Policy Consent' },
      { key: 'warning', label: 'Important Notice Acceptance' }
    ];

    const acceptedAgreements = agreementsList.filter(a => agreements[a.key]);
    if (acceptedAgreements.length > 0) {
      agreementsHTML = `
      <!-- Agreements Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: normal;">Agreements</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.gold}; margin-bottom: 15px;"></div>
        ${acceptedAgreements.map(a => `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 16px; height: 16px; background-color: ${COLORS.green}; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
              <span style="color: white; font-size: 12px; font-weight: bold;">✓</span>
            </div>
            <span style="font-size: 13px; color: ${COLORS.black};">${a.label}</span>
          </div>
        `).join('')}
      </div>`;
    }

    // Generate Important Notice HTML
    const importantNoticeHTML = `
    <!-- Important Notice Section -->
    <div style="margin-top: 25px; border: 4px solid ${COLORS.orange}; padding: 20px;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="font-size: 20px; margin-right: 10px;">⚠</span>
        <span style="font-size: 14px; color: ${COLORS.orange}; font-weight: bold;">IMPORTANT NOTICE - MANDATORY READING</span>
      </div>

      <p style="font-size: 11px; color: ${COLORS.black}; line-height: 1.5; margin: 0 0 10px 0;">
        If check-in is completed by the company's specialized staff, signed by the customer and the check-in manager, and no damage or clogging is detected on the yacht
      </p>

      <div style="background-color: #FEE2E2; padding: 10px; margin: 10px 0;">
        <p style="font-size: 10px; color: #DC2626; font-weight: bold; margin: 0; line-height: 1.4;">
          (if there is any damage, the base manager is obliged to report it so that the customer knows, writes it in the comments and takes a photo)
        </p>
      </div>

      <p style="font-size: 11px; color: ${COLORS.black}; line-height: 1.5; margin: 10px 0;">
        or toilet clogging, the company and the base have no responsibility after check-in.
      </p>

      <div style="background-color: #FEFCE8; padding: 10px; margin: 10px 0;">
        <p style="font-size: 10px; color: ${COLORS.black}; font-weight: bold; margin: 0; line-height: 1.4;">
          Upon return, the customer must pay for any damage without any excuse. The customer is responsible for any damage that occurs after check-in. They must take care of the yacht and return it in the condition they received it.
        </p>
      </div>

      <p style="font-size: 11px; font-weight: bold; color: ${COLORS.black}; text-align: center; margin: 15px 0 10px 0;">
        Thank you in advance.
      </p>

      ${warningAccepted ? `
      <div style="display: flex; align-items: center; margin-top: 15px;">
        <div style="width: 16px; height: 16px; background-color: ${COLORS.green}; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
          <span style="color: white; font-size: 12px; font-weight: bold;">✓</span>
        </div>
        <span style="font-size: 10px; color: ${COLORS.black}; font-weight: bold;">✓ I have read and accept</span>
      </div>
      ` : ''}
    </div>`;

    // Generate Inventory HTML - Show ALL items with status
    let inventoryHTML = '';
    if (inventoryItems.length > 0) {
      // Group by section
      let currentSection = '';
      let tableRows = '';

      inventoryItems.forEach((item: any) => {
        const sectionKey = `${item.page || ''} - ${item.section || ''}`;
        if (sectionKey !== currentSection && item.page && item.section) {
          currentSection = sectionKey;
          tableRows += `
            <tr>
              <td colspan="5" style="background-color: ${COLORS.lightGrey}; padding: 6px 8px; font-size: 9px; font-weight: bold; color: ${COLORS.navy};">
                ${item.page} - ${item.section}
              </td>
            </tr>`;
        }

        // Determine if item is OK or not OK
        const isOK = item.inOk || item.in === 'ok';
        const statusHTML = isOK
          ? `<span style="color: ${COLORS.green}; font-size: 14px; font-weight: bold;">✓</span>`
          : `<span style="color: ${COLORS.red}; font-size: 14px; font-weight: bold;">✗</span>`;

        tableRows += `
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 9px; color: ${COLORS.grey};">${item.page || ''}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.black};">${item.name || ''}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.black}; text-align: center;">${item.qty || 1}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; text-align: center;">
              ${statusHTML}
            </td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.grey}; text-align: right;">€${(parseFloat(item.price) || 0).toFixed(2)}</td>
          </tr>`;
      });

      inventoryHTML = `
      <!-- Complete Inventory Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: normal;">Complete Inventory</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.gold}; margin-bottom: 15px;"></div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 6px 8px; text-align: left; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">PAGE</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">ITEM</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">QTY</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">CHECK-IN</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">RATE</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>`;
    }

    // Generate Notes HTML
    let notesHTML = '';
    if (notes) {
      notesHTML = `
      <!-- Additional Remarks Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: normal;">Additional Remarks</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.gold}; margin-bottom: 15px;"></div>
        <p style="font-size: 10px; color: ${COLORS.black}; line-height: 1.5; margin: 0; white-space: pre-wrap;">${notes}</p>
      </div>`;
    }

    // Generate Signatures HTML with actual signature images
    let signaturesHTML = '';
    let skipperSigData = additionalData?.skipperSignature;
    let employeeSigData = additionalData?.employeeSignature;

    console.log('📧 DEBUG CHECKIN - skipperSigData type:', typeof skipperSigData);
    console.log('📧 DEBUG CHECKIN - skipperSigData preview:', typeof skipperSigData === 'string' ? skipperSigData.substring(0, 80) : JSON.stringify(skipperSigData)?.substring(0, 80));
    console.log('📧 DEBUG CHECKIN - employeeSigData type:', typeof employeeSigData);
    console.log('📧 DEBUG CHECKIN - employeeSigData preview:', typeof employeeSigData === 'string' ? employeeSigData.substring(0, 80) : JSON.stringify(employeeSigData)?.substring(0, 80));

    // Extract signature data if it's an object
    if (skipperSigData && typeof skipperSigData === 'object') {
      console.log('📧 DEBUG CHECKIN - skipperSigData is object, keys:', Object.keys(skipperSigData));
      skipperSigData = skipperSigData.url || skipperSigData.data || skipperSigData;
    }
    if (employeeSigData && typeof employeeSigData === 'object') {
      console.log('📧 DEBUG CHECKIN - employeeSigData is object, keys:', Object.keys(employeeSigData));
      employeeSigData = employeeSigData.url || employeeSigData.data || employeeSigData;
    }

    // Check if signatures are valid base64 or data URLs
    const hasSkipperSig = skipperSigData && typeof skipperSigData === 'string' && skipperSigData.length > 100;
    const hasEmployeeSig = employeeSigData && typeof employeeSigData === 'string' && employeeSigData.length > 100;
    console.log('📧 DEBUG CHECKIN - hasSkipperSig:', hasSkipperSig, 'length:', skipperSigData?.length || 0);
    console.log('📧 DEBUG CHECKIN - hasEmployeeSig:', hasEmployeeSig, 'length:', employeeSigData?.length || 0);

    // Always show signatures section with both boxes
    signaturesHTML = `
    <!-- Signatures Section -->
    <div style="margin-top: 25px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 10px;">
            <p style="font-size: 9px; color: ${COLORS.grey}; margin: 0 0 5px 0;">Skipper's Signature</p>
            ${hasSkipperSig
              ? `<img src="${skipperSigData}" style="max-width: 200px; max-height: 80px; border: 1px solid ${COLORS.lightGrey};" alt="Skipper Signature" />`
              : `<div style="border: 1px solid ${COLORS.lightGrey}; height: 60px; background-color: #fafafa;"></div>`
            }
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 10px;">
            <p style="font-size: 9px; color: ${COLORS.grey}; margin: 0 0 5px 0;">Employee's Signature</p>
            ${hasEmployeeSig
              ? `<img src="${employeeSigData}" style="max-width: 200px; max-height: 80px; border: 1px solid ${COLORS.lightGrey};" alt="Employee Signature" />`
              : `<div style="border: 1px solid ${COLORS.lightGrey}; height: 60px; background-color: #fafafa;"></div>`
            }
          </td>
        </tr>
      </table>
    </div>`;

    // Email subject
    const subject = `✅ CHECK-IN COMPLETED - ${vesselName || 'Vessel'} - ${charterParty || 'Charter'}`;

    // Generate HTML email content matching PDF exactly
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 10px;">
      <h1 style="font-size: 28px; color: ${COLORS.navy}; margin: 0; font-weight: normal;">TAILWIND YACHTING</h1>
      <p style="font-size: 14px; color: ${COLORS.grey}; margin: 8px 0 0 0;">Check-in Report - Page 5</p>
    </div>

    <!-- Gold separator line -->
    <div style="border-bottom: 2px solid ${COLORS.gold}; margin: 15px 0;"></div>

    <!-- Info Row 1: Charter Party, Yacht, Skipper -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${charterParty ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHARTER PARTY</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${charterParty}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${vesselName ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">YACHT</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${vesselName}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperName ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">SKIPPER</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${skipperName}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    <!-- Info Row 2: Address, Email, Phone -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${skipperAddress ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">ADDRESS</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperAddress}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperEmail ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">EMAIL</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperEmail}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperPhone ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">PHONE</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperPhone}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    <!-- Info Row 3: Check-in, Check-out, Mode -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${checkInDate ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHECK-IN</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${checkInDate}${checkInTime ? ' ' + checkInTime : ''}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${checkOutDate ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHECK-OUT</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${checkOutDate}${checkOutTime ? ' ' + checkOutTime : ''}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">MODE</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">Check-in</p>
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    ${agreementsHTML}

    ${importantNoticeHTML}

    ${inventoryHTML}

    ${notesHTML}

    ${signaturesHTML}

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid ${COLORS.lightGrey};">
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0;">Leukosias 37, Alimos</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">www.tailwindyachting.com</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">Tel: +30 6978196009</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com</p>
      <p style="font-size: 7px; color: ${COLORS.grey}; margin: 10px 0 0 0;">Document generated on ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

  </div>
</body>
</html>`;

    // Plain text version
    const textContent = `TAILWIND YACHTING
Check-in Report - Page 5
========================

${charterParty ? `CHARTER PARTY: ${charterParty}` : ''}
${vesselName ? `YACHT: ${vesselName}` : ''}
${skipperName ? `SKIPPER: ${skipperName}` : ''}

${skipperAddress ? `ADDRESS: ${skipperAddress}` : ''}
${skipperEmail ? `EMAIL: ${skipperEmail}` : ''}
${skipperPhone ? `PHONE: ${skipperPhone}` : ''}

${checkInDate ? `CHECK-IN: ${checkInDate}${checkInTime ? ' ' + checkInTime : ''}` : ''}
${checkOutDate ? `CHECK-OUT: ${checkOutDate}${checkOutTime ? ' ' + checkOutTime : ''}` : ''}
MODE: Check-in

${inventoryItems.length > 0 ? `COMPLETE INVENTORY
------------------
${inventoryItems.map((item: any) => {
  const isOK = item.inOk || item.in === 'ok';
  const status = isOK ? '✓' : '✗';
  return `${status} ${item.name || ''} (Qty: ${item.qty || 1}) - €${(parseFloat(item.price) || 0).toFixed(2)}`;
}).join('\n')}
` : ''}

${notes ? `ADDITIONAL REMARKS
------------------
${notes}
` : ''}

IMPORTANT NOTICE
----------------
If check-in is completed and no damage or toilet clogging is detected, the company and base have no responsibility after check-in.
${warningAccepted ? '✓ Customer has read and accepted' : ''}

---
Leukosias 37, Alimos
www.tailwindyachting.com
Tel: +30 6978196009
info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com
Document generated on ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    // Send email
    console.log('📧 DEBUG - About to send email to:', recipients);
    console.log('📧 DEBUG - Subject:', subject);
    console.log('📧 DEBUG - HTML length:', htmlContent.length);
    console.log('📧 DEBUG - Text length:', textContent.length);

    const response = await fetch('https://yachtmanagementsuite.com/email/send-email', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: recipients,
        subject: subject,
        html: htmlContent,
        text: textContent,
        attachments: [{
          filename: 'check-in-report.pdf',
          content: pdfBase64,
          contentType: 'application/pdf'
        }]
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('📧 ❌ Check-in email API error:', response.status, responseText);
      return { success: false, results: [{ success: false, error: responseText }] };
    }

    console.log('📧 ✅ Check-in email sent successfully!');
    return { success: true, results: [{ success: true }] };

  } catch (error: any) {
    console.error('📧 ❌ Check-in email error:', error);
    console.error('📧 ❌ Error message:', error?.message);
    console.error('📧 ❌ Error stack:', error?.stack);
    return { success: false, results: [{ success: false, error: error?.message || error }] };
  }
}

// Helper function to format date
function formatDateForEmail(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// =====================================================
// CHECK-OUT EMAIL - MATCHES PDF TEMPLATE EXACTLY
// =====================================================
export async function sendCheckOutEmail(
  customerEmail: string,
  bookingData: any,
  pdfBlob: Blob,
  additionalData?: any
): Promise<{ success: boolean; results: any[] }> {
  try {
    console.log('📧 ========== CHECK-OUT EMAIL START ==========');

    // Convert PDF to base64 for attachment
    const pdfBase64 = await blobToBase64(pdfBlob);

    // Build recipients list
    const recipients: string[] = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail && !recipients.includes(customerEmail)) {
      recipients.unshift(customerEmail);
    }

    // Extract booking details - bookingNumber is where Page1 stores the charter code
    const charterParty = bookingData.bookingNumber || bookingData.bookingCode || bookingData.code || bookingData.charterCode || '';
    const vesselName = bookingData.vesselName || bookingData.selectedVessel || bookingData.vessel || '';
    const skipperFirstName = bookingData.skipperFirstName || '';
    const skipperLastName = bookingData.skipperLastName || '';
    const skipperName = `${skipperFirstName} ${skipperLastName}`.trim();
    const skipperAddress = bookingData.skipperAddress || '';
    const skipperEmail = bookingData.skipperEmail || '';
    const skipperPhone = bookingData.skipperPhone ? `${bookingData.phoneCountryCode || ''} ${bookingData.skipperPhone}`.trim() : '';
    const checkInDate = formatDateForEmail(bookingData.checkInDate) || '';
    const checkOutDate = formatDateForEmail(bookingData.checkOutDate) || '';
    const checkInTime = bookingData.checkInTime || '';
    const checkOutTime = bookingData.checkOutTime || '';

    // Extract additional data
    const allItems = additionalData?.allItems || [];
    const agreements = additionalData?.agreements || {};
    const notes = additionalData?.notes || '';
    const warningAccepted = additionalData?.warningAccepted || false;
    const paymentAuthAccepted = additionalData?.paymentAuthAccepted || false;
    const timestamp = additionalData?.timestamp || new Date().toISOString();
    const photos = additionalData?.photos || {};

    // 🔥 Debug: Log photos info
    console.log('📧 EMAIL DEBUG - Photos received:', {
      hasPhotos: Object.keys(photos).length > 0,
      photoKeys: Object.keys(photos),
      sampleUrl: Object.values(photos)[0]?.[0]?.substring(0, 80) || 'N/A'
    });

    // Filter damaged items (out === 'not')
    const damagedItems = allItems.filter((item: any) => item.out === 'not');
    const hasDamages = damagedItems.length > 0;
    const hasPhotos = Object.keys(photos).length > 0;

    // Colors matching PDF
    const COLORS = {
      navy: '#0B1D51',
      gold: '#C6A664',
      grey: '#6B7280',
      lightGrey: '#E8E8E8',
      black: '#1A1A1A',
      green: '#10B981',
      red: '#EF4444',
      orange: '#D97706'
    };

    // Generate Agreements HTML
    let agreementsHTML = '';
    const agreementsList = [
      { key: 'return', label: 'Return Condition Acknowledgement' },
      { key: 'terms', label: 'Terms & Conditions' },
      { key: 'privacy', label: 'Privacy Policy Consent' },
      { key: 'warning', label: 'Important Notice Acceptance' }
    ];

    // Add payment auth for check-out
    if (paymentAuthAccepted) {
      agreementsList.push({ key: 'paymentAuth', label: 'Payment Authorization' });
    }

    const acceptedAgreements = agreementsList.filter(a =>
      a.key === 'paymentAuth' ? paymentAuthAccepted : agreements[a.key]
    );

    if (acceptedAgreements.length > 0) {
      agreementsHTML = `
      <!-- Agreements Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: normal;">Agreements</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.gold}; margin-bottom: 15px;"></div>
        ${acceptedAgreements.map(a => `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 16px; height: 16px; background-color: ${COLORS.green}; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
              <span style="color: white; font-size: 12px; font-weight: bold;">✓</span>
            </div>
            <span style="font-size: 13px; color: ${COLORS.black};">${a.label}</span>
          </div>
        `).join('')}
      </div>`;
    }

    // Generate Important Notice HTML
    const importantNoticeHTML = `
    <!-- Important Notice Section -->
    <div style="margin-top: 25px; border: 4px solid ${COLORS.orange}; padding: 20px;">
      <div style="display: flex; align-items: center; margin-bottom: 15px;">
        <span style="font-size: 20px; margin-right: 10px;">⚠</span>
        <span style="font-size: 14px; color: ${COLORS.orange}; font-weight: bold;">IMPORTANT NOTICE - MANDATORY READING</span>
      </div>

      <p style="font-size: 11px; color: ${COLORS.black}; line-height: 1.5; margin: 0 0 10px 0;">
        If check-in is completed by the company's specialized staff, signed by the customer and the check-in manager, and no damage or clogging is detected on the yacht
      </p>

      <div style="background-color: #FEE2E2; padding: 10px; margin: 10px 0;">
        <p style="font-size: 10px; color: #DC2626; font-weight: bold; margin: 0; line-height: 1.4;">
          (if there is any damage, the base manager is obliged to report it so that the customer knows, writes it in the comments and takes a photo)
        </p>
      </div>

      <p style="font-size: 11px; color: ${COLORS.black}; line-height: 1.5; margin: 10px 0;">
        or toilet clogging, the company and the base have no responsibility after check-in.
      </p>

      <div style="background-color: #FEFCE8; padding: 10px; margin: 10px 0;">
        <p style="font-size: 10px; color: ${COLORS.black}; font-weight: bold; margin: 0; line-height: 1.4;">
          Upon return, the customer must pay for any damage without any excuse. The customer is responsible for any damage that occurs after check-in. They must take care of the yacht and return it in the condition they received it.
        </p>
      </div>

      <p style="font-size: 11px; font-weight: bold; color: ${COLORS.black}; text-align: center; margin: 15px 0 10px 0;">
        Thank you in advance.
      </p>

      ${warningAccepted ? `
      <div style="display: flex; align-items: center; margin-top: 15px;">
        <div style="width: 16px; height: 16px; background-color: ${COLORS.green}; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
          <span style="color: white; font-size: 12px; font-weight: bold;">✓</span>
        </div>
        <span style="font-size: 10px; color: ${COLORS.black}; font-weight: bold;">✓ I have read and accept</span>
      </div>
      ` : ''}
    </div>`;

    // Generate Damage Report HTML (for check-out)
    let damageReportHTML = '';
    if (hasDamages) {
      let totalAmount = 0;

      // Get VAT rate from settings
      let vatRate = 24;
      try {
        vatRate = getVATRate() || 24;
      } catch (e) {
        vatRate = 24; // Default to 24% if unable to get setting
      }

      const damageRows = damagedItems.map((item: any) => {
        const qty = item.qty || 1;
        const unitPrice = parseFloat(item.price) || 0;
        const total = qty * unitPrice;
        totalAmount += total;

        return `
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 9px; color: ${COLORS.grey};">${item.page || ''}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.black};">${item.name || ''}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.black}; text-align: center;">${qty}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.black}; text-align: center;">€${unitPrice.toFixed(2)}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid ${COLORS.lightGrey}; font-size: 10px; color: ${COLORS.red}; font-weight: bold; text-align: right;">€${total.toFixed(2)}</td>
          </tr>`;
      }).join('');

      // Calculate VAT amounts
      const vatAmount = totalAmount * (vatRate / 100);
      const totalWithVat = totalAmount + vatAmount;

      damageReportHTML = `
      <!-- Damage Report Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.red}; font-weight: bold;">DAMAGE REPORT</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.red}; margin-bottom: 15px;"></div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 6px 8px; text-align: left; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">PAGE</th>
              <th style="padding: 6px 8px; text-align: left; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">ITEM</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">QTY</th>
              <th style="padding: 6px 8px; text-align: center; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">UNIT PRICE</th>
              <th style="padding: 6px 8px; text-align: right; font-size: 8px; color: ${COLORS.grey}; font-weight: bold; border-bottom: 1px solid ${COLORS.lightGrey};">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${damageRows}
          </tbody>
        </table>

        <!-- VAT Calculation Section -->
        <div style="margin-top: 15px;">
          <!-- NET TOTAL -->
          <div style="background-color: #F3F4F6; padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${COLORS.lightGrey};">
            <span style="font-size: 11px; font-weight: bold; color: ${COLORS.black};">NET TOTAL:</span>
            <span style="font-size: 12px; font-weight: bold; color: ${COLORS.black};">€${totalAmount.toFixed(2)}</span>
          </div>
          <!-- VAT -->
          <div style="background-color: #F3F4F6; padding: 8px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${COLORS.lightGrey};">
            <span style="font-size: 11px; font-weight: bold; color: ${COLORS.black};">VAT ${vatRate}%:</span>
            <span style="font-size: 12px; font-weight: bold; color: ${COLORS.black};">€${vatAmount.toFixed(2)}</span>
          </div>
          <!-- TOTAL WITH VAT -->
          <div style="background-color: #FEE2E2; border: 2px solid ${COLORS.red}; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: bold; color: ${COLORS.red};">TOTAL WITH VAT:</span>
            <span style="font-size: 14px; font-weight: bold; color: ${COLORS.red};">€${totalWithVat.toFixed(2)}</span>
          </div>
        </div>
      </div>`;
    }

    // Generate Damage Photos HTML (for check-out)
    let damagePhotosHTML = '';
    if (hasPhotos) {
      const photoEntries = Object.entries(photos);
      let photoImagesHTML = '';

      photoEntries.forEach(([itemName, photoUrls]: [string, any]) => {
        const urlArray = Array.isArray(photoUrls) ? photoUrls : [photoUrls];
        urlArray.forEach((photoUrl: string, idx: number) => {
          if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('data:image')) {
            photoImagesHTML += `
              <div style="display: inline-block; margin: 5px; text-align: center; vertical-align: top;">
                <img src="${photoUrl}" style="width: 120px; height: 90px; object-fit: cover; border: 1px solid ${COLORS.lightGrey}; border-radius: 4px;" alt="${itemName} ${idx + 1}" />
                <div style="font-size: 8px; color: ${COLORS.grey}; margin-top: 2px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${itemName}</div>
              </div>`;
          }
        });
      });

      if (photoImagesHTML) {
        damagePhotosHTML = `
        <!-- Damage Photos Section -->
        <div style="margin-top: 20px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: ${COLORS.red}; font-weight: bold;">📷 DAMAGE PHOTOS</span>
          </div>
          <div style="border: 1px solid ${COLORS.lightGrey}; border-radius: 4px; padding: 10px; background-color: #FAFAFA;">
            ${photoImagesHTML}
          </div>
        </div>`;
      }
    }

    // Generate Payment Authorization HTML (for check-out)
    let paymentAuthHTML = '';
    if (paymentAuthAccepted) {
      paymentAuthHTML = `
      <!-- Payment Authorization Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: bold;">Payment Authorization *</span>
        </div>

        <p style="font-size: 10px; color: ${COLORS.black}; line-height: 1.5; margin: 10px 0;">
          The customer authorizes us to charge the pre-authorized amount on their card for any damages incurred.
        </p>

        <div style="display: flex; align-items: center; margin-top: 10px;">
          <div style="width: 16px; height: 16px; background-color: ${COLORS.green}; border-radius: 2px; display: inline-flex; align-items: center; justify-content: center; margin-right: 8px;">
            <span style="color: white; font-size: 12px; font-weight: bold;">✓</span>
          </div>
          <span style="font-size: 10px; color: ${COLORS.black}; font-weight: bold;">✓ I authorize payment</span>
        </div>

        <p style="font-size: 9px; color: ${COLORS.grey}; font-style: italic; text-align: center; margin-top: 10px;">
          * The skipper signature below covers this authorization
        </p>
      </div>`;
    }

    // Generate Notes HTML
    let notesHTML = '';
    if (notes) {
      notesHTML = `
      <!-- Additional Remarks Section -->
      <div style="margin-top: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 14px; color: ${COLORS.navy}; font-weight: normal;">Additional Remarks</span>
        </div>
        <div style="border-bottom: 2px solid ${COLORS.gold}; margin-bottom: 15px;"></div>
        <p style="font-size: 10px; color: ${COLORS.black}; line-height: 1.5; margin: 0; white-space: pre-wrap;">${notes}</p>
      </div>`;
    }

    // Generate Signatures HTML with actual signature images
    let signaturesHTML = '';
    let skipperSigData = additionalData?.skipperSignature;
    let employeeSigData = additionalData?.employeeSignature;

    // Extract signature data if it's an object
    if (skipperSigData && typeof skipperSigData === 'object') {
      skipperSigData = skipperSigData.url || skipperSigData.data || skipperSigData;
    }
    if (employeeSigData && typeof employeeSigData === 'object') {
      employeeSigData = employeeSigData.url || employeeSigData.data || employeeSigData;
    }

    // Check if signatures are valid base64 or data URLs
    const hasSkipperSig = skipperSigData && typeof skipperSigData === 'string' && skipperSigData.length > 100;
    const hasEmployeeSig = employeeSigData && typeof employeeSigData === 'string' && employeeSigData.length > 100;

    if (hasSkipperSig || hasEmployeeSig) {
      signaturesHTML = `
      <!-- Signatures Section -->
      <div style="margin-top: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 10px;">
              <p style="font-size: 9px; color: ${COLORS.grey}; margin: 0 0 5px 0;">Skipper's Signature</p>
              ${hasSkipperSig
                ? `<img src="${skipperSigData}" style="max-width: 200px; max-height: 80px; border: 1px solid ${COLORS.lightGrey};" alt="Skipper Signature" />`
                : `<div style="border: 1px solid ${COLORS.lightGrey}; height: 60px; background-color: #fafafa;"></div>`
              }
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 10px;">
              <p style="font-size: 9px; color: ${COLORS.grey}; margin: 0 0 5px 0;">Employee's Signature</p>
              ${hasEmployeeSig
                ? `<img src="${employeeSigData}" style="max-width: 200px; max-height: 80px; border: 1px solid ${COLORS.lightGrey};" alt="Employee Signature" />`
                : `<div style="border: 1px solid ${COLORS.lightGrey}; height: 60px; background-color: #fafafa;"></div>`
              }
            </td>
          </tr>
        </table>
      </div>`;
    }

    // Email subject
    const subject = hasDamages
      ? `⚠️ CHECK-OUT WITH DAMAGES - ${vesselName || 'Vessel'} - ${charterParty || 'Charter'}`
      : `🏁 CHECK-OUT COMPLETED - ${vesselName || 'Vessel'} - ${charterParty || 'Charter'}`;

    // Generate HTML email content matching PDF exactly
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; padding: 20px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 10px;">
      <h1 style="font-size: 28px; color: ${COLORS.navy}; margin: 0; font-weight: normal;">TAILWIND YACHTING</h1>
      <p style="font-size: 14px; color: ${COLORS.grey}; margin: 8px 0 0 0;">Check-out Report - Page 5</p>
    </div>

    <!-- Gold separator line -->
    <div style="border-bottom: 2px solid ${COLORS.gold}; margin: 15px 0;"></div>

    <!-- Info Row 1: Charter Party, Yacht, Skipper -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${charterParty ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHARTER PARTY</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${charterParty}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${vesselName ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">YACHT</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${vesselName}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperName ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">SKIPPER</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${skipperName}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    <!-- Info Row 2: Address, Email, Phone -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${skipperAddress ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">ADDRESS</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperAddress}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperEmail ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">EMAIL</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperEmail}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${skipperPhone ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">PHONE</p>
          <p style="font-size: 10px; color: ${COLORS.black}; margin: 0;">${skipperPhone}</p>
          ` : ''}
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    <!-- Info Row 3: Check-in, Check-out, Mode -->
    <table style="width: 100%; margin-bottom: 15px;">
      <tr>
        <td style="width: 33%; vertical-align: top;">
          ${checkInDate ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHECK-IN</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${checkInDate}${checkInTime ? ' ' + checkInTime : ''}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          ${checkOutDate ? `
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">CHECK-OUT</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">${checkOutDate}${checkOutTime ? ' ' + checkOutTime : ''}</p>
          ` : ''}
        </td>
        <td style="width: 33%; vertical-align: top;">
          <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0 0 5px 0; font-weight: bold;">MODE</p>
          <p style="font-size: 11px; color: ${COLORS.black}; margin: 0;">Check-out</p>
        </td>
      </tr>
    </table>

    <!-- Grey separator -->
    <div style="border-bottom: 1px solid ${COLORS.lightGrey}; margin: 10px 0;"></div>

    ${agreementsHTML}

    ${importantNoticeHTML}

    ${damageReportHTML}

    ${damagePhotosHTML}

    ${notesHTML}

    ${paymentAuthHTML}

    ${signaturesHTML}

    <!-- Footer -->
    <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid ${COLORS.lightGrey};">
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 0;">Leukosias 37, Alimos</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">www.tailwindyachting.com</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">Tel: +30 6978196009</p>
      <p style="font-size: 8px; color: ${COLORS.grey}; margin: 4px 0;">info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com</p>
      <p style="font-size: 7px; color: ${COLORS.grey}; margin: 10px 0 0 0;">Document generated on ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>

  </div>
</body>
</html>`;

    // Plain text version
    const textContent = `TAILWIND YACHTING
Check-out Report - Page 5
=========================

${charterParty ? `CHARTER PARTY: ${charterParty}` : ''}
${vesselName ? `YACHT: ${vesselName}` : ''}
${skipperName ? `SKIPPER: ${skipperName}` : ''}

${skipperAddress ? `ADDRESS: ${skipperAddress}` : ''}
${skipperEmail ? `EMAIL: ${skipperEmail}` : ''}
${skipperPhone ? `PHONE: ${skipperPhone}` : ''}

${checkInDate ? `CHECK-IN: ${checkInDate}${checkInTime ? ' ' + checkInTime : ''}` : ''}
${checkOutDate ? `CHECK-OUT: ${checkOutDate}${checkOutTime ? ' ' + checkOutTime : ''}` : ''}
MODE: Check-out

${hasDamages ? `DAMAGE REPORT
-------------
${damagedItems.map((item: any) => {
  const qty = item.qty || 1;
  const unitPrice = parseFloat(item.price) || 0;
  const total = qty * unitPrice;
  return `✘ ${item.name || ''} (Qty: ${qty}) - €${total.toFixed(2)}`;
}).join('\n')}

TOTAL WITH VAT: €${damagedItems.reduce((sum: number, item: any) => sum + ((item.qty || 1) * (parseFloat(item.price) || 0)), 0).toFixed(2)}
` : 'NO DAMAGES REPORTED - Vessel returned in good condition.'}

${notes ? `ADDITIONAL REMARKS
------------------
${notes}
` : ''}

${paymentAuthAccepted ? `PAYMENT AUTHORIZATION
---------------------
✓ Customer has authorized payment for any damages incurred.
` : ''}

IMPORTANT NOTICE
----------------
The customer is responsible for any damage that occurs after check-in.
${warningAccepted ? '✓ Customer has read and accepted' : ''}

---
Leukosias 37, Alimos
www.tailwindyachting.com
Tel: +30 6978196009
info@tailwindyachting.com | charter@tailwindyachting.com | accounting@tailwindyachting.com
Document generated on ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    // Send email
    const response = await fetch('https://yachtmanagementsuite.com/email/send-email', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to: recipients,
        subject: subject,
        html: htmlContent,
        text: textContent,
        attachments: [{
          filename: 'check-out-report.pdf',
          content: pdfBase64,
          contentType: 'application/pdf'
        }]
      })
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('📧 ❌ Check-out email API error:', response.status, responseText);
      return { success: false, results: [{ success: false, error: responseText }] };
    }

    console.log('📧 ✅ Check-out email sent successfully!');
    return { success: true, results: [{ success: true }] };

  } catch (error) {
    console.error('📧 ❌ Check-out email error:', error);
    return { success: false, results: [{ success: false, error }] };
  }
}

// =====================================================
// CHARTER ACCEPTANCE EMAIL (Fleet Management)
// =====================================================
export async function sendCharterAcceptanceEmail(
  charterData: any,
  vesselName: string,
  ownerEmail: string,
  pdfBlob?: Blob,
  boatType?: string
): Promise<{ success: boolean; results: any[] }> {
  const result = await sendCharterEmail(charterData, vesselName, 'accepted', ownerEmail, boatType);
  return { success: result.success, results: [result] };
}

// =====================================================
// CHARTER REJECTION EMAIL (Fleet Management)
// =====================================================
export async function sendCharterRejectionEmail(
  charterData: any,
  vesselName: string,
  ownerEmail: string,
  boatType?: string
): Promise<{ success: boolean; results: any[] }> {
  const result = await sendCharterEmail(charterData, vesselName, 'rejected', ownerEmail, boatType);
  return { success: result.success, results: [result] };
}

// =====================================================
// GENERIC EMAIL
// =====================================================
export async function sendGenericEmail(
  recipients: string[],
  subject: string,
  message: string,
  pdfBlob?: Blob,
  additionalData?: any
): Promise<{ success: boolean; results: any[] }> {
  try {
    let pdfBase64 = '';
    if (pdfBlob) {
      pdfBase64 = await blobToBase64(pdfBlob);
    }

    const response = await fetch(`${EMAIL_SERVER_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipients.join(', '),
        subject,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
        text: message
      })
    });

    const result = await response.json();
    return { success: result.success, results: [result] };
  } catch (error) {
    console.error('❌ Generic email error:', error);
    return { success: false, results: [{ success: false, error }] };
  }
}

// =====================================================
// HELPER: Convert Blob to Base64
// =====================================================
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default {
  sendCheckInEmail,
  sendCheckOutEmail,
  sendCharterAcceptanceEmail,
  sendCharterRejectionEmail,
  sendCharterEmail,
  sendGenericEmail,
  EMAIL_RECIPIENTS
};