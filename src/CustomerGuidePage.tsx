import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const sessionLang = sessionStorage.getItem('yacht_lang');
    const finalLang = urlLang || sessionLang || 'en';
    
    setLang(finalLang);
    
    if (urlLang && urlLang !== sessionLang) {
      sessionStorage.setItem('yacht_lang', urlLang);
    }
  }, []);

  const t = (key: string): string => {
    const translations = {
      userGuide: {
        en: 'User Guide', el: 'Οδηγός Χρήσης', it: 'Guida Utente', de: 'Benutzerhandbuch',
        ru: 'Руководство пользователя', fr: 'Guide utilisation', ro: 'Ghidul utilizatorului',
        pl: 'Przewodnik użytkownika', he: 'מדריך משתמש', es: 'Guía de Usuario'
      },
      installTitle: {
        en: 'Install as App', el: 'Εγκατάσταση ως Εφαρμογή', it: 'Installa come App', de: 'Als App installieren',
        ru: 'Установить как приложение', fr: 'Installer comme App', ro: 'Instalează ca aplicație',
        pl: 'Zainstaluj jako aplikację', he: 'התקן כאפליקציה', es: 'Instalar como App'
      },
      installText: {
        en: 'For best experience, install this app:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        el: 'Για καλύτερη εμπειρία, εγκατάστησε την εφαρμογή:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        it: 'Per migliore esperienza, installa questa app:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        de: 'Für beste Erfahrung, installiere diese App:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        ru: 'Для лучшего опыта установите приложение:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        fr: 'Pour meilleure expérience, installez cette app:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        ro: 'Pentru experiență optimă, instalați aplicația:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        pl: 'Dla najlepszego doświadczenia zainstaluj aplikację:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        he: 'לחוויה הטובה ביותר התקן את האפליקציה:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon',
        es: 'Para mejor experiencia, instala esta app:\n\n• iPhone: Safari > Share > Add to Home Screen\n• Android: Chrome > Menu > Install App\n• Desktop: Address bar > Install icon'
      },
      checkInTitle: {
        en: 'Check-in Process', el: 'Διαδικασία Check-in', it: 'Processo Check-in', de: 'Check-in Prozess',
        ru: 'Процесс регистрации', fr: 'Processus Check-in', ro: 'Proces Check-in',
        pl: 'Proces zameldowania', he: 'תהליך צק-אין', es: 'Proceso Check-in'
      },
      checkInText: {
        en: 'Complete yacht check-in in 5 pages:\n\nPage 1: Basic info, skipper details, signatures\nPage 2: Equipment inspection, photos\nPage 3: Safety equipment, cabin check\nPage 4: Interactive floorplan navigation\nPage 5: Final submission and confirmation\n\nTips:\n• All pages must be completed\n• Take photos of any damage\n• Ask crew for help if needed',
        el: 'Ολοκληρώστε το check-in σε 5 σελίδες:\n\nΣελίδα 1: Βασικά στοιχεία, καπετάνιος, υπογραφές\nΣελίδα 2: Έλεγχος εξοπλισμού, φωτογραφίες\nΣελίδα 3: Εξοπλισμός ασφαλείας, έλεγχος καμπίνων\nΣελίδα 4: Διαδραστικός χάρτης σκάφους\nΣελίδα 5: Τελική αποστολή και επιβεβαίωση\n\nΣυμβουλές:\n• Όλες οι σελίδες πρέπει να ολοκληρωθούν\n• Βγάλτε φωτογραφίες ζημιών\n• Ρωτήστε το πλήρωμα αν χρειάζεστε βοήθεια',
        it: 'Completa check-in in 5 pagine:\n\nPagina 1: Info base, dettagli skipper, firme\nPagina 2: Ispezione equipaggiamento, foto\nPagina 3: Equipaggiamento sicurezza, controllo cabine\nPagina 4: Navigazione planimetria interattiva\nPagina 5: Invio finale e conferma\n\nSuggerimenti:\n• Tutte le pagine devono essere completate\n• Scatta foto di eventuali danni\n• Chiedi aiuto al crew se necessario',
        de: 'Vollständiger Check-in in 5 Seiten:\n\nSeite 1: Grundinfos, Skipper-Details, Unterschriften\nSeite 2: Ausrüstungsinspektion, Fotos\nSeite 3: Sicherheitsausrüstung, Kabinencheck\nSeite 4: Interaktive Grundriss-Navigation\nSeite 5: Finale Übermittlung und Bestätigung\n\nTipps:\n• Alle Seiten müssen ausgefüllt werden\n• Fotos von Schäden machen\n• Crew um Hilfe bitten wenn nötig',
        ru: 'Полная регистрация на 5 страницах:\n\nСтраница 1: Основная информация, данные шкипера, подписи\nСтраница 2: Осмотр оборудования, фотографии\nСтраница 3: Оборудование безопасности, проверка кают\nСтраница 4: Интерактивная навигация по плану\nСтраница 5: Финальная отправка и подтверждение\n\nСоветы:\n• Все страницы должны быть заполнены\n• Фотографируйте любые повреждения\n• Обратитесь к экипажу за помощью при необходимости',
        fr: 'Check-in complet en 5 pages:\n\nPage 1: Infos de base, détails skipper, signatures\nPage 2: Inspection équipement, photos\nPage 3: Équipement sécurité, contrôle cabines\nPage 4: Navigation plan interactif\nPage 5: Soumission finale et confirmation\n\nConseils:\n• Toutes les pages doivent être complétées\n• Prenez des photos des dommages\n• Demandez aide à équipage si nécessaire',
        ro: 'Check-in complet în 5 pagini:\n\nPagina 1: Informații de bază, detalii skipper, semnături\nPagina 2: Inspecția echipamentului, fotografii\nPagina 3: Echipament siguranță, verificare cabine\nPagina 4: Navigare plan interactiv\nPagina 5: Trimitere finală și confirmare\n\nSfaturi:\n• Toate paginile trebuie completate\n• Fotografiați orice deteriorare\n• Cereți ajutorul echipajului dacă este necesar',
        pl: 'Pełne zameldowanie w 5 stronach:\n\nStrona 1: Podstawowe info, szczegóły skipera, podpisy\nStrona 2: Inspekcja wyposażenia, zdjęcia\nStrona 3: Wyposażenie bezpieczeństwa, kontrola kabin\nStrona 4: Nawigacja po interaktywnym planie\nStrona 5: Finalne przesłanie i potwierdzenie\n\nWskazówki:\n• Wszystkie strony muszą być wypełnione\n• Rób zdjęcia wszelkich uszkodzeń\n• Proś załogę o pomoc jeśli potrzeba',
        he: 'צק-אין מלא ב-5 עמודים:\n\nעמוד 1: מידע בסיסי, פרטי קפטן, חתימות\nעמוד 2: בדיקת ציוד, תמונות\nעמוד 3: ציוד בטיחות, בדיקת תא\nעמוד 4: ניווט תוכנית אינטראקטיבית\nעמוד 5: שליחה סופית ואישור\n\nעצות:\n• כל הדפים חייבים להיות מלאים\n• צלם כל נזק\n• בקש עזרה מהצוות אם צריך',
        es: 'Check-in completo en 5 páginas:\n\nPágina 1: Info básica, detalles patrón, firmas\nPágina 2: Inspección equipamiento, fotos\nPágina 3: Equipamiento seguridad, control cabinas\nPágina 4: Navegación plano interactivo\nPágina 5: Envío final y confirmación\n\nConsejos:\n• Todas las páginas deben completarse\n• Toma fotos de cualquier daño\n• Pide ayuda a la tripulación si es necesario'
      },
      troubleshootingTitle: {
        en: 'Troubleshooting', el: 'Επίλυση Προβλημάτων', it: 'Risoluzione Problemi', de: 'Fehlerbehebung',
        ru: 'Устранение неполадок', fr: 'Dépannage', ro: 'Depanare',
        pl: 'Rozwiązywanie problemów', he: 'פתרון בעיות', es: 'Solución de Problemas'
      },
      troubleshootingText: {
        en: 'Common issues and solutions:\n\n• App wont load: Check internet, refresh page\n• Cant sign: Draw inside signature box, use finger\n• Photos wont upload: Check permissions, good lighting\n• Page wont advance: Complete all required fields\n• Lost progress: Work automatically saved every 30 seconds\n\nNeed help? Ask any staff member for assistance.',
        el: 'Συχνά προβλήματα και λύσεις:\n\n• Δεν φορτώνει: Ελέγξτε internet, ανανεώστε σελίδα\n• Δεν υπογράφω: Σχεδιάστε μέσα στο κουτί υπογραφής\n• Δεν ανεβαίνουν φωτό: Ελέγξτε άδειες, καλό φως\n• Δεν προχωράει: Συμπληρώστε όλα τα υποχρεωτικά\n• Έχασα πρόοδο: Αυτόματη αποθήκευση κάθε 30 δευτερόλεπτα\n\nΧρειάζεστε βοήθεια; Ρωτήστε οποιοδήποτε μέλος προσωπικού.',
        it: 'Problemi comuni e soluzioni:\n\n• App non carica: Controlla internet, aggiorna pagina\n• Non riesco firmare: Disegna dentro riquadro firma\n• Foto non caricano: Controlla permessi, buona luce\n• Pagina non avanza: Completa tutti campi richiesti\n• Perso progresso: Salvataggio automatico ogni 30 secondi\n\nServe aiuto? Chiedi a qualsiasi membro staff.',
        de: 'Häufige Probleme und Lösungen:\n\n• App lädt nicht: Internet prüfen, Seite aktualisieren\n• Kann nicht unterschreiben: In Unterschriftsfeld zeichnen\n• Fotos laden nicht hoch: Berechtigungen prüfen, gutes Licht\n• Seite geht nicht weiter: Alle Pflichtfelder ausfüllen\n• Fortschritt verloren: Automatisches Speichern alle 30 Sekunden\n\nHilfe benötigt? Fragen Sie jedes Crew-Mitglied.',
        ru: 'Распространенные проблемы и решения:\n\n• Приложение не загружается: Проверьте интернет, обновите страницу\n• Не могу подписать: Рисуйте внутри поля подписи\n• Фото не загружаются: Проверьте разрешения, хорошее освещение\n• Страница не продвигается: Заполните все обязательные поля\n• Потерян прогресс: Автосохранение каждые 30 секунд\n\nНужна помощь? Обратитесь к любому сотруднику.',
        fr: 'Problèmes courants et solutions:\n\n• App ne charge pas: Vérifiez internet, actualisez page\n• Impossible signer: Dessinez dans zone signature\n• Photos ne chargent pas: Vérifiez permissions, bon éclairage\n• Page navance pas: Complétez tous champs requis\n• Progrès perdu: Sauvegarde automatique toutes les 30 secondes\n\nBesoin aide? Demandez à nimporte quel membre équipage.',
        ro: 'Probleme comune și soluții:\n\n• App nu se încarcă: Verificați internetul, reîmprospătați pagina\n• Nu pot semna: Desenați în caseta semnăturii\n• Fotografiile nu se încarcă: Verificați permisiunile, lumină bună\n• Pagina nu avansează: Completați toate câmpurile obligatorii\n• Progres pierdut: Salvare automată la fiecare 30 secunde\n\nAveți nevoie de ajutor? Întrebați orice membru al echipajului.',
        pl: 'Częste problemy i rozwiązania:\n\n• Aplikacja się nie ładuje: Sprawdź internet, odśwież stronę\n• Nie mogę podpisać: Rysuj w polu podpisu\n• Zdjęcia się nie ładują: Sprawdź uprawnienia, dobre światło\n• Strona nie postępuje: Wypełnij wszystkie wymagane pola\n• Stracony postęp: Automatyczny zapis co 30 sekund\n\nPotrzebujesz pomocy? Zapytaj dowolnego członka załogi.',
        he: 'בעיות נפוצות ופתרונות:\n\n• אפליקציה לא נטענת: בדוק אינטרנט, רענן דף\n• לא יכול לחתום: צייר בתוך תיבת החתימה\n• תמונות לא נטענות: בדוק הרשאות, תאורה טובה\n• דף לא מתקדם: מלא כל השדות הנדרשים\n• איבוד התקדמות: שמירה אוטומטית כל 30 שניות\n\nצריך עזרה? שאל כל חבר צוות.',
        es: 'Problemas comunes y soluciones:\n\n• App no carga: Verifica internet, actualiza página\n• No puedo firmar: Dibuja dentro del cuadro de firma\n• Fotos no suben: Verifica permisos, buena iluminación\n• Página no avanza: Completa todos los campos requeridos\n• Progreso perdido: Guardado automático cada 30 segundos\n\nNecesitas ayuda? Pregunta a cualquier miembro del personal.'
      },
      backToGate: {
        en: 'Back to Main', el: 'Πίσω στην Αρχική', it: 'Torna al Principale', de: 'Zurück zur Hauptseite',
        ru: 'Назад к главной', fr: 'Retour au principal', ro: 'Înapoi la principal',
        pl: 'Powrót do głównej', he: 'חזרה לעמוד הראשי', es: 'Volver al Principal'
      },
      initialSetupTitle: {
        en: '🚀 First Time Setup & Login', el: '🚀 Πρώτη Ρύθμιση & Σύνδεση', it: '🚀 Prima Configurazione e Login', de: '🚀 Ersteinrichtung & Anmeldung',
        ru: '🚀 Первоначальная настройка и вход', fr: '🚀 Configuration Initiale & Connexion', ro: '🚀 Configurarea Inițială & Login',
        pl: '🚀 Pierwsza Konfiguracja i Logowanie', he: '🚀 הגדרה ראשונה והתחברות', es: '🚀 Configuración Inicial y Login'
      },
      initialSetupText: {
        en: 'COMPLETE FIRST-TIME SETUP PROCESS:\n\n📧 EMAIL VERIFICATION STEP:\n• Enter your REAL email address (you will receive emails here)\n• Use format: yourname@gmail.com (include @)\n• Check spelling carefully - wrong email = no access\n• You will receive verification code immediately\n• Check spam/junk folder if not in inbox\n• Enter 6-digit code exactly as received\n• Code expires in 10 minutes - request new one if needed\n\n🌍 LANGUAGE SELECTION:\n• Choose your preferred language from flags\n• This affects ALL app text and instructions\n• You can change language anytime later\n• Selection is saved automatically\n\n📋 GDPR CONSENT (REQUIRED):\n• Read privacy policy carefully\n• Understand how your data will be used\n• Consent is MANDATORY to use app\n• You receive PDF copy of consent via email\n• Keep this PDF for your records\n\n🎫 ACCESS CODES (STAFF WILL PROVIDE):\n• Vessel Access Code: Unique for each yacht\n• Staff will give you this code\n• Format: Usually 4-6 characters\n• Case sensitive - enter exactly as given\n• Valid only for your charter period\n\n👤 USER ROLES & PERMISSIONS:\n• CUSTOMER: Check-in/out, Charter Agreement\n• STAFF: Full access, can help customers\n• TECHNICAL: Equipment access, no fleet management\n• ADMIN/OWNER: Complete system access\n\n🔄 RETURNING USERS:\n• Use same email address as before\n• System remembers your language preference\n• Previous data may be pre-filled\n• Contact staff if you forgot your details\n\n⚠️ IMPORTANT FIRST-TIME NOTES:\n• Complete setup on device you will use most\n• Ensure stable internet during setup\n• Keep email accessible throughout charter\n• Save vessel code in safe place\n• Ask staff immediately if any step fails',
        el: 'ΠΛΗΡΗΣ ΔΙΑΔΙΚΑΣΙΑ ΠΡΩΤΗΣ ΡΥΘΜΙΣΗΣ:\n\n📧 ΕΠΑΛΗΘΕΥΣΗ EMAIL:\n• Βάλτε το ΠΡΑΓΜΑΤΙΚΟ σας email (θα λάβετε emails εδώ)\n• Χρησιμοποιήστε μορφή: onoma@gmail.com (με @)\n• Ελέγξτε προσεκτικά - λάθος email = χωρίς πρόσβαση\n• Θα λάβετε κωδικό επαλήθευσης αμέσως\n• Ελέγξτε φάκελο spam αν δεν είναι στα εισερχόμενα\n• Βάλτε τον 6ψήφιο κωδικό ακριβώς όπως τον λάβατε\n• Ο κωδικός λήγει σε 10 λεπτά - ζητήστε νέο αν χρειαστεί\n\n🌍 ΕΠΙΛΟΓΗ ΓΛΩΣΣΑΣ:\n• Επιλέξτε την προτιμώμενη γλώσσα από τις σημαίες\n• Αυτό επηρεάζει ΟΛΑ τα κείμενα της εφαρμογής\n• Μπορείτε να αλλάξετε γλώσσα αργότερα\n• Η επιλογή αποθηκεύεται αυτόματα\n\n📋 ΣΥΝΑΙΝΕΣΗ GDPR (ΑΠΑΙΤΕΙΤΑΙ):\n• Διαβάστε προσεκτικά την πολιτική απορρήτου\n• Κατανοήστε πώς θα χρησιμοποιηθούν τα δεδομένα σας\n• Η συναίνεση είναι ΥΠΟΧΡΕΩΤΙΚΗ για χρήση\n• Θα λάβετε PDF αντίγραφο συναίνεσης στο email\n• Κρατήστε αυτό το PDF για τα αρχεία σας\n\n🎫 ΚΩΔΙΚΟΙ ΠΡΟΣΒΑΣΗΣ (ΘΑ ΔΩΣΕΙ ΤΟ ΠΡΟΣΩΠΙΚΟ):\n• Κωδικός Πρόσβασης Σκάφους: Μοναδικός για κάθε γιοτ\n• Το προσωπικό θα σας δώσει αυτόν τον κωδικό\n• Μορφή: Συνήθως 4-6 χαρακτήρες\n• Διακρίνει πεζά-κεφαλαία - βάλτε ακριβώς όπως δόθηκε\n• Ισχύει μόνο για την περίοδο ναύλωσης\n\n👤 ΡΟΛΟΙ ΧΡΗΣΤΩΝ & ΔΙΚΑΙΩΜΑΤΑ:\n• ΠΕΛΑΤΗΣ: Check-in/out, Συμφωνία Charter\n• ΠΡΟΣΩΠΙΚΟ: Πλήρης πρόσβαση, βοηθά πελάτες\n• ΤΕΧΝΙΚΟΣ: Πρόσβαση εξοπλισμού, όχι διαχείριση στόλου\n• ADMIN/ΙΔΙΟΚΤΗΤΗΣ: Πλήρης πρόσβαση συστήματος\n\n🔄 ΧΡΗΣΤΕΣ ΠΟΥ ΕΠΙΣΤΡΕΦΟΥΝ:\n• Χρησιμοποιήστε το ίδιο email όπως πριν\n• Το σύστημα θυμάται την προτίμηση γλώσσας\n• Προηγούμενα δεδομένα μπορεί να είναι προ-συμπληρωμένα\n• Επικοινωνήστε με προσωπικό αν ξεχάσατε στοιχεία\n\n⚠️ ΣΗΜΑΝΤΙΚΕΣ ΣΗΜΕΙΩΣΕΙΣ ΠΡΩΤΗΣ ΦΟΡΑΣ:\n• Ολοκληρώστε ρύθμιση στη συσκευή που θα χρησιμοποιείτε περισσότερο\n• Εξασφαλίστε σταθερό internet κατά τη ρύθμιση\n• Κρατήστε email προσβάσιμο καθ όλη τη ναύλωση\n• Αποθηκεύστε κωδικό σκάφους σε ασφαλές μέρος\n• Ζητήστε αμέσως βοήθεια αν αποτύχει οποιοδήποτε βήμα'
      },
    };

    return translations[key]?.[lang] || translations[key]?.['en'] || key;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    card: {
      maxWidth: '800px',
      margin: '0 auto',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '40px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '40px'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#333',
      marginBottom: '10px'
    },
    section: {
      marginBottom: '30px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    },
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#495057',
      marginBottom: '15px'
    },
    text: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: '#6c757d',
      whiteSpace: 'pre-line' as const
    },
    backButton: {
      display: 'block',
      width: '200px',
      margin: '40px auto 0',
      padding: '15px 30px',
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>⛵ {t('userGuide')}</h1>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t('initialSetupTitle')}</h2>
          <p style={styles.text}>{t('initialSetupText')}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>📱 {t('installTitle')}</h2>
          <p style={styles.text}>{t('installText')}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>⛵ {t('checkInTitle')}</h2>
          <p style={styles.text}>{t('checkInText')}</p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>🔧 {t('troubleshootingTitle')}</h2>
          <p style={styles.text}>{t('troubleshootingText')}</p>
        </div>

        <button 
          style={styles.backButton}
          onClick={() => navigate('/')}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#5a67d8'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#667eea'}
        >
          ← {t('backToGate')}
        </button>
      </div>
    </div>
  );
};

export default CustomerGuidePage;