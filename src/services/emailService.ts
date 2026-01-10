// =====================================================
// EMAIL SERVICE - CENTRALIZED EMAIL MANAGEMENT
// =====================================================
// Sends emails via local Node.js server (localhost:3001)
// Sends to: Customer, Company, Base Manager, Owners

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
// CHECK-IN EMAIL (Using same approach as sendOwnerCharterEmail)
// =====================================================
export async function sendCheckInEmail(
  customerEmail: string,
  bookingData: any,
  _pdfBlob: Blob // Kept for backwards compatibility, not used
): Promise<{ success: boolean; results: any[] }> {
  try {
    console.log('📧 ========== CHECK-IN EMAIL START ==========');

    // Build recipients list
    const recipients: string[] = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail && !recipients.includes(customerEmail)) {
      recipients.unshift(customerEmail);
    }

    // Extract booking details
    const bookingNumber = bookingData.bookingNumber || 'N/A';
    const vesselName = bookingData.vesselName || bookingData.selectedVessel || 'N/A';
    const skipperName = `${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`.trim() || 'N/A';
    const checkInDate = formatDateForEmail(bookingData.checkInDate) || 'N/A';
    const checkOutDate = formatDateForEmail(bookingData.checkOutDate) || 'N/A';
    const checkInTime = bookingData.checkInTime || '';
    const skipperEmail = bookingData.skipperEmail || '';
    const skipperPhone = bookingData.skipperPhone || '';

    // Email subject
    const subject = `✅ CHECK-IN COMPLETED - ${vesselName} - Booking ${bookingNumber}`;

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ CHECK-IN COMPLETED</h1>
      <p style="color: #b0c4de; margin: 10px 0 0 0; font-size: 14px;">TAILWIND YACHTING</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">

      <!-- Booking Info Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
        <h2 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 140px;">Booking Number:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Vessel:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${vesselName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Skipper:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${skipperName}</td>
          </tr>
          ${skipperEmail ? `<tr>
            <td style="padding: 8px 0; color: #666;">Email:</td>
            <td style="padding: 8px 0; color: #333;">${skipperEmail}</td>
          </tr>` : ''}
          ${skipperPhone ? `<tr>
            <td style="padding: 8px 0; color: #666;">Phone:</td>
            <td style="padding: 8px 0; color: #333;">${skipperPhone}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Dates Box -->
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background-color: #e8f5e9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #2e7d32; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Check-In Date</p>
          <p style="color: #1b5e20; margin: 0; font-size: 18px; font-weight: bold;">${checkInDate}</p>
          ${checkInTime ? `<p style="color: #388e3c; margin: 5px 0 0 0; font-size: 14px;">${checkInTime}</p>` : ''}
        </div>
        <div style="flex: 1; background-color: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #e65100; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Check-Out Date</p>
          <p style="color: #bf360c; margin: 0; font-size: 18px; font-weight: bold;">${checkOutDate}</p>
        </div>
      </div>

      <!-- Status -->
      <div style="background-color: #e8f5e9; border: 2px solid #4caf50; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="color: #2e7d32; margin: 0; font-size: 16px; font-weight: bold;">
          ✅ Check-in has been successfully completed
        </p>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
          ${new Date().toLocaleString('el-GR', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
      <p style="color: #b0c4de; margin: 0; font-size: 12px;">TAILWIND YACHTING</p>
      <p style="color: #7a9cbf; margin: 5px 0 0 0; font-size: 11px;">Leukosias 37, Alimos | +30 6978196009 | info@tailwindyachting.com</p>
    </div>

  </div>
</body>
</html>`;

    // Plain text version
    const textContent = `CHECK-IN COMPLETED - TAILWIND YACHTING

Booking Number: ${bookingNumber}
Vessel: ${vesselName}
Skipper: ${skipperName}
${skipperEmail ? `Email: ${skipperEmail}` : ''}
${skipperPhone ? `Phone: ${skipperPhone}` : ''}

Check-In: ${checkInDate} ${checkInTime}
Check-Out: ${checkOutDate}

Status: ✅ Check-in has been successfully completed
Time: ${new Date().toLocaleString('el-GR')}

---
TAILWIND YACHTING
Leukosias 37, Alimos
+30 6978196009
info@tailwindyachting.com`;

    // Email payload (same format as sendOwnerCharterEmail)
    const emailPayload = {
      to: recipients,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log('📧 Sending check-in email to:', recipients);
    console.log('📧 Subject:', subject);

    const response = await fetch('https://yachtmanagementsuite.com/email/send-email', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('📧 Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('📧 ❌ Check-in email API error:', response.status, responseText);
      return { success: false, results: [{ success: false, error: responseText }] };
    }

    const responseData = await response.text();
    console.log('📧 ✅ Check-in email sent successfully!');
    console.log('📧 ========== CHECK-IN EMAIL END ==========');
    return { success: true, results: [{ success: true }] };

  } catch (error) {
    console.error('📧 ❌ Check-in email error:', error);
    return { success: false, results: [{ success: false, error }] };
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
// CHECK-OUT EMAIL (Using same approach as sendOwnerCharterEmail)
// =====================================================
export async function sendCheckOutEmail(
  customerEmail: string,
  bookingData: any,
  _pdfBlob: Blob // Kept for backwards compatibility, not used
): Promise<{ success: boolean; results: any[] }> {
  try {
    console.log('📧 ========== CHECK-OUT EMAIL START ==========');

    // Build recipients list
    const recipients: string[] = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail && !recipients.includes(customerEmail)) {
      recipients.unshift(customerEmail);
    }

    // Extract booking details
    const bookingNumber = bookingData.bookingNumber || 'N/A';
    const vesselName = bookingData.vesselName || bookingData.selectedVessel || 'N/A';
    const skipperName = `${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`.trim() || 'N/A';
    const checkInDate = formatDateForEmail(bookingData.checkInDate) || 'N/A';
    const checkOutDate = formatDateForEmail(bookingData.checkOutDate) || 'N/A';
    const checkOutTime = bookingData.checkOutTime || '';
    const skipperEmail = bookingData.skipperEmail || '';
    const skipperPhone = bookingData.skipperPhone || '';

    // Email subject
    const subject = `🏁 CHECK-OUT COMPLETED - ${vesselName} - Booking ${bookingNumber}`;

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🏁 CHECK-OUT COMPLETED</h1>
      <p style="color: #b0c4de; margin: 10px 0 0 0; font-size: 14px;">TAILWIND YACHTING</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">

      <!-- Booking Info Box -->
      <div style="background-color: #f8f9fa; border-left: 4px solid #1e3a5f; padding: 20px; margin-bottom: 25px; border-radius: 0 8px 8px 0;">
        <h2 style="color: #1e3a5f; margin: 0 0 15px 0; font-size: 18px;">📋 Booking Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 140px;">Booking Number:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${bookingNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Vessel:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${vesselName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Skipper:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${skipperName}</td>
          </tr>
          ${skipperEmail ? `<tr>
            <td style="padding: 8px 0; color: #666;">Email:</td>
            <td style="padding: 8px 0; color: #333;">${skipperEmail}</td>
          </tr>` : ''}
          ${skipperPhone ? `<tr>
            <td style="padding: 8px 0; color: #666;">Phone:</td>
            <td style="padding: 8px 0; color: #333;">${skipperPhone}</td>
          </tr>` : ''}
        </table>
      </div>

      <!-- Dates Box -->
      <div style="display: flex; gap: 15px; margin-bottom: 25px;">
        <div style="flex: 1; background-color: #e3f2fd; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #1565c0; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Check-In Date</p>
          <p style="color: #0d47a1; margin: 0; font-size: 18px; font-weight: bold;">${checkInDate}</p>
        </div>
        <div style="flex: 1; background-color: #fff3e0; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="color: #e65100; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Check-Out Date</p>
          <p style="color: #bf360c; margin: 0; font-size: 18px; font-weight: bold;">${checkOutDate}</p>
          ${checkOutTime ? `<p style="color: #e65100; margin: 5px 0 0 0; font-size: 14px;">${checkOutTime}</p>` : ''}
        </div>
      </div>

      <!-- Status -->
      <div style="background-color: #e3f2fd; border: 2px solid #1976d2; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="color: #1565c0; margin: 0; font-size: 16px; font-weight: bold;">
          🏁 Check-out has been successfully completed
        </p>
        <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
          ${new Date().toLocaleString('el-GR', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>

      <!-- Thank You Message -->
      <div style="margin-top: 25px; text-align: center;">
        <p style="color: #1e3a5f; font-size: 16px; margin: 0;">
          Thank you for sailing with us! 🌊⛵
        </p>
        <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
          We hope to see you again soon.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #1e3a5f; padding: 20px; text-align: center;">
      <p style="color: #b0c4de; margin: 0; font-size: 12px;">TAILWIND YACHTING</p>
      <p style="color: #7a9cbf; margin: 5px 0 0 0; font-size: 11px;">Leukosias 37, Alimos | +30 6978196009 | info@tailwindyachting.com</p>
    </div>

  </div>
</body>
</html>`;

    // Plain text version
    const textContent = `CHECK-OUT COMPLETED - TAILWIND YACHTING

Booking Number: ${bookingNumber}
Vessel: ${vesselName}
Skipper: ${skipperName}
${skipperEmail ? `Email: ${skipperEmail}` : ''}
${skipperPhone ? `Phone: ${skipperPhone}` : ''}

Check-In: ${checkInDate}
Check-Out: ${checkOutDate} ${checkOutTime}

Status: 🏁 Check-out has been successfully completed
Time: ${new Date().toLocaleString('el-GR')}

Thank you for sailing with us!
We hope to see you again soon.

---
TAILWIND YACHTING
Leukosias 37, Alimos
+30 6978196009
info@tailwindyachting.com`;

    // Email payload (same format as sendOwnerCharterEmail)
    const emailPayload = {
      to: recipients,
      subject: subject,
      html: htmlContent,
      text: textContent
    };

    console.log('📧 Sending check-out email to:', recipients);
    console.log('📧 Subject:', subject);

    const response = await fetch('https://yachtmanagementsuite.com/email/send-email', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailPayload)
    });

    console.log('📧 Response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('📧 ❌ Check-out email API error:', response.status, responseText);
      return { success: false, results: [{ success: false, error: responseText }] };
    }

    console.log('📧 ✅ Check-out email sent successfully!');
    console.log('📧 ========== CHECK-OUT EMAIL END ==========');
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