import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import wordDocumentService from './services/wordDocumentService';
import { updateCharterCrew, loadCharterCrew, getAllBookings, loadChartererData, saveChartererData } from './services/apiService';
import { useSignatureTouch } from './utils/useSignatureTouch';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { saveAs } from 'file-saver';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { codeMatches } from './utils/searchUtils';
import { I18N, LANG_MAP, flagImg } from './shared-components';

// Declare jsPDF as global
declare global {
  interface Window {
    jspdf: any;
  }
}

export default function CharterAgreementPage() {
  const [language, setLanguage] = useState(() => sessionStorage.getItem('yacht_lang') || 'en');
  const [showLangPopup, setShowLangPopup] = useState(false);
  const t: any = new Proxy({}, { get: (_target: any, key: string) => { const v = (I18N as any)[language]; if (v && v[key] !== undefined) return v[key]; return (I18N as any).en[key]; } });
  const [bookingData, setBookingData] = useState<any>(null);
  const [showCrewForm, setShowCrewForm] = useState(false);
  const [skipperLicense, setSkipperLicense] = useState<string>('');
  const [extraLicenses, setExtraLicenses] = useState<string[]>([]);
  const [charterPartyScan, setCharterPartyScan] = useState<string>('');
  const [crewListScan, setCrewListScan] = useState<string>('');
  const [crewMembers, setCrewMembers] = useState([
    { name: '', passport: '', dateOfBirth: '', nationality: '' }
  ]);

  // Phase 6: Crew invitations state
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteForm, setInviteForm] = useState({ firstName: '', lastName: '', email: '', role: 'crew' });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');

  // 🔥 Auto-refresh: Track last update time
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Charterer Details Form (online submission by charterer)
  const [chartererData, setChartererData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    idType: 'id',
    idNumber: '',
    taxNumber: '',
    taxOffice: '',
    tel: '',
    email: '',
    signature: '',
    isAlsoSkipper: false,
    skipperName: '',
    skipperSignature: ''
  });
  const [showChartererForm, setShowChartererForm] = useState(false);

  // Canvas refs for signatures
  const chartererCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const skipperCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useSignatureTouch(chartererCanvasRef);
  useSignatureTouch(skipperCanvasRef);
  const [isDrawingCharterer, setIsDrawingCharterer] = useState(false);
  const [isDrawingSkipper, setIsDrawingSkipper] = useState(false);

  // Persist language changes to sessionStorage (shared across all pages)
  useEffect(() => {
    sessionStorage.setItem('yacht_lang', language);
  }, [language]);

  // Canvas drawing helpers
  const getCanvasPos = (canvas: HTMLCanvasElement, e: any) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (canvasRef: React.RefObject<HTMLCanvasElement>, setDrawing: (b: boolean) => void) => (e: any) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
  };

  const draw = (canvasRef: React.RefObject<HTMLCanvasElement>, isDrawing: boolean) => (e: any) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getCanvasPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = (setDrawing: (b: boolean) => void, canvasRef: React.RefObject<HTMLCanvasElement>, field: 'signature' | 'skipperSignature') => () => {
    setDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setChartererData(prev => ({ ...prev, [field]: dataUrl }));
  };

  const clearCanvas = (canvasRef: React.RefObject<HTMLCanvasElement>, field: 'signature' | 'skipperSignature') => () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setChartererData(prev => ({ ...prev, [field]: '' }));
  };
  const navigate = useNavigate();
  const location = useLocation();

  // Get booking code for use in loadCrewData
  const bookingCode = location.state?.bookingCode || localStorage.getItem('currentBooking');

  // 🔥 Auto-refresh: Memoized loadCrewData function
  const loadCrewData = useCallback(async () => {
    if (!bookingCode) return;

    try {
      const savedCrew = await loadCharterCrew(bookingCode);
      if (savedCrew && savedCrew.length > 0) {
        console.log('👥 Auto-refresh: Loading crew members:', savedCrew);
        setCrewMembers(savedCrew);
        setShowCrewForm(true);
      }

      // Auto-refresh: Load charterer data
      const autoCharterer = await loadChartererData(bookingCode);
      if (autoCharterer && (autoCharterer.firstName || autoCharterer.lastName)) {
        console.log('Auto-refresh: Loading charterer data:', autoCharterer);
        // Pre-fill: merge online data with booking data
        const bk = (bookingData || {}) as any;
        const merged = {
          ...autoCharterer,
          firstName: autoCharterer.firstName || bk.chartererFirstName || bk.skipperFirstName || '',
          lastName: autoCharterer.lastName || bk.chartererLastName || bk.skipperLastName || '',
          address: autoCharterer.address || bk.chartererAddress || bk.skipperAddress || '',
          tel: autoCharterer.tel || bk.chartererPhone || bk.skipperPhone || '',
          email: autoCharterer.email || bk.chartererEmail || bk.skipperEmail || '',
        };
        setChartererData(merged);
        setShowChartererForm(true);
      } else if (bookingData) {
        // No online data — pre-fill from booking
        const bk = bookingData as any;
        setChartererData(prev => ({
          ...prev,
          firstName: bk.chartererFirstName || bk.skipperFirstName || '',
          lastName: bk.chartererLastName || bk.skipperLastName || '',
          address: bk.chartererAddress || bk.skipperAddress || '',
          tel: bk.chartererPhone || bk.skipperPhone || '',
          email: bk.chartererEmail || bk.skipperEmail || '',
        }));
      }

      setLastUpdated(new Date());

            // Load already uploaded documents from archive
            try {
              const archiveResp = await fetch('/api/charter-archive.php?booking_number=' + encodeURIComponent(bookingCode));
              if (archiveResp.ok) {
                const archiveResult = await archiveResp.json();
                const archiveData = archiveResult.data || {};
                const docs = archiveData.documents || {};
                if (docs.skipperLicense && docs.skipperLicense.length > 0) {
                  setSkipperLicense(docs.skipperLicense[0].dataUrl || '');
                  console.log('Loaded skipper license from archive');
                }
                if (docs.charterAgreement && docs.charterAgreement.length > 0) {
                  setCharterPartyScan(docs.charterAgreement[0].dataUrl || '');
                  console.log('Loaded charter party scan from archive');
                }
                if (docs.crewList && docs.crewList.length > 0) {
                  setCrewListScan(docs.crewList[0].dataUrl || '');
                  console.log('Loaded crew list scan from archive');
                }
              }
            } catch (archiveErr) {
              console.log('No archive data yet:', archiveErr);
            }

    } catch (error) {
      console.error('❌ Error loading crew data:', error);
    }
  }, [bookingCode]);

  // 🔥 Auto-refresh: Poll crew data every 5 minutes
  const { isRefreshing } = useAutoRefresh(loadCrewData, 5);

  useEffect(() => {
    const loadBookingFromAPI = async () => {
      console.log('🔍 CharterAgreementPage: Loading booking from API:', bookingCode);

      if (bookingCode) {
        try {
          // Fetch all bookings from API (API is source of truth)
          const allBookings = await getAllBookings();

          // Find matching booking by code (case-insensitive)
          const booking = allBookings.find((b: any) =>
            codeMatches(b.bookingNumber || b.code || b.id, bookingCode)
          );

          console.log('📦 Found booking from API:', booking);

          if (booking) {
            const data = {
              bookingCode: booking.bookingNumber || booking.code || bookingCode,
              ...booking
            };
            console.log('✅ Setting bookingData:', data);
            setBookingData(data);

            // PREFILL_FROM_BOOKING_MARKER
            try {
              const existingOnline = await loadChartererData(bookingCode);
              if (existingOnline && existingOnline.isLocked) {
                console.log('🔒 Loading locked online charterer data');
                setChartererData((prev: any) => ({ ...prev, ...existingOnline }));
                setShowChartererForm(true);
              } else {
                console.log('📋 Pre-filling charterer form from booking data');
                const prefill: any = {
                  firstName: (existingOnline?.firstName) || data.chartererFirstName || '',
                  lastName: (existingOnline?.lastName) || data.chartererLastName || '',
                  address: (existingOnline?.address) || data.chartererAddress || '',
                  tel: (existingOnline?.tel) || data.chartererPhone || '',
                  email: (existingOnline?.email) || data.chartererEmail || '',
                  idNumber: (existingOnline?.idNumber) || data.chartererIdNumber || '',
                  taxNumber: (existingOnline?.taxNumber) || data.chartererTaxNumber || '',
                  taxOffice: (existingOnline?.taxOffice) || data.chartererTaxOffice || '',
                  idType: existingOnline?.idType || 'id',
                  signature: existingOnline?.signature || '',
                  isAlsoSkipper: existingOnline?.isAlsoSkipper || false,
                  skipperName: existingOnline?.skipperName || '',
                  skipperSignature: existingOnline?.skipperSignature || '',
                  isLocked: false
                };
                setChartererData((prev: any) => ({ ...prev, ...prefill }));
              }
            } catch (prefillErr) {
              console.log('Pre-fill error (non-fatal):', prefillErr);
            }

            // Load crew members from API data
            const savedCrew = data.crewMembers || booking.charterAgreementData?.crewMembers;
            if (savedCrew && savedCrew.length > 0) {
              console.log('👥 Loading saved crew members:', savedCrew);
              setCrewMembers(savedCrew);
              setShowCrewForm(true);
            }
            setLastUpdated(new Date());
          } else {
            console.warn('⚠️ No booking found in API for:', bookingCode);
          }
        } catch (error) {
          console.error('❌ Error loading booking from API:', error);
        }
      } else {
        console.warn('⚠️ No booking code found!');
      }
    };

    loadBookingFromAPI();
  }, [bookingCode]);

  // Phase 6: Crew invitations handlers
  const loadInvitations = async (bkCode: string) => {
    if (!bkCode) return;
    try {
      const r = await fetch('/api/crew-invitations.php?action=list&booking_number=' + encodeURIComponent(bkCode));
      const j = await r.json();
      if (j.success && Array.isArray(j.data)) {
        setInvitations(j.data);
        const submitted = j.data.filter((i: any) => i.status === 'submitted');
        if (submitted.length > 0) {
          setCrewMembers((prev: any[]) => {
            const byKey = new Map();
            prev.forEach((m: any) => { if (m.passport) byKey.set(m.passport, m); });
            submitted.forEach((i: any) => {
              const fullName = ((i.submitted_first_name || '') + ' ' + (i.submitted_last_name || '')).trim();
              if (i.role === 'skipper') {
                // Skipper invitation: populate ONLY chartererData.skipper* fields, DO NOT add to crewMembers
                setChartererData((cd: any) => {
                  if (cd && cd.isAlsoSkipper) return cd;
                  return Object.assign({}, cd, {
                    skipperName: fullName,
                    skipperFirstName: i.submitted_first_name || '',
                    skipperLastName: i.submitted_last_name || '',
                    skipperPassport: i.submitted_passport || '',
                    skipperPhone: i.submitted_phone || '',
                    skipperEmail: i.submitted_email || i.invite_email || '',
                    skipperAddress: i.submitted_address || '',
                    skipperNationality: i.submitted_nationality || '',
                    skipperDob: i.submitted_date_of_birth || '',
                    skipperSignature: i.signature_data || '',
                    skipperFromInvitation: true,
                  });
                });
                return;
              }
              const passport = i.submitted_passport || '';
              const entry = {
                name: fullName,
                firstName: i.submitted_first_name || '',
                lastName: i.submitted_last_name || '',
                passport: passport,
                dateOfBirth: i.submitted_date_of_birth || '',
                nationality: i.submitted_nationality || '',
                email: i.submitted_email || i.invite_email || '',
                phone: i.submitted_phone || '',
                address: i.submitted_address || '',
                role: i.role || 'crew',
                signature: i.signature_data || '',
                fromInvitation: true,
                invitationToken: i.token,
              };
              byKey.set(passport || ('__' + i.token), entry);
            });
            return Array.from(byKey.values());
          });
          if (!showCrewForm) setShowCrewForm(true);
        }
      }
    } catch (e) { console.error('loadInvitations failed', e); }
  };

  const sendInvitation = async () => {
    if (!bookingCode) { setInviteMsg(t.ca_noBookingCodeMsg); return; }
    if (!inviteForm.email) { setInviteMsg(t.ca_emailRequired); return; }
    setInviteBusy(true); setInviteMsg('');
    try {
      const r = await fetch('/api/crew-invitations.php?action=create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_number: bookingCode,
          role: inviteForm.role,
          first_name: inviteForm.firstName,
          last_name: inviteForm.lastName,
          email: inviteForm.email,
          language: language,
        })
      });
      const j = await r.json();
      if (j.success) {
        await fetch('/api/crew-invitations.php?action=resend', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: j.data.token })
        });
        setInviteMsg(t.ca_invitationSentTo + ' ' + inviteForm.email);
        setInviteForm({ firstName: '', lastName: '', email: '', role: 'crew' });
        await loadInvitations(bookingCode);
      } else {
        setInviteMsg('Error: ' + (j.error || 'Failed'));
      }
    } catch (e) {
      setInviteMsg('Network error');
    } finally {
      setInviteBusy(false);
    }
  };

  const resendInvitation = async (tk: string) => {
    setInviteBusy(true); setInviteMsg('');
    try {
      const r = await fetch('/api/crew-invitations.php?action=resend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk })
      });
      const j = await r.json();
      setInviteMsg(j.success ? t.ca_invitationResent : t.ca_resendFailed);
      if (j.success && bookingCode) await loadInvitations(bookingCode);
    } finally { setInviteBusy(false); }
  };

  const deleteInvitation = async (tk: string) => {
    if (!window.confirm(t.ca_deleteConfirm)) return;
    setInviteBusy(true);
    try {
      await fetch('/api/crew-invitations.php?action=delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tk })
      });
      if (bookingCode) await loadInvitations(bookingCode);
    } finally { setInviteBusy(false); }
  };

  useEffect(() => {
    if (bookingCode) loadInvitations(bookingCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingCode, bookingData]);

  const handlePreviewBoardingPass = () => {
    handleDownloadBoardingPass(true);
  };

  const handleDownloadBoardingPass = (previewOnly = false) => {
    if (!bookingData) {
      alert(t.ca_alertNoBookingExcl);
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
      if (previewOnly) {
        const pdfUrl = doc.output('bloburl');
        window.open(pdfUrl, '_blank');
      } else {
        doc.save(`Boarding-Pass-${bookingData.bookingCode}.pdf`);
      }
    };
  };

  const handleDownloadCharterAgreement = () => {
    if (!bookingData) {
      alert(t.ca_alertNoBookingExcl);
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

    // Amount entered is GROSS (includes 12% VAT)
    const grossAmount = parseFloat(bookingData.charterAmount || 0);
    const charterAmount = grossAmount / 1.12; // NET = gross / 1.12
    const charterVat = grossAmount - charterAmount; // VAT = gross - NET
    const totalAmount = grossAmount; // Total = gross
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

  // 🔥 FIX 27: Generate Crew List DOCX with auto-fill from bookingData and crewMembers

  // === EXACT COPY FROM FleetManagement - Charter Party ===
const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero Euro';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertGroup = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertGroup(n % 100) : '');
  };

  const euros = Math.floor(Math.abs(num));
  const cents = Math.round((Math.abs(num) - euros) * 100);

  let result = '';
  if (euros >= 1000000) {
    result += convertGroup(Math.floor(euros / 1000000)) + ' Million ';
    const remainder = euros % 1000000;
    if (remainder >= 1000) {
      result += convertGroup(Math.floor(remainder / 1000)) + ' Thousand ';
      if (remainder % 1000) result += (remainder % 1000 < 100 ? 'and ' : '') + convertGroup(remainder % 1000);
    } else if (remainder > 0) {
      result += 'and ' + convertGroup(remainder);
    }
  } else if (euros >= 1000) {
    result += convertGroup(Math.floor(euros / 1000)) + ' Thousand ';
    if (euros % 1000) result += (euros % 1000 < 100 ? 'and ' : '') + convertGroup(euros % 1000);
  } else {
    result = convertGroup(euros);
  }

  result = result.trim() + ' Euro';
  if (cents > 0) {
    result += ' and ' + convertGroup(cents) + ' Cents';
  }
  return result;
};

// 🔥 FIX 23: Generate Charter Party DOCX with auto-fill
const generateCharterParty = async (charter, boat, showMessage?) => {
  console.log('🚀 Charter Party button clicked!');
  console.log('🚀 Charter:', charter);
  console.log('🚀 Boat:', boat);

  try {
        // Phase 3: Fetch online charterer data (from Phase 1 form)
      const bookingCode = charter.charterCode || charter.code || charter.bookingCode || '';
      let onlineData: any = null;
      if (bookingCode) {
        try {
          const { loadChartererData } = await import('./services/apiService');
          onlineData = await loadChartererData(bookingCode);
          try {
            const invR = await fetch('/api/crew-invitations.php?action=list&booking_number=' + encodeURIComponent(bookingCode));
            const invJ = await invR.json();
            if (invJ && invJ.success && Array.isArray(invJ.data)) {
              const skInv = invJ.data.find((x) => x.role === 'skipper' && x.status === 'submitted');
              if (skInv) {
                onlineData = onlineData || {};
                const fn = skInv.submitted_first_name || '';
                const ln = skInv.submitted_last_name || '';
                if (!onlineData.skipperName) onlineData.skipperName = (fn + ' ' + ln).trim();
                if (!onlineData.skipperFirstName) onlineData.skipperFirstName = fn;
                if (!onlineData.skipperLastName) onlineData.skipperLastName = ln;
                if (!onlineData.skipperPassport) onlineData.skipperPassport = skInv.submitted_passport || '';
                if (!onlineData.skipperPhone) onlineData.skipperPhone = skInv.submitted_phone || '';
                if (!onlineData.skipperEmail) onlineData.skipperEmail = skInv.submitted_email || skInv.invite_email || '';
                if (!onlineData.skipperAddress) onlineData.skipperAddress = skInv.submitted_address || '';
                if (!onlineData.skipperNationality) onlineData.skipperNationality = skInv.submitted_nationality || '';
                if (!onlineData.skipperDob) onlineData.skipperDob = skInv.submitted_date_of_birth || '';
                onlineData.skipperSignature = skInv.signature_data || onlineData.skipperSignature || '';
              }
              // Merge submitted crew invitations into charter.crewMembers
              const crewInvs = invJ.data.filter((x) => x.status === 'submitted' && x.role !== 'skipper');
              if (crewInvs.length > 0) {
                (charter as any).crewMembers = (charter as any).crewMembers || [];
                const byPass = new Map();
                ((charter as any).crewMembers).forEach((m) => { if (m.passport) byPass.set(m.passport, m); });
                crewInvs.forEach((ci) => {
                  const passport = ci.submitted_passport || '';
                  byPass.set(passport || ('__' + ci.token), {
                    name: ((ci.submitted_first_name || '') + ' ' + (ci.submitted_last_name || '')).trim(),
                    firstName: ci.submitted_first_name || '',
                    lastName: ci.submitted_last_name || '',
                    passport: passport,
                    dateOfBirth: ci.submitted_date_of_birth || '',
                    nationality: ci.submitted_nationality || '',
                    email: ci.submitted_email || ci.invite_email || '',
                    phone: ci.submitted_phone || '',
                    address: ci.submitted_address || '',
                    role: ci.role || 'crew',
                    signature: ci.signature_data || '',
                    fromInvitation: true,
                  });
                });
                (charter as any).crewMembers = Array.from(byPass.values());
              }
            }
          } catch (eInv) { console.log('invitation enrich skipped', eInv); }
          console.log('Online charterer data loaded:', onlineData);
        } catch (err) {
          console.log('No online charterer data found');
        }
      }

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

    // Fetch owner data from API
    let ownerApiData: any = null;
    try {
      const vesselName = boat?.name || '';
      const ownerResponse = await fetch(`https://yachtmanagementsuite.com/api/vessel-owners.php?vessel_name=${encodeURIComponent(vesselName)}`);
      if (ownerResponse.ok) {
        const ownerResult = await ownerResponse.json();
        ownerApiData = ownerResult?.data || ownerResult;
        if (ownerApiData && !ownerApiData.vessel_name) ownerApiData = null;
      }
    } catch (e) {
      console.log('Could not fetch owner data:', e);
    }

    // Calculate financial values - amount entered is GROSS (includes 12% VAT)
    const grossAmount = charter.amount || 0;
    const charterAmount = grossAmount / 1.12; // NET = gross / 1.12
    const vatAmount = grossAmount - charterAmount; // VAT = gross - NET
    const totalWithVat = grossAmount; // Total = gross (amount entered by user)

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

      // Owner Info - AUTO-FILL from API data
      OWNER_NAME: ownerApiData?.owner_first_name && ownerApiData?.owner_last_name
        ? ownerApiData.owner_first_name + ' ' + ownerApiData.owner_last_name
        : ownerApiData?.company_name || '',
      OWNER_ADDRESS: [ownerApiData?.street, ownerApiData?.street_number, ownerApiData?.postal_code, ownerApiData?.city].filter(Boolean).join(', ') || '',
      OWNER_ID: ownerApiData?.id_passport_number || '',
      OWNER_PASSPORT: ownerApiData?.id_passport_number || '',
      OWNER_TAX: ownerApiData?.vat_number || '',
      OWNER_TAX_OFFICE: ownerApiData?.tax_office || '',
      OWNER_PHONE: ownerApiData?.phone || '',
      OWNER_EMAIL: ownerApiData?.owner_email || ownerApiData?.company_email || '',

      // Broker Info - only fill when a foreign broker is selected
      BROKER2_NAME: charter.hasForeignBroker && charter.broker?.trim() ? (charter.broker || '') : '',
      BROKER2_ADDRESS: charter.hasForeignBroker && charter.broker?.trim() ? (charter.brokerAddress || '') : '',
      BROKER2_TAX: charter.hasForeignBroker && charter.broker?.trim() ? (charter.brokerAfm || charter.brokerTax || '') : '',
      BROKER2_TAX_OFFICE: charter.hasForeignBroker && charter.broker?.trim() ? (charter.brokerDoy || charter.brokerTaxOffice || '') : '',
      BROKER2_PHONE: charter.hasForeignBroker && charter.broker?.trim() ? (charter.brokerPhone || '') : '',
      BROKER2_EMAIL: charter.hasForeignBroker && charter.broker?.trim() ? (charter.brokerEmail || '') : '',

      // Charterer Info - AUTO-FILL from charter data
      CHARTERER_NAME: onlineData?.firstName && onlineData?.lastName
          ? `${onlineData.firstName} ${onlineData.lastName}`
          : charter.chartererFirstName && charter.chartererLastName
        ? `${charter.chartererFirstName} ${charter.chartererLastName}`
        : charter.skipperFirstName && charter.skipperLastName
          ? `${charter.skipperFirstName} ${charter.skipperLastName}`
          : charter.clientName || charter.charterer || '',
      CHARTERER_FIRST_NAME: onlineData?.firstName || chartererData?.firstName || charter.chartererFirstName || charter.skipperFirstName || '',
      CHARTERER_LAST_NAME: onlineData?.lastName || chartererData?.lastName || charter.chartererLastName || charter.skipperLastName || '',
      CHARTERER_ADDRESS: onlineData?.address || chartererData?.address || charter.chartererAddress || charter.skipperAddress || '',
      CHARTERER_ID: (onlineData?.idType === 'id' ? onlineData?.idNumber : '') || (chartererData?.idType === 'id' ? chartererData?.idNumber : '') || charter.chartererIdNumber || '',
      CHARTERER_PASSPORT: (onlineData?.idType === 'passport' ? onlineData?.idNumber : '') || (chartererData?.idType === 'passport' ? chartererData?.idNumber : '') || charter.chartererPassport || '',
      CHARTERER_TAX: onlineData?.taxNumber || chartererData?.taxNumber || charter.chartererTax || charter.chartererAfm || '',
      CHARTERER_TAX_OFFICE: onlineData?.taxOffice || chartererData?.taxOffice || charter.chartererTaxOffice || charter.chartererDoy || '',
      CHARTERER_PHONE: onlineData?.tel || chartererData?.tel || charter.chartererPhone || charter.skipperPhone || '',
      CHARTERER_EMAIL: onlineData?.email || chartererData?.email || charter.chartererEmail || charter.skipperEmail || '',

      // Phase 3: Charterer signature as image (marker text for inject-signature.php)
      CHARTERER_SIGNATURE: onlineData?.signature ? '[object ArrayBuffer]' : '',
      '%CHARTERER_SIGNATURE': onlineData?.signature ? '[object ArrayBuffer]' : '',
      '%SKIPPER_SIGNATURE': (onlineData?.skipperSignature || (onlineData?.isAlsoSkipper && onlineData?.signature)) ? '[object ArrayBuffer]' : '',

      // Charter Dates - AUTO-FILL
      CHECKIN_DATE: charter.startDate || '',
      CHECKOUT_DATE: charter.endDate || '',
      DEPARTURE_PORT: charter.departure || 'ALIMOS MARINA',
      ARRIVAL_PORT: charter.arrival || 'ALIMOS MARINA',

      // Financial - AUTO-FILL
      NET_CHARTER_FEE: charterAmount.toFixed(2),
      VAT_AMOUNT: vatAmount.toFixed(2),
      TOTAL_CHARTER_PRICE: totalWithVat.toFixed(2),
      TOTAL_IN_WORDS: numberToWords(grossAmount),
      CHARTER_AMOUNT: charterAmount.toFixed(2),

      // Additional fields - AUTO-FILL from charter data + owner custom_fields
      PROFESSIONAL_LICENSE: '',
      AMEPA: '',
      CALL_SIGN: '',
      SECURITY_DEPOSIT: '',
      DAMAGE_WAIVER: '',
      APA_AMOUNT: charter.apa || charter.apaAmount || '',

      // Reference
      CHARTER_CODE: charter.charterCode || charter.code || charter.bookingCode || '',
      BOOKING_CODE: charter.code || ''
    };

    // Fill template placeholders from owner custom_fields
    if (ownerApiData?.custom_fields) {
      try {
        const cf = typeof ownerApiData.custom_fields === 'string'
          ? JSON.parse(ownerApiData.custom_fields)
          : ownerApiData.custom_fields;
        const cfMap: Record<string, string> = {
          'register_no': 'REGISTER_NUMBER',
          'professional_license': 'PROFESSIONAL_LICENSE',
          'amepa': 'AMEPA',
          'call_sign': 'CALL_SIGN',
          'security_deposit': 'SECURITY_DEPOSIT'
        };
        for (const [cfKey, placeholder] of Object.entries(cfMap)) {
          if (cf[cfKey] && !data[placeholder]) {
            data[placeholder] = cf[cfKey];
          }
        }
        // Fallback: if SECURITY_DEPOSIT still empty, try charter data
        if (!data['SECURITY_DEPOSIT']) {
          data['SECURITY_DEPOSIT'] = charter.securityDeposit || charter.deposit || '';
        }
      } catch (e) {
        console.log('Error parsing owner custom_fields:', e);
      }
    }

    console.log('📋 Step 4: Auto-fill data prepared:', data);

    // Generate document with docxtemplater
    console.log('📄 Step 5: Creating PizZip...');
    const zip = new PizZip(templateBuffer);
    console.log('📄 Step 6: PizZip created successfully');

    console.log('📄 Step 7: Creating Docxtemplater...');
    // Phase 3: Setup image module for signatures
    const ImageModule = (await import('docxtemplater-image-module-free')).default;
    const imageOpts = {
      centered: false,
      getImage: (tagValue: any) => tagValue,
      getSize: () => [150, 50]
    };
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      nullGetter: () => ''
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
    // === SIG_INJECT_MARKER: server-side signature injection ===
    let finalBlob = blob;
    try {
      const sig = onlineData?.signature || '';
      if (sig && blob && blob.size > 0) {
        console.log('Injecting signature via server...');
        const fd = new FormData();
        fd.append('docx', blob, 'input.docx');
        fd.append('charterer_signature', sig);
        fd.append('filename', filename);
        const resp = await fetch('/api/inject-signature.php', { method: 'POST', body: fd });
        if (resp.ok) {
          const signedBlob = await resp.blob();
          if (signedBlob && signedBlob.size > 5000) {
            finalBlob = signedBlob;
            console.log('Signature injected, size:', signedBlob.size);
          }
        } else {
          console.warn('Inject endpoint HTTP:', resp.status);
        }
      }
    } catch (sigErr) {
      console.error('Signature injection failed (non-fatal):', sigErr);
    }
    saveAs(finalBlob, filename);

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


  // === EXACT COPY FROM FleetManagement - Crew List ===
const generateCrewList = async (charter, boat, boatDetails?, showMessage?) => {
  console.log('👥 generateCrewList called');
  console.log('👥 charter:', JSON.stringify(charter, null, 2));
  console.log('👥 boat:', JSON.stringify(boat, null, 2));
  console.log('👥 boatDetails (from caller):', JSON.stringify(boatDetails, null, 2));

  try {
    // Step 1: Fetch vessel custom fields from API (don't rely on boatDetails arg - it's often empty)
    let cf: Record<string, string> = {};
    try {
      const vesselName = boat?.name || charter.vesselName || charter.boatName || '';
      const ownerResponse = await fetch(`https://yachtmanagementsuite.com/api/vessel-owners.php?vessel_name=${encodeURIComponent(vesselName)}`);
      if (ownerResponse.ok) {
        const ownerResult = await ownerResponse.json();
        const ownerData = ownerResult?.data || ownerResult;
        cf = typeof ownerData?.custom_fields === 'string'
          ? JSON.parse(ownerData.custom_fields)
          : (ownerData?.custom_fields || {});
        console.log('👥 Vessel custom_fields from API:', JSON.stringify(cf, null, 2));
      }
    } catch (e) {
      console.warn('👥 Could not fetch vessel data from API:', e);
    }

    console.log('📄 Fetching Crew List template...');

    // Load template from public folder
    const templateUrl = `/templates/CrewList2026.docx?t=${Date.now()}`;
    console.log('📄 Template URL:', templateUrl);

    const response = await fetch(templateUrl, { cache: 'no-store' });
    console.log('📄 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('❌ Template not found at:', templateUrl);
      alert(`❌ Template file not found!\n\nPlease place the template at:\npublic/templates/Crew-List.docx`);
      return;
    }

    const templateBuffer = await response.arrayBuffer();
    console.log('📄 Template loaded, size:', templateBuffer.byteLength, 'bytes');

    // Passengers array — try all possible field names on charter
    const crewMembers: any[] = charter.crewMembers || charter.passengers || charter.crew || charter.crewList || [];
    console.log('👥 Passengers found:', crewMembers.length, crewMembers);

    // Format dates helper
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        // Already formatted dd/mm/yyyy — return as-is
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('en-GB');
      } catch {
        return dateStr || '';
      }
    };

    // Safe passenger field getter — never returns undefined/null
    const pax = (idx: number): any => crewMembers[idx] || {};
    const paxName = (p: any): string =>
      (p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '');
    const paxStr = (v: any): string => (v == null ? '' : String(v));

    // -------------------------------------------------------
    // Skipper data (from charter fields — check both top-level
    // and charter.bookingData which some saves use)
    // -------------------------------------------------------
    const bd: any = charter.bookingData || {};
    // === CREW_SIG_INJECT_MARKER: server-side skipper signature injection ===
    // Load onlineData for signatures (same as generateCharterParty)
    let onlineData: any = null;
    try {
      const bookingCode = charter.charterCode || charter.code || charter.bookingCode || '';
      if (bookingCode) {
        const { loadChartererData } = await import('./services/apiService');
        onlineData = await loadChartererData(bookingCode);
          try {
            const invR = await fetch('/api/crew-invitations.php?action=list&booking_number=' + encodeURIComponent(bookingCode));
            const invJ = await invR.json();
            if (invJ && invJ.success && Array.isArray(invJ.data)) {
              const skInv = invJ.data.find((x) => x.role === 'skipper' && x.status === 'submitted');
              if (skInv) {
                onlineData = onlineData || {};
                const fn = skInv.submitted_first_name || '';
                const ln = skInv.submitted_last_name || '';
                if (!onlineData.skipperName) onlineData.skipperName = (fn + ' ' + ln).trim();
                if (!onlineData.skipperFirstName) onlineData.skipperFirstName = fn;
                if (!onlineData.skipperLastName) onlineData.skipperLastName = ln;
                if (!onlineData.skipperPassport) onlineData.skipperPassport = skInv.submitted_passport || '';
                if (!onlineData.skipperPhone) onlineData.skipperPhone = skInv.submitted_phone || '';
                if (!onlineData.skipperEmail) onlineData.skipperEmail = skInv.submitted_email || skInv.invite_email || '';
                if (!onlineData.skipperAddress) onlineData.skipperAddress = skInv.submitted_address || '';
                if (!onlineData.skipperNationality) onlineData.skipperNationality = skInv.submitted_nationality || '';
                if (!onlineData.skipperDob) onlineData.skipperDob = skInv.submitted_date_of_birth || '';
                onlineData.skipperSignature = skInv.signature_data || onlineData.skipperSignature || '';
              }
              // Merge submitted crew invitations into charter.crewMembers
              const crewInvs = invJ.data.filter((x) => x.status === 'submitted' && x.role !== 'skipper');
              if (crewInvs.length > 0) {
                (charter as any).crewMembers = (charter as any).crewMembers || [];
                const byPass = new Map();
                ((charter as any).crewMembers).forEach((m) => { if (m.passport) byPass.set(m.passport, m); });
                crewInvs.forEach((ci) => {
                  const passport = ci.submitted_passport || '';
                  byPass.set(passport || ('__' + ci.token), {
                    name: ((ci.submitted_first_name || '') + ' ' + (ci.submitted_last_name || '')).trim(),
                    firstName: ci.submitted_first_name || '',
                    lastName: ci.submitted_last_name || '',
                    passport: passport,
                    dateOfBirth: ci.submitted_date_of_birth || '',
                    nationality: ci.submitted_nationality || '',
                    email: ci.submitted_email || ci.invite_email || '',
                    phone: ci.submitted_phone || '',
                    address: ci.submitted_address || '',
                    role: ci.role || 'crew',
                    signature: ci.signature_data || '',
                    fromInvitation: true,
                  });
                });
                (charter as any).crewMembers = Array.from(byPass.values());
              }
            }
          } catch (eInv) { console.log('invitation enrich skipped', eInv); }
        console.log('Online charterer data loaded (crew list):', onlineData);
      }
    } catch (olErr) {
      console.log('No online data available for crew list:', olErr);
    }

    const skipperFirstName = onlineData?.skipperFirstName || chartererData?.skipperFirstName || charter.skipperFirstName || bd.skipperFirstName || '';
    const skipperLastName  = onlineData?.skipperLastName || chartererData?.skipperLastName || charter.skipperLastName  || bd.skipperLastName  || '';
    const skipperName = skipperFirstName && skipperLastName
      ? `${skipperFirstName} ${skipperLastName}`
      : charter.skipperName || bd.skipperName || charter.clientName || '';
    const skipperPhone       = onlineData?.skipperPhone || chartererData?.skipperPhone || charter.skipperPhone       || bd.skipperPhone       || '';
    const skipperEmail       = onlineData?.skipperEmail || chartererData?.skipperEmail || charter.skipperEmail       || bd.skipperEmail       || '';
    const skipperPassport    = onlineData?.skipperPassport || chartererData?.skipperPassport || charter.skipperPassport    || bd.skipperPassport    || '';
    const skipperNationality = onlineData?.skipperNationality || chartererData?.skipperNationality || charter.skipperNationality || bd.skipperNationality || '';
    const skipperGender      = charter.skipperGender      || bd.skipperGender      || '';
    const skipperDob         = formatDate(onlineData?.skipperDob || chartererData?.skipperDob || charter.skipperDob || charter.skipperDateOfBirth || bd.skipperDob || bd.skipperDateOfBirth || '');

    console.log('👥 Skipper resolved:', { skipperName, skipperPhone, skipperEmail, skipperPassport, skipperNationality, skipperGender, skipperDob });

    // -------------------------------------------------------
    // Vessel / registration fields
    // cf = custom_fields from API (keys: register_no, call_sign, professional_license)
    // -------------------------------------------------------
    const charterPartyNoFull = charter.code || charter.charterCode || charter.bookingCode || charter.bookingNumber || ''; const charterPartyNo = charterPartyNoFull.replace(/CHARTER PARTY N[O0]s*/i, '').replace(/CHARER PARTY N[O0]s*/i, '').replace(/CHARTER PART N[O0]s*/i, '').trim();
    const registrationNumber = cf['register_no']         || boatDetails?.['Register No / Αριθμός Νηολογίου'] || '';
    const callSign           = cf['call_sign']            || boatDetails?.['CALL SIGN']                        || '';
    const eMitroo            = cf['professional_license'] || boatDetails?.['Αριθμ. Πρωτ. Αδείας Επαγγελματικού Πλοίου Αναψυχής / E-μητρώο'] || '';
    const flag               = cf['flag']                 || boatDetails?.['Flag']                             || 'Greek';
    const registryPort       = cf['port_of_registry']     || boatDetails?.['Port of Registry']                 || 'Piraeus';

    console.log('👥 Vessel fields resolved:', { charterPartyNo, registrationNumber, callSign, eMitroo, flag, registryPort });

    // -------------------------------------------------------
    // Build the data object — only keys that exist as
    // {{placeholders}} in CrewList2026.docx are included.
    //
    // Template structure:
    //   CREW1 row = Skipper
    //   CREW2–CREW12 rows = Passengers 1–11
    //   Footer: SKIPPER_NAME (×3), SKIPPER_MOBILE, CHARTERER_MOBILE
    //   No ARRIVAL_TIME placeholder exists (it is static text).
    // -------------------------------------------------------
    const data: Record<string, string> = {
      // Header / vessel block
      CHARTER_PARTY_NO:    charterPartyNo,
      YACHT_NAME:          boat?.name || charter.vesselName || charter.boatName || '',
      YACHT_TYPE:          boat?.type || cf['yacht_type'] || '',
      FLAG:                flag,
      REGISTRY_PORT:       registryPort,
      REGISTRATION_NUMBER: registrationNumber,
      CALL_SIGN:           callSign,
      E_MITROO:            eMitroo,

      // Dates
      EMBARKATION_DATE:     formatDate(charter.startDate  || ''),
      EMBARKATION_PLACE:    charter.departure || 'ALIMOS MARINA',
      DISEMBARKATION_DATE:  formatDate(charter.endDate    || ''),
      DISEMBARKATION_PLACE: charter.arrival   || 'ALIMOS MARINA',

      // Footer skipper block (only these 3 placeholders exist in the template)
      SKIPPER_NAME:     skipperName,
      SKIPPER_MOBILE:   skipperPhone,
      CHARTERER_MOBILE: skipperPhone,

      // ---- CREW1 = Skipper row ----
      CREW1_NAME:        skipperName,
      CREW1_DOB:         skipperDob,
      CREW1_PASSPORT:    skipperPassport,
      CREW1_GENDER:      skipperGender,
      CREW1_NATIONALITY: skipperNationality,
      CREW1_PHONE:       skipperPhone,
      CREW1_EMAIL:       skipperEmail,

      // ---- CREW2–CREW12 = Passengers 1–11 (crewMembers[0]–[10]) ----
      CREW2_NAME:        paxStr(paxName(pax(0))),
      CREW2_DOB:         formatDate(paxStr(pax(0).dateOfBirth)),
      CREW2_PASSPORT:    paxStr(pax(0).passport),
      CREW2_GENDER:      paxStr(pax(0).gender),
      CREW2_NATIONALITY: paxStr(pax(0).nationality),
      CREW2_PHONE:       paxStr(pax(0).phone),
      CREW2_EMAIL:       paxStr(pax(0).email),

      CREW3_NAME:        paxStr(paxName(pax(1))),
      CREW3_DOB:         formatDate(paxStr(pax(1).dateOfBirth)),
      CREW3_PASSPORT:    paxStr(pax(1).passport),
      CREW3_GENDER:      paxStr(pax(1).gender),
      CREW3_NATIONALITY: paxStr(pax(1).nationality),
      CREW3_PHONE:       paxStr(pax(1).phone),
      CREW3_EMAIL:       paxStr(pax(1).email),

      CREW4_NAME:        paxStr(paxName(pax(2))),
      CREW4_DOB:         formatDate(paxStr(pax(2).dateOfBirth)),
      CREW4_PASSPORT:    paxStr(pax(2).passport),
      CREW4_GENDER:      paxStr(pax(2).gender),
      CREW4_NATIONALITY: paxStr(pax(2).nationality),
      CREW4_PHONE:       paxStr(pax(2).phone),
      CREW4_EMAIL:       paxStr(pax(2).email),

      CREW5_NAME:        paxStr(paxName(pax(3))),
      CREW5_DOB:         formatDate(paxStr(pax(3).dateOfBirth)),
      CREW5_PASSPORT:    paxStr(pax(3).passport),
      CREW5_GENDER:      paxStr(pax(3).gender),
      CREW5_NATIONALITY: paxStr(pax(3).nationality),
      CREW5_PHONE:       paxStr(pax(3).phone),
      CREW5_EMAIL:       paxStr(pax(3).email),

      CREW6_NAME:        paxStr(paxName(pax(4))),
      CREW6_DOB:         formatDate(paxStr(pax(4).dateOfBirth)),
      CREW6_PASSPORT:    paxStr(pax(4).passport),
      CREW6_GENDER:      paxStr(pax(4).gender),
      CREW6_NATIONALITY: paxStr(pax(4).nationality),
      CREW6_PHONE:       paxStr(pax(4).phone),
      CREW6_EMAIL:       paxStr(pax(4).email),

      CREW7_NAME:        paxStr(paxName(pax(5))),
      CREW7_DOB:         formatDate(paxStr(pax(5).dateOfBirth)),
      CREW7_PASSPORT:    paxStr(pax(5).passport),
      CREW7_GENDER:      paxStr(pax(5).gender),
      CREW7_NATIONALITY: paxStr(pax(5).nationality),
      CREW7_PHONE:       paxStr(pax(5).phone),
      CREW7_EMAIL:       paxStr(pax(5).email),

      CREW8_NAME:        paxStr(paxName(pax(6))),
      CREW8_DOB:         formatDate(paxStr(pax(6).dateOfBirth)),
      CREW8_PASSPORT:    paxStr(pax(6).passport),
      CREW8_GENDER:      paxStr(pax(6).gender),
      CREW8_NATIONALITY: paxStr(pax(6).nationality),
      CREW8_PHONE:       paxStr(pax(6).phone),
      CREW8_EMAIL:       paxStr(pax(6).email),

      CREW9_NAME:        paxStr(paxName(pax(7))),
      CREW9_DOB:         formatDate(paxStr(pax(7).dateOfBirth)),
      CREW9_PASSPORT:    paxStr(pax(7).passport),
      CREW9_GENDER:      paxStr(pax(7).gender),
      CREW9_NATIONALITY: paxStr(pax(7).nationality),
      CREW9_PHONE:       paxStr(pax(7).phone),
      CREW9_EMAIL:       paxStr(pax(7).email),

      CREW10_NAME:        paxStr(paxName(pax(8))),
      CREW10_DOB:         formatDate(paxStr(pax(8).dateOfBirth)),
      CREW10_PASSPORT:    paxStr(pax(8).passport),
      CREW10_GENDER:      paxStr(pax(8).gender),
      CREW10_NATIONALITY: paxStr(pax(8).nationality),
      CREW10_PHONE:       paxStr(pax(8).phone),
      CREW10_EMAIL:       paxStr(pax(8).email),

      CREW11_NAME:        paxStr(paxName(pax(9))),
      CREW11_DOB:         formatDate(paxStr(pax(9).dateOfBirth)),
      CREW11_PASSPORT:    paxStr(pax(9).passport),
      CREW11_GENDER:      paxStr(pax(9).gender),
      CREW11_NATIONALITY: paxStr(pax(9).nationality),
      CREW11_PHONE:       paxStr(pax(9).phone),
      CREW11_EMAIL:       paxStr(pax(9).email),

      CREW12_NAME:        paxStr(paxName(pax(10))),
      CREW12_DOB:         formatDate(paxStr(pax(10).dateOfBirth)),
      CREW12_PASSPORT:    paxStr(pax(10).passport),
      CREW12_GENDER:      paxStr(pax(10).gender),
      CREW12_NATIONALITY: paxStr(pax(10).nationality),
      CREW12_PHONE:       paxStr(pax(10).phone),
      CREW12_EMAIL:       paxStr(pax(10).email),
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
      delimiters: { start: '{{', end: '}}' },
      nullGetter: () => ''
    });
    console.log('📄 Step 8: Docxtemplater created successfully');

    // Render with data
    console.log('📄 Step 9: Rendering document...');
    doc.render(data);
    console.log('📄 Step 10: Document rendered successfully');

    // -------------------------------------------------------
    // Post-render: inject arrival time into static text.
    // The template has NO {{ARRIVAL_TIME}} placeholder — the
    // line reads "Arrival time in the marina: ___________".
    // We replace the underscores with the actual time value.
    // -------------------------------------------------------
    const arrivalTime: string = charter.startTime || charter.checkInTime
      || (charter.bookingData as any)?.startTime
      || (charter.bookingData as any)?.checkInTime
      || (charter.bookingData as any)?.checkInHour
      || '';
    console.log('👥 arrivalTime for injection:', arrivalTime,
      { startTime: charter.startTime, checkInTime: charter.checkInTime,
        bdStartTime: (charter.bookingData as any)?.startTime,
        bdCheckInTime: (charter.bookingData as any)?.checkInTime,
        bdCheckInHour: (charter.bookingData as any)?.checkInHour });

    const renderedZip = doc.getZip();
    if (arrivalTime) {
      const xmlFile = 'word/document.xml';
      let xml: string = renderedZip.files[xmlFile].asText();
      // Replace the underscore placeholder that follows "marina: "
      xml = xml.replace(/Arrival time in the marina:\s*_{3,}/g,
        `Arrival time in the marina: ${arrivalTime}`);
      renderedZip.file(xmlFile, xml);
      console.log('👥 Arrival time injected:', arrivalTime);
    }

    // Generate blob
    console.log('📄 Step 11: Generating blob...');
    const blob = renderedZip.generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    console.log('📄 Step 12: Blob generated, size:', blob.size, 'bytes');

    // Download file
    const filename = `Crew-List-${charter.code || 'document'}.docx`;
    console.log('📄 Step 13: Saving file as:', filename);
    let finalBlob = blob;
    try {
      const skipperSig = onlineData?.skipperSignature || '';
      const chartererSig = onlineData?.signature || '';
      const isAlsoSkipper = onlineData?.isAlsoSkipper === true;
      const sigToUse = skipperSig || (isAlsoSkipper ? chartererSig : '');
      if (sigToUse && blob && blob.size > 0) {
        console.log('Injecting skipper signature via server (crew_list)...');
        const fd = new FormData();
        fd.append('docx', blob, 'input.docx');
        fd.append('skipper_signature', sigToUse);
        fd.append('charterer_signature', chartererSig);
        fd.append('filename', filename);
        fd.append('mode', 'crew_list');
        const resp = await fetch('/api/inject-signature.php', { method: 'POST', body: fd });
        if (resp.ok) {
          const signedBlob = await resp.blob();
          if (signedBlob && signedBlob.size > 5000) {
            finalBlob = signedBlob;
            console.log('Skipper signature injected, size:', signedBlob.size);
          }
        } else {
          console.warn('Inject endpoint HTTP:', resp.status);
        }
      }
    } catch (sigErr) {
      console.error('Crew skipper signature injection failed (non-fatal):', sigErr);
    }
    saveAs(finalBlob, filename);

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



  // === Handlers for CharterAgreementPage ===
  const handleDownloadCharterParty = async () => {
    if (!bookingData) {
      alert(t.ca_alertNoBookingExcl);
      return;
    }
    // Check if online form has been submitted (signature required)
    if (!chartererData?.signature) {
      alert(t.ca_alertCompleteForm);
      return;
    }
    const charter = bookingData;
    const vesselTypes: any = {'Bob':'Catamaran','Perla':'Catamaran','Infinity':'Catamaran','Maria 1':'Monohull','Maria 2':'Monohull','Bar Bar':'Monohull','Kalispera':'Monohull','Valesia':'Monohull'};
    let boatType = vesselTypes[bookingData.vesselName] || '';
    try {
      const vRes = await fetch('https://yachtmanagementsuite.com/api/vessel-owners.php');
      if (vRes.ok) {
        const vessels = await vRes.json();
        const found = vessels.find((v: any) => v.vessel_name === bookingData.vesselName);
        if (found) boatType = found.vessel_type || '';
      }
    } catch(e) { console.log('Could not fetch vessels:', e); }
    const boat = { name: bookingData.vesselName, id: bookingData.vesselId, type: boatType };
    generateCharterParty(charter, boat);
  };

  const handleDownloadCrewList = () => {
    if (!bookingData) {
      alert(t.ca_alertNoBookingExcl);
      return;
    }
    const charter = bookingData;
    const vTypes: any = {'Bob':'Catamaran','Perla':'Catamaran','Infinity':'Catamaran','Maria 1':'Monohull','Maria 2':'Monohull','Bar Bar':'Monohull','Kalispera':'Monohull','Valesia':'Monohull'};
    const boat = { name: bookingData.vesselName, id: bookingData.vesselId, type: vTypes[bookingData.vesselName] || '' };
    const boatDetails = {};
    generateCrewList(charter, boat, boatDetails);
  };

  const handleSkipperLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!skipperLicense) { setSkipperLicense(dataUrl); } else { setExtraLicenses(prev => [...prev, dataUrl]); }
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

  const handleCharterPartyScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCharterPartyScan(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCrewListScanUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCrewListScan(event.target?.result as string);
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
      alert(t.ca_alertNoBookingExcl);
      return;
if (!skipperLicense) {
      // Check if already in archive before blocking
      try {
        const checkResp = await fetch('/api/charter-archive.php?booking_number=' + encodeURIComponent(bookingData.bookingCode));
        if (checkResp.ok) {
          const checkData = await checkResp.json();
          const existingDocs = checkData?.data?.documents || {};
          if (existingDocs.skipperLicense && existingDocs.skipperLicense.length > 0) {
            console.log('Skipper license found in archive, continuing...');
          } else {
            alert(t.ca_alertUploadLicense);
            return;
          }
        } else {
          alert(t.ca_alertUploadLicense);
          return;
        }
      } catch (e) {
        alert(t.ca_alertUploadLicense);
        return;
      }
    }

    }

    if (showCrewForm && crewMembers.some(m => !m.name || !m.passport)) {
      alert(t.ca_alertFillCrewAll);
      return;
    }

    // Validate charterer (only if the charterer form is open and filled)
    if (showChartererForm) {
      const c = chartererData;
      const missing = [];
      if (!c.firstName) missing.push(t.ca_firstName);
      if (!c.lastName) missing.push(t.ca_lastName);
      if (!c.address) missing.push(t.ca_address);
      if (!c.idNumber) missing.push(t.ca_idOrPassportNum);
      if (!c.tel) missing.push(t.ca_phoneShort);
      if (!c.email) missing.push(t.ca_emailLabel);
      if (!c.signature) missing.push(t.ca_chartererSignature);
      const hasSkipperInv = invitations.some((i: any) => i.role === 'skipper');
      if (!c.isAlsoSkipper && !hasSkipperInv) {
        if (!c.skipperName) missing.push(t.ca_skipperNameLabel);
        if (!c.skipperSignature) missing.push(t.ca_skipperSignature);
      }
      if (missing.length > 0) {
        alert((t.ca_alertFillFieldsMulti) + missing.join('\n- '));
        return;
      }
    }

    const pendingInv = invitations.filter((i: any) => i.status === 'pending');
    if (pendingInv.length > 0) {
      const names = pendingInv.map((i: any) => (i.invite_first_name || i.invite_email)).join(', ');
      const proceed = window.confirm('Awaiting crew/skipper completion from: ' + names + '. Continue and submit without these?');
      if (!proceed) return;
    }
    const bookingCode = bookingData.bookingCode;
    const crewToSave = showCrewForm ? crewMembers : [];

    try {
      // Save crew members to API (API is source of truth - no localStorage)
      if (crewToSave.length > 0) {
        console.log('👥 Saving crew to API...', { bookingCode, crewMembers: crewToSave });
        await updateCharterCrew(bookingCode, crewToSave);
      }

      // Save charterer data with legal timestamps
      if (showChartererForm && chartererData.firstName) {
        const now = new Date().toISOString();
        const chartererToSave = {
          ...chartererData,
          submittedAt: chartererData.submittedAt || now,
          lastModifiedAt: now,
          submittedUserAgent: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '',
          isLocked: true
        };
        console.log('📋 Saving charterer data to API...', { bookingCode });
        await saveChartererData(bookingCode, chartererToSave);
        setChartererData(chartererToSave);

        // SAVE_BACK_TO_BOOKING_MARKER
        try {
          console.log('🔄 Syncing charterer data back to bookings table...');
          await updateCharterCrew(bookingCode, { chartererData: chartererToSave } as any);
          console.log('✅ Bookings table synced with charterer data');
        } catch (syncErr) {
          console.log('⚠️ Bookings sync failed (charter_archives save succeeded):', syncErr);
        }
      }

      alert(t.ca_submitSuccess);

      // Save uploaded documents to Charter Archive
      const today = new Date().toLocaleDateString('el-GR');
      const documents: any = {};
      if (skipperLicense) {
        documents.skipperLicense = [{ name: 'Skipper License', dataUrl: skipperLicense, uploadDate: today }];
        extraLicenses.forEach((lic, i) => documents.skipperLicense.push({ name: 'Skipper License ' + (i+2), dataUrl: lic, uploadDate: today }));
      }
      if (charterPartyScan) {
        documents.charterAgreement = [{ name: 'Charter Party Scan', dataUrl: charterPartyScan, uploadDate: today }];
      }
      if (crewListScan) {
        documents.crewList = [{ name: 'Crew List Scan', dataUrl: crewListScan, uploadDate: today }];
      }
    if (Object.keys(documents).length > 0) {
      // Fetch existing docs and merge with new ones
      let mergedDocs = { ...documents };
      try {
        const existResp = await fetch('/api/charter-archive.php?booking_number=' + encodeURIComponent(bookingCode));
        if (existResp.ok) {
          const existData = await existResp.json();
          const existingDocs = existData?.data?.documents || {};
          mergedDocs = { ...existingDocs, ...documents };
          console.log('Merged docs:', mergedDocs);
        }
      } catch (e) { console.log('No existing archive to merge'); }

      console.log('\ud83d\udcc1 Saving merged documents to archive...', { bookingCode, mergedDocs });
      await fetch('/api/charter-archive.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_number: bookingCode, archive_data: { documents: mergedDocs } })
      });
    }

    // Send notification emails
      try {
        const docsUploaded = [];
        if (skipperLicense || extraLicenses.length > 0) docsUploaded.push('Skipper License (' + (1 + extraLicenses.length) + ')');
        if (charterPartyScan) docsUploaded.push('Charter Party Scan');
        if (crewListScan) docsUploaded.push('Crew List Scan');
        const hasOnlineCrew = crewToSave.length > 0;
        const vesselName = bookingData?.vesselName || '';
        const clientName = ((bookingData?.chartererFirstName || '') + ' ' + (bookingData?.chartererLastName || '')).trim() || bookingData?.chartererName || bookingData?.clientName || '';
        const startDate = bookingData?.startDate || '';
        const endDate = bookingData?.endDate || '';
        const clientEmail = bookingData?.chartererEmail || bookingData?.skipperEmail || '';

        const crewTable = hasOnlineCrew ? '<h3>Online Crew List (' + crewToSave.length + ' members):</h3><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%"><tr style="background:#1e40af;color:white"><th>Name</th><th>Passport</th><th>DOB</th><th>Nationality</th><th>Email</th><th>Phone</th></tr>' + crewToSave.map((m: any) => '<tr><td>' + (m.name||'') + '</td><td>' + (m.passport||'') + '</td><td>' + (m.dateOfBirth||'') + '</td><td>' + (m.nationality||'') + '</td><td>' + (m.email||'') + '</td><td>' + (m.phone||'') + '</td></tr>').join('') + '</table>' : '';
        const docsListHtml = docsUploaded.map(d => '<li style="color:#16a34a;padding:4px 0">\u2705 ' + d + '</li>').join('');

        // EMAIL 1: Admin notification
        const adminHtml = '<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto"><div style="background:#1e40af;color:white;padding:20px;border-radius:8px 8px 0 0;text-align:center"><h1>\u2693 Charter Agreement Submitted</h1></div><div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0"><h2>' + bookingCode + '</h2><p><strong>Vessel:</strong> ' + vesselName + '</p><p><strong>Client:</strong> ' + clientName + '</p><p><strong>Client Email:</strong> ' + clientEmail + '</p><p><strong>Dates:</strong> ' + startDate + ' - ' + endDate + '</p><hr style="margin:15px 0"><h3>Documents Uploaded:</h3>' + (docsUploaded.length > 0 ? '<ul style="list-style:none;padding:0">' + docsListHtml + '</ul>' : '<p style="color:#dc2626">\u274c No documents uploaded</p>') + (hasOnlineCrew ? '<p style="color:#16a34a">\u2705 Online Crew List (' + crewToSave.length + ' members)</p>' : '') + crewTable + '<hr style="margin:15px 0"><p style="color:#64748b;font-size:12px">Submitted: ' + new Date().toLocaleString('el-GR') + '</p></div></div>';

        await fetch('https://yachtmanagementsuite.com/email/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'charter@tailwindyachting.com', subject: '\u2693 Charter Submitted - ' + bookingCode + ' - ' + vesselName, html: adminHtml })
        });

        // EMAIL 2: Client confirmation
        if (clientEmail) {
          const clientHtml = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#0ea5e9,#1e40af);color:white;padding:30px;border-radius:12px 12px 0 0;text-align:center"><div style="font-size:40px">\u26f5</div><h1 style="margin:10px 0">Tailwind Yachting</h1></div><div style="padding:25px;background:white;border:1px solid #e2e8f0"><p style="font-size:16px">Dear <strong>' + clientName + '</strong>,</p><p>Thank you for submitting your charter documents for <strong>' + vesselName + '</strong> - <strong>' + bookingCode + '</strong>.</p><table style="width:100%;margin:15px 0;background:#f0f9ff;border-radius:8px;padding:15px"><tr><td><p><strong>Check-in:</strong> ' + startDate + '</p><p><strong>Check-out:</strong> ' + endDate + '</p></td></tr></table><h3>Documents received:</h3><ul style="list-style:none;padding:0">' + docsListHtml + (hasOnlineCrew ? '<li style="color:#16a34a;padding:4px 0">\u2705 Online Crew List (' + crewToSave.length + ' members)</li>' : '') + '</ul><p>We will review your documents and contact you if anything is needed.</p><div style="background:#f0f9ff;border-radius:8px;padding:15px;margin:20px 0"><p><strong>Meeting Point:</strong> Marina Alimos - Charter Village Box A47</p><p><strong>Contact:</strong> Ms Maria Mazaraki (+30 6978196009)</p></div><p style="font-size:16px;text-align:center;margin-top:20px">We look forward to welcoming you aboard! \u26f5</p></div><div style="background:#1e293b;color:white;padding:15px;border-radius:0 0 12px 12px;text-align:center;font-size:12px"><p>Tailwind Yachting | Marina Alimos, Greece</p></div></div>';

          await fetch('https://yachtmanagementsuite.com/email/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: clientEmail, subject: '\u26f5 Tailwind Yachting - Documents Received', html: clientHtml })
          });
        }
      } catch(emailErr) { console.log('Email send failed:', emailErr); }

    navigate('/');
    } catch (error) {
      console.error('❌ Error saving charter agreement data:', error);
      alert(t.ca_errorSaving);
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
                {t.ca_title}
              </h1>
              {bookingData && (
                <>
                  <p className="text-sm text-gray-600">
                    {t.ca_booking}: <span className="font-bold text-blue-600">{bookingData.bookingCode}</span>
                  </p>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-400">
                      {t.ca_lastUpdated}: {lastUpdated.toLocaleTimeString()}
                    </p>
                    {isRefreshing && (
                      <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full animate-pulse">
                        🔄 {t.ca_updating}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowLangPopup(!showLangPopup)}
              className="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg font-semibold text-blue-900 transition-colors flex items-center gap-2"
            >
              <img src={flagImg(LANG_MAP.find((l: any) => l.code === language)?.country || 'GB')} alt="" style={{ width: '24px', height: '18px' }} />
              {language.toUpperCase()}
            </button>
            {showLangPopup && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowLangPopup(false)}>
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={(e) => e.stopPropagation()}>
                  <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', color: '#1e293b' }}>{t.ca_selectLanguage}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {LANG_MAP.map(({ code, country, label }: any) => (
                      <button key={code} onClick={() => { setLanguage(code); setShowLangPopup(false); }} style={{ padding: '12px 8px', borderRadius: '10px', border: 'none', background: language === code ? 'linear-gradient(135deg, #0c4a6e, #0ea5e9)' : '#f1f5f9', color: language === code ? 'white' : '#334155', fontSize: '15px', fontWeight: language === code ? 700 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <img src={flagImg(country)} alt="" style={{ width: '24px', height: '18px', borderRadius: '2px' }} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {!bookingData ? (
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {t.ca_noBookingFound}
          </h2>
          <p className="text-gray-600 mb-6">
            {t.ca_alertEnterCode}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {('🏠 ' + t.ca_backToHome)}
          </button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-2xl">🎫</span>
                  {t.ca_boardingPass}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t.ca_boardingPassDesc2}
                </p>
              </div>
              <button
                onClick={() => handleDownloadBoardingPass(false)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
              >
                📥 {t.ca_download}
              </button>
            </div>
            <button
              onClick={handlePreviewBoardingPass}
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-semibold hover:from-teal-700 hover:to-teal-800 transition-all shadow-md"
            >
              👁 {t.ca_preview}
            </button>
            <div className="text-sm text-gray-500 border-t pt-3">
              <p>✅ {t.ca_meetingLocation}</p>
              <p>✅ {t.ca_contact}</p>
            </div>
          </div>

          
          {/* Charter Party & Crew List Downloads */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-2">
              <span className="text-2xl">📋</span>
              {t.ca_documents}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {t.ca_charterDocsDesc}
            </p>
            <button
              onClick={handleDownloadCharterParty}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg mb-2 flex items-center justify-center border border-indigo-500 transition-all shadow-md"
            >
              <span className="ml-2">📄 {t.ca_charterPartyDocx}</span>
            </button>
            <p className="text-xs text-gray-400 mb-4 text-center">
              {t.ca_charterAgreementDesc}
            </p>
            <button
              onClick={handleDownloadCrewList}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg mb-2 flex items-center justify-center border border-green-500 transition-all shadow-md"
            >
              <span className="ml-2">👥 {t.ca_crewListDocx}</span>
            </button>
            <p className="text-xs text-gray-400 text-center">
              {t.ca_crewListOfficialDesc}
            </p>
          </div>

<div className="bg-white rounded-2xl p-6 shadow-lg">
            {/* 🔥 Financial Summary Section */}
            {bookingData.charterAmount && (
              <div className="mt-4 bg-gradient-to-br from-slate-800 to-gray-900 rounded-xl p-6 text-white">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  {t.ca_financialSummary}
                </h3>

                <div className="space-y-3">
                  {/* Charter Amount (NET) - amount entered is GROSS, NET = gross / 1.12 */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-blue-300 font-semibold">
                      {t.ca_charterAmountNet}
                    </span>
                    <span className="text-blue-300 font-bold text-lg">
                      {(parseFloat(bookingData.charterAmount) / 1.12).toFixed(2)}€
                    </span>
                  </div>

                  {/* VAT on Charter (12%) - VAT = gross - NET */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-600">
                    <span className="text-blue-300 font-medium">
                      {t.ca_vat12}
                    </span>
                    <span className="text-blue-300 font-bold">
                      +{(parseFloat(bookingData.charterAmount) - parseFloat(bookingData.charterAmount) / 1.12).toFixed(2)}€
                    </span>
                  </div>

                  {/* Total Amount - Total = gross (the amount entered by user) */}
                  <div className="flex justify-between items-center pt-2 pb-2 border-b-2 border-teal-500">
                    <span className="text-teal-300 font-bold text-lg">
                      {t.ca_totalWithVat}
                    </span>
                    <span className="text-teal-300 font-bold text-2xl">
                      {parseFloat(bookingData.charterAmount).toFixed(2)}€
                    </span>
                  </div>

                  {/* Deposit Required */}
                  <div className="flex justify-between items-center pt-2 bg-yellow-500/10 rounded-lg px-3 py-2">
                    <span className="text-yellow-300 font-bold">
                      {t.ca_depositRequired}
                    </span>
                    <span className="text-yellow-300 font-bold text-xl">
                      {parseFloat(bookingData.deposit).toFixed(2)}€
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-4 italic">
                  {t.ca_fiscalNote}
                </p>
              </div>
            )}

            <div className="text-sm text-gray-500 border-t pt-3 mt-4">
              <p>📄 {t.ca_pdfFormat}</p>
              <p>✍️ {t.ca_printSign}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span className="text-2xl">👥</span>
  {t.ca_charterParty}
          </h2>

          {/* 🔥 NEW: Charter Party Online Form */}
          <div className="space-y-4">
            <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {t.ca_fillCharterPartyOnline}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t.ca_fillLatinOnly}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChartererForm(!showChartererForm)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                    showChartererForm
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  }`}
                >
                  {showChartererForm
                    ? (('❌ ' + t.ca_close))
                    : (('✏️ ' + t.ca_fillNow))}
                </button>
              </div>

              {showChartererForm && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {chartererData.isLocked && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 mb-2">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">🔒</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-700 font-bold text-lg">
                              {t.ca_charterPartySubmitted}
                            </span>
                            <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                              {t.ca_legallyBinding}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700 space-y-0.5">
                            <div>
                              <span className="font-semibold">
                                {(t.ca_submittedBy + ' ')}
                              </span>
                              {chartererData.firstName} {chartererData.lastName}
                            </div>
                            {chartererData.submittedAt && (
                              <div>
                                <span className="font-semibold">
                                  {(t.ca_submittedOn + ' ')}
                                </span>
                                {new Date(chartererData.submittedAt).toLocaleString(language)}
                              </div>
                            )}
                            {chartererData.lastModifiedAt && chartererData.lastModifiedAt !== chartererData.submittedAt && (
                              <div>
                                <span className="font-semibold">
                                  {(t.ca_lastModified + ' ')}
                                </span>
                                {new Date(chartererData.lastModifiedAt).toLocaleString(language)}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-2 italic">
                            {t.ca_toModifyNote}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder={(t.ca_firstName + ' *')} value={chartererData.firstName} onChange={(e) => setChartererData(prev => ({ ...prev, firstName: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                    <input type="text" placeholder={(t.ca_lastName + ' *')} value={chartererData.lastName} onChange={(e) => setChartererData(prev => ({ ...prev, lastName: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <input type="text" placeholder={(t.ca_address + ' *')} value={chartererData.address} onChange={(e) => setChartererData(prev => ({ ...prev, address: e.target.value }))} readOnly={chartererData.isLocked} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  <div className="flex gap-4 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="idType" value="id" checked={chartererData.idType === 'id'} onChange={() => setChartererData(prev => ({ ...prev, idType: 'id' }))} />
                      <span>{t.ca_idCard}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="idType" value="passport" checked={chartererData.idType === 'passport'} onChange={() => setChartererData(prev => ({ ...prev, idType: 'passport' }))} />
                      <span>{t.ca_passport}</span>
                    </label>
                  </div>
                  <input type="text" placeholder={chartererData.idType === 'id' ? ((t.ca_idCardNumber + ' *')) : ((t.ca_passportNum + ' *'))} value={chartererData.idNumber} onChange={(e) => setChartererData(prev => ({ ...prev, idNumber: e.target.value }))} readOnly={chartererData.isLocked} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" placeholder={t.ca_taxNumberAfm} value={chartererData.taxNumber} onChange={(e) => setChartererData(prev => ({ ...prev, taxNumber: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                    <input type="text" placeholder={t.ca_taxOfficeDoy} value={chartererData.taxOffice} onChange={(e) => setChartererData(prev => ({ ...prev, taxOffice: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="tel" placeholder={(t.ca_phoneShort + ' *')} value={chartererData.tel} onChange={(e) => setChartererData(prev => ({ ...prev, tel: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                    <input type="email" placeholder={(t.ca_emailLabel + ' *')} value={chartererData.email} onChange={(e) => setChartererData(prev => ({ ...prev, email: e.target.value }))} readOnly={chartererData.isLocked} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input type="checkbox" checked={chartererData.isAlsoSkipper} onChange={(e) => setChartererData(prev => ({ ...prev, isAlsoSkipper: e.target.checked }))} disabled={chartererData.isLocked} className="w-5 h-5" />
                    <span className="font-semibold">{t.ca_iAmSkipper}</span>
                  </label>
                  <div>
                    <p className="font-semibold mb-2">{(t.ca_chartererSignature + ' *')}</p>
                    {chartererData.isLocked && chartererData.signature ? (
                      <div className="border-2 border-green-400 rounded-lg bg-white p-2">
                        <img src={chartererData.signature} alt="Charterer Signature" className="max-w-full max-h-40 mx-auto" />
                        <p className="text-xs text-green-700 text-center mt-1">
                          ✓ {t.ca_digitallySigned}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="border-2 border-gray-400 rounded-lg bg-white">
                          <canvas ref={chartererCanvasRef} width={600} height={150} className="w-full touch-none cursor-crosshair" onMouseDown={startDrawing(chartererCanvasRef, setIsDrawingCharterer)} onMouseMove={draw(chartererCanvasRef, isDrawingCharterer)} onMouseUp={stopDrawing(setIsDrawingCharterer, chartererCanvasRef, 'signature')} onMouseLeave={stopDrawing(setIsDrawingCharterer, chartererCanvasRef, 'signature')} onTouchStart={startDrawing(chartererCanvasRef, setIsDrawingCharterer)} onTouchMove={draw(chartererCanvasRef, isDrawingCharterer)} onTouchEnd={stopDrawing(setIsDrawingCharterer, chartererCanvasRef, 'signature')} />
                        </div>
                        <button type="button" onClick={clearCanvas(chartererCanvasRef, 'signature')} className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">{t.ca_clear}</button>
                      </>
                    )}
                  </div>
                  {!chartererData.isAlsoSkipper && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                      <p className="font-semibold text-blue-800">{t.ca_skipperDetailsDiff}</p>
                      <input type="text" placeholder={(t.ca_skipperFullName + ' *')} value={chartererData.skipperName} onChange={(e) => setChartererData(prev => ({ ...prev, skipperName: e.target.value }))} readOnly={chartererData.isLocked} className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none" />
                      <div>
                        <p className="font-semibold mb-2">{(t.ca_skipperSignature + ' *')}</p>
                        {chartererData.isLocked && chartererData.skipperSignature ? (
                          <div className="border-2 border-green-400 rounded-lg bg-white p-2">
                            <img src={chartererData.skipperSignature} alt="Skipper Signature" className="max-w-full max-h-40 mx-auto" />
                            <p className="text-xs text-green-700 text-center mt-1">
                              ✓ {t.ca_digitallySigned}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="border-2 border-gray-400 rounded-lg bg-white">
                              <canvas ref={skipperCanvasRef} width={600} height={150} className="w-full touch-none cursor-crosshair" onMouseDown={startDrawing(skipperCanvasRef, setIsDrawingSkipper)} onMouseMove={draw(skipperCanvasRef, isDrawingSkipper)} onMouseUp={stopDrawing(setIsDrawingSkipper, skipperCanvasRef, 'skipperSignature')} onMouseLeave={stopDrawing(setIsDrawingSkipper, skipperCanvasRef, 'skipperSignature')} onTouchStart={startDrawing(skipperCanvasRef, setIsDrawingSkipper)} onTouchMove={draw(skipperCanvasRef, isDrawingSkipper)} onTouchEnd={stopDrawing(setIsDrawingSkipper, skipperCanvasRef, 'skipperSignature')} />
                            </div>
                            <button type="button" onClick={clearCanvas(skipperCanvasRef, 'skipperSignature')} className="mt-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm">{t.ca_clear}</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase 6: Invite Crew/Skipper Section */}
        <div className='bg-white rounded-2xl p-6 shadow-lg'>
          <h2 className='text-xl font-bold text-gray-800 flex items-center gap-2 mb-4'>
            <span className='text-2xl'>📧</span>
            {t.ca_inviteTitle}
          </h2>
          <p className='text-sm text-gray-600 mb-4'>
            {t.ca_inviteDesc}
          </p>
          <div className='border-2 border-gray-200 rounded-lg p-4 mb-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-3'>
              <input type='text' placeholder='First Name' value={inviteForm.firstName}
                onChange={(e) => setInviteForm(p => ({ ...p, firstName: e.target.value }))}
                className='px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none' />
              <input type='text' placeholder='Last Name' value={inviteForm.lastName}
                onChange={(e) => setInviteForm(p => ({ ...p, lastName: e.target.value }))}
                className='px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none' />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mb-3'>
              <input type='email' placeholder='Email (required)' value={inviteForm.email}
                onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                className='px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none' />
              <select value={inviteForm.role} onChange={(e) => setInviteForm(p => ({ ...p, role: e.target.value }))}
                className='px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none'>
                <option value='crew'>Crew Member</option>
                <option value='skipper'>Skipper</option>
                <option value='co-skipper'>Co-Skipper</option>
              </select>
            </div>
            <button onClick={sendInvitation} disabled={inviteBusy || !inviteForm.email}
              className='w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50'>
              {inviteBusy ? t.ca_sending : ('📨 ' + t.ca_sendInvitation)}
            </button>
            {inviteMsg && <p className='text-sm mt-2 text-center'>{inviteMsg}</p>}
          </div>

          {invitations.length > 0 && (
            <div className='mt-4'>
              <h3 className='font-semibold text-gray-700 mb-3'>{t.ca_sentInvitations} ({invitations.length})</h3>
              <div className='space-y-2'>
                {invitations.map((inv: any) => (
                  <div key={inv.token} className={'flex items-center justify-between p-3 border rounded-lg ' + (inv.status === 'submitted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200')}>
                    <div className='flex-1'>
                      <div className='font-semibold text-sm'>{inv.invite_first_name} {inv.invite_last_name} <span className='text-xs text-gray-500'>({inv.role})</span></div>
                      <div className='text-xs text-gray-600'>{inv.invite_email}</div>
                      <div className='text-xs mt-1'>
                        {inv.status === 'submitted' ? <span className='text-green-700 font-semibold'>✓ {t.ca_submittedShort} {inv.submitted_at ? 'on ' + new Date(inv.submitted_at).toLocaleDateString() : ''}</span> : <span className='text-yellow-700 font-semibold'>⏳ {t.ca_pending}</span>}
                      </div>
                    </div>
                    {inv.status !== 'submitted' && (
                      <div className='flex gap-2'>
                        <button onClick={() => resendInvitation(inv.token)} disabled={inviteBusy}
                          className='px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'>{t.ca_resend}</button>
                        <button onClick={() => deleteInvitation(inv.token)} disabled={inviteBusy}
                          className='px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50'>{t.ca_deleteBtn}</button>
                        <button onClick={() => { navigator.clipboard?.writeText(window.location.origin + '/crew-invite/' + inv.token); setInviteMsg(t.ca_linkCopied); }}
                          className='px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700'>{t.ca_copyLink}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        
{/* 👥 Crew List section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <span className="text-2xl">👥</span>
            {t.ca_crewList}
            </h2>
            
            {/* 🔥 FIX 27: Removed Option 1 (Google Drive download) - now using auto-fill in FleetManagement */}
            <div className="space-y-4">
              <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {t.ca_fillCrewOnline}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {t.ca_fillCrewInApp}
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
                      ? (('❌ ' + t.ca_close))
                      : (('✏️ ' + t.ca_fillNow))
                    }
                  </button>
                </div>

                {showCrewForm && (
                  <div className="mt-4 space-y-4 border-t pt-4">
                    {crewMembers.map((member, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">
                            {member.role === 'skipper' ? (t.ca_skipper) : member.role === 'co-skipper' ? (t.ca_coSkipper) : (t.ca_crewMember + " " + (index + 1))}
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
                        
                        {member.fromInvitation && (
                          <div className="bg-green-50 border border-green-300 rounded-lg p-2 mb-2 text-sm text-green-800 flex items-center gap-2">
                            <span>✓</span>
                            <span>Auto-filled from invitation (locked)</span>
                            {member.signature && <span className="ml-auto text-xs bg-green-600 text-white px-2 py-0.5 rounded">Signed</span>}
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder={t.ca_fullName}
                            value={member.name}
                            onChange={(e) => handleCrewMemberChange(index, 'name', e.target.value)}
                            readOnly={member.fromInvitation}
                            className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100 cursor-not-allowed' : '')}
                          />
                          <input
                            type="text"
                            placeholder={t.ca_passportNum}
                            value={member.passport}
                            onChange={(e) => handleCrewMemberChange(index, 'passport', e.target.value)}
                            readOnly={member.fromInvitation}
                            className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100 cursor-not-allowed' : '')}
                          />
                          <input
                            type="date"
                            placeholder={t.ca_dateOfBirth}
                            value={member.dateOfBirth}
                            onChange={(e) => handleCrewMemberChange(index, 'dateOfBirth', e.target.value)}
                            readOnly={member.fromInvitation}
                            className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100 cursor-not-allowed' : '')}
                          />
                          <input
                            type="text"
                            placeholder={t.ca_nationality}
                            value={member.nationality}
                            onChange={(e) => handleCrewMemberChange(index, 'nationality', e.target.value)}
                            readOnly={member.fromInvitation}
                            className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100 cursor-not-allowed' : '')}
                          />
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <input type="email" placeholder={t.ca_emailLabel} value={member.email || ''} onChange={(e) => handleCrewMemberChange(index, 'email', e.target.value)} readOnly={member.fromInvitation} className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100' : '')} />
                  <input type="tel" placeholder={t.ca_phoneShort} value={member.phone || ''} onChange={(e) => handleCrewMemberChange(index, 'phone', e.target.value)} readOnly={member.fromInvitation} className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100' : '')} />
                  <select value={member.gender || ''} onChange={(e) => handleCrewMemberChange(index, 'gender', e.target.value)} disabled={member.fromInvitation} className={'px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none ' + (member.fromInvitation ? 'bg-gray-100' : '')}>
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="mt-2">
                  <select value={member.role || 'crew'} onChange={(e) => handleCrewMemberChange(index, 'role', e.target.value)} className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none w-full">
                    <option value="crew">{t.ca_crewMember}</option>
                    <option value="skipper">{t.ca_skipper}</option>
                    <option value="co-skipper">{t.ca_coSkipper}</option>
                  </select>
                </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={addCrewMember}
                      className="w-full px-4 py-2 border-2 border-dashed border-blue-400 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                      + {t.ca_addCrewMember}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
              <span className="text-2xl">📸</span>
              {t.ca_skipperLicense}
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              {t.ca_skipperLicenseDesc}
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
                    🗑️ {t.ca_remove}
                  </button>
                <label className="cursor-pointer inline-block mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
                  + {t.ca_addAnotherLicense}
                  <input type="file" accept="image/jpeg,image/png,image/jpg,.pdf,.doc,.docx" className="hidden" onChange={handleSkipperLicenseUpload} />
                </label>
                {extraLicenses.map((lic, idx) => (
                  <div key={'extra-' + idx} className="mt-3 space-y-2">
                    <img src={lic} alt={'License ' + (idx + 2)} className="max-w-full max-h-48 mx-auto rounded-lg shadow-md" />
                    <button onClick={() => setExtraLicenses(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                      {t.ca_remove}
                    </button>
                  </div>
                ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                    {/* Camera Capture */}
                    <label className="cursor-pointer flex-1 max-w-xs">
                      <div className="p-6 border-2 border-blue-400 rounded-lg hover:bg-blue-50 transition-colors">
                        <div className="text-5xl mb-2">📷</div>
                        <p className="text-lg font-semibold text-gray-700">
                          {t.ca_takePhoto}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t.ca_useCamera}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
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
                          {t.ca_uploadFile}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t.ca_chooseGallery}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleSkipperLicenseUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500">
                    {t.ca_orDragDrop}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Charter Party Scan Upload */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <span className="text-2xl">📋</span>
            {t.ca_charterPartyScanTitle}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t.ca_uploadSignedCP}
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {charterPartyScan ? (
              <div className="space-y-4">
                {charterPartyScan.startsWith('data:application/pdf') || charterPartyScan.startsWith('data:application/vnd') || charterPartyScan.startsWith('data:application/msword') ? (
                  <div className="text-green-600 font-semibold">✅ {t.ca_docUploaded}</div>
                ) : (
                  <img src={charterPartyScan} alt="Charter Party" className="max-w-full max-h-64 mx-auto rounded-lg shadow-md" />
                )}
                <button
                  onClick={() => setCharterPartyScan('')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                >
                  🗑 {t.ca_remove}
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="p-6 border-2 border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="text-5xl mb-2">📁</div>
                  <p className="text-lg font-semibold text-gray-700">
                    {t.ca_uploadFile}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.ca_pdfWordImg}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCharterPartyScanUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* Crew List Scan Upload */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <span className="text-2xl">👥</span>
            {t.ca_crewListScanTitle}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t.ca_uploadSignedCL}
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            {crewListScan ? (
              <div className="space-y-4">
                {crewListScan.startsWith('data:application/pdf') || crewListScan.startsWith('data:application/vnd') || crewListScan.startsWith('data:application/msword') ? (
                  <div className="text-green-600 font-semibold">✅ {t.ca_docUploaded}</div>
                ) : (
                  <img src={crewListScan} alt="Crew List" className="max-w-full max-h-64 mx-auto rounded-lg shadow-md" />
                )}
                <button
                  onClick={() => setCrewListScan('')}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
                >
                  🗑 {t.ca_remove}
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <div className="p-6 border-2 border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="text-5xl mb-2">📁</div>
                  <p className="text-lg font-semibold text-gray-700">
                    {t.ca_uploadFile}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {t.ca_pdfWordImg}
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCrewListScanUpload}
                />
              </label>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-4 bg-gray-600 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition-colors min-h-[48px]"
            >
              ← {t.ca_backToHome}
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold text-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg min-h-[48px]"
            >
              ✅ {t.ca_submitAllDocs}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
