ΚΑΝΟΝΑΣ #0: ΑΠΑΓΟΡΕΥΕΤΑΙ οποιαδήποτε πρόσβαση στο C:\Users\KOSTAS\yacht-checkin ή Downloads ή Windows temp. Μόνο server /var/www/yacht-prod.

ΚΑΝΟΝΑΣ #1: Server first. SSH root@50.6.229.177. Build+Deploy στον server.

DB: PGPASSWORD='YachtDB2024!' psql -U yachtadmin -h localhost yachtdb
Deploy: cd /var/www/yacht-prod && bash deploy.sh
Version: v4.9

ΦΑΣΕΙΣ 1-4: DONE ήδη (rollback bypasses, localStorage cleanup, booking normalize, SELECT ALL OK button)

ΜΕΝΟΥΝ:

ΦΑΣΗ 5: CharterAgreementPage μεταφράσεις
- ΜΟΝΟ επικεφαλίδες + field labels (First Name, Email, Address, Passport κλπ) σε 10 γλώσσες
- Το agreement text (νομικό περιεχόμενο) ΜΕΝΕΙ Αγγλικά
- Flag selector 10 σημαιών αντί GR/EN toggle
- Page 4 vessel-checkin ΔΕΝ αγγίζει - είναι ήδη μεταφρασμένη

ΦΑΣΗ 6: Shareable Links Crew/Skipper
- Charterer συμπληρώνει βασικά στοιχεία crew+skipper στο CharterAgreementPage
- Σύστημα στέλνει email με μοναδικό link σε κάθε crew+skipper (αν skipper≠charterer)
- Email στη γλώσσα που επέλεξε ο Charterer (από flag selector)
- Link ανοίγει mini-form ΠΑΝΤΑ στα Αγγλικά
- Πεδία: όνομα, επώνυμο, διεύθυνση, email, τηλέφωνο, διαβατήριο
- GDPR consent 3 ενότητες + canvas signature + submit
- ΚΡΙΣΙΜΟ: μετά submit, όλα τα στοιχεία+υπογραφή πάνε ΠΙΣΩ στο CharterAgreementPage και γεμίζουν αυτόματα τα πεδία Crew List
- Crew List DOCX + Charter Party DOCX παίρνουν τα πλήρη στοιχεία + υπογραφές
- Ο Charterer βλέπει completion tracker (ποιος υπέγραψε)
- Emails μετά submission:
  * Στον crew/skipper: ευχαριστήρια στη γλώσσα Charterer
  * Στην εταιρεία info@tailwindyachting.com: Αγγλικά, ποιος συμπλήρωσε τι, timestamp
- Reminders: αν link δεν ολοκληρωθεί σε 3 μέρες → auto email
- Link expires after 7 days

ΦΑΣΗ 7: App Store + Play Store prep - ΔΕΝ ΠΕΙΡΑΖΟΥΜΕ ΤΩΡΑ
- Μόνο όταν το πει ο Κώστας ρητά
- Testing, version bump v5.0, backup, SCP στο local, git push, PWA audit, Lighthouse

ΑΠΑΓΟΡΕΥΜΕΝΑ git checkout: create-chat-tables.php, floorplans.php, update-charter-crew.php, add-crew-column.php, db_config.php, chat-messages.php
Πριν git pull: git checkout -- public/service-worker.js

Γλώσσα: Ο Κώστας Greeklish, απαντάς Ελληνικά. Σύντομα, χωρίς Τέλεια/Εξαιρετικό.

ΑΥΡΙΟ: Ξεκίνα Φάση 5.
