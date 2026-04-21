# 📋 Οδηγός Placeholders για Word Documents

## Τι είναι τα Placeholders;

Τα placeholders είναι ειδικά σύμβολα που θα αντικατασταθούν αυτόματα με τα πραγματικά δεδομένα κάθε κράτησης.

**Μορφή:** `{{fieldName}}`

Παράδειγμα: Αν γράψεις `{{bookingCode}}` στο Word, θα αντικατασταθεί με "001"

---

## 🔧 Πώς να τα προσθέσεις στα Word Documents

### Βήμα 1: Άνοιξε το Word Document
Άνοιξε το `Charter-Agreement.docx` ή `Crew-List.docx`

### Βήμα 2: Βρες τις θέσεις που θέλεις να συμπληρωθούν αυτόματα
Για παράδειγμα, αν έχεις:
```
Booking Number: __________
```

### Βήμα 3: Αντικατάστησε με placeholder
Αλλάξ' το σε:
```
Booking Number: {{bookingCode}}
```

### Βήμα 4: Επανέλαβε για όλα τα πεδία
Βλέπε παρακάτω τη λίστα με όλα τα διαθέσιμα placeholders

---

## 📝 Διαθέσιμα Placeholders

### 🔢 Βασικά Στοιχεία Κράτησης
```
{{bookingNumber}}         - Αριθμός κράτησης
{{bookingCode}}          - Κωδικός κράτησης (π.χ. "001")
{{vesselName}}           - Όνομα σκάφους (π.χ. "Lagoon 42-BOB")
{{selectedVessel}}       - Εναλλακτικό όνομα σκάφους
```

### 📅 Ημερομηνίες
```
{{checkInDate}}          - Ημερομηνία Check-in (π.χ. "2025-06-15")
{{checkOutDate}}         - Ημερομηνία Check-out (π.χ. "2025-06-22")
```

### 👨‍✈️ Στοιχεία Skipper
```
{{skipperFirstName}}     - Όνομα (π.χ. "Κώστας")
{{skipperLastName}}      - Επώνυμο (π.χ. "Παπαδόπουλος")
{{skipperEmail}}         - Email
{{skipperPhone}}         - Τηλέφωνο
{{skipperNationality}}   - Υπηκοότητα
{{skipperPassport}}      - Αριθμός διαβατηρίου
{{skipperAddress}}       - Διεύθυνση
```

### 💰 Οικονομικά Στοιχεία (ΟΛΑ με 2 δεκαδικά)
```
{{amount}}               - Αρχικό ποσό (π.χ. "5000.00")
{{charterAmount}}        - Ποσό Ναύλου ΚΑΘΑΡΟ (π.χ. "4000.00")
{{charterVat}}           - ΦΠΑ Ναύλου 12% (π.χ. "480.00")
{{totalAmount}}          - ΣΥΝΟΛΟ (Ναύλος + ΦΠΑ) (π.χ. "4480.00")
{{deposit}}              - Προκαταβολή (π.χ. "4480.00")
{{commission}}           - Προμήθεια (π.χ. "1000.00")
{{commissionVat}}        - ΦΠΑ Προμήθειας 24% (π.χ. "240.00")
```

### 🏢 Στοιχεία Αντζενσι
```
{{agencyName}}           - Όνομα αντζενσι
{{agencyProvidesInvoice}} - "Yes" ή "No" (αν δίνει τιμολόγιο)
```

---

## 📄 Παράδειγμα Charter Agreement

```
═══════════════════════════════════════════════════════════
                    CHARTER PARTY AGREEMENT
                      ΝΑΥΛΟΣΥΜΦΩΝΟ
═══════════════════════════════════════════════════════════

BOOKING DETAILS / ΣΤΟΙΧΕΙΑ ΚΡΑΤΗΣΗΣ
------------------------------------------------------------
Booking Code:        {{bookingCode}}
Vessel:              {{vesselName}}
Check-in Date:       {{checkInDate}}
Check-out Date:      {{checkOutDate}}

CHARTERER INFORMATION / ΣΤΟΙΧΕΙΑ ΝΑΥΛΩΤΗ
------------------------------------------------------------
Name:                {{skipperFirstName}} {{skipperLastName}}
Email:               {{skipperEmail}}
Phone:               {{skipperPhone}}
Passport:            {{skipperPassport}}
Nationality:         {{skipperNationality}}
Address:             {{skipperAddress}}

FINANCIAL SUMMARY / ΟΙΚΟΝΟΜΙΚΑ ΣΤΟΙΧΕΙΑ
------------------------------------------------------------
Charter Amount (NET): {{charterAmount}}€
VAT (12%):           {{charterVat}}€
────────────────────────────────────────
TOTAL AMOUNT:        {{totalAmount}}€
DEPOSIT:             {{deposit}}€

═══════════════════════════════════════════════════════════
```

---

## 📋 Παράδειγμα Crew List

```
═══════════════════════════════════════════════════════════
                      CREW LIST
                 ΛΙΣΤΑ ΠΛΗΡΩΜΑΤΟΣ
═══════════════════════════════════════════════════════════

BOOKING: {{bookingCode}}
VESSEL:  {{vesselName}}
DATES:   {{checkInDate}} - {{checkOutDate}}

SKIPPER / ΚΑΠΕΤΑΝΙΟΣ
------------------------------------------------------------
Name:        {{skipperFirstName}} {{skipperLastName}}
Passport:    {{skipperPassport}}
Nationality: {{skipperNationality}}

CREW MEMBERS / ΜΕΛΗ ΠΛΗΡΩΜΑΤΟΣ
------------------------------------------------------------
(Add manually or use crew form)

═══════════════════════════════════════════════════════════
```

---

## ✅ Τι να κάνεις ΤΩΡΑ

1. **Άνοιξε** το `Charter-Agreement.docx` από το `public/documents/`
2. **Βρες** τα πεδία που θέλεις να συμπληρωθούν (π.χ. Booking Number, Vessel, κ.λπ.)
3. **Αντικατάστησε** τα με placeholders από τη λίστα παραπάνω (π.χ. `{{bookingCode}}`)
4. **Επανάλαβε** για το `Crew-List.docx`
5. **Αποθήκευσε** τα αρχεία

---

## 🧪 Δοκιμή

Μετά την προσθήκη των placeholders:

1. Πήγαινε στο `/charter-agreement`
2. Πάτησε **"Download Charter Agreement"**
3. Άνοιξε το αρχείο που κατέβηκε
4. Έλεγξε αν όλα τα `{{placeholders}}` αντικαταστάθηκαν με πραγματικά δεδομένα

---

## ⚠️ Σημαντικό

- Γράψε τα placeholders **ΑΚΡΙΒΩΣ** όπως φαίνονται παραπάνω
- Μην ξεχάσεις τα `{{` και `}}`
- Δεν έχει σημασία το κεφαλαίο/μικρό (αλλά καλύτερα να τα γράψεις όπως παραπάνω)
- Αν κάποιο πεδίο είναι κενό, θα εμφανιστεί κενή γραμμή στο τελικό document

---

## 💡 Tips

- Μπορείς να χρησιμοποιήσεις **bold**, *italic*, underline στα placeholders
- Μπορείς να προσθέσεις κείμενο πριν/μετά: `Total: {{totalAmount}}€`
- Για ποσά, το σύστημα προσθέτει αυτόματα 2 δεκαδικά (4000.00)

---

**Όταν τελειώσεις, πες μου "ετοιμα" και θα κάνω δοκιμή!** ✅
