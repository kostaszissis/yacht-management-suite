# 💬 Technical Support Chat - Οδηγός Χρήσης

## ✅ Τι Προστέθηκε

Ένα **πλήρες σύστημα live chat** για επικοινωνία μεταξύ:
- 👤 **Πελάτες (Charters)**
- 🛠️ **Technical Manager**

---

## 🎯 Χαρακτηριστικά

### Για τον Πελάτη:
- ✅ **Νέο κουμπί στο HomePage**: "Chat με Technical Manager" 💬
- ✅ **Real-time messaging**: Στέλνει και λαμβάνει μηνύματα live
- ✅ **Ήχος ειδοποίησης**: Παίζει "beep" όταν έρχεται νέο μήνυμα από Technical Manager
- ✅ **Πάντα διαθέσιμο**: Το κουμπί είναι ξεκλείδωτο όπως το Weather, AI Assistant, κλπ.

### Για τον Technical Manager:
- ✅ **Dashboard με όλες τις συνομιλίες**: Βλέπει όλα τα chats
- ✅ **Unread counter**: Βλέπει πόσα μηνύματα δεν έχει διαβάσει
- ✅ **Φίλτρα**: ALL / OPEN / CLOSED chats
- ✅ **Close/Reopen chats**: Μπορεί να κλείσει ή να ξανανοίξει συνομιλίες
- ✅ **Real-time updates**: Αυτόματη ανανέωση κάθε 2 δευτερόλεπτα
- ✅ **Browser Notifications**: Ειδοποιήσεις ακόμα και όταν το app είναι κλειστό/minimized

---

## 📍 Πού Βρίσκονται τα Αρχεία

### 1. **Services**
```
src/services/technicalSupportService.ts
```
- Διαχειρίζεται όλη τη λογική του chat
- LocalStorage για αποθήκευση μηνυμάτων
- Ήχος ειδοποίησης

### 2. **Components**
```
src/TechnicalSupportChat.tsx          ← Για τον πελάτη
src/TechnicalManagerDashboard.tsx     ← Για τον Technical Manager
```

### 3. **Routes (App.tsx)**
```typescript
/technical-support          ← Customer chat
/technical-manager          ← Technical Manager dashboard
```

---

## 🚀 Πώς να το Χρησιμοποιήσεις

### **Ως Πελάτης (Charter):**

1. Πήγαινε στο **HomePage**
2. Πάτα το κουμπί **"Chat με Technical Manager"** 💬
3. Γράψε το μήνυμά σου
4. Πάτα **Send**
5. Όταν ο Technical Manager απαντήσει, θα ακούσεις ένα "beep" 🔔

### **Ως Technical Manager:**

1. Μπες στην εφαρμογή με **Staff Login** (π.χ. `ADMIN2025`)
2. Πήγαινε στο URL: **`/technical-manager`**
   - Ή πρόσθεσε link στο Admin Panel
3. Θα δεις τη λίστα με όλα τα chats
4. Πάτα σε ένα chat για να το ανοίξεις
5. Απάντησε στον πελάτη
6. Μπορείς να κλείσεις το chat όταν τελειώσει

---

## 🔔 Ειδοποιήσεις

### Ήχος Ειδοποίησης
Ο ήχος παίζει **αυτόματα** όταν:
- ✅ Ο **πελάτης** λαμβάνει μήνυμα από τον Technical Manager
- ✅ Ο **Technical Manager** λαμβάνει μήνυμα από πελάτη
- ✅ Χρησιμοποιεί **Web Audio API** (δουλεύει σε όλα τα browsers)
- ✅ Είναι ένα **απλό beep** 800Hz, 0.3 δευτερόλεπτα

### Browser Notifications (για Technical Manager)
Όταν ο Technical Manager λαμβάνει μήνυμα:
- ✅ **Browser notification** εμφανίζεται ακόμα και αν το app είναι κλειστό
- ✅ **Click notification** → ανοίγει το Technical Manager Dashboard
- ✅ **Auto-close** μετά από 10 δευτερόλεπτα
- ✅ **Permission request** → ζητάει άδεια την πρώτη φορά που μπαίνει στο dashboard

### Πώς λειτουργεί:
```typescript
// Ήχος
playNotificationSound() {
  // Creates a 800Hz sine wave beep
  // Duration: 0.3 seconds
  // Volume: 0.3 (30%)
}

// Browser Notification
showBrowserNotification(title, message, chatId) {
  new Notification(title, {
    body: message,
    icon: '/favicon.ico',
    requireInteraction: false
  });
  // Clicks → opens /technical-manager
}
```

---

## 💾 Αποθήκευση Δεδομένων

Όλα τα chats αποθηκεύονται στο **localStorage**:

```typescript
Key: 'technical_support_chats'

Structure:
{
  id: "chat_123",
  bookingCode: "NAY-001",
  vesselName: "Lagoon 46-BOB",
  customerName: "John Doe",
  messages: [
    {
      id: "msg_1",
      sender: "CUSTOMER",
      message: "Hello, I need help",
      timestamp: "2025-01-21T10:30:00Z",
      read: false
    }
  ],
  unreadCount: 1,
  status: "OPEN"
}
```

---

## 🎨 UI/UX

### **Customer Chat:**
- 💬 **Μπλε bubbles** για τα μηνύματα του πελάτη (δεξιά)
- 🛠️ **Γκρι bubbles** για τα μηνύματα του Technical Manager (αριστερά)
- ⏰ **Timestamps** σε κάθε μήνυμα
- 📱 **Responsive design**

### **Technical Manager Dashboard:**
- 📊 **Split view**: Λίστα chats (αριστερά) + Μηνύματα (δεξιά)
- 🔴 **Red badge** για unread messages
- 🟢 **Open/Closed status indicators**
- ⏱️ **Relative timestamps** (5m ago, 2h ago, etc.)
- 🎨 **Πράσινα bubbles** για τα μηνύματα του Technical Manager

---

## 🔧 Technical Details

### **Real-time Updates:**
Χρησιμοποιεί **polling** (κάθε 2 δευτερόλεπτα):

```typescript
subscribeToChat(chatId, callback, interval = 2000)
```

### **Read Receipts:**
Τα μηνύματα μαρκάρονται ως διαβασμένα αυτόματα:

```typescript
markMessagesAsRead(chatId, 'CUSTOMER' | 'TECHNICAL')
```

### **Unread Counter:**
Υπολογίζεται δυναμικά:

```typescript
getTotalUnreadCount() → 5 unread messages
```

---

## 📋 Checklist Εγκατάστασης

- [x] Service created: `technicalSupportService.ts`
- [x] Customer chat component created: `TechnicalSupportChat.tsx`
- [x] Manager dashboard created: `TechnicalManagerDashboard.tsx`
- [x] Routes added to `App.tsx`
- [x] Button added to `HomePage.tsx`
- [x] Sound notification implemented
- [x] Real-time polling implemented
- [x] Read receipts implemented
- [x] Unread counter implemented

---

## 🎯 Επόμενα Βήματα (Optional)

### Για να προσθέσεις link στο Admin Panel:

1. Άνοιξε `src/FleetManagement.tsx`
2. Βρες το `AdminDashboard` component
3. Πρόσθεσε κουμπί:

```typescript
<button
  onClick={() => window.location.href = '/technical-manager'}
  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
>
  💬 Technical Support Dashboard
</button>
```

---

## 🐛 Troubleshooting

### **Δεν παίζει ο ήχος:**
- Έλεγξε ότι ο browser επιτρέπει auto-play sounds
- Κάνε "click" στη σελίδα πριν έρθει το μήνυμα (Web Audio API restriction)

### **Δεν εμφανίζονται browser notifications:**
- Έλεγξε ότι έχεις δώσει άδεια στο browser (Permission: Allow)
- Στο Chrome: Settings → Privacy and Security → Site Settings → Notifications
- Βεβαιώσου ότι το dashboard είναι ανοιχτό τουλάχιστον μία φορά για να ζητήσει άδεια

### **Δεν ενημερώνονται τα μηνύματα:**
- Έλεγξε το console για errors
- Βεβαιώσου ότι το localStorage δουλεύει

### **Δεν βρίσκει το booking:**
- Πρέπει να έχεις εισάγει booking code στο HomePage πρώτα
- Το chat χρειάζεται `bookingCode`, `vesselName`, `customerName`

---

## 📞 Support

Αν χρειάζεσαι βοήθεια, έλεγξε:
- Console για error messages
- localStorage key: `technical_support_chats`
- Network tab για fetch requests (αν χρησιμοποιήσεις backend στο μέλλον)

---

**Created:** 2025-01-21
**Version:** 1.0.0
**Status:** ✅ Completed & Ready to Use
