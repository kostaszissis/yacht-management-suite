// Shared translations for customer-facing pages
// Languages: en, el, it, de, ru, fr, ro, pl, he, es

export type LangCode = 'en' | 'el' | 'it' | 'de' | 'ru' | 'fr' | 'ro' | 'pl' | 'he' | 'es';

const T: Record<string, Record<LangCode, string>> = {
  welcomeAboard: {
    en: 'Welcome Aboard!', el: 'Καλώς Ήρθατε!', it: 'Benvenuti a bordo!', de: 'Willkommen an Bord!',
    ru: 'Добро пожаловать на борт!', fr: 'Bienvenue à bord!', ro: 'Bine ați venit la bord!',
    pl: 'Witamy na pokładzie!', he: '!ברוכים הבאים על הסיפון', es: '¡Bienvenido a bordo!'
  },
  welcomeSubtitle: {
    en: 'Your premium yacht charter experience starts here',
    el: 'Η premium εμπειρία ναύλωσης σας ξεκινά εδώ',
    it: 'La vostra esperienza premium di charter inizia qui',
    de: 'Ihr Premium-Yachtcharter-Erlebnis beginnt hier',
    ru: 'Ваш премиальный опыт яхтенного чартера начинается здесь',
    fr: 'Votre expérience premium de location de yacht commence ici',
    ro: 'Experiența dvs. premium de închiriere iahturi începe aici',
    pl: 'Twoje premium doświadczenie czarteru jachtu zaczyna się tutaj',
    he: 'חוויית השכרת היאכטה הפרימיום שלך מתחילה כאן',
    es: 'Su experiencia premium de alquiler de yate comienza aquí'
  },
  yourVessel: {
    en: 'Your Vessel', el: 'Το Σκάφος σας', it: 'La vostra barca', de: 'Ihr Schiff',
    ru: 'Ваше судно', fr: 'Votre bateau', ro: 'Vasul dumneavoastră',
    pl: 'Twój jacht', he: 'הכלי שלך', es: 'Su embarcación'
  },
  adminMode: {
    en: 'Administrator Mode', el: 'Λειτουργία Διαχειριστή', it: 'Modalità Amministratore', de: 'Administratormodus',
    ru: 'Режим администратора', fr: 'Mode Administrateur', ro: 'Mod Administrator',
    pl: 'Tryb administratora', he: 'מצב מנהל', es: 'Modo Administrador'
  },
  allFeaturesUnlocked: {
    en: 'All features unlocked', el: 'Όλες οι λειτουργίες ξεκλειδωμένες', it: 'Tutte le funzioni sbloccate', de: 'Alle Funktionen freigeschaltet',
    ru: 'Все функции разблокированы', fr: 'Toutes les fonctionnalités débloquées', ro: 'Toate funcțiile deblocate',
    pl: 'Wszystkie funkcje odblokowane', he: 'כל התכונות פתוחות', es: 'Todas las funciones desbloqueadas'
  },
  bookingStatus: {
    en: 'Booking Status', el: 'Κατάσταση Κράτησης', it: 'Stato della prenotazione', de: 'Buchungsstatus',
    ru: 'Статус бронирования', fr: 'Statut de réservation', ro: 'Starea rezervării',
    pl: 'Status rezerwacji', he: 'סטטוס הזמנה', es: 'Estado de la reserva'
  },
  checkInToday: {
    en: 'Check-in available today!', el: 'Επιβίβαση διαθέσιμη σήμερα!', it: 'Check-in disponibile oggi!', de: 'Check-in heute verfügbar!',
    ru: 'Регистрация доступна сегодня!', fr: 'Enregistrement disponible aujourd\'hui!', ro: 'Check-in disponibil astăzi!',
    pl: 'Check-in dostępny dzisiaj!', he: '!צ\'ק-אין זמין היום', es: '¡Check-in disponible hoy!'
  },
  checkInCompleted: {
    en: 'Check-in completed', el: 'Επιβίβαση ολοκληρώθηκε', it: 'Check-in completato', de: 'Check-in abgeschlossen',
    ru: 'Регистрация завершена', fr: 'Enregistrement terminé', ro: 'Check-in finalizat',
    pl: 'Check-in zakończony', he: 'צ\'ק-אין הושלם', es: 'Check-in completado'
  },
  checkOutCompleted: {
    en: 'Check-out completed', el: 'Αποβίβαση ολοκληρώθηκε', it: 'Check-out completato', de: 'Check-out abgeschlossen',
    ru: 'Выезд завершён', fr: 'Check-out terminé', ro: 'Check-out finalizat',
    pl: 'Check-out zakończony', he: 'צ\'ק-אאוט הושלם', es: 'Check-out completado'
  },
  searchPlaceholder: {
    en: 'e.g. Charter Party No 1, NAY-001, 15/12/2024', el: 'π.χ. Charter Party No 1, NAY-001, 15/12/2024',
    it: 'es. Charter Party No 1, NAY-001, 15/12/2024', de: 'z.B. Charter Party No 1, NAY-001, 15/12/2024',
    ru: 'напр. Charter Party No 1, NAY-001, 15/12/2024', fr: 'ex. Charter Party No 1, NAY-001, 15/12/2024',
    ro: 'ex. Charter Party No 1, NAY-001, 15/12/2024', pl: 'np. Charter Party No 1, NAY-001, 15/12/2024',
    he: 'Charter Party No 1, NAY-001, 15/12/2024 :לדוגמה', es: 'ej. Charter Party No 1, NAY-001, 15/12/2024'
  },
  searching: {
    en: 'Searching...', el: 'Αναζήτηση...', it: 'Ricerca...', de: 'Suche...',
    ru: 'Поиск...', fr: 'Recherche...', ro: 'Căutare...',
    pl: 'Szukanie...', he: '...מחפש', es: 'Buscando...'
  },
  search: {
    en: 'Search', el: 'Αναζήτηση', it: 'Cerca', de: 'Suchen',
    ru: 'Поиск', fr: 'Rechercher', ro: 'Căutare',
    pl: 'Szukaj', he: 'חיפוש', es: 'Buscar'
  },
  yourServices: {
    en: 'YOUR SERVICES', el: 'ΟΙ ΥΠΗΡΕΣΙΕΣ ΣΑΣ', it: 'I VOSTRI SERVIZI', de: 'IHRE DIENSTE',
    ru: 'ВАШИ УСЛУГИ', fr: 'VOS SERVICES', ro: 'SERVICIILE DVS.',
    pl: 'TWOJE USŁUGI', he: 'השירותים שלך', es: 'SUS SERVICIOS'
  },
  virtualTour: {
    en: '360° Virtual Tour', el: 'Εικονική Περιήγηση 360°', it: 'Tour virtuale 360°', de: '360° Virtuelle Tour',
    ru: 'Виртуальный тур 360°', fr: 'Visite virtuelle 360°', ro: 'Tur virtual 360°',
    pl: 'Wirtualna wycieczka 360°', he: '360° סיור וירטואלי', es: 'Tour virtual 360°'
  },
  technicalGuides: {
    en: 'Technical Guides', el: 'Τεχνικοί Οδηγοί', it: 'Guide tecniche', de: 'Technische Anleitungen',
    ru: 'Технические руководства', fr: 'Guides techniques', ro: 'Ghiduri tehnice',
    pl: 'Instrukcje techniczne', he: 'מדריכים טכניים', es: 'Guías técnicas'
  },
  charterAgreement: {
    en: 'Charter Agreement', el: 'Ναυλοσύμφωνο', it: 'Contratto di noleggio', de: 'Chartervertrag',
    ru: 'Чартерный договор', fr: 'Contrat d\'affrètement', ro: 'Contract de închiriere',
    pl: 'Umowa czarteru', he: 'הסכם שכירות', es: 'Contrato de fletamento'
  },
  preFillDetails: {
    en: 'Pre-Fill Details', el: 'Συμπλήρωση Στοιχείων', it: 'Pre-compilazione dati', de: 'Daten vorausfüllen',
    ru: 'Предварительное заполнение', fr: 'Pré-remplir les détails', ro: 'Completare prealabilă',
    pl: 'Wstępne wypełnienie', he: 'מילוי מראש', es: 'Pre-rellenar datos'
  },
  fleetManagement: {
    en: 'Fleet Management', el: 'Διαχείριση Στόλου', it: 'Gestione flotta', de: 'Flottenmanagement',
    ru: 'Управление флотом', fr: 'Gestion de flotte', ro: 'Managementul flotei',
    pl: 'Zarządzanie flotą', he: 'ניהול צי', es: 'Gestión de flota'
  },
  companyNewsletter: {
    en: 'Company Newsletter', el: 'Newsletter Εταιρίας', it: 'Newsletter aziendale', de: 'Firmennewsletter',
    ru: 'Новости компании', fr: 'Newsletter de l\'entreprise', ro: 'Newsletter companie',
    pl: 'Newsletter firmowy', he: 'ניוזלטר החברה', es: 'Boletín de la empresa'
  },
  guide: {
    en: 'Guide', el: 'Οδηγίες', it: 'Guida', de: 'Anleitung',
    ru: 'Руководство', fr: 'Guide', ro: 'Ghid',
    pl: 'Przewodnik', he: 'מדריך', es: 'Guía'
  },
  logout: {
    en: 'Logout', el: 'Έξοδος', it: 'Esci', de: 'Abmelden',
    ru: 'Выход', fr: 'Déconnexion', ro: 'Deconectare',
    pl: 'Wyloguj', he: 'התנתק', es: 'Cerrar sesión'
  },
  selectLanguage: {
    en: 'Select Language', el: 'Επιλογή Γλώσσας', it: 'Seleziona Lingua', de: 'Sprache wählen',
    ru: 'Выбрать язык', fr: 'Choisir la langue', ro: 'Selectați limba',
    pl: 'Wybierz język', he: 'בחר שפה', es: 'Seleccionar idioma'
  },
  enter: {
    en: 'Enter', el: 'Είσοδος', it: 'Entra', de: 'Eintreten',
    ru: 'Войти', fr: 'Entrer', ro: 'Accesează',
    pl: 'Wejdź', he: 'כניסה', es: 'Entrar'
  },
  login: {
    en: 'Login', el: 'Σύνδεση', it: 'Accedi', de: 'Anmelden',
    ru: 'Войти', fr: 'Connexion', ro: 'Autentificare',
    pl: 'Zaloguj', he: 'התחבר', es: 'Iniciar sesión'
  },
  cancel: {
    en: 'Cancel', el: 'Ακύρωση', it: 'Annulla', de: 'Abbrechen',
    ru: 'Отмена', fr: 'Annuler', ro: 'Anulare',
    pl: 'Anuluj', he: 'ביטול', es: 'Cancelar'
  },
  onlyStaff: {
    en: 'Only Staff', el: 'Μόνο Προσωπικό', it: 'Solo personale', de: 'Nur Personal',
    ru: 'Только персонал', fr: 'Personnel uniquement', ro: 'Doar personal',
    pl: 'Tylko personel', he: 'צוות בלבד', es: 'Solo personal'
  },
  quickActions: {
    en: 'Quick Actions', el: 'Γρήγορες Ενέργειες', it: 'Azioni rapide', de: 'Schnellaktionen',
    ru: 'Быстрые действия', fr: 'Actions rapides', ro: 'Acțiuni rapide',
    pl: 'Szybkie akcje', he: 'פעולות מהירות', es: 'Acciones rápidas'
  },
  staffLogin: {
    en: 'Staff Login', el: 'Είσοδος Προσωπικού', it: 'Accesso personale', de: 'Personalanmeldung',
    ru: 'Вход для персонала', fr: 'Connexion personnel', ro: 'Autentificare personal',
    pl: 'Logowanie personelu', he: 'כניסת צוות', es: 'Acceso de personal'
  },
  enterEmployeeCode: {
    en: 'Enter your employee code', el: 'Εισάγετε τον κωδικό υπαλλήλου', it: 'Inserisci il codice dipendente', de: 'Mitarbeitercode eingeben',
    ru: 'Введите код сотрудника', fr: 'Entrez votre code employé', ro: 'Introduceți codul de angajat',
    pl: 'Wprowadź kod pracownika', he: 'הזן את קוד העובד', es: 'Ingrese su código de empleado'
  },
  employeeCode: {
    en: 'Employee Code', el: 'Κωδικός Υπαλλήλου', it: 'Codice dipendente', de: 'Mitarbeitercode',
    ru: 'Код сотрудника', fr: 'Code employé', ro: 'Cod angajat',
    pl: 'Kod pracownika', he: 'קוד עובד', es: 'Código de empleado'
  },
  enterAccessCode: {
    en: 'Enter your access code', el: 'Εισάγετε τον κωδικό πρόσβασης', it: 'Inserisci il codice di accesso', de: 'Zugangscode eingeben',
    ru: 'Введите код доступа', fr: 'Entrez votre code d\'accès', ro: 'Introduceți codul de acces',
    pl: 'Wprowadź kod dostępu', he: 'הזן את קוד הגישה', es: 'Ingrese su código de acceso'
  },
  accessCode: {
    en: 'Access Code', el: 'Κωδικός Πρόσβασης', it: 'Codice di accesso', de: 'Zugangscode',
    ru: 'Код доступа', fr: 'Code d\'accès', ro: 'Cod de acces',
    pl: 'Kod dostępu', he: 'קוד גישה', es: 'Código de acceso'
  },
  musicRadio: {
    en: 'Music Radio', el: 'Μουσικό Ράδιο', it: 'Radio musicale', de: 'Musikradio',
    ru: 'Музыкальное радио', fr: 'Radio musicale', ro: 'Radio muzical',
    pl: 'Radio muzyczne', he: 'רדיו מוזיקלי', es: 'Radio musical'
  },
  chooseMusicStyle: {
    en: 'Choose your music style', el: 'Επιλέξτε το είδος μουσικής', it: 'Scegli il tuo stile musicale', de: 'Wählen Sie Ihren Musikstil',
    ru: 'Выберите стиль музыки', fr: 'Choisissez votre style de musique', ro: 'Alegeți stilul muzical',
    pl: 'Wybierz styl muzyki', he: 'בחר את סגנון המוזיקה', es: 'Elija su estilo musical'
  },
  aiAssistant: {
    en: 'AI Assistant', el: 'AI Βοηθός', it: 'Assistente AI', de: 'KI-Assistent',
    ru: 'ИИ Ассистент', fr: 'Assistant IA', ro: 'Asistent AI',
    pl: 'Asystent AI', he: 'עוזר AI', es: 'Asistente IA'
  },
  weather: {
    en: 'Weather', el: 'Καιρός', it: 'Meteo', de: 'Wetter',
    ru: 'Погода', fr: 'Météo', ro: 'Vremea',
    pl: 'Pogoda', he: 'מזג אוויר', es: 'Clima'
  },
  music: {
    en: 'Music', el: 'Μουσική', it: 'Musica', de: 'Musik',
    ru: 'Музыка', fr: 'Musique', ro: 'Muzică',
    pl: 'Muzyka', he: 'מוזיקה', es: 'Música'
  },
  wrongCode: {
    en: 'Wrong code!', el: 'Λάθος κωδικός!', it: 'Codice errato!', de: 'Falscher Code!',
    ru: 'Неверный код!', fr: 'Code incorrect!', ro: 'Cod greșit!',
    pl: 'Błędny kod!', he: '!קוד שגוי', es: '¡Código incorrecto!'
  },
  invalidCode: {
    en: 'Invalid code!', el: 'Μη έγκυρος κωδικός!', it: 'Codice non valido!', de: 'Ungültiger Code!',
    ru: 'Недействительный код!', fr: 'Code invalide!', ro: 'Cod invalid!',
    pl: 'Nieprawidłowy kod!', he: '!קוד לא תקין', es: '¡Código inválido!'
  },
  enterBookingFirst: {
    en: 'Please enter your booking code first!', el: 'Παρακαλώ εισάγετε πρώτα τον κωδικό ναύλου σας!',
    it: 'Inserisci prima il codice di prenotazione!', de: 'Bitte geben Sie zuerst Ihren Buchungscode ein!',
    ru: 'Пожалуйста, сначала введите код бронирования!', fr: 'Veuillez d\'abord entrer votre code de réservation!',
    ro: 'Vă rugăm introduceți mai întâi codul de rezervare!', pl: 'Proszę najpierw wprowadzić kod rezerwacji!',
    he: '!אנא הזן תחילה את קוד ההזמנה', es: '¡Por favor ingrese primero su código de reserva!'
  },
  preFillOnlyCheckin: {
    en: 'Pre-Fill Details is only available on your check-in day!',
    el: 'Η συμπλήρωση στοιχείων είναι διαθέσιμη μόνο την ημέρα επιβίβασης!',
    it: 'La pre-compilazione è disponibile solo il giorno del check-in!',
    de: 'Vorausfüllung ist nur am Check-in-Tag verfügbar!',
    ru: 'Предварительное заполнение доступно только в день регистрации!',
    fr: 'Le pré-remplissage n\'est disponible que le jour de l\'enregistrement!',
    ro: 'Pre-completarea este disponibilă doar în ziua de check-in!',
    pl: 'Wstępne wypełnienie jest dostępne tylko w dniu check-in!',
    he: '!מילוי מראש זמין רק ביום הצ\'ק-אין',
    es: '¡El pre-relleno solo está disponible el día del check-in!'
  },
  bookingNotFound: {
    en: 'Booking not found! Please check your booking code.',
    el: 'Δεν βρέθηκε κράτηση! Παρακαλώ ελέγξτε τον κωδικό ναύλου.',
    it: 'Prenotazione non trovata! Controlla il codice.',
    de: 'Buchung nicht gefunden! Bitte Code pr\u00fcfen.',
    ru: 'Бронирование не найдено!',
    fr: 'R\u00e9servation introuvable! V\u00e9rifiez le code.',
    ro: 'Rezervarea nu a fost g\u0103sit\u0103!',
    pl: 'Rezerwacja nie znaleziona!',
    he: '!\u05d4\u05d6\u05de\u05e0\u05d4 \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0\u05d4',
    es: '\u00a1Reserva no encontrada!'
  },
  enterBookingOrDate: {
    en: 'Enter Booking Code or Check-in Date', el: 'Κωδικός Ναύλου ή Ημερομηνία Επιβίβασης',
    it: 'Codice prenotazione o data check-in', de: 'Buchungscode oder Check-in-Datum',
    ru: 'Код бронирования или дата регистрации', fr: 'Code de réservation ou date d\'enregistrement',
    ro: 'Cod de rezervare sau data check-in', pl: 'Kod rezerwacji lub data check-in',
    he: 'קוד הזמנה או תאריך צ\'ק-אין', es: 'Código de reserva o fecha de check-in'
  },
};

export function getTranslations(lang: string) {
  const l = (lang || 'en') as LangCode;
  const result: Record<string, string> = {};
  for (const key in T) {
    result[key] = T[key][l] || T[key].en;
  }
  return result;
}

export default T;
