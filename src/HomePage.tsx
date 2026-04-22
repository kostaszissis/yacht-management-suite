import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isOwnerCode } from './ownerCodes';
import authService from './authService';
import { getTranslations } from './translations';
import FloatingChatWidget from './FloatingChatWidget';
import UserGuide from './UserGuide';
import InstallButton from './InstallButton';
import { codeMatches, parseSearchDate, dateMatches } from './utils/searchUtils';

// 🎵 MUSIC RADIO LINKS
const MUSIC_RADIO_LINKS = {
  "Music by Tailwind": "https://drive.google.com/drive/folders/1r2JplJDTUXepmNENSw7Wue7kNnDeQjCf",
  "Chill/Lounge": "https://www.chilltrax.com",
  "Jazz": "https://www.jazz24.org",
  "Rock": "https://www.rockradio.com",
  "Greek Music": "https://onlineradiobox.com/gr/?lang=en",
  "House": "https://filtermusic.net",
  "Electronic": "https://www.accuradio.com/electronic"
};

// Format date helper (YYYY-MM-DD or Date → DD/MM/YYYY)
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date); // Return original if invalid
    return d.toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(date);
  }
};

export default function HomePage() {
  const [language, setLanguage] = useState(sessionStorage.getItem('yacht_lang') || 'en');
  const t = getTranslations(language);

  const LANG_MAP = [
    { code: 'el', country: 'GR', label: 'Ελληνικά' },
    { code: 'en', country: 'GB', label: 'English' },
    { code: 'it', country: 'IT', label: 'Italiano' },
    { code: 'de', country: 'DE', label: 'Deutsch' },
    { code: 'ru', country: 'RU', label: 'Русский' },
    { code: 'fr', country: 'FR', label: 'Français' },
    { code: 'ro', country: 'RO', label: 'Română' },
    { code: 'pl', country: 'PL', label: 'Polski' },
    { code: 'he', country: 'IL', label: 'עברית' },
    { code: 'es', country: 'ES', label: 'Español' },
  ];

  const flagImg = (countryCode: string) =>
    `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    sessionStorage.setItem('yacht_lang', lang);
    setShowLangPopup(false);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [fleetCode, setFleetCode] = useState('');
  const [bookingStatus, setBookingStatus] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const navigate = useNavigate();

  // 🔥 FIX: Sync currentUser with sessionStorage on every mount/navigation
  // This ensures back/forward browser navigation doesn't show stale state
  useEffect(() => {
    // Sync on mount
    const syncUser = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };

    syncUser();

    // Also sync when page is shown (back/forward navigation from bfcache)
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache
        syncUser();
      }
    };

    // Also sync on focus (tab switching)
    const handleFocus = () => {
      syncUser();
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN';
  const isStaff = currentUser && currentUser.role !== 'OWNER'; // Staff = any role except OWNER
  const isCustomer = !currentUser; // Customer = no employee/owner login

  // Auto-load booking from URL parameter

  // Check booking status from API (case-insensitive search or by date)
  const checkBookingStatus = async (bookingCode: string) => {
    try {
      // Try to fetch bookings from API first
      let apiResponse = null;
      try {
        const response = await fetch('/api/bookings.php');
        if (response.ok) {
          const text = await response.text();
          // Check if response is JSON (not HTML)
          if (text.startsWith('{') || text.startsWith('[')) {
            apiResponse = JSON.parse(text);
          }
        }
      } catch (apiError) {
        console.log('API not available');
      }

      // API is source of truth - no localStorage fallback
      if (!apiResponse) {
        console.log('⚠️ API not available - no localStorage fallback');
        apiResponse = { bookings: [] };
      }

      // Handle both array format and { bookings: {...} } object format from API
      const bookings: Record<string, any> = {};

      if (Array.isArray(apiResponse)) {
        // Direct array format
        apiResponse.forEach((booking: any) => {
          const code = booking.bookingCode || booking.charterCode || booking.code || booking.id;
          if (code) {
            bookings[code] = { bookingData: booking };
          }
        });
      } else if (apiResponse && typeof apiResponse === 'object') {
        // Object format: { bookings: {...} } or { bookings: [...] }
        const bookingsData = apiResponse.bookings || apiResponse;

        if (Array.isArray(bookingsData)) {
          bookingsData.forEach((booking: any) => {
            const code = booking.bookingCode || booking.charterCode || booking.code || booking.id;
            if (code) {
              bookings[code] = { bookingData: booking };
            }
          });
        } else if (typeof bookingsData === 'object') {
          // Object keyed by booking code
          Object.entries(bookingsData).forEach(([key, value]: [string, any]) => {
            const booking = value?.bookingData || value;
            const code = key || booking?.bookingCode || booking?.charterCode || booking?.code || booking?.id;
            if (code) {
              bookings[code] = { bookingData: booking };
            }
          });
        }
      }

      console.log('📋 Loaded bookings:', Object.keys(bookings).length, 'bookings');

      // Check if search is a date
      const searchDate = parseSearchDate(bookingCode);

      let matchingKey: string | undefined;

      if (searchDate) {
        // Search by date - find booking where startDate or endDate matches
        matchingKey = Object.keys(bookings).find(key => {
          const booking = bookings[key];
          if (!booking?.bookingData) return false;
          const { startDate, endDate, checkInDate, checkOutDate } = booking.bookingData;
          return dateMatches(startDate || checkInDate, searchDate) ||
                 dateMatches(endDate || checkOutDate, searchDate);
        });
      } else {
        // Search by booking code (case-insensitive, partial match)
        matchingKey = Object.keys(bookings).find(key => codeMatches(key, bookingCode));
      }

      if (!matchingKey) {
        return null;
      }

      const booking = bookings[matchingKey];
      console.log('🔍 Found booking for key:', matchingKey);
      console.log('🔍 Booking object:', booking);
      console.log('🔍 BookingData:', booking?.bookingData);

      if (!booking || !booking.bookingData) {
        console.log('❌ No booking data found');
        return null;
      }

      const bookingData = booking.bookingData;
      console.log('📋 bookingData.code:', bookingData.code);
      console.log('📋 bookingData.vesselName:', bookingData.vesselName);
      console.log('📋 bookingData.boatName:', bookingData.boatName);
      console.log('📋 bookingData.startDate:', bookingData.startDate);
      console.log('📋 bookingData.endDate:', bookingData.endDate);

      // Normalize field names (FleetManagement uses startDate/endDate, Page1 uses checkInDate/checkOutDate)
      const startDateStr = bookingData.startDate || bookingData.checkInDate;
      const endDateStr = bookingData.endDate || bookingData.checkOutDate;

      // Handle invalid or missing dates
      const checkInDate = startDateStr ? new Date(startDateStr) : new Date();
      const checkOutDate = endDateStr ? new Date(endDateStr) : new Date();

      // Normalize vessel name (FleetManagement uses boatName, vesselName, or vessel)
      if (!bookingData.vesselName && bookingData.boatName) {
        bookingData.vesselName = bookingData.boatName;
      }
      if (!bookingData.vesselName && bookingData.vessel) {
        bookingData.vesselName = bookingData.vessel;
      }
      const today = new Date();

      checkInDate.setHours(0, 0, 0, 0);
      checkOutDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const checkInCompleted = !!booking.page5DataCheckIn || !!bookingData.checkInCompleted;
      const checkOutCompleted = !!booking.page5DataCheckOut || !!bookingData.checkOutCompleted;

      return {
        bookingCode: matchingKey, // Use the actual key found
        bookingData,
        checkInDate,
        checkOutDate,
        today,
        checkInCompleted,
        checkOutCompleted,
        isBeforeCheckIn: today < checkInDate,
        isCheckInDay: today.getTime() === checkInDate.getTime(),
        isBetweenCheckInAndCheckOut: today >= checkInDate && today < checkOutDate,
        isCheckOutDay: today.getTime() === checkOutDate.getTime(),
        isAfterCheckOut: today > checkOutDate,
      };
    } catch (error) {
      console.error('Error checking booking status:', error);
      return null;
    }
  };


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingParam = params.get('booking');
    if (bookingParam) {
      setSearchQuery(bookingParam);
        const autoLoad = async () => {
            const status = await checkBookingStatus(bookingParam);
            if (status) {
                localStorage.setItem('currentBooking', status.bookingCode);
                setBookingStatus(status);
            }
        };
        autoLoad();
    }
  }, []);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      try {
        const status = await checkBookingStatus(searchQuery.trim());

        if (status) {
          localStorage.setItem('currentBooking', status.bookingCode);
          setBookingStatus(status);
          setSearchQuery('');
          console.log('✅ Booking found:', status.bookingCode);
        } else {
            alert(t.bookingNotFound);
        }
      } finally {
        setIsSearching(false);
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = authService.login(adminPassword);

    if (success) {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      setShowAdminModal(false);
      setAdminPassword('');
      authService.logActivity('login_from_homepage', adminPassword);

      // 🔥 FIX: Navigate to /admin page after successful login
      navigate('/admin');
    } else {
      alert(t.wrongCode);
      setAdminPassword('');
    }
  };

  const handleFleetLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = fleetCode.toUpperCase().trim();
    const success = authService.login(upperCode);
    
    if (success) {
      const user = authService.getCurrentUser();
      if (authService.isOwner() || authService.isAdmin()) {
        if (authService.isAdmin()) {
          navigate('/fleet-management', { state: { userType: 'COMPANY', isAdmin: true, employeeCode: upperCode } });
        } else if (authService.isOwner()) {
          navigate('/owner-dashboard', { state: { ownerCode: upperCode } });
        }
        setShowFleetModal(false);
        setFleetCode('');
        return;
      }
    }
    
    if (isOwnerCode(upperCode)) {
      navigate('/owner-dashboard', { state: { ownerCode: upperCode } });
      setShowFleetModal(false);
      setFleetCode('');
      return;
    }
    
    alert(t.invalidCode);
    setFleetCode('');
  };

  // 🔥 FIX: Check if already logged in before showing Fleet login modal
  const handleFleetClick = () => {
    // If user is already logged in, navigate directly without showing login
    if (authService.isLoggedIn()) {
      const user = authService.getCurrentUser();
      if (authService.isAdmin()) {
        navigate('/fleet-management', { state: { userType: 'COMPANY', isAdmin: true, employeeCode: user?.code } });
        return;
      } else if (authService.isOwner()) {
        navigate('/owner-dashboard', { state: { ownerCode: user?.code } });
        return;
      } else if (authService.isTechnical() || authService.isBooking() || authService.isAccounting()) {
        // Employee with specific role - go to fleet management
        navigate('/fleet-management', { state: { userType: 'COMPANY', employeeCode: user?.code } });
        return;
      }
    }
    // Not logged in - show login modal
    setShowFleetModal(true);
  };

  const handleWeather = () => {
    window.open('https://www.windy.com/-Waves-waves?waves,60.172,24.935,5,p:wind', '_blank');
  };

  const handleCompanyNews = () => {
    navigate('/company-news');
  };

  const handleMusicRadio = (genre: string, url: string) => {
    window.open(url, '_blank');
    setShowMusicModal(false);
  };

  const handleTechnicalSupport = () => {
    navigate('/technical-support');
  };

  const handlePreFillClick = () => {
    if (isAdmin) {
      navigate('/page1');
      return;
    }
    // Technical: bypass booking check, direct access to Pre-Fill
    if (currentUser?.role === 'TECHNICAL') {
      navigate('/page1');
      return;
    }
    
    if (!bookingStatus) {
      alert(t.enterBookingFirst);
      return;
    }
    
    if (bookingStatus.isCheckInDay && !bookingStatus.checkInCompleted) {
      navigate('/page1', { state: { bookingCode: bookingStatus.bookingCode } });
    } else {
      alert(t.preFillOnlyCheckin);
    }
  };

  const getButtonState = (buttonId: string) => {
    if (isAdmin) return { enabled: true, locked: false, hidden: false };
    // Technical: hide fleet, lock 360+guides (not built yet)
    if (currentUser?.role === 'TECHNICAL') {
      if (buttonId === 'fleet') return { enabled: false, locked: false, hidden: true };
      if (['360', 'guides'].includes(buttonId)) return { enabled: false, locked: true, hidden: false };
    }
    // Customer: fleet and enter always hidden
    if (isCustomer && ['fleet', 'enter'].includes(buttonId)) {
      return { enabled: false, locked: false, hidden: true };
    }
    // Customer: prefill hidden unless it is check-in day
    if (isCustomer && buttonId === 'prefill') {
      if (!bookingStatus?.isCheckInDay) {
        return { enabled: false, locked: false, hidden: true };
      }
    }
    // Customer: lock 360 and guides (not built yet)
    if (isCustomer && ['360', 'guides'].includes(buttonId)) {
      return { enabled: false, locked: true, hidden: false };
    }
    if (['360', 'news', 'music', 'weather', 'ai', 'fleet', 'support', 'enter'].includes(buttonId)) {
      return { enabled: true, locked: false, hidden: false };
    }
    // Staff (logged in) sees everything enabled
    if (currentUser) return { enabled: true, locked: false, hidden: false };
    // Customer without booking
    if (!bookingStatus) return { enabled: false, locked: true, hidden: false };

    const { isCheckInDay, checkInCompleted, checkOutCompleted } = bookingStatus;
    if (checkOutCompleted) return { enabled: false, locked: true, hidden: false };
    if (buttonId === 'prefill') {
      if (currentUser?.role === 'TECHNICAL') return { enabled: true, locked: false, hidden: false };
      return { enabled: isCheckInDay && !checkInCompleted, locked: !(isCheckInDay && !checkInCompleted), hidden: false };
    }
    return { enabled: true, locked: false, hidden: false };
  };

  // Styles object
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 30%, #bae6fd 60%, #e0f2fe 100%)',
      padding: '16px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    } as React.CSSProperties,
    
    app: {
      maxWidth: '500px',
      margin: '0 auto',
    } as React.CSSProperties,
    
    // Responsive for larger screens
    appLarge: {
      '@media (min-width: 768px)': {
        maxWidth: '700px',
      },
      '@media (min-width: 1024px)': {
        maxWidth: '900px',
      },
    },
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0 20px',
    } as React.CSSProperties,
    
    logoText: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-55%)',
    } as React.CSSProperties,
    
    logoIcon: {
      fontSize: '32px',
    } as React.CSSProperties,
    
    logoTitle: {
      fontSize: '26px',
      fontWeight: 800,
      color: '#0c4a6e',
      margin: 0,
    } as React.CSSProperties,
    
    logoSubtitle: {
      fontSize: '14px',
      fontWeight: 600,
      background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      margin: 0,
    } as React.CSSProperties,
    
    langBtn: {
      padding: '10px 16px',
      background: 'white',
      border: '1px solid #bae6fd',
      borderRadius: '12px',
      fontSize: '14px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(14, 165, 233, 0.15)',
      transition: 'all 0.3s',
    } as React.CSSProperties,
    
    welcome: {
      background: 'linear-gradient(135deg, rgba(12, 74, 110, 0.95) 0%, rgba(3, 105, 161, 0.9) 50%, rgba(14, 165, 233, 0.85) 100%)',
      borderRadius: '24px',
      padding: '40px 24px',
      marginBottom: '20px',
      color: 'white',
      textAlign: 'center' as const,
      position: 'relative' as const,
      overflow: 'hidden',
      boxShadow: '0 15px 50px rgba(3, 105, 161, 0.4), 0 0 60px rgba(14, 165, 233, 0.2)',
    } as React.CSSProperties,
    
    welcomeShimmer: {
      position: 'absolute' as const,
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
      animation: 'shimmer 3s infinite',
    } as React.CSSProperties,
    
    welcomeTitle: {
      fontSize: '32px',
      fontWeight: 800,
      marginBottom: '10px',
      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
      position: 'relative' as const,
      zIndex: 1,
    } as React.CSSProperties,
    
    welcomeSubtitle: {
      fontSize: '16px',
      opacity: 0.9,
      position: 'relative' as const,
      zIndex: 1,
    } as React.CSSProperties,
    
    vesselName: {
      marginTop: '16px',
      padding: '10px 20px',
      background: 'rgba(255,255,255,0.2)',
      borderRadius: '12px',
      display: 'inline-block',
      fontWeight: 600,
      backdropFilter: 'blur(10px)',
      position: 'relative' as const,
      zIndex: 1,
    } as React.CSSProperties,
    
    adminBanner: {
      background: 'linear-gradient(135deg, #059669, #10b981)',
      borderRadius: '16px',
      padding: '16px 20px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      color: 'white',
      boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.15)',
    } as React.CSSProperties,
    
    bookingBanner: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      textAlign: 'center' as const,
      boxShadow: '0 8px 25px rgba(14, 165, 233, 0.15)',
      border: '2px solid #bae6fd',
    } as React.CSSProperties,
    
    searchBox: {
      background: 'white',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 8px 30px rgba(14, 165, 233, 0.15)',
    } as React.CSSProperties,
    
    searchLabel: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 600,
      color: '#0c4a6e',
      marginBottom: '10px',
    } as React.CSSProperties,
    
    searchRow: {
      display: 'flex',
      gap: '10px',
    } as React.CSSProperties,
    
    searchInput: {
      flex: 1,
      padding: '14px 18px',
      border: '2px solid #e0f2fe',
      borderRadius: '14px',
      fontSize: '15px',
      outline: 'none',
      transition: 'all 0.3s',
    } as React.CSSProperties,
    
    searchBtn: {
      padding: '14px 24px',
      background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
      color: 'white',
      border: 'none',
      borderRadius: '14px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
      transition: 'all 0.3s',
    } as React.CSSProperties,
    
    sectionLabel: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#0c4a6e',
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
      marginBottom: '12px',
      paddingLeft: '4px',
    } as React.CSSProperties,
    
    servicesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '20px',
    } as React.CSSProperties,
    
    serviceCard: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)',
      borderRadius: '20px',
      padding: '28px 16px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '1px solid rgba(14,116,144,0.08)',
      position: 'relative' as const,
      boxShadow: '0 2px 12px rgba(14,116,144,0.06)',
    } as React.CSSProperties,
    
    serviceCardLocked: {
      opacity: 0.55,
      cursor: 'not-allowed',
      background: 'linear-gradient(145deg, #f1f5f9 0%, #e8eef5 100%)',
      border: '1px solid rgba(148,163,184,0.2)',
      boxShadow: 'none',
    } as React.CSSProperties,
    
    serviceIcon: {
      width: '64px',
      height: '64px',
      margin: '0 auto 14px',
      borderRadius: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px',
    } as React.CSSProperties,
    
    serviceTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#0c4a6e',
      lineHeight: 1.3,
      margin: 0,
      letterSpacing: '-0.2px',
    } as React.CSSProperties,
    
    lockBadge: {
      position: 'absolute' as const,
      top: '8px',
      right: '8px',
      fontSize: '14px',
      background: 'rgba(148,163,184,0.15)',
      borderRadius: '8px',
      padding: '2px 6px',
    } as React.CSSProperties,
    
    staffCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: '2px solid transparent',
    } as React.CSSProperties,
    
    quickRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      marginBottom: '20px',
    } as React.CSSProperties,
    
    quickBtn: {
      background: 'white',
      borderRadius: '16px',
      padding: '14px 8px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.3s',
      border: 'none',
    } as React.CSSProperties,
    
    quickIcon: {
      width: '40px',
      height: '40px',
      margin: '0 auto 8px',
      background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
    } as React.CSSProperties,
    
    quickLabel: {
      fontSize: '11px',
      fontWeight: 600,
      color: '#0c4a6e',
    } as React.CSSProperties,
    
    loginRow: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '20px',
    } as React.CSSProperties,
    
    loginBtn: {
      background: 'white',
      border: '2px solid #e2e8f0',
      borderRadius: '16px',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      cursor: 'pointer',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      transition: 'all 0.3s',
    } as React.CSSProperties,
    
    floatingChat: {
      position: 'fixed' as const,
      bottom: '24px',
      right: '24px',
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4), 0 0 40px rgba(14, 165, 233, 0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s',
      zIndex: 1000,
      border: '3px solid white',
    } as React.CSSProperties,
    
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '16px',
    } as React.CSSProperties,
    
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '32px',
      maxWidth: '400px',
      width: '100%',
      boxShadow: '0 25px 80px rgba(0,0,0,0.3)',
    } as React.CSSProperties,
    
    footer: {
      textAlign: 'center' as const,
      padding: '20px 0',
      color: '#64748b',
      fontSize: '12px',
    } as React.CSSProperties,
  };

  const iconColors: { [key: string]: React.CSSProperties } = {
    blue: { background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)' },
    purple: { background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)' },
    green: { background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)' },
    orange: { background: 'linear-gradient(135deg, #ffedd5, #fed7aa)' },
    cyan: { background: 'linear-gradient(135deg, #cffafe, #a5f3fc)' },
    pink: { background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)' },
    indigo: { background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)' },
    teal: { background: 'linear-gradient(135deg, #ccfbf1, #99f6e4)' },
    gray: { background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' },
  };

  const services = [
    { id: '360', icon: '🌐', title: t.virtualTour, color: 'blue', action: () => console.log('360 tour') },
    { id: 'guides', icon: '🎥', title: t.technicalGuides, color: 'purple', action: () => console.log('guides') },
    { id: 'agreement', icon: '📄', title: t.charterAgreement, color: 'green', action: () => navigate('/charter-agreement', { state: { bookingCode: bookingStatus?.bookingCode } }) },
    { id: 'prefill', icon: '📋', title: t.preFillDetails, color: 'orange', action: handlePreFillClick },
    { id: 'news', icon: '📰', title: t.companyNewsletter, color: 'indigo', action: handleCompanyNews },
    { id: 'fleet', icon: '⚓', title: t.fleetManagement, color: 'teal', action: handleFleetClick },
    { id: 'enter', icon: '➡️', title: t.staffLogin || 'Enter', color: 'blue', action: () => { if (isStaff) { navigate('/admin'); } else { setShowAdminModal(true); } } },
  ];

  const quickActions = [
    { id: 'ai', icon: '🤖', label: t.aiAssistant, action: () => navigate('/ai-assistant') },
    { id: 'weather', icon: '🌤️', label: t.weather, action: handleWeather },
    { id: 'music', icon: '🎵', label: t.music, action: () => setShowMusicModal(true) },
  ];

  return (
    <div style={styles.container}>
      {/* CSS Animation for shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { left: -100%; }
          50%, 100% { left: 100%; }
        }
        @media (min-width: 768px) {
          .services-grid-responsive {
            grid-template-columns: repeat(3, 1fr) !important;
          }
          .app-responsive {
            max-width: 700px !important;
          }
        }
        @media (min-width: 1024px) {
          .app-responsive {
            max-width: 900px !important;
          }
        }
      `}</style>
      
      <div style={styles.app} className="app-responsive">
        
        {/* Header */}
        <header style={{...styles.header, justifyContent: 'space-between', position: 'relative'}}>
          {/* Left: Logout + Guide */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              style={{ ...styles.langBtn, background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
              onClick={() => { authService.logout(); navigate("/"); }}
            >
              {t.logout}
            </button>
            <button
              style={{ ...styles.langBtn, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              onClick={() => setShowUserGuide(true)}
            >
              {t.guide}
            </button>
          </div>

          {/* Center: Logo */}
          <div style={styles.logoText}>
            <span style={styles.logoIcon}>⚓</span>
            <div>
              <h1 style={styles.logoTitle}>Yacht Management Suite</h1>
              <p style={styles.logoSubtitle}>Digital Check-In System</p>
            </div>
          </div>

          {/* Right: Language selector + Install */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <InstallButton />
            <button
              style={{...styles.langBtn, position: "relative"}}
              onClick={() => setShowLangPopup(!showLangPopup)}
            >
              <img src={flagImg(LANG_MAP.find(l => l.code === language)?.country || "GB")} alt="" style={{width: "24px", height: "18px"}} /> {language.toUpperCase()}
            </button>
          </div>
        </header>


        {/* Language Selector Popup */}
        {showLangPopup && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} onClick={() => setShowLangPopup(false)}>
            <div style={{
              background: 'white', borderRadius: '16px', padding: '24px',
              maxWidth: '340px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <h3 style={{ textAlign: 'center', marginBottom: '16px', fontSize: '18px', color: '#1e293b' }}>
                {t.selectLanguage || 'Select Language'}
              </h3>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}>
                {LANG_MAP.map(({ code, country, label }) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    style={{
                      padding: '12px 8px', borderRadius: '10px', border: 'none',
                      background: language === code
                        ? 'linear-gradient(135deg, #0c4a6e, #0ea5e9)'
                        : '#f1f5f9',
                      color: language === code ? 'white' : '#334155',
                      fontSize: '15px', fontWeight: language === code ? 700 : 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={flagImg(country)} alt="" style={{width: "24px", height: "18px", borderRadius: "2px"}} /> {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Welcome Banner */}
        <div style={styles.welcome}>
          <div style={styles.welcomeShimmer}></div>
          <h2 style={styles.welcomeTitle}>
            {bookingStatus?.bookingData?.skipperFirstName
                ? `${t.welcomeAboard.replace('!',',')} ${bookingStatus.bookingData.skipperFirstName}!`
              : t.welcomeAboard
            }
          </h2>
          <p style={styles.welcomeSubtitle}>
            {t.welcomeSubtitle}
          </p>
          <div style={styles.vesselName}>
            🚤 {bookingStatus?.bookingData?.vesselName || t.yourVessel}
          </div>
          {bookingStatus?.bookingData?.skipperFirstName && bookingStatus?.bookingData?.skipperLastName && (
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#0c4a6e', marginTop: '10px' }}>
              {bookingStatus.bookingData.skipperFirstName} {bookingStatus.bookingData.skipperLastName}
            </div>
          )}
        </div>

        {/* Admin Status */}
        {isAdmin && (
          <div style={styles.adminBanner}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
              🔓 {t.adminMode}
            </h3>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              {t.allFeaturesUnlocked}
            </p>
          </div>
        )}

        {/* Booking Status */}
        {bookingStatus && !isAdmin && (
          <div style={styles.bookingBanner}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0369a1', marginBottom: '8px' }}>
              {bookingStatus.bookingData?.code || bookingStatus.bookingData?.bookingCode || bookingStatus.bookingCode}
            </div>
            <div style={{ fontSize: '15px', color: '#0c4a6e', fontWeight: 600, marginBottom: '8px' }}>
              🚤 {bookingStatus.bookingData?.vesselName || bookingStatus.bookingData?.boatName || 'Vessel'}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              📅 Check-in: {formatDate(bookingStatus.checkInDate)} | Check-out: {formatDate(bookingStatus.checkOutDate)}
            </div>
            {bookingStatus.isCheckInDay && !bookingStatus.checkInCompleted && (
              <div style={{ marginTop: '12px', padding: '8px 16px', background: '#fef3c7', color: '#d97706', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'inline-block' }}>
                🎯 {t.checkInToday}
              </div>
            )}
            {bookingStatus.checkInCompleted && !bookingStatus.checkOutCompleted && (
              <div style={{ marginTop: '12px', padding: '8px 16px', background: '#d1fae5', color: '#059669', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'inline-block' }}>
                ✅ {t.checkInCompleted}
              </div>
            )}
          </div>
        )}

        {/* Search Box */}
        {!isAdmin && (
          <form onSubmit={handleSearch} style={styles.searchBox}>
            <div style={styles.searchRow}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                style={styles.searchInput}
              />
              <button type="submit" style={styles.searchBtn} disabled={isSearching}>
                {isSearching
                  ? (t.searching)
                  : (t.search)}
              </button>
            </div>
          </form>
        )}

        {/* Services Grid */}
        <p style={styles.sectionLabel}>
          {t.yourServices}
        </p>
        <div style={{...styles.servicesGrid, ...(isCustomer ? {gridTemplateColumns: "repeat(2, 1fr)"} : {})}} className={isCustomer ? "" : "services-grid-responsive"}>
          {services.filter((s) => !getButtonState(s.id).hidden).map((service) => {
            const state = getButtonState(service.id);
            return (
              <div
                key={service.id}
                onClick={state.enabled ? service.action : undefined}
                style={{
                  ...styles.serviceCard,
                  ...(state.locked ? styles.serviceCardLocked : {}),
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  ...(service.id === 'enter' ? { gridColumn: '2' } : {}),
                }}
                className={!state.locked ? 'shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transform-gpu' : ''}
              >
                {state.locked && <span style={styles.lockBadge}>🔒</span>}
                <div style={{ ...styles.serviceIcon, ...iconColors[service.color] }}>
                  {service.icon}
                </div>
                <h3 style={styles.serviceTitle}>{service.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Login/Enter Button - moved to services grid */}
            {false && (<>
        {/* 🔥 FIX: Staff logged in = go to /admin. Owner logged in OR not logged in = show login modal */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <button
            onClick={() => {
              if (isStaff) {
                navigate('/admin');
              } else {
                setShowAdminModal(true);
              }
            }}
            style={{ ...styles.quickBtn, width: '200px', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
            className="shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transform-gpu"
          >
            <div style={styles.quickIcon}>{isStaff ? '➡️' : '🔐'}</div>
            <span style={styles.quickLabel}>
              {isStaff
                ? (t.enter)
                : (t.login)}
            </span>
            {!isStaff && (
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                {t.onlyStaff}
              </span>
            )}
          </button>
        </div>

        </>)}

        {/* Quick Actions */}
        <p style={styles.sectionLabel}>
          {t.quickActions}
        </p>
        <div style={styles.quickRow}>
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              style={{ ...styles.quickBtn, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              className="shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 transform-gpu"
            >
              <div style={styles.quickIcon}>{action.icon}</div>
              <span style={styles.quickLabel}>{action.label}</span>
            </button>
          ))}
        </div>


        {/* Footer */}
        <div style={styles.footer}>
          © 2026 Yacht Management Suite v5.4<br />
          All rights reserved
        </div>
      </div>

      {/* Floating Chat Widget */}
      <FloatingChatWidget />

      {/* Admin Modal */}
      {showAdminModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>🔐</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0c4a6e', marginBottom: '8px' }}>
                {t.staffLogin}
              </h3>
              <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
                {t.enterEmployeeCode}
              </p>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div style={{ position: 'relative', width: '100%', marginBottom: '16px' }}>
                <input
                  type={showAdminPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder={t.employeeCode}
                  style={{ ...styles.searchInput, width: '100%', paddingRight: '45px' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '20px',
                    color: '#1e3a5f'
                  }}
                >
                  {showAdminPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setAdminPassword(''); }}
                  style={{ flex: 1, padding: '14px', background: '#f1f5f9', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, ...styles.searchBtn }}
                >
                  {t.login}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fleet Modal */}
      {showFleetModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, background: 'white', border: '2px solid #1e40af' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>⚓</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af', marginBottom: '8px' }}>
                Fleet Management
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {t.enterAccessCode}
              </p>
            </div>
            <form onSubmit={handleFleetLogin}>
              <input
                type="text"
                value={fleetCode}
                onChange={(e) => setFleetCode(e.target.value)}
                placeholder={t.accessCode}
                style={{ ...styles.searchInput, width: '100%', marginBottom: '16px', background: '#f9fafb', border: '2px solid #d1d5db', color: '#374151' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowFleetModal(false); setFleetCode(''); }}
                  style={{ flex: 1, padding: '14px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '14px', background: '#1e40af', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', color: 'white' }}
                >
                  {t.login}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Music Modal */}
      {showMusicModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, background: 'linear-gradient(135deg, #831843, #be185d)', border: '2px solid #f472b6', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎵</div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
                {t.musicRadio}
              </h3>
              <p style={{ color: '#fbcfe8', fontSize: '14px', margin: 0 }}>
                {t.chooseMusicStyle}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {Object.entries(MUSIC_RADIO_LINKS).map(([genre, url]) => (
                <button
                  key={genre}
                  onClick={() => handleMusicRadio(genre, url)}
                  style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '12px', color: 'white', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
                >
                  {genre === "Music by Tailwind" ? "🎼" : "🎶"} {genre}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMusicModal(false)}
              style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', color: 'white' }}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* User Guide Modal */}
      <UserGuide isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />
    </div>
  );
}

