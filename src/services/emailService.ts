// =====================================================
// EMAIL SERVICE - CENTRALIZED EMAIL MANAGEMENT
// =====================================================
// Sends emails via local Node.js server (localhost:3001)
// Sends to: Customer, Company, Base Manager, Owners

// Email Server URL (change this when you go to production)
const EMAIL_SERVER_URL = 'http://localhost:3001';

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
// CHECK-IN EMAIL
// =====================================================
export async function sendCheckInEmail(
  customerEmail: string,
  bookingData: any,
  pdfBlob: Blob
): Promise<{ success: boolean; results: any[] }> {
  try {
    // Convert PDF to base64
    const pdfBase64 = await blobToBase64(pdfBlob);

    const recipients = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail) recipients.unshift(customerEmail);

    const response = await fetch(`${EMAIL_SERVER_URL}/send-checkin-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingData: {
          bookingNumber: bookingData.bookingNumber || '',
          vesselName: bookingData.vesselName || bookingData.selectedVessel || '',
          skipperName: `${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`.trim(),
          checkInDate: bookingData.checkInDate || '',
          checkOutDate: bookingData.checkOutDate || ''
        },
        pdfBase64,
        mode: 'in',
        recipients
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Check-in emails sent successfully');
      return { success: true, results: [{ success: true }] };
    } else {
      console.error('❌ Check-in email failed:', result.error);
      return { success: false, results: [{ success: false, error: result.error }] };
    }
  } catch (error) {
    console.error('❌ Check-in email error:', error);
    return { success: false, results: [{ success: false, error }] };
  }
}

// =====================================================
// CHECK-OUT EMAIL
// =====================================================
export async function sendCheckOutEmail(
  customerEmail: string,
  bookingData: any,
  pdfBlob: Blob
): Promise<{ success: boolean; results: any[] }> {
  try {
    // Convert PDF to base64
    const pdfBase64 = await blobToBase64(pdfBlob);

    const recipients = [EMAIL_RECIPIENTS.company, EMAIL_RECIPIENTS.baseManager];
    if (customerEmail) recipients.unshift(customerEmail);

    const response = await fetch(`${EMAIL_SERVER_URL}/send-checkin-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingData: {
          bookingNumber: bookingData.bookingNumber || '',
          vesselName: bookingData.vesselName || bookingData.selectedVessel || '',
          skipperName: `${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`.trim(),
          checkInDate: bookingData.checkInDate || '',
          checkOutDate: bookingData.checkOutDate || ''
        },
        pdfBase64,
        mode: 'out',
        recipients
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Check-out emails sent successfully');
      return { success: true, results: [{ success: true }] };
    } else {
      console.error('❌ Check-out email failed:', result.error);
      return { success: false, results: [{ success: false, error: result.error }] };
    }
  } catch (error) {
    console.error('❌ Check-out email error:', error);
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