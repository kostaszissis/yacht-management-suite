# 📋 Booking API Migration Guide
## From localStorage to PostgreSQL API

This guide shows which files need to be updated to migrate from localStorage to API.

---

## ✅ COMPLETED FILES

### 1. **Backend Server** - `backend-server.js`
✅ Created with PostgreSQL endpoints for bookings and vessels

### 2. **API Service** - `src/services/apiService.ts`
✅ Updated with complete booking API functions

---

## 🔧 FRONTEND FILES TO UPDATE

### **Priority 1: Core Booking Management**

#### 1. **src/page1-with-fleet-management.tsx**
**Changes Required:**
- Replace `saveBookingData()` with API call
- Replace `loadBookingData()` with API call
- Replace `getAllBookings()` with API call
- Replace `deleteBooking()` with API call

**Current Code (Lines 206-289):**
```typescript
const saveBookingData = (bookingNumber, data) => {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  // ... localStorage logic
  localStorage.setItem('bookings', JSON.stringify(bookings));
};

const loadBookingData = (bookingNumber) => {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  return bookings[bookingNumber]?.bookingData || null;
};

const getAllBookings = () => {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  return Object.keys(bookings).map(bookingNumber => ({...}));
};

const deleteBooking = (bookingNumber) => {
  const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
  delete bookings[bookingNumber];
  localStorage.setItem('bookings', JSON.stringify(bookings));
};
```

**New Code:**
```typescript
import { getBooking, saveBooking, getBookings, deleteBooking as deleteBookingAPI } from './services/apiService';

const saveBookingData = async (bookingNumber, data) => {
  if (!bookingNumber) return;

  try {
    await saveBooking(bookingNumber, { bookingData: data });
    console.log('💾 Saved booking:', bookingNumber);
  } catch (error) {
    console.error('Error saving booking:', error);
    throw error;
  }
};

const loadBookingData = async (bookingNumber) => {
  if (!bookingNumber) return null;

  try {
    const booking = await getBooking(bookingNumber);
    if (booking?.bookingData) {
      console.log('📂 Loaded booking:', bookingNumber);
      return booking.bookingData;
    }
    return null;
  } catch (error) {
    console.error('Error loading booking:', error);
    return null;
  }
};

const getAllBookings = async () => {
  try {
    const response = await getBookings();
    const bookingsObj = response.bookings || {};
    return Object.keys(bookingsObj).map(bookingNumber => ({
      bookingNumber,
      ...bookingsObj[bookingNumber].bookingData,
      lastModified: bookingsObj[bookingNumber].lastModified,
      synced: bookingsObj[bookingNumber].synced
    }));
  } catch (error) {
    console.error('Error getting all bookings:', error);
    return [];
  }
};

const deleteBooking = async (bookingNumber) => {
  try {
    await deleteBookingAPI(bookingNumber);
    console.log('🗑️ Deleted booking:', bookingNumber);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};
```

**Additional Changes:**
- Update `useEffect` hooks that call these functions to handle async/await
- Add loading states while fetching data
- Add error handling UI

---

#### 2. **src/vessel-checkin-page2.tsx**
**Changes Required:**
- Replace localStorage reads/writes for page2 data with API calls

**Current Pattern:**
```typescript
// Line 245
const currentBookingNumber = localStorage.getItem('currentBooking') || '';

// Line 668 (save)
const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
bookings[currentBookingNumber].page2DataCheckIn = { items, hullItems, dinghyItems };
localStorage.setItem('bookings', JSON.stringify(bookings));
```

**New Pattern:**
```typescript
import { getBooking, updateBooking } from './services/apiService';

// Load on mount
useEffect(() => {
  const loadPage2Data = async () => {
    if (!currentBookingNumber) return;

    try {
      const booking = await getBooking(currentBookingNumber);
      if (booking?.page2DataCheckIn) {
        // Load page2 data
        setItems(booking.page2DataCheckIn.items || []);
        setHullItems(booking.page2DataCheckIn.hullItems || []);
        setDinghyItems(booking.page2DataCheckIn.dinghyItems || []);
      }
    } catch (error) {
      console.error('Error loading page2 data:', error);
    }
  };

  loadPage2Data();
}, [currentBookingNumber]);

// Save function
const savePage2Data = async () => {
  if (!currentBookingNumber) return;

  try {
    await updateBooking(currentBookingNumber, {
      page2DataCheckIn: { items, hullItems, dinghyItems }
    });
    console.log('✅ Page2 data saved');
  } catch (error) {
    console.error('Error saving page2 data:', error);
  }
};
```

---

#### 3. **src/vessel-checkin-page3.tsx**
**Changes Required:**
- Similar to page2, replace localStorage with API for page3 data

**Pattern:**
```typescript
import { getBooking, updateBooking } from './services/apiService';

// Load page3 data
const loadPage3Data = async () => {
  const booking = await getBooking(currentBookingNumber);
  if (booking?.page3DataCheckIn) {
    setSafetyItems(booking.page3DataCheckIn.safetyItems || []);
    setCabinItems(booking.page3DataCheckIn.cabinItems || []);
    setOptionalItems(booking.page3DataCheckIn.optionalItems || []);
  }
};

// Save page3 data
const savePage3Data = async () => {
  await updateBooking(currentBookingNumber, {
    page3DataCheckIn: { safetyItems, cabinItems, optionalItems }
  });
};
```

---

#### 4. **src/page4-with-vessel-floorplans.tsx**
**Changes Required:**
- Replace localStorage with API for page4 data (floorplan interactions)

**Pattern:**
```typescript
import { getBooking, updateBooking } from './services/apiService';

// Load and save page4 data with same pattern as page2/page3
```

---

#### 5. **src/vessel-final-page.tsx**
**Changes Required:**
- Load all booking data from API for final summary

**Current Pattern:**
```typescript
// Line 257-259
const currentBooking = localStorage.getItem('currentBooking');
const bookings = JSON.parse(localStorage.getItem('bookings') || '{}');
```

**New Pattern:**
```typescript
import { getBooking } from './services/apiService';

const loadAllBookingData = async () => {
  const booking = await getBooking(currentBookingNumber);
  return booking;
};
```

---

### **Priority 2: Supporting Components**

#### 6. **src/shared-components.js**
**Changes Required:**
- Update `savePageData` helper function to use API
- Update `BookingInfoBox` component to load from API

**Current Pattern (Line 224):**
```javascript
localStorage.setItem('bookings', JSON.stringify(bookings));
```

**New Pattern:**
```javascript
import { updateBooking } from './services/apiService';

export const savePageData = async (bookingNumber, pageKey, data) => {
  await updateBooking(bookingNumber, { [pageKey]: data });
};
```

---

#### 7. **src/App.tsx**
**Changes Required:**
- Update booking initialization logic
- Replace localStorage with API for mode changes

**Current Pattern (Lines 193, 284, 301):**
```typescript
localStorage.setItem('bookings', JSON.stringify(bookings));
localStorage.setItem('currentBooking', updates.bookingNumber);
```

**New Pattern:**
```typescript
import { getBooking, updateBooking } from './services/apiService';

// Use API calls instead of localStorage
// Store currentBooking in React state or sessionStorage (temporary)
```

---

#### 8. **src/HomePage.tsx**
**Changes Required:**
- Load booking status from API instead of localStorage

**Current Pattern (Line 82):**
```typescript
localStorage.setItem('currentBooking', status.bookingCode);
```

**New Pattern:**
```typescript
// Store current booking in sessionStorage (temporary)
// Or use React Context to share across components
sessionStorage.setItem('currentBooking', status.bookingCode);
```

---

#### 9. **src/CharterAgreementPage.tsx**
**Changes Required:**
- Update charter agreement saving to use API

**Current Pattern (Line 513):**
```typescript
localStorage.setItem('bookings', JSON.stringify(bookings));
```

**New Pattern:**
```typescript
await updateBooking(bookingNumber, { bookingData: data });
```

---

## 🔑 IMPORTANT MIGRATION NOTES

### 1. **Current Booking Tracking**
Instead of `localStorage.getItem('currentBooking')`, use:
- **Option A:** sessionStorage (temporary, cleared on tab close)
  ```typescript
  sessionStorage.setItem('currentBooking', bookingNumber);
  const current = sessionStorage.getItem('currentBooking');
  ```

- **Option B:** React Context (recommended)
  ```typescript
  const BookingContext = createContext();
  // Wrap app with provider
  ```

### 2. **Loading States**
Add loading indicators:
```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await getBooking(bookingNumber);
    // ... use data
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

### 3. **Error Handling**
Add user-friendly error messages:
```typescript
try {
  await saveBooking(...);
  alert('✅ Saved successfully!');
} catch (error) {
  alert('❌ Failed to save. Please try again.');
  console.error(error);
}
```

### 4. **Offline Support (Optional)**
Keep localStorage as cache:
```typescript
// Try API first, fallback to localStorage
try {
  const booking = await getBooking(bookingNumber);
  localStorage.setItem(`booking_${bookingNumber}`, JSON.stringify(booking));
  return booking;
} catch (error) {
  // If offline, use cached data
  const cached = localStorage.getItem(`booking_${bookingNumber}`);
  return cached ? JSON.parse(cached) : null;
}
```

### 5. **Migration Strategy**
**Recommended Approach:**
1. Deploy backend server first
2. Test API endpoints with Postman/curl
3. Update one page at a time (start with page1)
4. Keep localStorage as backup during transition
5. Remove localStorage code after full testing

---

## 📦 DEPLOYMENT CHECKLIST

### Backend Deployment
```bash
# 1. Copy backend-server.js to server
scp backend-server.js user@server:/var/www/yacht-api/server.js

# 2. Install dependencies
cd /var/www/yacht-api
npm install express cors pg nodemailer

# 3. Create PostgreSQL database
sudo -u postgres psql
CREATE DATABASE yachtdb;
CREATE USER yachtadmin WITH PASSWORD 'YachtDB2024!';
GRANT ALL PRIVILEGES ON DATABASE yachtdb TO yachtadmin;
\q

# 4. Set up environment variables
echo "EMAIL_USER=your-email@gmail.com" > .env
echo "EMAIL_PASS=your-app-password" >> .env

# 5. Start server with PM2
pm2 start server.js --name yacht-api
pm2 save
```

### Frontend Deployment
```bash
# 1. Update apiService.ts (already done)
# 2. Update each page component with API calls
# 3. Test locally
npm run dev

# 4. Build and deploy
npm run build
# Copy build to production server
```

---

## 🧪 TESTING

### Test API Endpoints
```bash
# Get all bookings
curl http://localhost:3001/api/bookings

# Get single booking
curl http://localhost:3001/api/bookings/BOOKING123

# Create booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"bookingNumber":"TEST001","bookingData":{"vesselName":"Test Vessel"}}'

# Update booking
curl -X PUT http://localhost:3001/api/bookings/TEST001 \
  -H "Content-Type: application/json" \
  -d '{"bookingData":{"vesselName":"Updated Vessel"}}'

# Delete booking
curl -X DELETE http://localhost:3001/api/bookings/TEST001
```

---

## 📊 MIGRATION PROGRESS TRACKER

- [ ] Backend server deployed
- [ ] PostgreSQL database created
- [ ] API endpoints tested
- [ ] page1-with-fleet-management.tsx
- [ ] vessel-checkin-page2.tsx
- [ ] vessel-checkin-page3.tsx
- [ ] page4-with-vessel-floorplans.tsx
- [ ] vessel-final-page.tsx
- [ ] shared-components.js
- [ ] App.tsx
- [ ] HomePage.tsx
- [ ] CharterAgreementPage.tsx
- [ ] Remove localStorage fallback code
- [ ] Production deployment
- [ ] User acceptance testing

---

## 🆘 TROUBLESHOOTING

### Issue: CORS errors
**Solution:** Ensure backend has CORS enabled:
```javascript
app.use(cors({
  origin: 'https://yachtmanagementsuite.com',
  credentials: true
}));
```

### Issue: 404 errors
**Solution:** Check API_URL in apiService.ts matches backend URL

### Issue: Database connection failed
**Solution:** Check PostgreSQL credentials and ensure database exists

### Issue: Data not persisting
**Solution:** Check backend logs for SQL errors
```bash
pm2 logs yacht-api
```

---

## 📚 ADDITIONAL RESOURCES

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Async/Await Patterns](https://react.dev/reference/react/useState)
- [PM2 Process Manager](https://pm2.keymetrics.io/docs/usage/quick-start/)
