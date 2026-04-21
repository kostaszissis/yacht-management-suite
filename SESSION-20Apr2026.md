# SESSION SUMMARY - 20/04/2026

## STATUS: ΦΑΣΕΙΣ 5 + 6 DEPLOYED

---

## ΦΑΣΗ 5: CharterAgreementPage 10-γλώσσες μεταφράσεις (DONE)

### shared-components.js
- Export LANG_MAP + flagImg (ήταν const χωρίς export)
- I18N: 104 νέα charter* keys (86 base + 18 extras) σε 10 γλώσσες (en, el, it, de, ru, fr, ro, pl, he, es)

### CharterAgreementPage.tsx
- Import I18N, LANG_MAP, flagImg
- t helper = Proxy με per-key fallback σε en
- Flag selector popup 10 σημαιών (αντί GR/EN toggle)
- ~123 αντικαταστάσεις language ternaries -> t.key (5 passes)
- Legal text (PDF/DOCX templates) παραμένει Αγγλικά

---

## ΦΑΣΗ 6: Shareable Links Crew/Skipper (DONE)

### Database
- Νέος πίνακας crew_invitations (token, booking_number, role, invite_*, submitted_*, gdpr_*, signature_data, expires_at 7 days, status: pending/submitted)
- Indexes σε booking_number, token, status

### Backend PHP
- api/crew-invitations.php: actions: create, submit, resend, delete, list, validate
- backend/send-crew-invite-email.php: functions sendInvitationEmail, sendCrewSubmissionEmails, sendCrewReminder
- backend/crew_invite_translations.json: 10-γλώσσες email templates (subject, greeting, intro, cta, expiry, thanks, reminder)

### Frontend
- **CrewInviteForm.tsx (νέο)**: Public mini-form πάντα Αγγλικά
  - Route: /crew-invite/:token
  - Fields: First Name, Last Name, Address, Email, Phone, Passport, DoB, Nationality
  - GDPR 3 consents (data processing, sharing with authorities, accuracy)
  - Canvas signature + Clear button
  - Submit -> API -> thanks email (στη γλώσσα Charterer) + company notification (Αγγλικά)
  - Link expiry 7 μέρες

- **CharterAgreementPage.tsx**: Νέα section Invite Crew/Skipper via Email
  - Φόρμα: First Name, Last Name, Email, Role (crew/skipper/co-skipper)
  - Send Invitation button -> API -> email στον παραλήπτη
  - Invitations list με status (pending/submitted)
  - Actions per invitation: Resend, Delete, Copy Link
  - Auto-sync: όταν ο crew υποβάλει, γεμίζει αυτόματα ο Crew List στο CharterAgreementPage (merged by passport)
  - Crew List DOCX + Charter Party DOCX παίρνουν τα πλήρη στοιχεία

### App.tsx
- Νέο route /crew-invite/:token -> CrewInviteForm

### Email flow
- Invitation email: multilingual (10 langs), CTA button, link, 7-day notice
- Thanks to crew: στη γλώσσα Charterer
- Notification σε info@tailwindyachting.com: Αγγλικά με πλήρη λίστα submitted data
- Reminders: function sendCrewReminder ready, auto-cron TBD

---

## ΑΡΧΕΙΑ ΠΟΥ ΑΛΛΑΞΑΝ/ΠΡΟΣΤΕΘΗΚΑΝ

### Νέα
- api/crew-invitations.php
- backend/send-crew-invite-email.php
- backend/crew_invite_translations.json
- src/CrewInviteForm.tsx

### Τροποποιήσεις
- src/App.tsx (+ import + route)
- src/CharterAgreementPage.tsx (+ invitations state, handlers, UI section, auto-sync)
- src/shared-components.js (Φάση 5: export + 860 translations)

### Database
- crew_invitations table (νέο)

---

## BACKUPS

- Pre-phase5: /root/yacht-prod-backup-20Apr2026-0910-PHASE5START.tar.gz
- Post-phase5: /root/yacht-prod-backup-20Apr2026-0948-PHASE5DONE.tar.gz
- Pre-phase6: /root/yacht-prod-backup-20Apr2026-*PHASE6START.tar.gz
- Post-phase6: /root/yacht-prod-backup-20Apr2026-*PHASE6DONE.tar.gz

---

## ΦΑΣΕΙΣ ΠΟΥ ΜΕΝΟΥΝ

### ΦΑΣΗ 7: App Store + Play Store prep (ΔΕΝ ΠΕΙΡΑΖΟΥΜΕ ΤΩΡΑ)
- Testing, version bump v5.0, backup, SCP, git push, PWA audit, Lighthouse, submission
- ΜΟΝΟ όταν πει ο Κώστας

---

## TODO/KNOWN ISSUES ΦΑΣΗ 6

- Auto-reminder cron job (3 μέρες pending) δεν έχει μπει στο crontab ακόμα (function ready)
- Auto-expire cron (after 7 days) δεν έχει μπει (expires_at field το ελέγχει στο validate)
- Email delivery εξαρτάται από PHP mail() configuration στο server
- Δεν υπάρχει rate-limiting στα endpoints (προτείνεται για φάση 8)

---

## ΦΑΣΗ 6 FIX (20/04/2026 απόγευμα): Invitation Flow Hardening

### BUG 1: Validation συγκρούσεις με invitations
- Αν έχει σταλεί skipper invitation → skip validation για Skipper Name + Skipper Signature (`hasSkipperInv` check)
- Αν υπάρχουν pending invitations → confirm dialog πριν submit ('Awaiting crew/skipper completion from ... Continue?')

### BUG 2: Auto-fill + lock crew fields
- crewMembers entries με `fromInvitation: true` → όλα τα πεδία (name, passport, DoB, nationality, email, phone, gender) readOnly/disabled + gray background
- Green success badge πάνω από το slot: "✓ Auto-filled from invitation (locked) [Signed]"
- Crew member signature (signature_data) persisted στο crewMembers[].signature
- Skipper invitation (όταν submitted) → chartererData.skipperName + chartererData.skipperSignature auto-populate

### DOCX generation
- generateCharterParty + generateCrewList: μετά το loadChartererData, fetch invitations και enrich onlineData με skipper data (signature + name) αν υπάρχει submitted skipper invitation
- Η skipper signature πάει στο Charter Party DOCX και Crew List DOCX μέσω inject-signature endpoint

### Email server integration
- send-crew-invite-email.php αντικαταστάθηκε: τώρα χρησιμοποιεί PM2 email-server (localhost:3001/send-email) αντί για απευθείας php mail()
- Gmail SMTP ήδη configured στο PM2 server → emails πάνε κανονικά (verified με test)

### Bug fix: jsonResponse() collision
- api/crew-invitations.php είχε function jsonResponse() που συγκρούονταν με την υπάρχουσα στο db_connect.php → 500 errors
- Μετονομάστηκε σε ciResponse() μέσω Python patch

### Extra: Translation για Invite UI
- 17 νέα translation keys στο shared-components.js (ca_inviteTitle, ca_sendInvitation, ca_resend, ca_deleteBtn, ca_copyLink, ca_pending, ca_submittedShort, ca_linkCopied, ca_invitationSentTo, κλπ) × 10 γλώσσες
- Τα input fields (First Name, Last Name, Email, Crew Member dropdown) παραμένουν Αγγλικά

### Backup files
- /root/yacht-prod-backup-20Apr2026-*-INVITATIONFIX.tar.gz (πριν)
- /root/yacht-prod-backup-20Apr2026-*-INVITATIONFIXDONE.tar.gz (μετά)

### Full flow tested
- Create invitation via API → token returned
- Validate token → booking context returned
- Submit with signature + GDPR → success, status = submitted
- List shows submitted data + signature_data
- CharterAgreementPage fetches list + auto-populates crewMembers + chartererData

---

## CHARTER AGREEMENT BUGS FIX (20/04/2026 βράδυ)

### BUG 1: Skipper invitation γινόταν Passenger 1
- loadInvitations auto-sync: για role='skipper' submitted → populate ΜΟΝΟ chartererData.skipper* fields (skipperFirstName, skipperLastName, skipperPassport, skipperPhone, skipperEmail, skipperAddress, skipperNationality, skipperDob, skipperSignature, skipperFromInvitation), ΔΕΝ προστίθεται στο crewMembers array
- generateCrewList: οι skipperX variables προτιμούν onlineData?.skipperX → chartererData?.skipperX → charter.skipperX → bd.skipperX
- Αποτέλεσμα: SKIPPER row γεμίζει σωστά από invitation submission, passenger rows δεν μπερδεύονται

### BUG 2: Υπογραφή Charterer έγραφε undefined στο DOCX
- Template placeholders {{%CHARTERER_SIGNATURE}} (key με % prefix) δεν βρίσκονταν στο data → docxtemplater render undefined
- Προσθήκη nullGetter: () => '' σε 2 Docxtemplater instances (Charter Party + Crew List)
- Προσθήκη '%CHARTERER_SIGNATURE' key + '%SKIPPER_SIGNATURE' key στο data με value '[object ArrayBuffer]' ως marker για inject-signature.php
- CHARTERER_SIGNATURE IIFE αντικαταστάθηκε με απλό conditional

### BUG 3: Charterer ID/ΑΦΜ/ΔΟΥ/Passport λείπουν
- CHARTERER_FIRST_NAME, CHARTERER_LAST_NAME, CHARTERER_ADDRESS, CHARTERER_ID, CHARTERER_PASSPORT, CHARTERER_TAX, CHARTERER_TAX_OFFICE, CHARTERER_PHONE, CHARTERER_EMAIL: προσθήκη chartererData state fallback μετά από onlineData
- Πριν: onlineData → booking field → ''
- Τώρα: onlineData → chartererData state → booking field → ''

### BUG 4: Form δεν ξανά-ανοίγει με saved data
- Όταν φορτώνεται existingOnline με isLocked=true → auto setShowChartererForm(true)
- Πριν ο user έπρεπε να πατήσει 'Fill Now' για να δει τα δεδομένα

### BUG 5: Skipper signature στο DOCX
- inject-signature.php ήδη handles crew_list mode: αναγνωρίζει το 32-underscore line κάτω από THE SKIPPER: και το αντικαθιστά με image
- Charterer signature: markers {{%CHARTERER_SIGNATURE}} και '[object ArrayBuffer]' βρίσκονται από PHP και αντικαθιστώνται με image στο cell Signed by the Charterer
- Cleanup: leftover markers ({{%...}}, [object ArrayBuffer]) καθαρίζονται αυτόματα

### Backup files
- /root/yacht-prod-backup-20Apr2026-*-CHARTERBUGS.tar.gz (πριν)
- /root/yacht-prod-backup-20Apr2026-*-CHARTERBUGSDONE.tar.gz (μετά)

---

## SIGNATURES ROOT INVESTIGATION + FIX (20/04/2026 νύχτα)

### Diagnostic findings
- Πίνακας bookings: μόνο booking_number + booking_data (jsonb) + page*_data (pages 2-5 checkin/checkout data)
- Πίνακας charter_archives: booking_number + archive_data jsonb (περιέχει chartererData με firstName, lastName, signature base64, skipperName, skipperSignature base64, isLocked, idType, idNumber, taxNumber, taxOffice, tel, email, isAlsoSkipper, κλπ)
- Πίνακας crew_invitations: πλήρης δομή με submitted_* fields + signature_data + role + status
- **SIGNATURES ΥΠΑΡΧΟΥΝ**: charter_archives (1000 booking): charterer sig 7294 bytes, skipper sig 3314 bytes (Maria MAZARAKI). crew_invitations (Maria): signature 5866 bytes, role=skipper, status=submitted

### Root cause: οι γεννήτριες DOCX στο FleetManagement.tsx δεν χρησιμοποιούσαν τα δεδομένα
- generateCharterParty + generateCrewList στο FleetManagement.tsx είχαν ΔΙΚΗ ΤΟΥΣ υλοποίηση (ξεχωριστή από CharterAgreementPage.tsx)
- Δεν υπήρχε invitation enrichment
- CHARTERER_FIRST_NAME, CHARTERER_ID, CHARTERER_TAX κλπ δεν έβλεπαν onlineData
- Skipper fields δεν έβλεπαν onlineData (μόνο charter.skipper* που ήταν κενά)
- Signatures δεν mark-άρονταν ως ArrayBuffer marker για inject-signature.php

### Fixes applied

**FleetManagement.tsx:**
- generateCharterParty: προσθήκη invitation enrichment μετά loadChartererData, CHARTERER_* fields με onlineData fallback (firstName, lastName, address, idType-based ID/passport, taxNumber, taxOffice, tel, email), CHARTERER_SIGNATURE + %CHARTERER_SIGNATURE + %SKIPPER_SIGNATURE markers, SKIPPER_SIGNATURE marker
- generateCrewList: enrichment, skipperX fields prefer onlineDataCL?.skipper*, submitted crew invitations merge στο charter.crewMembers
- nullGetter: () => '' σε όλα τα Docxtemplater instances (2x)

**CharterAgreementPage.tsx:**
- Επέκταση enrichment να φέρνει όλα τα submitted_* fields (firstName, lastName, passport, phone, email, address, nationality, dob) όχι μόνο name+signature
- Merge crew invitations στο charter.crewMembers

**FleetManagement.tsx detail modal:**
- Νέο component CharterDetailsBlock
- Φορτώνει chartererData από charter-archive.php + skipper invitation από crew-invitations.php
- Εμφανίζει: Full Name, Address, ID Card, Passport, AFM, DOY, Phone, Email, Charterer Signature image, Skipper Name/Passport/Phone/Email + Skipper Signature image
- Γίνεται render αυτόματα αν υπάρχουν saved data

### Backup files
- /root/yacht-prod-backup-20Apr2026-*-SIGNATURESROOT.tar.gz (πριν)
- /root/yacht-prod-backup-20Apr2026-*-SIGNATURESROOTDONE.tar.gz (μετά)
