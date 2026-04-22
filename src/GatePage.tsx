import authService from './authService';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flagImg } from './shared-components';
import { useSignatureTouch } from './utils/useSignatureTouch';

// ============================================================
// GATE PAGE — Tailwind Yachting
// Entry point: email verification + GDPR consent + staff login
// ============================================================

const API_BASE = '/api';
const EMAIL_API = '/email/send-email';

// ---------- LANGUAGE DATA ----------

interface LangOption {
  code: string;
  name: string;
  flag: string;
  country: string;
}

const LANGUAGES: LangOption[] = [
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', country: 'GR' },
  { code: 'en', name: 'English', flag: '🇬🇧', country: 'GB' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', country: 'IT' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', country: 'DE' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', country: 'RU' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', country: 'FR' },
  { code: 'ro', name: 'Română', flag: '🇷🇴', country: 'RO' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', country: 'PL' },
  { code: 'he', name: 'עברית', flag: '🇮🇱', country: 'IL' },
  { code: 'es', name: 'Español', flag: '🇪🇸', country: 'ES' },
];

// ---------- TRANSLATIONS ----------

const T: Record<string, Record<string, string>> = {
  welcome: {
      userGuide: {
        en: 'User Guide', el: 'Οδηγός Χρήσης', it: 'Guida Utente', de: 'Benutzerhandbuch',
        ru: 'Руководство пользователя', fr: "Guide d'utilisation", ro: 'Ghidul utilizatorului',
        pl: 'Przewodnik użytkownika', he: 'מדריך משתמש', es: 'Guía de Usuario'
      },
    el: 'Καλωσήρθατε στην Tailwind Yachting',
    en: 'Welcome to Tailwind Yachting',
    it: 'Benvenuti a Tailwind Yachting',
    de: 'Willkommen bei Tailwind Yachting',
    ru: 'Добро пожаловать в Tailwind Yachting',
    fr: 'Bienvenue chez Tailwind Yachting',
    ro: 'Bun venit la Tailwind Yachting',
    pl: 'Witamy w Tailwind Yachting',
    he: 'ברוכים הבאים ל-Tailwind Yachting',
    es: 'Bienvenido a Tailwind Yachting',
  },
  subtitle: {
    el: 'Ιστιοπλοϊκές διακοπές στην Ελλάδα',
    en: 'Sailing holidays in Greece',
    it: 'Vacanze in barca a vela in Grecia',
    de: 'Segelurlaub in Griechenland',
    ru: 'Парусный отдых в Греции',
    fr: 'Vacances à la voile en Grèce',
    ro: 'Vacanțe cu velierul în Grecia',
    pl: 'Żeglarskie wakacje w Grecji',
    he: 'חופשות שיט ביוון',
    es: 'Vacaciones en velero en Grecia',
  },
  clientBtn: {
    el: 'Πελάτης / Ναυλωτής',
    en: 'Client / Charterer',
    it: 'Cliente / Noleggiatore',
    de: 'Kunde / Charterer',
    ru: 'Клиент / Чартер',
    fr: 'Client / Affréteur',
    ro: 'Client / Navlositor',
    pl: 'Klient / Czarterujący',
    he: 'לקוח / שוכר',
    es: 'Cliente / Fletador',
  },
  staffBtn: {
    el: 'Υπάλληλος / Πλοιοκτήτης',
    en: 'Staff / Owner',
    it: 'Personale / Proprietario',
    de: 'Mitarbeiter / Eigner',
    ru: 'Сотрудник / Владелец',
    fr: 'Personnel / Propriétaire',
    ro: 'Personal / Proprietar',
    pl: 'Pracownik / Właściciel',
    he: 'צוות / בעלים',
    es: 'Personal / Propietario',
  },
  emailLabel: {
    el: 'Email ή Αριθμός Ναύλου',
    en: 'Email or Charter Number',
    it: 'Inserisci la tua email',
    de: 'Geben Sie Ihre E-Mail ein',
    ru: 'Введите вашу электронную почту',
    fr: 'Entrez votre email',
    ro: 'Introduceți email-ul dvs.',
    pl: 'Wprowadź swój email',
    he: 'הזן את האימייל שלך',
    es: 'Introduce tu email',
  },
  sendCode: {
    el: 'Αποστολή Κωδικού',
    en: 'Send Code',
    it: 'Invia Codice',
    de: 'Code Senden',
    ru: 'Отправить Код',
    fr: 'Envoyer le Code',
    ro: 'Trimite Codul',
    pl: 'Wyślij Kod',
    he: 'שלח קוד',
    es: 'Enviar Código',
  },
  enterBtn: {
    el: 'Είσοδος',
    en: 'Enter',
    it: 'Entra',
    de: 'Anmelden',
    ru: 'Войти',
    fr: 'Entrer',
    ro: 'Intră',
    pl: 'Wejdź',
    he: 'כניסה',
    es: 'Entrar',
  },
  ymSuite: {
    el: 'Yacht Management Suite',
    en: 'Yacht Management Suite',
    it: 'Yacht Management Suite',
    de: 'Yacht Management Suite',
    ru: 'Yacht Management Suite',
    fr: 'Yacht Management Suite',
    ro: 'Yacht Management Suite',
    pl: 'Yacht Management Suite',
    he: 'Yacht Management Suite',
    es: 'Yacht Management Suite',
  },
  digitalCheckIn: {
    el: 'Ψηφιακό Σύστημα Check-In',
    en: 'Digital Check-In System',
    it: 'Sistema Check-In Digitale',
    de: 'Digitales Check-In-System',
    ru: 'Цифровая система регистрации',
    fr: 'Système de Check-In Numérique',
    ro: 'Sistem Digital de Check-In',
    pl: 'Cyfrowy System Check-In',
    he: 'מערכת צ\'ק-אין דיגיטלית',
    es: 'Sistema de Check-In Digital',
  },
  alreadyHaveAccount: {
    el: 'Έχεις ήδη λογαριασμό;',
    en: 'Already have an account?',
    it: 'Hai già un account?',
    de: 'Hast du bereits ein Konto?',
    ru: 'Уже есть аккаунт?',
    fr: 'Vous avez déjà un compte?',
    ro: 'Ai deja un cont?',
    pl: 'Masz już konto?',
    he: 'כבר יש לך חשבון?',
    es: '¿Ya tienes una cuenta?',
  },
  loginBtn: {
    el: 'Σύνδεση',
    en: 'Login',
    it: 'Accedi',
    de: 'Anmelden',
    ru: 'Войти',
    fr: 'Connexion',
    ro: 'Autentificare',
    pl: 'Zaloguj',
    he: 'התחבר',
    es: 'Iniciar Sesión',
  },
  newToSuite: {
    el: 'Νέος στο Yacht Management Suite;',
    en: 'New to Yacht Management Suite?',
    it: 'Nuovo su Yacht Management Suite?',
    de: 'Neu bei Yacht Management Suite?',
    ru: 'Новичок в Yacht Management Suite?',
    fr: 'Nouveau sur Yacht Management Suite?',
    ro: 'Nou pe Yacht Management Suite?',
    pl: 'Nowy w Yacht Management Suite?',
    he: 'חדש ב-Yacht Management Suite?',
    es: '¿Nuevo en Yacht Management Suite?',
  },
  createAccountBtn: {
    el: 'Δημιουργία Λογαριασμού',
    en: 'Create an account',
    it: 'Crea un account',
    de: 'Konto erstellen',
    ru: 'Создать аккаунт',
    fr: 'Créer un compte',
    ro: 'Creează un cont',
    pl: 'Utwórz konto',
    he: 'צור חשבון',
    es: 'Crear una cuenta',
  },
  codeLabel: {
    el: 'Εισάγετε τον 6ψήφιο κωδικό',
    en: 'Enter 6-digit code',
    it: 'Inserisci il codice a 6 cifre',
    de: 'Geben Sie den 6-stelligen Code ein',
    ru: 'Введите 6-значный код',
    fr: 'Entrez le code à 6 chiffres',
    ro: 'Introduceți codul de 6 cifre',
    pl: 'Wprowadź 6-cyfrowy kod',
    he: 'הזן קוד בן 6 ספרות',
    es: 'Introduce el código de 6 dígitos',
  },
  verify: {
    el: 'Επαλήθευση',
    en: 'Verify',
    it: 'Verifica',
    de: 'Bestätigen',
    ru: 'Подтвердить',
    fr: 'Vérifier',
    ro: 'Verifică',
    pl: 'Zweryfikuj',
    he: 'אימות',
    es: 'Verificar',
  },
  codeSent: {
    el: 'Κωδικός στάλθηκε στο email σας',
    en: 'Code sent to your email',
    it: 'Codice inviato alla tua email',
    de: 'Code an Ihre E-Mail gesendet',
    ru: 'Код отправлен на вашу почту',
    fr: 'Code envoyé à votre email',
    ro: 'Codul a fost trimis la email',
    pl: 'Kod wysłany na Twój email',
    he: 'הקוד נשלח לאימייל שלך',
    es: 'Código enviado a tu email',
  },
  nameLabel: {
    el: 'Ονοματεπώνυμο',
    en: 'Full Name',
    it: 'Nome Completo',
    de: 'Vollständiger Name',
    ru: 'Полное имя',
    fr: 'Nom Complet',
    ro: 'Nume Complet',
    pl: 'Imię i Nazwisko',
    he: 'שם מלא',
    es: 'Nombre Completo',
  },
  continueBtn: {
    el: 'Συνέχεια',
    en: 'Continue',
    it: 'Continua',
    de: 'Weiter',
    ru: 'Продолжить',
    fr: 'Continuer',
    ro: 'Continuă',
    pl: 'Kontynuuj',
    he: 'המשך',
    es: 'Continuar',
  },
  gdprTitle: {
    el: 'Προστασία Προσωπικών Δεδομένων (GDPR)',
    en: 'Data Protection (GDPR)',
    it: 'Protezione dei Dati (GDPR)',
    de: 'Datenschutz (DSGVO)',
    ru: 'Защита Данных (GDPR)',
    fr: 'Protection des Données (RGPD)',
    ro: 'Protecția Datelor (GDPR)',
    pl: 'Ochrona Danych (RODO)',
    he: 'הגנת מידע (GDPR)',
    es: 'Protección de Datos (RGPD)',
  },
  gdprAccept: {
    el: 'Αποδέχομαι',
    en: 'I Accept',
    it: 'Accetto',
    de: 'Ich akzeptiere',
    ru: 'Принимаю',
    fr: 'J\'accepte',
    ro: 'Accept',
    pl: 'Akceptuję',
    he: 'אני מסכים/ה',
    es: 'Acepto',
  },
  signTitle: {
    el: 'Υπογραφή',
    en: 'Signature',
    it: 'Firma',
    de: 'Unterschrift',
    ru: 'Подпись',
    fr: 'Signature',
    ro: 'Semnătură',
    pl: 'Podpis',
    he: 'חתימה',
    es: 'Firma',
  },
  signInstruction: {
    el: 'Υπογράψτε με το δάχτυλο ή το ποντίκι',
    en: 'Sign with your finger or mouse',
    it: 'Firma con il dito o il mouse',
    de: 'Unterschreiben Sie mit dem Finger oder der Maus',
    ru: 'Подпишите пальцем или мышью',
    fr: 'Signez avec votre doigt ou la souris',
    ro: 'Semnați cu degetul sau mouse-ul',
    pl: 'Podpisz palcem lub myszką',
    he: 'חתום באצבע או בעכבר',
    es: 'Firme con el dedo o el ratón',
  },
  clearSign: {
    el: 'Καθαρισμός',
    en: 'Clear',
    it: 'Cancella',
    de: 'Löschen',
    ru: 'Очистить',
    fr: 'Effacer',
    ro: 'Șterge',
    pl: 'Wyczyść',
    he: 'נקה',
    es: 'Borrar',
  },
  submitGdpr: {
    el: 'Αποδοχή & Συνέχεια',
    en: 'Accept & Continue',
    it: 'Accetta & Continua',
    de: 'Akzeptieren & Weiter',
    ru: 'Принять & Продолжить',
    fr: 'Accepter & Continuer',
    ro: 'Acceptă & Continuă',
    pl: 'Akceptuj & Kontynuuj',
    he: 'אישור והמשך',
    es: 'Aceptar & Continuar',
  },
  bookingLabel: {
    el: 'Αριθμός Ναύλου (π.χ. 1000)',
    en: 'Charter Number (e.g. 1000)',
    it: 'Numero Noleggio (es. 1000)',
    de: 'Charter-Nummer (z.B. 1000)',
    ru: 'Номер чартера (напр. 1000)',
    fr: 'Numéro d\'affrètement (ex. 1000)',
    ro: 'Număr Charter (ex. 1000)',
    pl: 'Numer Czarteru (np. 1000)',
    he: 'מספר שכירות (למשל 1000)',
    es: 'Número de Fletamento (ej. 1000)',
  },
  enterApp: {
    el: 'Είσοδος',
    en: 'Enter',
    it: 'Entra',
    de: 'Eintreten',
    ru: 'Войти',
    fr: 'Entrer',
    ro: 'Intră',
    pl: 'Wejdź',
    he: 'כניסה',
    es: 'Entrar',
  },
  staffCode: {
    el: 'Κωδικός Πρόσβασης',
    en: 'Access Code',
    it: 'Codice di Accesso',
    de: 'Zugangscode',
    ru: 'Код Доступа',
    fr: 'Code d\'accès',
    ro: 'Cod de Acces',
    pl: 'Kod Dostępu',
    he: 'קוד גישה',
    es: 'Código de Acceso',
  },
  staffLogin: {
    el: 'Σύνδεση',
    en: 'Login',
    it: 'Accedi',
    de: 'Anmelden',
    ru: 'Войти',
    fr: 'Se connecter',
    ro: 'Conectare',
    pl: 'Zaloguj',
    he: 'התחבר',
    es: 'Iniciar Sesión',
  },
  back: {
    el: 'Πίσω',
    en: 'Back',
    it: 'Indietro',
    de: 'Zurück',
    ru: 'Назад',
    fr: 'Retour',
    ro: 'Înapoi',
    pl: 'Wstecz',
    he: 'חזרה',
    es: 'Atrás',
  },
  invalidCode: {
    el: 'Λάθος κωδικός. Δοκιμάστε ξανά.',
    en: 'Invalid code. Please try again.',
    it: 'Codice non valido. Riprova.',
    de: 'Ungültiger Code. Bitte versuchen Sie es erneut.',
    ru: 'Неверный код. Попробуйте снова.',
    fr: 'Code invalide. Veuillez réessayer.',
    ro: 'Cod invalid. Încercați din nou.',
    pl: 'Nieprawidłowy kod. Spróbuj ponownie.',
    he: 'קוד שגוי. נסה שוב.',
    es: 'Código inválido. Inténtelo de nuevo.',
  },
  resendCode: {
    el: 'Αποστολή νέου κωδικού',
    en: 'Resend code',
    it: 'Rinvia codice',
    de: 'Code erneut senden',
    ru: 'Отправить код повторно',
    fr: 'Renvoyer le code',
    ro: 'Retrimite codul',
    pl: 'Wyślij kod ponownie',
    he: 'שלח קוד שוב',
    es: 'Reenviar código',
  },
  orBookingNumber: {
    el: 'ή εισάγετε αριθμό ναύλου',
    en: 'or enter charter number',
    it: 'o inserisci il numero di noleggio',
    de: 'oder Charter-Nummer eingeben',
    ru: 'или введите номер чартера',
    fr: 'ou entrez le numéro d\'affrètement',
    ro: 'sau introduceți numărul de charter',
    pl: 'lub wprowadź numer czarteru',
    he: 'או הזן מספר שכירות',
    es: 'o introduce el número de fletamento',
  },
  skipBooking: {
    el: 'Παράλειψη',
    en: 'Skip',
    it: 'Salta',
    de: 'Überspringen',
    ru: 'Пропустить',
    fr: 'Passer',
    ro: 'Sari peste',
    pl: 'Pomiń',
    he: 'דלג',
    es: 'Omitir',
  },
  processing: {
    el: 'Παρακαλώ περιμένετε...',
    en: 'Please wait...',
    it: 'Attendere prego...',
    de: 'Bitte warten...',
    ru: 'Пожалуйста, подождите...',
    fr: 'Veuillez patienter...',
    ro: 'Vă rugăm așteptați...',
    pl: 'Proszę czekać...',
    he: 'אנא המתן...',
    es: 'Por favor espere...',
  },
};

// ---------- GDPR TEXTS ----------

const GDPR_TEXTS: Record<string, { s1: string; s2: string; s3: string }> = {
  el: {
    s1: 'Σύμφωνα με τον General Data Protection Regulation (Γενικός Κανονισμός Προστασίας Δεδομένων – GDPR), η εταιρεία μας συλλέγει και επεξεργάζεται τα προσωπικά σας δεδομένα, όπως το ονοματεπώνυμο, το email, τον αριθμό τηλεφώνου και τα στοιχεία διαβατηρίου, αποκλειστικά για συγκεκριμένους και νόμιμους σκοπούς. Τα δεδομένα αυτά χρησιμοποιούνται μόνο για την επικοινωνία μαζί σας μέσω ηλεκτρονικής αλληλογραφίας, για τη σύνταξη του ναυλοσυμφώνου και της crew list, καθώς και για την υποχρεωτική καταχώρησή τους στο εκάστοτε Λιμεναρχείο, προκειμένου να καταστεί δυνατή η νόμιμη αναχώρηση του σκάφους.',
    s2: 'Επιπλέον, τα στοιχεία αυτά ενδέχεται να χρησιμοποιηθούν μόνο εφόσον απαιτηθεί από τις αρμόδιες αρχές, σε περίπτωση ελέγχου ή ατυχήματος, σύμφωνα με την ισχύουσα νομοθεσία. Η εταιρεία μας δεσμεύεται να διασφαλίζει την προστασία και την εμπιστευτικότητα των προσωπικών σας δεδομένων και να μην τα χρησιμοποιεί για οποιονδήποτε άλλο σκοπό πέραν των ανωτέρω.',
    s3: 'Η εταιρεία δεν φέρει καμία ευθύνη για οποιαδήποτε περαιτέρω επεξεργασία ή χρήση των δεδομένων από το εκάστοτε Λιμεναρχείο ή οποιαδήποτε άλλη αρμόδια αρχή, στο πλαίσιο των νόμιμων αρμοδιοτήτων τους.',
  },
  en: {
    s1: 'In accordance with the General Data Protection Regulation (GDPR), our company collects and processes your personal data, such as your full name, email, phone number and passport details, exclusively for specific and lawful purposes. This data is used solely for communicating with you via email, for drafting the charter agreement and crew list, and for the mandatory registration with the respective Port Authority, in order to enable the lawful departure of the vessel.',
    s2: 'Furthermore, this data may only be used if required by the competent authorities, in case of inspection or accident, in accordance with applicable law. Our company is committed to ensuring the protection and confidentiality of your personal data and to not using it for any purpose other than those stated above.',
    s3: 'The company bears no responsibility for any further processing or use of data by the respective Port Authority or any other competent authority, within the scope of their lawful duties.',
  },
  it: {
    s1: 'In conformità al Regolamento Generale sulla Protezione dei Dati (GDPR), la nostra azienda raccoglie e tratta i vostri dati personali, come nome completo, email, numero di telefono e dati del passaporto, esclusivamente per scopi specifici e leciti. Questi dati vengono utilizzati solo per la comunicazione via email, per la redazione del contratto di noleggio e della lista equipaggio, nonché per la registrazione obbligatoria presso la Capitaneria di Porto competente, al fine di consentire la partenza legale dell\'imbarcazione.',
    s2: 'Inoltre, questi dati potranno essere utilizzati solo se richiesto dalle autorità competenti, in caso di ispezione o incidente, in conformità alla legislazione vigente. La nostra azienda si impegna a garantire la protezione e la riservatezza dei vostri dati personali e a non utilizzarli per scopi diversi da quelli sopra indicati.',
    s3: 'L\'azienda non si assume alcuna responsabilità per qualsiasi ulteriore trattamento o utilizzo dei dati da parte della rispettiva Capitaneria di Porto o di qualsiasi altra autorità competente, nell\'ambito delle loro competenze legali.',
  },
  de: {
    s1: 'Gemäß der Datenschutz-Grundverordnung (DSGVO) erhebt und verarbeitet unser Unternehmen Ihre personenbezogenen Daten wie vollständigen Namen, E-Mail, Telefonnummer und Reisepassdaten ausschließlich für bestimmte und rechtmäßige Zwecke. Diese Daten werden nur für die Kommunikation per E-Mail, die Erstellung des Chartervertrags und der Crewliste sowie für die obligatorische Registrierung bei der zuständigen Hafenbehörde verwendet, um die rechtmäßige Abfahrt des Schiffes zu ermöglichen.',
    s2: 'Darüber hinaus können diese Daten nur verwendet werden, wenn dies von den zuständigen Behörden im Falle einer Kontrolle oder eines Unfalls gemäß geltendem Recht verlangt wird. Unser Unternehmen verpflichtet sich, den Schutz und die Vertraulichkeit Ihrer personenbezogenen Daten zu gewährleisten und sie nicht für andere als die oben genannten Zwecke zu verwenden.',
    s3: 'Das Unternehmen übernimmt keine Verantwortung für jede weitere Verarbeitung oder Nutzung der Daten durch die jeweilige Hafenbehörde oder eine andere zuständige Behörde im Rahmen ihrer gesetzlichen Zuständigkeiten.',
  },
  ru: {
    s1: 'В соответствии с Общим регламентом защиты данных (GDPR), наша компания собирает и обрабатывает ваши персональные данные, такие как полное имя, электронная почта, номер телефона и данные паспорта, исключительно в конкретных и законных целях. Эти данные используются только для связи с вами по электронной почте, для составления чартерного договора и списка экипажа, а также для обязательной регистрации в соответствующей портовой администрации с целью обеспечения законного отплытия судна.',
    s2: 'Кроме того, эти данные могут быть использованы только по требованию компетентных органов в случае проверки или несчастного случая в соответствии с действующим законодательством. Наша компания обязуется обеспечивать защиту и конфиденциальность ваших персональных данных и не использовать их в каких-либо иных целях, кроме вышеуказанных.',
    s3: 'Компания не несет ответственности за любую дальнейшую обработку или использование данных соответствующей портовой администрацией или любым другим компетентным органом в рамках их законных полномочий.',
  },
  fr: {
    s1: 'Conformément au Règlement Général sur la Protection des Données (RGPD), notre société collecte et traite vos données personnelles, telles que nom complet, email, numéro de téléphone et données de passeport, exclusivement à des fins spécifiques et légitimes. Ces données sont utilisées uniquement pour la communication par email, la rédaction du contrat d\'affrètement et de la liste d\'équipage, ainsi que pour l\'enregistrement obligatoire auprès de l\'autorité portuaire compétente, afin de permettre le départ légal du navire.',
    s2: 'En outre, ces données ne pourront être utilisées que si les autorités compétentes l\'exigent, en cas de contrôle ou d\'accident, conformément à la législation en vigueur. Notre société s\'engage à assurer la protection et la confidentialité de vos données personnelles et à ne pas les utiliser à d\'autres fins que celles mentionnées ci-dessus.',
    s3: 'La société décline toute responsabilité pour tout traitement ou utilisation ultérieure des données par l\'autorité portuaire concernée ou toute autre autorité compétente, dans le cadre de leurs attributions légales.',
  },
  ro: {
    s1: 'În conformitate cu Regulamentul General privind Protecția Datelor (GDPR), compania noastră colectează și prelucrează datele dumneavoastră personale, precum numele complet, email-ul, numărul de telefon și datele pașaportului, exclusiv în scopuri specifice și legale. Aceste date sunt utilizate doar pentru comunicarea prin email, pentru întocmirea contractului de charter și a listei echipajului, precum și pentru înregistrarea obligatorie la Autoritatea Portuară competentă, pentru a permite plecarea legală a navei.',
    s2: 'În plus, aceste date pot fi utilizate doar dacă este solicitat de autoritățile competente, în caz de control sau accident, în conformitate cu legislația în vigoare. Compania noastră se angajează să asigure protecția și confidențialitatea datelor dumneavoastră personale și să nu le utilizeze în alte scopuri decât cele menționate mai sus.',
    s3: 'Compania nu poartă nicio responsabilitate pentru orice prelucrare sau utilizare ulterioară a datelor de către Autoritatea Portuară respectivă sau orice altă autoritate competentă, în cadrul atribuțiilor lor legale.',
  },
  pl: {
    s1: 'Zgodnie z Ogólnym Rozporządzeniem o Ochronie Danych (RODO), nasza firma zbiera i przetwarza Państwa dane osobowe, takie jak imię i nazwisko, email, numer telefonu oraz dane paszportowe, wyłącznie w określonych i zgodnych z prawem celach. Dane te są wykorzystywane jedynie do komunikacji mailowej, sporządzenia umowy czarterowej i listy załogi, a także do obowiązkowej rejestracji w odpowiednim Urzędzie Portowym, w celu umożliwienia legalnego wypłynięcia jednostki.',
    s2: 'Ponadto dane te mogą być wykorzystane wyłącznie na żądanie właściwych organów, w przypadku kontroli lub wypadku, zgodnie z obowiązującym prawem. Nasza firma zobowiązuje się do zapewnienia ochrony i poufności Państwa danych osobowych oraz do niewykorzystywania ich w żadnym innym celu niż wymienione powyżej.',
    s3: 'Firma nie ponosi żadnej odpowiedzialności za jakiekolwiek dalsze przetwarzanie lub wykorzystanie danych przez odpowiedni Urząd Portowy lub jakikolwiek inny właściwy organ, w zakresie ich ustawowych kompetencji.',
  },
  he: {
    s1: 'בהתאם לתקנת הגנת המידע הכללית (GDPR), חברתנו אוספת ומעבדת את הנתונים האישיים שלכם, כגון שם מלא, דוא"ל, מספר טלפון ופרטי דרכון, אך ורק למטרות ספציפיות וחוקיות. נתונים אלה משמשים רק לתקשורת באמצעות דוא"ל, לעריכת הסכם השכרת היאכטה ורשימת הצוות, וכן לרישום החובה ברשות הנמל המוסמכת, על מנת לאפשר את יציאת כלי השיט כדין.',
    s2: 'בנוסף, נתונים אלה עשויים לשמש רק אם נדרש על ידי הרשויות המוסמכות, במקרה של ביקורת או תאונה, בהתאם לחוק החל. חברתנו מתחייבת להבטיח את ההגנה והסודיות של הנתונים האישיים שלכם ולא להשתמש בהם לכל מטרה אחרת מלבד האמור לעיל.',
    s3: 'החברה אינה נושאת באחריות כלשהי לכל עיבוד או שימוש נוסף בנתונים על ידי רשות הנמל המתאימה או כל רשות מוסמכת אחרת, במסגרת סמכויותיהן החוקיות.',
  },
  es: {
    s1: 'De acuerdo con el Reglamento General de Protección de Datos (RGPD), nuestra empresa recopila y procesa sus datos personales, como nombre completo, correo electrónico, número de teléfono y datos del pasaporte, exclusivamente para fines específicos y legítimos. Estos datos se utilizan únicamente para la comunicación por correo electrónico, la redacción del contrato de fletamento y la lista de tripulación, así como para el registro obligatorio ante la Autoridad Portuaria correspondiente, a fin de permitir la salida legal de la embarcación.',
    s2: 'Además, estos datos solo podrán ser utilizados si lo requieren las autoridades competentes, en caso de inspección o accidente, de acuerdo con la legislación vigente. Nuestra empresa se compromete a garantizar la protección y confidencialidad de sus datos personales y a no utilizarlos para ningún fin distinto a los mencionados anteriormente.',
    s3: 'La empresa no asume ninguna responsabilidad por cualquier procesamiento o uso posterior de los datos por parte de la Autoridad Portuaria respectiva o cualquier otra autoridad competente, en el ámbito de sus competencias legales.',
  },
};

const GDPR_SECTION_TITLES: Record<string, { t1: string; t2: string; t3: string }> = {
  el: { t1: 'Συλλογή & Χρήση Δεδομένων', t2: 'Χρήση από Αρχές', t3: 'Περιορισμός Ευθύνης' },
  en: { t1: 'Data Collection & Use', t2: 'Use by Authorities', t3: 'Limitation of Liability' },
  it: { t1: 'Raccolta e Utilizzo dei Dati', t2: 'Utilizzo da parte delle Autorità', t3: 'Limitazione di Responsabilità' },
  de: { t1: 'Datenerhebung & Nutzung', t2: 'Nutzung durch Behörden', t3: 'Haftungsbeschränkung' },
  ru: { t1: 'Сбор и Использование Данных', t2: 'Использование Властями', t3: 'Ограничение Ответственности' },
  fr: { t1: 'Collecte et Utilisation des Données', t2: 'Utilisation par les Autorités', t3: 'Limitation de Responsabilité' },
  ro: { t1: 'Colectarea și Utilizarea Datelor', t2: 'Utilizarea de către Autorități', t3: 'Limitarea Responsabilității' },
  pl: { t1: 'Zbieranie i Wykorzystanie Danych', t2: 'Wykorzystanie przez Organy', t3: 'Ograniczenie Odpowiedzialności' },
  he: { t1: 'איסוף ושימוש בנתונים', t2: 'שימוש על ידי רשויות', t3: 'הגבלת אחריות' },
  es: { t1: 'Recopilación y Uso de Datos', t2: 'Uso por Autoridades', t3: 'Limitación de Responsabilidad' },
};

// ---------- STYLES ----------

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #6bb6f5 0%, #1e90ff 50%, #87ceeb 100%)',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    padding: '20px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.2)',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  langBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  langBtn: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#fff',
    transition: 'all 0.2s',
  },
  langBtnActive: {
    background: 'rgba(255,255,255,0.3)',
    border: '1px solid rgba(255,255,255,0.6)',
    borderRadius: '8px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#fff',
    fontWeight: 'bold',
  },
  card: {
    background: 'rgba(255,255,255,0.95)',
    color: '#1a2a3a',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '90%',
    margin: '30px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center' as const,
    color: '#2d5a8a',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: '25px',
  },
  input: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '2px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '15px',
    transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #2d5a8a, #4da8da)',
    color: '#fff',
    transition: 'all 0.2s',
    marginBottom: '10px',
  },
  btnSecondary: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #2d5a8a',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    background: 'transparent',
    color: '#2d5a8a',
    transition: 'all 0.2s',
    marginBottom: '10px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: '#fee',
    color: '#c00',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  success: {
    background: '#efe',
    color: '#060',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    textAlign: 'center' as const,
  },
  gdprSection: {
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '12px',
    padding: '15px',
    marginBottom: '15px',
  },
  gdprSectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2d5a8a',
    marginBottom: '8px',
  },
  gdprText: {
    fontSize: '13px',
    color: '#444',
    lineHeight: '1.6',
    marginBottom: '10px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2d5a8a',
  },
  canvas: {
    border: '2px solid #ccc',
    borderRadius: '12px',
    background: '#fff',
    cursor: 'crosshair',
    touchAction: 'none',
    width: '100%',
    height: '150px',
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#4da8da',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0',
    marginBottom: '15px',
    display: 'inline-block',
  },
  heroSection: {
    textAlign: 'center' as const,
    padding: '40px 20px 10px',
  },
  heroTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    marginBottom: '10px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '15px 0',
    color: '#999',
    fontSize: '13px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#ddd',
  },
};

// ============================================================
// COMPONENT
// ============================================================

type Step = 'landing' | 'email' | 'verify' | 'name' | 'gdpr' | 'booking' | 'staff';

const GatePage: React.FC = () => {
  const [lang, setLang] = useState<string>(() => {
    return 'en';
  });
  const [step, setStep] = useState<Step>('landing');
  const [isLoginMode, setIsLoginMode] = useState(false); // true = Login flow (Enter btn), false = Create (Send Code btn)
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [staffCode, setStaffCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [consentId, setConsentId] = useState<number | null>(null);
  const [gdpr1, setGdpr1] = useState(false);
  const [gdpr2, setGdpr2] = useState(false);
  const [gdpr3, setGdpr3] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasGdpr, setHasGdpr] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSignatureTouch(canvasRef);
  const isDrawing = useRef(false);

  // Helper
  const t = useCallback((key: string): string => {
    return T[key]?.[lang] || T[key]?.['en'] || key;
  }, [lang]);

  // Persist language
  useEffect(() => {
    
  }, [lang]);

  // Check if returning user
  useEffect(() => {
    const savedEmail = '';
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // ---------- API CALLS ----------

  const sendCode = async () => {
    const val = email.trim();
    if (!val) { setError(lang === 'el' ? 'Εισάγετε email, booking ή κωδικό staff' : 'Please enter email, booking code, or staff code'); return; }

    // ===================== STAFF CODE DETECTION =====================
    if (!val.includes('@') && !/^\d+$/.test(val) && !/^CHARTER/i.test(val)) {
      setLoading(true); setError('');
      try {
        const staffResp = await fetch(`${API_BASE}/employees.php`);
        const staffData = await staffResp.json();
        const employees = Array.isArray(staffData) ? staffData : (staffData.employees || []);
        const found = employees.find((e: any) => e.code && e.code.toUpperCase() === val.toUpperCase() && e.enabled);
        if (found) {
          if (!isLoginMode) {
            // Create mode — staff already exists, must use Login
            setError(lang === 'el' ? 'Staff πρέπει να χρησιμοποιεί Login (έχετε ήδη κωδικό)' : 'Staff should use Login (you already have an account)');
            setLoading(false);
            return;
          }
          // Login mode — proceed with staff auth
          const user = { code: found.code, name: found.name, role: found.role, permissions: found.permissions, loginTime: new Date().toISOString() };
          sessionStorage.setItem('auth_current_user', JSON.stringify(user));
          localStorage.setItem('employeeCode', found.code);
          sessionStorage.setItem('yacht_lang', lang);
          if (found.role === 'OWNER') {
            window.location.href = '/owner-dashboard';
          } else {
            window.location.href = '/home';
          }
          return;
        }
      } catch (e) { /* fall through to booking logic */ }
      setLoading(false);
    }

    // ===================== BOOKING NUMBER PATH (no @) =====================
    if (!val.includes('@')) {
      setLoading(true); setError('');
      try {
        const bn = val.match(/\d+/) ? 'CHARTER PARTY NO ' + val.match(/\d+/)[0] : val;
        const resp = await fetch(API_BASE + '/verify-email.php', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({action:'check_booking', booking_number: bn})
        });
        const data = await resp.json();

        if (!isLoginMode) {
          // ===== CREATE MODE =====
          if (data.success && data.has_gdpr) {
            setError(lang === 'el' ? 'Αυτό το booking έχει ήδη account. Χρησιμοποιήστε Login' : 'This booking already has an account. Please use Login');
            setLoading(false);
            return;
          }
          if (data.success) {
            // Booking exists but no GDPR → allow registration
            setBookingNumber(bn);
            setError(lang === 'el' ? 'Εισάγετε email για εγγραφή σε αυτό το booking' : 'Enter your email to register for this booking');
            setLoading(false);
            return;
          }
          setError(lang === 'el' ? 'Μη έγκυρος αριθμός booking' : 'Invalid booking number');
          setLoading(false);
          return;
        }

        // ===== LOGIN MODE =====
        if (data.success && data.has_gdpr) {
          sessionStorage.setItem('yacht_lang', lang);
          window.location.href = '/home?booking=' + encodeURIComponent(bn);
          return;
        }
        if (data.success) {
          // Booking exists but no account yet
          setError(lang === 'el' ? 'Το booking δεν έχει ακόμα account. Χρησιμοποιήστε Create an account' : 'This booking has no account yet. Please use Create an account');
          setLoading(false);
          return;
        }
        setError(lang === 'el' ? 'Το booking δεν βρέθηκε' : 'Booking not found');
        setLoading(false);
        return;
      } catch(e) { setError('Network error'); setLoading(false); return; }
    }

    // ===================== EMAIL PATH =====================
    // Check if user exists in gdpr_consents
    let gdprExists = false;
    try {
        const gdprResp = await fetch(`${API_BASE}/verify-email.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_gdpr', email: email.toLowerCase().trim() }),
        });
        const gdprData = await gdprResp.json();
        gdprExists = gdprData.success && gdprData.has_gdpr;
    } catch (e) { console.error('check_gdpr error', e); }

    if (!isLoginMode) {
      // ===== CREATE MODE =====
      if (gdprExists) {
        setError(lang === 'el' ? 'Αυτό το email είναι ήδη εγγεγραμμένο. Χρησιμοποιήστε Login' : 'You already have an account. Please use Login');
        return;
      }
      // New user → send verification code
      setLoading(true); setError('');
      try {
        const resp = await fetch(`${API_BASE}/verify-email.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'send_code', email: email.toLowerCase().trim() }),
        });
        const data = await resp.json();
        if (data.success) {
          setSuccess(t('codeSent'));
          setStep('verify');
        } else {
          setError(data.error || 'Failed to send code');
        }
      } catch (e) {
        setError('Network error');
      }
      setLoading(false);
      return;
    }

    // ===== LOGIN MODE =====
    if (gdprExists) {
      setHasGdpr(true);
      setStep('booking');
      return;
    }
    // Email doesn't have GDPR → Login cannot proceed
    setError(lang === 'el' ? 'Το email δεν βρέθηκε. Χρησιμοποιήστε Create an account' : 'Account not found. Please use Create an account');
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      setError(lang === 'el' ? 'Εισάγετε τον 6ψήφιο κωδικό' : 'Enter the 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/verify-email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', email: email.toLowerCase().trim(), code }),
      });
      const data = await resp.json();
      if (data.success && data.verified) {
        setConsentId(data.consent_id);
        
        // Check if user already has GDPR
        const gdprResp = await fetch(`${API_BASE}/verify-email.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_gdpr', email: email.toLowerCase().trim() }),
        });
        const gdprData = await gdprResp.json();
        if (gdprData.success && gdprData.has_gdpr) {
          setHasGdpr(true);
          setStep('booking');
        } else {
          setStep('name');
        }
      } else {
        setError(t('invalidCode'));
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };


  // Generate GDPR consent PDF with signature
  const generateGdprPdf = async (): Promise<string> => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    doc.addFileToVFS("DejaVuSans.ttf", (window as any).DejaVuSansBase64);
    doc.addFont("DejaVuSans.ttf", "DejaVuSans", "normal");
    doc.addFileToVFS("DejaVuSans-Bold.ttf", (window as any).DejaVuSansBoldBase64);
    doc.addFont("DejaVuSans-Bold.ttf", "DejaVuSans", "bold");
    try {
      const logoResp = await fetch("/logos/tailwind-logo.jpg");
      const logoBlob = await logoResp.blob();
      const logoB64: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoB64, "JPEG", 70, 10, 70, 25);
    } catch (e) { console.error("Logo load failed", e); }
    let y = 45;
    doc.setFont("DejaVuSans", "bold");
    doc.setFontSize(18);
    doc.text("GDPR Consent Receipt", 105, y, { align: "center" });
    y += 15;
    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(11);
    doc.text("Name: " + fullName, 20, y); y += 7;
    doc.text("Email: " + email, 20, y); y += 7;
    doc.text("Charter: " + (bookingNumber || "N/A"), 20, y); y += 7;
    doc.text("Date: " + new Date().toLocaleString(), 20, y); y += 7;
    doc.text("Language: " + lang, 20, y); y += 12;
    doc.setDrawColor(150);
    doc.line(20, y, 190, y);
    y += 10;
    const texts = GDPR_TEXTS[lang] || GDPR_TEXTS.en;
    const titles = GDPR_SECTION_TITLES[lang] || GDPR_SECTION_TITLES.en;
    const sections = [
      { title: titles.t1, text: texts.s1 },
      { title: titles.t2, text: texts.s2 },
      { title: titles.t3, text: texts.s3 },
    ];
    for (const section of sections) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont("DejaVuSans", "bold");
      doc.setFontSize(11);
      doc.text(section.title, 20, y);
      y += 7;
      doc.setFont("DejaVuSans", "normal");
      doc.setFontSize(9);
      const sLines = doc.splitTextToSize(section.text, 170);
      if (y + sLines.length * 4.5 > 275) { doc.addPage(); y = 20; }
      doc.text(sLines, 20, y);
      y += sLines.length * 4.5 + 8;
    }
    if (signatureData) {
      if (y + 45 > 275) { doc.addPage(); y = 20; }
      doc.setFont("DejaVuSans", "bold");
      doc.setFontSize(11);
      doc.text("Signature:", 20, y);
      y += 5;
      try { doc.addImage(signatureData, "PNG", 20, y, 60, 30); } catch(e) {}
      y += 35;
    }
    doc.setFont("DejaVuSans", "normal");
    doc.setFontSize(8);
    doc.text("Tailwind Yachting - www.tailwindyachting.com", 105, 287, { align: "center" });
    const pdfOutput = doc.output("datauristring");
    return pdfOutput.split(",")[1];
  };

  const saveGdpr = async () => {
    if (!gdpr1 || !gdpr2 || !gdpr3) {
      setError(lang === 'el' ? 'Αποδεχτείτε και τις 3 ενότητες' : 'Please accept all 3 sections');
      return;
    }
    if (!signatureData) {
      setError(lang === 'el' ? 'Υπογράψτε πρώτα' : 'Please sign first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/verify-email.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_gdpr', consent_id: consentId, consent_id: consentId, consent_id: consentId,
          email: email.toLowerCase().trim(),
          full_name: fullName,
          language: lang,
          consent_1: true,
          consent_2: true,
          consent_3: true,
          signature_data: signatureData,
          booking_number: bookingNumber || null,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        // Send notification email to info@
        try {
          const pdfBase64 = await generateGdprPdf();
          const pdfAtt = [{ filename: "GDPR-Consent-" + fullName.replace(/\s+/g, "-") + ".pdf", content: pdfBase64, contentType: "application/pdf" }];
          // Send to info@ with PDF
          await fetch(`${API_BASE}/../email/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: "info@tailwindyachting.com",
                subject: "New GDPR Registration - " + email,
                html: `<h3>New GDPR Registration</h3><p><b>Email:</b> ${email}</p><p><b>Name:</b> ${fullName}</p><p><b>Language:</b> ${lang}</p><p><b>Charter:</b> ${bookingNumber || "No charter"}</p><p><b>Date:</b> ${new Date().toLocaleString()}</p>`,
                attachments: pdfAtt,
            }),
          });
          // Send PDF receipt to client
          await fetch(`${API_BASE}/../email/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                to: email,
                subject: "Your GDPR Consent - Tailwind Yachting",
                html: `<h3>Thank you for your consent</h3><p>Dear ${fullName},</p><p>Please find attached your GDPR consent receipt.</p><p>Best regards,<br>Tailwind Yachting</p>`,
                attachments: pdfAtt,
            }),
          });
        } catch (e) { console.error("notification email error", e); }
        sessionStorage.setItem('yacht_lang', lang);
        if (bookingNumber) { window.location.href = '/home?booking=' + encodeURIComponent('CHARTER PARTY NO ' + (bookingNumber.match(/\d+/) ? bookingNumber.match(/\d+/)[0] : bookingNumber)); return; }
        setStep('booking');
      } else {
        setError(data.error || 'Failed to save consent');
      }
    } catch (e) {
      setError('Network error');
    }
    setLoading(false);
  };

  const handleStaffLogin = async () => {
    if (!staffCode) return;
    setLoading(true);
    try {
        const resp = await fetch(`${API_BASE}/employees.php`);
        const data = await resp.json();
        const employees = Array.isArray(data) ? data : (data.employees || []);
        const found = employees.find((e: any) => e.code.toUpperCase() === staffCode.toUpperCase() && e.enabled);
        if (found) {
            // Set session directly from API data
            const user = {
                code: found.code,
                name: found.name,
                role: found.role,
                permissions: found.permissions,
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem('auth_current_user', JSON.stringify(user));
            localStorage.setItem('employeeCode', staffCode);
            if (found.role === 'OWNER') {
                window.location.href = '/owner-dashboard';
            } else {
                sessionStorage.setItem('yacht_lang', lang);
                window.location.href = '/home';
            }
        } else {
            setError(lang === 'el' ? 'Λάθος κωδικός' : 'Invalid code');
        }
    } catch (e) {
        setError('Network error');
    }
    setLoading(false);
  };

  const enterApp = async () => {
    const bn = bookingNumber.trim();
    if (bn) {
      const charterNum = bn.match(/\d+/) ? bn.match(/\d+/)![0] : bn;
      
          const fullBn = `CHARTER PARTY NO ${charterNum}`;
          try {
              await fetch(`${API_BASE}/verify-email.php`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'update_booking', email: email.toLowerCase().trim(), booking_number: fullBn }),
              });
          } catch (e) { console.error('update_booking error', e); }
          sessionStorage.setItem('yacht_lang', lang);
          window.location.href = '/home?booking=' + encodeURIComponent(fullBn);
    } else {
      sessionStorage.setItem('yacht_lang', lang);
      window.location.href = '/home';
    }
  };

  // ---------- SIGNATURE CANVAS ----------

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    // Scale coordinates
    x = x * (canvas.width / rect.width);
    y = y * (canvas.height / rect.height);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      e.preventDefault();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    x = x * (canvas.width / rect.width);
    y = y * (canvas.height / rect.height);
    ctx.strokeStyle = '#2d5a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureData('');
  };

  // Init canvas size
  useEffect(() => {
    if (step === 'gdpr') {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = 460;
        canvas.height = 150;
      }
    }
  }, [step]);

  // ---------- RENDER ----------

  const isRtl = lang === 'he';

  // 🔥 NEW LANDING DESIGN (Perfect Body style)
  if (step === 'landing') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #6bb6f5 0%, #1e90ff 50%, #87ceeb 100%)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        direction: isRtl ? 'rtl' : 'ltr' as any,
      }}>
        {/* Top-right language selector */}
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={styles.langBar}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                style={{ ...(lang === l.code ? styles.langBtnActive : styles.langBtn), padding: '6px 8px', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => setLang(l.code)}
                title={l.name}
              >
                <img src={flagImg(l.country)} alt={l.code} style={{ width: 24, height: 18, borderRadius: 2 }} />
              </button>
            ))}
          </div>
        </div>

        {/* Center hero */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px', textAlign: 'center' as const }}>
          <div style={{ fontSize: '88px', marginBottom: '24px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>⚓</div>
          <h1 style={{ fontSize: 'clamp(32px, 7vw, 52px)', fontWeight: 'bold', color: '#ffffff', margin: '0 0 16px 0', textShadow: '0 2px 12px rgba(0,0,0,0.25)', letterSpacing: '0.5px', lineHeight: 1.1 }}>
            {t('ymSuite')}
          </h1>
          <p style={{ fontSize: 'clamp(16px, 3.5vw, 22px)', color: '#ffffff', opacity: 0.95, margin: 0, textShadow: '0 1px 6px rgba(0,0,0,0.15)' }}>
            {t('digitalCheckIn')}
          </p>
        </div>

        {/* Bottom 2 buttons */}
        <div style={{ padding: '0 20px 40px', maxWidth: '520px', width: '100%', alignSelf: 'center', boxSizing: 'border-box' as const }}>
          {/* WHITE button — Login (existing users) */}
          <button
            onClick={() => { setError(''); setSuccess(''); setIsLoginMode(true); setStep('email'); }}
            style={{
              width: '100%',
              padding: '20px',
              background: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              marginBottom: '14px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
          >
            <div style={{ color: '#1e90ff', fontSize: '14px', marginBottom: '4px' }}>{t('alreadyHaveAccount')}</div>
            <div style={{ color: '#1e90ff', fontSize: '22px', fontWeight: 'bold' }}>{t('loginBtn')}</div>
          </button>

          {/* BLUE button — Create account (new users) */}
          <button
            onClick={() => { setError(''); setSuccess(''); setIsLoginMode(false); setStep('email'); }}
            style={{
              width: '100%',
              padding: '20px',
              background: 'linear-gradient(135deg, #1e90ff 0%, #0070d9 100%)',
              border: 'none',
              borderRadius: '16px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(30,144,255,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30,144,255,0.5)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(30,144,255,0.4)'; }}
          >
            <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '4px', opacity: 0.92 }}>{t('newToSuite')}</div>
            <div style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{t('createAccountBtn')}</div>
          </button>

          {/* User Guide link */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              onClick={() => window.location.href = `/guide?lang=${lang}`}
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '20px',
                padding: '8px 20px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              📖 {t('userGuide')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.page, direction: isRtl ? 'rtl' : 'ltr' }}>
      {/* Simple top bar for non-landing steps (logo only, no flags) */}
      <div style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
        <div style={styles.logo}>
          ⛵ <span>Tailwind Yachting</span>
        </div>
      </div>

      {/* HERO */}
      <div style={styles.heroSection}>
        <div style={styles.heroTitle}>{t('welcome')}</div>
        <div style={styles.heroSubtitle}>{t('subtitle')}</div>
      </div>

      {/* MAIN CARD */}
      <div style={styles.card}>
        {error && <div style={styles.error}>{error}</div>}
        {success && step === 'verify' && <div style={styles.success}>{success}</div>}

        {/* ===== STEP: LANDING ===== */}
        {step === 'landing' && (
          <>
            <button
              style={styles.btn}
              onClick={() => { setError(''); setSuccess(''); setStep('email'); }}
            >
              {t('clientBtn')}
            </button>
            <button
              style={styles.btnSecondary}
              onClick={() => { setError(''); setSuccess(''); setStep('staff'); }}
            >
              {t('staffBtn')}
            </button>
          </>
        )}

        {/* ===== STEP: EMAIL ===== */}
        {step === 'email' && (
          <>
            <button style={styles.backLink} onClick={() => { setStep('landing'); setError(''); }}>
              ← {t('back')}
            </button>
            <div style={styles.cardTitle}>{t('emailLabel')}</div>
            <div style={{ marginBottom: '20px' }} />
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...styles.input, paddingRight: '50px' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="email / charter # / staff code"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#666' }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            <button
              style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
              onClick={sendCode}
              disabled={loading}
            >
              {loading ? t('processing') : (isLoginMode ? t('enterBtn') : t('sendCode'))}
            </button>
          </>
        )}

        {/* ===== STEP: VERIFY ===== */}
        {step === 'verify' && (
          <>
            <button style={styles.backLink} onClick={() => { setStep('email'); setError(''); setSuccess(''); }}>
              ← {t('back')}
            </button>
            <div style={styles.cardTitle}>{t('codeLabel')}</div>
            <div style={styles.cardSubtitle}>{email}</div>
            <input
              style={{ ...styles.input, textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
              type="text"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              autoFocus
            />
            <button
              style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
              onClick={verifyCode}
              disabled={loading}
            >
              {loading ? t('processing') : t('verify')}
            </button>
            <button
              style={{ ...styles.backLink, textAlign: 'center', width: '100%', marginTop: '10px' }}
              onClick={() => { setCode(''); sendCode(); }}
            >
              {t('resendCode')}
            </button>
          </>
        )}

        {/* ===== STEP: NAME ===== */}
        {step === 'name' && (
          <>
            <button style={styles.backLink} onClick={() => { setStep('verify'); setError(''); }}>
              ← {t('back')}
            </button>
            <div style={styles.cardTitle}>{t('nameLabel')}</div>
            <div style={{ marginBottom: '20px' }} />
            <input
              style={styles.input}
              type="text"
              placeholder={t('nameLabel')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fullName.trim() && setStep('gdpr')}
              autoFocus
            />
            <button
              style={{ ...styles.btn, ...(!fullName.trim() ? styles.btnDisabled : {}) }}
              onClick={() => { if (fullName.trim()) { setError(''); setStep('gdpr'); } }}
              disabled={!fullName.trim()}
            >
              {t('continueBtn')}
            </button>
          </>
        )}

        {/* ===== STEP: GDPR ===== */}
        {step === 'gdpr' && (
          <>
            <button style={styles.backLink} onClick={() => { setStep('name'); setError(''); }}>
              ← {t('back')}
            </button>
            <div style={styles.cardTitle}>{t('gdprTitle')}</div>
            <div style={{ marginBottom: '20px' }} />

            {/* Section 1 */}
            <div style={styles.gdprSection}>
              <div style={styles.gdprSectionTitle}>
                1. {GDPR_SECTION_TITLES[lang]?.t1 || GDPR_SECTION_TITLES.en.t1}
              </div>
              <div style={styles.gdprText}>
                {GDPR_TEXTS[lang]?.s1 || GDPR_TEXTS.en.s1}
              </div>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={gdpr1}
                  onChange={(e) => setGdpr1(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                {t('gdprAccept')}
              </label>
            </div>

            {/* Section 2 */}
            <div style={styles.gdprSection}>
              <div style={styles.gdprSectionTitle}>
                2. {GDPR_SECTION_TITLES[lang]?.t2 || GDPR_SECTION_TITLES.en.t2}
              </div>
              <div style={styles.gdprText}>
                {GDPR_TEXTS[lang]?.s2 || GDPR_TEXTS.en.s2}
              </div>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={gdpr2}
                  onChange={(e) => setGdpr2(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                {t('gdprAccept')}
              </label>
            </div>

            {/* Section 3 */}
            <div style={styles.gdprSection}>
              <div style={styles.gdprSectionTitle}>
                3. {GDPR_SECTION_TITLES[lang]?.t3 || GDPR_SECTION_TITLES.en.t3}
              </div>
              <div style={styles.gdprText}>
                {GDPR_TEXTS[lang]?.s3 || GDPR_TEXTS.en.s3}
              </div>
              <label style={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={gdpr3}
                  onChange={(e) => setGdpr3(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                {t('gdprAccept')}
              </label>
            </div>

            {/* Signature */}
            <div style={{ marginTop: '20px' }}>
              <div style={styles.gdprSectionTitle}>{t('signTitle')}</div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                {t('signInstruction')}
              </div>
              <canvas
                ref={canvasRef}
                style={styles.canvas}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              <button
                style={{ ...styles.backLink, marginTop: '5px' }}
                onClick={clearCanvas}
              >
                {t('clearSign')}
              </button>
            </div>

            <button
              style={{
                ...styles.btn,
                marginTop: '20px',
                ...(!gdpr1 || !gdpr2 || !gdpr3 || !signatureData ? styles.btnDisabled : {}),
              }}
              onClick={saveGdpr}
              disabled={loading || !gdpr1 || !gdpr2 || !gdpr3 || !signatureData}
            >
              {loading ? t('processing') : t('submitGdpr')}
            </button>
          </>
        )}

        {/* ===== STEP: BOOKING ===== */}
        {step === 'booking' && (
          <>
            <div style={styles.cardTitle}>{t('bookingLabel')}</div>
            <div style={{ marginBottom: '20px' }} />
            <input
              style={styles.input}
              type="text"
              placeholder="1000"
              value={bookingNumber}
              onChange={(e) => setBookingNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enterApp()}
              autoFocus
            />
            <button style={styles.btn} onClick={enterApp}>
              {t('enterApp')}
            </button>
            <button
              style={{ ...styles.backLink, textAlign: 'center', width: '100%' }}
              onClick={() => { setBookingNumber(''); enterApp(); }}
            >
              {t('skipBooking')}
            </button>
          </>
        )}

        {/* ===== STEP: STAFF ===== */}
        {step === 'staff' && (
          <>
            <button style={styles.backLink} onClick={() => { setStep('landing'); setError(''); }}>
              ← {t('back')}
            </button>
            <div style={styles.cardTitle}>{t('staffCode')}</div>
            <div style={{ marginBottom: '20px' }} />
              <div style={{ position: 'relative' }}>
            <input
              style={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('staffCode')}
              value={staffCode}
              onChange={(e) => setStaffCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStaffLogin()}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#666' }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            <button
              style={{ ...styles.btn, ...(!staffCode ? styles.btnDisabled : {}) }}
              onClick={handleStaffLogin}
              disabled={!staffCode}
            >
              {t('staffLogin')}
            </button>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ padding: '20px', fontSize: '13px', opacity: 0.6, textAlign: 'center' }}>
        © {new Date().getFullYear()} Tailwind Yachting — Marina Alimos, Greece
      </div>
    </div>
  );
};

export default GatePage;
