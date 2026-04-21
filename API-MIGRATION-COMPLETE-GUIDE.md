# COMPLETE API MIGRATION GUIDE
## Yacht Management Suite - Booking System Migration

### ✅ COMPLETED
1. **apiService.ts** - All hybrid API functions added

### 🔄 REMAINING CHANGES

## TASK 2: FleetManagement.tsx - ΝΑΥΛΑ (Charters) Form

### Location: CharterPage component (around line 3325)

### Changes Needed:

1. **Import API functions at top of file:**
```typescript
import { saveBookingHybrid, getBookingsHybrid } from './services/apiService';
```

2. **Update newCharter state to include skipper fields:**
```typescript
const [newCharter, setNewCharter] = useState({
  code: '',
  startDate: '',
  endDate: '',
  amount: '',
  commissionPercent: '',
  departure: 'ALIMOS MARINA',
  arrival: 'ALIMOS MARINA',
  status: 'Option',
  // NEW FIELDS:
  skipperFirstName: '',
  skipperLastName: '',
  skipperAddress: '',
  skipperEmail: '',
  skipperPhone: '',
  vesselName: boat.name,
  vesselType: boat.type || 'Monohull'
});
```

3. **Update handleAddCharter function (around line 3360):**
```typescript
const handleAddCharter = async () => {
  if (!canEditCharters) {
    showMessage('❌ View Only - Δεν έχετε δικαίωμα επεξεργασίας', 'error');
    return;
  }

  if (!isFormValid) {
    showMessage('❌ Παρακαλώ συμπληρώστε όλα τα πεδία.', 'error');
    return;
  }

  const charter = {
    id: uid(),
    code: newCharter.code,
    startDate: newCharter.startDate,
    endDate: newCharter.endDate,
    departure: newCharter.departure,
    arrival: newCharter.arrival,
    amount: financials.amount,
    commissionPercent: parseFloat(newCharter.commissionPercent) || 0,
    commission: financials.commission,
    vat_on_commission: financials.vat,
    status: newCharter.status,
    bookingStatus: newCharter.status,
    paymentStatus: 'Pending',
    payments: [],
    // NEW FIELDS:
    skipperFirstName: newCharter.skipperFirstName,
    skipperLastName: newCharter.skipperLastName,
    skipperAddress: newCharter.skipperAddress,
    skipperEmail: newCharter.skipperEmail,
    skipperPhone: newCharter.skipperPhone,
    createdBy: authService.getCurrentUser()?.name,
    createdAt: new Date().toISOString()
  };

  // Save charter to localStorage (existing logic)
  saveItems([...items, charter]);
  authService.logActivity('add_charter', `${boat.id}/${charter.code}`);

  // ✅ NEW: Also create booking in API
  try {
    await saveBookingHybrid(newCharter.code, {
      bookingData: {
        vesselName: boat.name,
        vesselType: boat.type || 'Monohull',
        charterPartyNo: newCharter.code,
        checkInDate: newCharter.startDate,
        checkOutDate: newCharter.endDate,
        checkInTime: null,
        checkOutTime: null,
        skipperFirstName: newCharter.skipperFirstName,
        skipperLastName: newCharter.skipperLastName,
        skipperAddress: newCharter.skipperAddress,
        skipperEmail: newCharter.skipperEmail,
        skipperPhone: newCharter.skipperPhone,
        departurePort: newCharter.departure,
        arrivalPort: newCharter.arrival,
        status: newCharter.status.toLowerCase() // 'option', 'confirmed', etc
      }
    });
    console.log('✅ Booking created in API:', newCharter.code);
  } catch (error) {
    console.error('⚠️ Failed to create booking in API:', error);
  }

  setNewCharter({
    code: '',
    startDate: '',
    endDate: '',
    amount: '',
    commissionPercent: '',
    departure: 'ALIMOS MARINA',
    arrival: 'ALIMOS MARINA',
    status: 'Option',
    skipperFirstName: '',
    skipperLastName: '',
    skipperAddress: '',
    skipperEmail: '',
    skipperPhone: '',
    vesselName: boat.name,
    vesselType: boat.type || 'Monohull'
  });
  setShowAddForm(false);
  showMessage('✅ Ο ναύλος προστέθηκε.', 'success');
};
```

4. **Add skipper fields to the form (around line 3444, inside showAddForm section):**

Add this section AFTER the "Κωδικός Ναύλου" field and BEFORE the dates:

```typescript
{/* SKIPPER INFORMATION */}
<div className="bg-gray-700 p-4 rounded-lg border border-gray-600 mt-4">
  <h3 className="text-lg font-bold text-teal-400 mb-3">SKIPPER INFORMATION</h3>
  <div className="grid grid-cols-1 gap-3">
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
        <input
          type="text"
          name="skipperFirstName"
          value={newCharter.skipperFirstName}
          onChange={handleFormChange}
          placeholder="John"
          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
        <input
          type="text"
          name="skipperLastName"
          value={newCharter.skipperLastName}
          onChange={handleFormChange}
          placeholder="Doe"
          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
      <input
        type="text"
        name="skipperAddress"
        value={newCharter.skipperAddress}
        onChange={handleFormChange}
        placeholder="123 Main St, City, Country"
        className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
      <input
        type="email"
        name="skipperEmail"
        value={newCharter.skipperEmail}
        onChange={handleFormChange}
        placeholder="john@example.com"
        className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
      <input
        type="tel"
        name="skipperPhone"
        value={newCharter.skipperPhone}
        onChange={handleFormChange}
        placeholder="+30 123 456 7890"
        className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-teal-500 focus:outline-none"
      />
    </div>
  </div>
</div>
```

---

## TASK 3: page1-with-fleet-management.tsx - Load Bookings from API

This file loads bookings for selection. Need to replace localStorage with API.

### Key Changes:

1. **Import API functions at top:**
```typescript
import { getBookingsHybrid } from './services/apiService';
```

2. **Find the loadBookings or similar function and replace with:**
```typescript
const loadBookings = async () => {
  try {
    const bookings = await getBookingsHybrid();
    // Transform bookings object to array for dropdown
    const bookingArray = Object.entries(bookings).map(([key, value]) => ({
      bookingNumber: key,
      ...value.bookingData
    }));
    setBookings(bookingArray);
    console.log('✅ Loaded bookings from API:', bookingArray.length);
  } catch (error) {
    console.error('Error loading bookings:', error);
    // Fallback to localStorage is already handled in getBookingsHybrid
  }
};
```

3. **Call loadBookings in useEffect:**
```typescript
useEffect(() => {
  loadBookings();
}, []);
```

---

## TASK 4: vessel-checkin-page2.tsx - Save to API

### Key Changes:

1. **Import API at top:**
```typescript
import { saveBookingHybrid } from './services/apiService';
```

2. **Update handleSaveDraft function (around line 631):**
```typescript
const handleSaveDraft = async () => {
  if (!currentBookingNumber) {
    alert(lang === 'el' ? '❌ Δεν υπάρχει ενεργή κράτηση!' : '❌ No active booking!');
    return;
  }

  const dataToSave = {
    items, hullItems, dinghyItems, mainsailAgreed,
    diversAgreed, remarks
  };

  // ✅ Save to API
  const modeKey = mode === 'in' ? 'page2DataCheckIn' : 'page2DataCheckOut';
  try {
    await saveBookingHybrid(currentBookingNumber, {
      [modeKey]: dataToSave
    });

    // Also save locally (for offline support - already handled in saveBookingHybrid)
    saveBookingData(currentBookingNumber, dataToSave, mode);

    alert(lang === 'el' ? '✅ Το προσχέδιο αποθηκεύτηκε!' : '✅ Draft saved!');
  } catch (error) {
    console.error('Error saving:', error);
    alert(lang === 'el' ? '❌ Σφάλμα αποθήκευσης!' : '❌ Save error!');
  }
};
```

3. **Update handleNext function similarly (around line 689)**

---

## TASK 5: vessel-checkin-page3.tsx - Save to API

### Key Changes:

1. **Import API at top:**
```typescript
import { saveBookingHybrid } from './services/apiService';
```

2. **Update handleSave function (around line 426):**
```typescript
const handleSave = async () => {
  if (!isEmployee || !currentEmployee?.canEdit) {
    alert(lang === 'el' ? '🔒 Δεν έχετε δικαίωμα αποθήκευσης!' : '🔒 You do not have permission to save!');
    return;
  }

  const dataToSave = {
    safetyItems,
    cabinItems,
    optionalItems,
    notes,
    signature: signatureImage,
    toiletWarningAccepted
  };

  // ✅ Save to API
  const modeKey = mode === 'in' ? 'page3DataCheckIn' : 'page3DataCheckOut';
  try {
    await saveBookingHybrid(currentBookingNumber, {
      [modeKey]: dataToSave
    });

    savePage3Data(currentBookingNumber, dataToSave, mode);
    alert(lang === 'el' ? '✅ Αποθηκεύτηκε!' : '✅ Saved!');
  } catch (error) {
    console.error('Error saving:', error);
    alert(lang === 'el' ? '❌ Σφάλμα αποθήκευσης!' : '❌ Save error!');
  }
};
```

3. **Update handleNext function similarly (around line 464)**

---

## TASK 6: page4-with-vessel-floorplans.tsx - Save to API

### Key Changes:

1. **Import API at top:**
```typescript
import { saveBookingHybrid } from './services/apiService';
```

2. **Update handleSave function (around line 685):**
```typescript
const handleSave = async () => {
  if (!isEmployee || !currentEmployee?.canEdit) {
    alert(lang === 'el' ? '🔒 Δεν έχετε δικαίωμα αποθήκευσης!' : '🔒 You do not have permission to save!');
    return;
  }

  const dataToSave = {
    items,
    navItems,
    safetyItems,
    genItems,
    deckItems,
    fdeckItems,
    dinghyItems,
    fendersItems,
    boathookItems,
    notes,
    signatureImage
  };

  // ✅ Save to API
  const modeKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
  try {
    await saveBookingHybrid(currentBookingNumber, {
      [modeKey]: dataToSave
    });

    // Also save to localStorage (for offline support)
    const storageKey = mode === 'in' ? 'page4DataCheckIn' : 'page4DataCheckOut';
    const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');

    if (bookings[currentBookingNumber]) {
      bookings[currentBookingNumber][storageKey] = dataToSave;
      bookings[currentBookingNumber].lastModified = new Date().toISOString();
      localStorage.setItem('bookings', JSON.stringify(bookings));
    }

    alert(lang === 'el' ? '✅ Αποθηκεύτηκε!' : '✅ Saved!');
  } catch (error) {
    console.error('Error saving:', error);
    alert(lang === 'el' ? '❌ Σφάλμα αποθήκευσης!' : '❌ Save error!');
  }
};
```

3. **Update handleNext function similarly (around line 798)**

---

## TASK 7: vessel-final-page.tsx - MASTER PAGE

This is the most critical file - it controls the entire flow and saves all data.

### Key Changes:

1. **Import API at top:**
```typescript
import { saveBookingHybrid, getBookingHybrid } from './services/apiService';
```

2. **Find the main save/submit function and update it:**
```typescript
const handleFinalSubmit = async () => {
  if (!currentBookingNumber) {
    alert('❌ No active booking!');
    return;
  }

  // Gather ALL data from all pages
  const page1Data = loadBookingData(currentBookingNumber, mode);
  const page2Data = mode === 'in' ? loadPage2DataCheckIn(currentBookingNumber) : loadPage2DataCheckOut(currentBookingNumber);
  const page3Data = mode === 'in' ? loadPage3DataCheckIn(currentBookingNumber) : loadPage3DataCheckOut(currentBookingNumber);
  const page4Data = mode === 'in' ? loadPage4DataCheckIn(currentBookingNumber) : loadPage4DataCheckOut(currentBookingNumber);

  // ✅ Save everything to API
  try {
    const updates = {
      bookingData: page1Data?.bookingData,
      page2DataCheckIn: mode === 'in' ? page2Data : undefined,
      page2DataCheckOut: mode === 'out' ? page2Data : undefined,
      page3DataCheckIn: mode === 'in' ? page3Data : undefined,
      page3DataCheckOut: mode === 'out' ? page3Data : undefined,
      page4DataCheckIn: mode === 'in' ? page4Data : undefined,
      page4DataCheckOut: mode === 'out' ? page4Data : undefined
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    await saveBookingHybrid(currentBookingNumber, updates);

    console.log('✅ All booking data saved to API');
    alert('✅ All data saved successfully!');

    // Continue with PDF generation and email sending...

  } catch (error) {
    console.error('❌ Error saving to API:', error);
    alert('⚠️ Some data may not have been saved. Check console for details.');
  }
};
```

---

## ADDITIONAL CHANGES NEEDED

### FleetBookingPlanPage Component

If there's a Fleet Booking Plan page (calendar view), it needs to be updated to load bookings from API.

**Find the loadBookings function and replace with:**
```typescript
const loadBookings = async () => {
  try {
    const bookings = await getBookingsHybrid();
    // Transform for calendar display
    const bookingArray = Object.entries(bookings).map(([key, value]) => ({
      id: key,
      bookingNumber: key,
      ...value.bookingData,
      ...value
    }));
    setBookings(bookingArray);
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
};
```

---

## TESTING CHECKLIST

After applying all changes, test this flow:

1. ✅ Create a new charter in Fleet Management ΝΑΥΛΑ with all skipper info
2. ✅ Verify booking appears in Page 1 dropdown
3. ✅ Select booking and perform check-in (fill pages 2, 3, 4)
4. ✅ Save at each step and verify data persists
5. ✅ Complete check-in and verify all data saved to API
6. ✅ Perform check-out for same booking
7. ✅ Verify check-out data saves separately
8. ✅ Check browser console for API sync messages
9. ✅ Test offline mode (disconnect internet, verify localStorage fallback)
10. ✅ Reconnect and verify data syncs to API

---

## DATABASE SCHEMA VERIFICATION

Ensure your PostgreSQL database has this structure:

```sql
CREATE TABLE IF NOT EXISTS bookings (
  booking_number VARCHAR(50) PRIMARY KEY,
  booking_data JSONB NOT NULL,
  page2_data_checkin JSONB,
  page2_data_checkout JSONB,
  page3_data_checkin JSONB,
  page3_data_checkout JSONB,
  page4_data_checkin JSONB,
  page4_data_checkout JSONB,
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API ENDPOINT VERIFICATION

Test these endpoints:
- GET https://yachtmanagementsuite.com/api/bookings
- GET https://yachtmanagementsuite.com/api/bookings/NAY-001
- POST https://yachtmanagementsuite.com/api/bookings
- PUT https://yachtmanagementsuite.com/api/bookings/NAY-001
- DELETE https://yachtmanagementsuite.com/api/bookings/NAY-001

---

## DEPLOYMENT NOTES

1. Deploy backend first (backend-server.js)
2. Test API endpoints manually with Postman/curl
3. Deploy frontend with updated code
4. Monitor browser console for API errors
5. Check server logs for database errors

---

## SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Check server logs: `pm2 logs yacht-api`
3. Verify database connection
4. Test API endpoints directly
5. Check CORS settings if getting network errors

---

**END OF MIGRATION GUIDE**
