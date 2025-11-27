import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import wordDocumentService from './services/wordDocumentService';
import { updateCharterCrew } from './services/apiService';

// Declare jsPDF as global
declare global {
  interface Window {
    jspdf: any;
  }
}

export default function CharterAgreementPage() {
  const [language, setLanguage] = useState('en');
  const [bookingData, setBookingData] = useState<any>(null);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [skipperLicense, setSkipperLicense] = useState<string>('');
  const [crewMembers, setCrewMembers] = useState([
    { name: '', passport: '', dateOfBirth: '', nationality: '' }
  ]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const bookingCode = location.state?.bookingCode || localStorage.getItem('currentBooking');

    console.log('🔍 CharterAgreementPage: Loading booking:', bookingCode);

    if (bookingCode) {
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      const booking = bookings[bookingCode];

      console.log('📦 Found booking:', booking);

      if (booking?.bookingData) {
        const data = {
          bookingCode,
          ...booking.bookingData
        };
        console.log('✅ Setting bookingData:', data);
        setBookingData(data);

        // 🔥 FIX 26: Load crew members from API data (or localStorage fallback)
        const savedCrew = data.crewMembers || booking.charterAgreementData?.crewMembers;
        if (savedCrew && savedCrew.length > 0) {
          console.log('👥 Loading saved crew members:', savedCrew);
          setCrewMembers(savedCrew);
          setShowCrewForm(true);
        }
      } else {
        console.warn('⚠️ No bookingData found for:', bookingCode);
      }
    } else {
      console.warn('⚠️ No booking code found!');
    }
  }, [location.state]);

  const handleDownloadBoardingPass = () => {
    if (!bookingData) {
      alert(language === 'en' 
        ? 'No booking data found!' 
        : 'Δεν βρέθηκαν στοιχεία κράτησης!');
      return;
    }
    
    // Vessel capacity mapping
    const vesselCapacity: { [key: string]: number } = {
      'Lagoon 42-BOB': 12,
      'Lagoon 46-PERLA': 12,
      'Bali 4.2-INFINITY': 10,
      'Bavaria C42-CRUISER-KALISPERA': 8,
      'Bavaria C42-CRUISER-VALESIA': 8,
      'Beneteau Oceanis 46': 10,
      'Jeanneau 54': 12,
      'Jeanneau 449': 10
    };
    
    // Get max people for this vessel
    const maxPeople = vesselCapacity[bookingData.vesselName] || '';

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Load logo from Google Drive
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
    
    const generatePDF = (hasLogo: boolean) => {
      try {
        if (hasLogo) {
          // Add logo
          doc.addImage(logoImg, 'PNG', 20, 10, 40, 18);
        } else {
          // Fallback to text
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 165, 0);
          doc.text('TAILWIND', 20, 20);
        }
      } catch (e) {
        console.error('Error adding logo:', e);
        // Fallback to text
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 165, 0);
        doc.text('TAILWIND', 20, 20);
      }
      
      // BOARDING PASS title at top right
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('BOARDING PASS', 190, 20, { align: 'right' });
      
      // ===== LEFT COLUMN =====
      let leftY = 45;
      
      // BOOKING DETAILS
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BOOKING DETAILS:', 20, leftY);
      
      leftY += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Booking No:', 20, leftY);
      doc.text(bookingData.bookingCode || '', 50, leftY);
      
      leftY += 5;
      doc.text('Client:', 20, leftY);
      doc.text(bookingData.clientName || '', 50, leftY);
      
      leftY += 5;
      doc.text('Agency:', 20, leftY);
      doc.text(bookingData.agency || '', 50, leftY);
      
      leftY += 8;
      doc.text('Boat Type/Name:', 20, leftY);
      doc.text(bookingData.vesselName || '', 60, leftY);
      
      leftY += 5;
      doc.text(`Check-in: ${bookingData.checkInDate || ''} (17:00h) - Athens / Alimos Marina`, 20, leftY);
      
      leftY += 5;
      doc.text(`Check-out: ${bookingData.checkOutDate || ''} (09:00h) Athens / Alimos Marina`, 20, leftY);
      
      leftY += 8;
      doc.text(`Max people onboard (including any crew): ${maxPeople}`, 20, leftY);
      
      leftY += 6;
      doc.text('Return to base: One day before check-out date', 20, leftY);
      leftY += 5;
      doc.text('the latest 17:00.', 20, leftY);
      
      leftY += 6;
      doc.text('Fuel: is paid by the charterer upon return of the boat.', 20, leftY);
      
      // LATE CHECK-IN (removed CREW LIST FORM section)
      leftY += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('LATE CHECK-IN (only for bareboat charters):', 20, leftY);
      
      leftY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('If the arrival of the skipper is after 21:00 a.m on', 20, leftY);
      leftY += 5;
      doc.text('embarkation day or Sunday there will be an extra', 20, leftY);
      leftY += 5;
      doc.text('charge of 200,00 EUR payable in cash on the spot.', 20, leftY);
      leftY += 5;
      doc.text('Please advise the skipper accordingly!', 20, leftY);
      
      // ===== RIGHT COLUMN =====
      let rightY = 45;
      
      // CONTACT INFORMATION
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACT INFORMATION:', 110, rightY);
      
      rightY += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Contact person: Ms Maria Mazaraki', 110, rightY);
      
      rightY += 5;
      doc.text('Contact number: +30 6978196009 (WhatsApp & Viber)', 110, rightY);
      
      rightY += 5;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('Meeting location: Marina Alimos – Charter Village Box A47', 110, rightY, { 
        url: 'https://www.google.gr/maps/place/Tailwind+Yachting/@37.913372,23.7079297,147m/' 
      });
      doc.setTextColor(0, 0, 0);
      
      rightY += 5;
      doc.text('Company: Tailwind Yachting', 110, rightY);
      
      rightY += 5;
      doc.setTextColor(0, 0, 255);
      doc.text('E-mail: info@tailwindyachting.com', 110, rightY);
      doc.setTextColor(0, 0, 0);
      
      // REQUIRED FOR BOARDING
      rightY += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('REQUIRED FOR BOARDING:', 110, rightY);
      
      rightY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('1. The boarding pass', 110, rightY);
      rightY += 6;
      doc.text('2. Passport / ID', 110, rightY);
      rightY += 6;
      doc.text("3. Skipper's license", 110, rightY);
      rightY += 6;
      doc.text('4. A card or cash for refundable security deposit.', 110, rightY);
      rightY += 6;
      doc.text('5. The total amount for extras as described above in cash.', 110, rightY);
      
      // e-PROVISIONING SERVICE
      rightY += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('e-PROVISIONING SERVICE:', 110, rightY);
      
      rightY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('We suggest to pre-order your provisions upfront', 110, rightY);
      rightY += 5;
      doc.text('& online by ', 110, rightY);
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('clicking here', 133, rightY, { url: 'https://store.yachtness.com/?tracking=tailwind' });
      doc.setTextColor(0, 0, 0);
      doc.text(" so you won't lose", 160, rightY);
      rightY += 5;
      doc.text('any valuable time on embarkation day.', 110, rightY);
      rightY += 6;
      doc.text('Our boats are based in Alimos marina, Pier 1.', 110, rightY);
      rightY += 5;
      doc.text('Please use these details for your delivery.', 110, rightY);
      rightY += 5;
      doc.text('You can pay online or on spot after the', 110, rightY);
      rightY += 5;
      doc.text('delivery of provisions.', 110, rightY);
      
      // TRANSFER SERVICE
      rightY += 12;
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSFER SERVICE:', 110, rightY);
      
      rightY += 7;
      doc.setFont('helvetica', 'normal');
      doc.text('To ensure a smooth and timely transfer, we', 110, rightY);
      rightY += 5;
      doc.text('kindly ask that you pre-book your service ', 110, rightY);
      doc.setTextColor(0, 0, 255);
      doc.text('at least', 180, rightY);
      rightY += 5;
      doc.text('2 weeks', 110, rightY);
      doc.setTextColor(0, 0, 0);
      doc.text(' before embarkation. Payment will be', 126, rightY);
      rightY += 5;
      doc.text('made directly to the driver upon pickup.', 110, rightY);
      
      // Save PDF
      doc.save(`Boarding-Pass-${bookingData.bookingCode}.pdf`);
    };
  };

  const handleDownloadCharterAgreement = () => {
    if (!bookingData) {
      alert(language === 'en'
        ? 'No booking data found!'
        : 'Δεν βρέθηκαν στοιχεία κράτησης!');
      return;
    }

    // Create PDF with jsPDF (same as Boarding Pass)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('CHARTER PARTY AGREEMENT', 105, 20, { align: 'center' });
    doc.text('ΝΑΥΛΟΣΥΜΦΩΝΟ', 105, 30, { align: 'center' });

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    let y = 45;

    // Booking Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('BOOKING DETAILS / ΣΤΟΙΧΕΙΑ ΚΡΑΤΗΣΗΣ', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Booking Code: ${bookingData.bookingCode || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Vessel: ${bookingData.vesselName || bookingData.selectedVessel || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Check-in: ${bookingData.checkInDate || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Check-out: ${bookingData.checkOutDate || 'N/A'}`, 20, y);
    y += 12;

    // Charterer Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CHARTERER INFORMATION / ΣΤΟΙΧΕΙΑ ΝΑΥΛΩΤΗ', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${bookingData.skipperFirstName || ''} ${bookingData.skipperLastName || ''}`, 20, y);
    y += 6;
    doc.text(`Email: ${bookingData.skipperEmail || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Phone: ${bookingData.skipperPhone || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Passport: ${bookingData.skipperPassport || 'N/A'}`, 20, y);
    y += 6;
    doc.text(`Nationality: ${bookingData.skipperNationality || 'N/A'}`, 20, y);
    y += 12;

    // Financial Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('FINANCIAL SUMMARY / ΟΙΚΟΝΟΜΙΚΑ ΣΤΟΙΧΕΙΑ', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const charterAmount = parseFloat(bookingData.charterAmount || 0);
    const charterVat = parseFloat(bookingData.charterVat || 0);
    const totalAmount = parseFloat(bookingData.totalAmount || 0);
    const deposit = parseFloat(bookingData.deposit || 0);

    doc.text(`Charter Amount (NET):`, 20, y);
    doc.text(`${charterAmount.toFixed(2)}€`, 190, y, { align: 'right' });
    y += 8;

    doc.text(`VAT (12%):`, 20, y);
    doc.text(`${charterVat.toFixed(2)}€`, 190, y, { align: 'right' });
    y += 8;

    // Total line
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`TOTAL (with VAT):`, 20, y);
    doc.text(`${totalAmount.toFixed(2)}€`, 190, y, { align: 'right' });
    y += 10;

    doc.text(`DEPOSIT REQUIRED:`, 20, y);
    doc.text(`${deposit.toFixed(2)}€`, 190, y, { align: 'right' });
    y += 15;

    // Terms & Conditions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TERMS & CONDITIONS / ΟΡΟΙ ΚΑΙ ΠΡΟΫΠΟΘΕΣΕΙΣ', 20, y);
    y += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const terms = [
      '1. The charter period begins and ends at the times specified above.',
      '2. The deposit must be paid in full before departure.',
      '3. The charterer is responsible for any damage to the vessel.',
      '4. All safety equipment must be returned in good condition.',
      '5. The charterer must follow all maritime regulations.',
      '',
      '1. Η περίοδος ναύλωσης αρχίζει και τελειώνει τις ώρες που καθορίζονται παραπάνω.',
      '2. Η προκαταβολή πρέπει να καταβληθεί πλήρως πριν την αναχώρηση.',
      '3. Ο ναυλωτής είναι υπεύθυνος για τυχόν ζημιές στο σκάφος.',
      '4. Όλος ο εξοπλισμός ασφαλείας πρέπει να επιστραφεί σε καλή κατάσταση.',
      '5. Ο ναυλωτής πρέπει να ακολουθεί όλους τους ναυτικούς κανονισμούς.'
    ];

    terms.forEach(term => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(term, 20, y);
      y += 5;
    });

    // Signature section
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SIGNATURES / ΥΠΟΓΡΑΦΕΣ', 20, y);
    y += 15;

    doc.setFont('helvetica', 'normal');
    doc.text('Charterer:', 20, y);
    doc.text('_____________________', 20, y + 10);

    doc.text('Company Representative:', 120, y);
    doc.text('_____________________', 120, y + 10);

    // Save PDF
    doc.save(`Charter-Agreement-${bookingData.bookingCode}.pdf`);
  };

  // 🔥 FIX 27: Removed handleDownloadCrewListTemplate - now using auto-fill in FleetManagement

  const handleSkipperLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSkipperLicense(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSkipperLicense(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCrewMember = () => {
    setCrewMembers([...crewMembers, { name: '', passport: '', dateOfBirth: '', nationality: '' }]);
  };

  const removeCrewMember = (index: number) => {
    setCrewMembers(crewMembers.filter((_, i) => i !== index));
  };

  const handleCrewMemberChange = (index: number, field: string, value: string) => {
    const updated = [...crewMembers];
    updated[index] = { ...updated[index], [field]: value };
    setCrewMembers(updated);
  };

  // 🔥 FIX 26: Updated to save crew to API
  const handleSubmit = async () => {
    if (!bookingData) {
      alert(language === 'en'
        ? 'No booking data found!'
        : 'Δεν βρέθηκαν στοιχεία κράτησης!');
      return;
    }

    if (!skipperLicense) {
      alert(language === 'en'
        ? "Please upload Skipper's License!"
        : 'Παρακαλώ ανεβάστε το δίπλωμα του κυβερνήτη!');
      return;
    }

    if (showCrewForm && crewMembers.some(m => !m.name || !m.passport)) {
      alert(language === 'en'
        ? 'Please fill in all crew member details!'
        : 'Παρακαλώ συμπληρώστε όλα τα στοιχεία του πληρώματος!');
      return;
    }

    const bookingCode = bookingData.bookingCode;
    const crewToSave = showCrewForm ? crewMembers : [];

    try {
      // 🔥 FIX 26: Save crew members to API
      if (crewToSave.length > 0) {
        console.log('👥 Saving crew to API...', { bookingCode, crewMembers: crewToSave });
        await updateCharterCrew(bookingCode, crewToSave);
      }

      // Also save to localStorage for backwards compatibility
      const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
      if (bookings[bookingCode]) {
        bookings[bookingCode].charterAgreementData = {
          skipperLicense,
          crewMembers: crewToSave,
          submittedAt: new Date().toISOString()
        };
        localStorage.setItem('bookings', JSON.stringify(bookings));
      }

      alert(language === 'en'
        ? '✅ Charter Agreement documents submitted successfully!'
        : '✅ Τα έγγραφα του Ναυλοσυμφώνου υποβλήθηκαν επιτυχώς!');

      navigate('/');
    } catch (error) {
      console.error('❌ Error saving charter agreement data:', error);
      alert(language === 'en'
        ? 'Error saving data. Please try again.'
        : 'Σφάλμα αποθήκευσης. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 p-6">
      
      <header className="bg-white shadow-md rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">⚓</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {language === 'en' ? 'Charter Agreement & Documents' : 'Ναυλοσύμφωνο & Έγγραφα'}
              </h1>
              {bookingData && (
                <p className="text-sm text-gray-600">
                  {language === 'en' ? 'Booking' : 'Κράτηση'}: <span className="font-bold text-blue-600">{bookingData.bookingCode}</span>
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setLanguage(language === 'en' ? 'el' : 'en')}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold text-blue-900 transition-colors"
          >
            {language === 'en' ? '🇬🇷 GR' : '🇬🇧 EN'}
          </button>
        </div>
      </header>

      {!bookingData ? (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {language === 'en' ? 'No Booking Found' : 'Δεν Βρέθηκε Κράτηση'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'en' 
              ? 'Please enter your booking code from the home page first.'
              : 'Παρακαλώ εισάγετε τον κωδικό ναύλου σας από την αρχική σελίδα πρώτα.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {language === 'en' ? '🏠 Back to Home' : '🏠 Πίσω στην Αρχική'}
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🎫</span>
                  {language === 'en' ? 'Boarding Pass' : 'Boarding Pass'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'en' 
                    ? 'Your boarding pass with all details and meeting location'
                    : 'Το boarding pass σας με όλες τις λεπτομέρειες και σημείο συνάντησης'}
                </p>
              </div>
              <button
                onClick={handleDownloadBoardingPass}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                📥 {language === 'en' ? 'Download' : 'Λήψη'}
              </button>
            </div>
            <div className="text-sm text-gray-500 border-t pt-3">
              <p>✅ {language === 'en' ? 'Meeting location: Marina Alimos - Charter Village Box A47' : 'Σημείο συνάντησης: Marina Alimos - Charter Village Box A47'}</p>
              <p>✅ {language === 'en' ? 'Contact: Ms Maria Mazaraki (+30 6978196009)' : 'Επικοινωνία: Κα. Μαρία Μαζαράκη (+30 6978196009)'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">📜</span>
                  {language === 'en' ? 'Charter Agreement (Ναυλοσύμφωνο)' : 'Ναυλοσύμφωνο (Charter Agreement)'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {language === 'en'
                    ? 'Download, print, sign and bring it with you'
                    : 'Κατεβάστε, τυπώστε, υπογράψτε και φέρτε το μαζί σας'}
                </p>
              </div>
              <button
                onClick={handleDownloadCharterAgreement}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md"
              >
                📥 {language === 'en' ? 'Download' : 'Λήψη'}
              </button>
            </div>

            {/* 🔥 Financial Summary Section */}
            {bookingData.charterAmount && (
              <div className="mt-4 bg-gradient-to-br from-slate-800 to-gray-900 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  {language === 'en' ? 'Financial Summary' : 'Οικονομικά Στοιχεία'}
                </h3>

                <div className="space-y-3">
                  {/* Charter Amount (NET) */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-blue-300 font-semibold">
                      {language === 'en' ? 'Charter Amount (NET):' : 'Ποσό Ναύλου (ΚΑΘΑΡΟ):'}
                    </span>
                    <span className="text-blue-300 font-bold text-lg">
                      {parseFloat(bookingData.charterAmount).toFixed(2)}€
                    </span>
                  </div>

                  {/* VAT on Charter (12%) */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-blue-300 font-medium">
                      {language === 'en' ? 'VAT (12%):' : 'ΦΠΑ (12%):'}
                    </span>
                    <span className="text-blue-300 font-bold">
                      +{parseFloat(bookingData.charterVat).toFixed(2)}€
                    </span>
                  </div>

                  {/* Total Amount */}
                  <div className="flex justify-between items-center pt-2 pb-2 border-b-2 border-teal-500">
                    <span className="text-teal-300 font-bold text-lg">
                      {language === 'en' ? 'TOTAL (with VAT):' : 'ΣΥΝΟΛΟ (με ΦΠΑ):'}
                    </span>
                    <span className="text-teal-300 font-bold text-2xl">
                      {parseFloat(bookingData.totalAmount).toFixed(2)}€
                    </span>
                  </div>

                  {/* Deposit Required */}
                  <div className="flex justify-between items-center pt-2 bg-yellow-500/10 rounded-lg px-3 py-2">
                    <span className="text-yellow-300 font-bold">
                      {language === 'en' ? 'Deposit Required:' : 'Απαιτούμενη Προκαταβολή:'}
                    </span>
                    <span className="text-yellow-300 font-bold text-xl">
                      {parseFloat(bookingData.deposit).toFixed(2)}€
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-4 italic">
                  {language === 'en'
                    ? '* These amounts are automatically calculated and reflect the final payment details in your charter agreement.'
                    : '* Τα ποσά υπολογίζονται αυτόματα και αντικατοπτρίζουν τα τελικά οικονομικά στοιχεία του ναυλοσυμφώνου σας.'}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-500 border-t pt-3 mt-4">
              <p>📄 {language === 'en' ? 'Format: PDF (with all details pre-filled)' : 'Μορφή: PDF (με όλα τα στοιχεία προ-συμπληρωμένα)'}</p>
              <p>✍️ {language === 'en' ? 'Print and sign before check-in' : 'Τυπώστε και υπογράψτε πριν το check-in'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span className="text-2xl">👥</span>
              {language === 'en' ? 'Crew List' : 'Λίστα Πληρώματος'}
            </h2>
            
            {/* 🔥 FIX 27: Removed Option 1 (Google Drive download) - now using auto-fill in FleetManagement */}
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {language === 'en' ? 'Fill Crew Details Online' : 'Συμπλήρωση Στοιχείων Πληρώματος'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {language === 'en'
                        ? 'Fill the crew list directly in the app'
                        : 'Συμπληρώστε τη λίστα πληρώματος απευθείας στο app'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCrewForm(!showCrewForm)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                      showCrewForm 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {showCrewForm 
                      ? (language === 'en' ? '❌ Close' : '❌ Κλείσιμο')
                      : (language === 'en' ? '✏️ Fill Now' : '✏️ Συμπλήρωση')
                    }
                  </button>
                </div>

                {showCrewForm && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {crewMembers.map((member, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">
                            {language === 'en' ? `Crew Member ${index + 1}` : `Μέλος Πληρώματος ${index + 1}`}
                          </h4>
                          {index > 0 && (
                            <button
                              onClick={() => removeCrewMember(index)}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Full Name' : 'Ονοματεπώνυμο'}
                            value={member.name}
                            onChange={(e) => handleCrewMemberChange(index, 'name', e.target.value)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Passport Number' : 'Αριθμός Διαβατηρίου'}
                            value={member.passport}
                            onChange={(e) => handleCrewMemberChange(index, 'passport', e.target.value)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="date"
                            placeholder={language === 'en' ? 'Date of Birth' : 'Ημ. Γέννησης'}
                            value={member.dateOfBirth}
                            onChange={(e) => handleCrewMemberChange(index, 'dateOfBirth', e.target.value)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder={language === 'en' ? 'Nationality' : 'Εθνικότητα'}
                            value={member.nationality}
                            onChange={(e) => handleCrewMemberChange(index, 'nationality', e.target.value)}
                            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addCrewMember}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      + {language === 'en' ? 'Add Crew Member' : 'Προσθήκη Μέλους Πληρώματος'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span className="text-2xl">📸</span>
              {language === 'en' ? "Skipper's License" : 'Δίπλωμα Κυβερνήτη'}
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              {language === 'en' 
                ? "Upload a photo of the skipper's sailing license"
                : 'Ανεβάστε φωτογραφία του ναυτικού διπλώματος του κυβερνήτη'}
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              {skipperLicense ? (
                <div className="space-y-4">
                  <img 
                    src={skipperLicense} 
                    alt="Skipper License" 
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={() => setSkipperLicense('')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                  >
                    🗑️ {language === 'en' ? 'Remove' : 'Αφαίρεση'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    {/* Camera Capture */}
                    <label className="cursor-pointer flex-1 max-w-xs">
                      <div className="p-6 border-2 border-blue-400 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="text-5xl mb-2">📷</div>
                        <p className="text-lg font-semibold text-gray-700">
                          {language === 'en' ? 'Take Photo' : 'Τράβηξε Φωτό'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'en' ? 'Use camera' : 'Χρήση κάμερας'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                      />
                    </label>

                    {/* File Upload */}
                    <label className="cursor-pointer flex-1 max-w-xs">
                      <div className="p-6 border-2 border-gray-400 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="text-5xl mb-2">📁</div>
                        <p className="text-lg font-semibold text-gray-700">
                          {language === 'en' ? 'Upload File' : 'Ανέβασμα Αρχείου'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {language === 'en' ? 'Choose from gallery' : 'Επιλογή από συλλογή'}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSkipperLicenseUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    {language === 'en' ? 'or drag and drop' : 'ή σύρετε και αφήστε'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-colors"
            >
              ← {language === 'en' ? 'Back to Home' : 'Πίσω στην Αρχική'}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
            >
              ✅ {language === 'en' ? 'Submit All Documents' : 'Υποβολή Όλων των Εγγράφων'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
