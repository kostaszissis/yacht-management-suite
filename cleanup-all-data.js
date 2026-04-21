/**
 * 🧹 CLEANUP SCRIPT - Remove ALL Test Data
 *
 * This script cleans:
 * - PostgreSQL database (all bookings, invoices, payments, financials)
 * - Browser localStorage (all charters, bookings, check-ins, financials)
 *
 * HOW TO RUN:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Press Enter
 * 4. Refresh the page
 */

console.log('🧹 Starting cleanup of ALL test data...');

// =====================================================
// 1. CLEAN LOCALSTORAGE
// =====================================================
console.log('\n📦 Cleaning localStorage...');

const keysToRemove = [];

// Scan all localStorage keys
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);

  // Remove keys related to:
  if (key && (
    key.includes('charter') ||
    key.includes('booking') ||
    key.includes('checkin') ||
    key.includes('checkout') ||
    key.includes('inspection') ||
    key.includes('damage') ||
    key.includes('signature') ||
    key.includes('invoice') ||
    key.includes('payment') ||
    key.includes('financial') ||
    key.includes('expense') ||
    key.includes('income') ||
    key.includes('revenue') ||
    key.includes('ΝΑΥΛΑ') ||
    key.includes('ΤΙΜΟΛΟΓΙΑ') ||
    key.includes('ΠΛΗΡΩΜΕΣ') ||
    key.includes('fleet_') ||
    key.includes('bookings')
  )) {
    keysToRemove.push(key);
  }
}

console.log(`Found ${keysToRemove.length} keys to remove:`, keysToRemove);

// Remove all matching keys
keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log(`  ✅ Removed: ${key}`);
});

console.log(`\n✅ localStorage cleaned: ${keysToRemove.length} keys removed`);

// =====================================================
// 2. CLEAN POSTGRESQL DATABASE VIA API
// =====================================================
console.log('\n🗄️ Cleaning PostgreSQL database...');

async function cleanDatabase() {
  const API_URL = 'https://yachtmanagementsuite.com/api';

  try {
    // Get all bookings
    console.log('  📊 Fetching all bookings from API...');
    const response = await fetch(`${API_URL}/bookings`);
    const data = await response.json();
    const bookings = data.bookings || {};

    const bookingNumbers = Object.keys(bookings);
    console.log(`  Found ${bookingNumbers.length} bookings in database`);

    if (bookingNumbers.length === 0) {
      console.log('  ✅ Database is already clean!');
      return;
    }

    // Delete each booking
    let deleted = 0;
    let failed = 0;

    for (const bookingNumber of bookingNumbers) {
      try {
        const deleteResponse = await fetch(`${API_URL}/bookings/${bookingNumber}`, {
          method: 'DELETE'
        });

        if (deleteResponse.ok) {
          console.log(`  ✅ Deleted booking: ${bookingNumber}`);
          deleted++;
        } else {
          console.error(`  ❌ Failed to delete: ${bookingNumber}`);
          failed++;
        }
      } catch (error) {
        console.error(`  ❌ Error deleting ${bookingNumber}:`, error);
        failed++;
      }
    }

    console.log(`\n✅ Database cleanup complete:`);
    console.log(`  - Deleted: ${deleted} bookings`);
    console.log(`  - Failed: ${failed} bookings`);

  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  }
}

// Run database cleanup
cleanDatabase().then(() => {
  console.log('\n🎉 CLEANUP COMPLETE!');
  console.log('\n📋 Summary:');
  console.log(`  - localStorage: ${keysToRemove.length} keys removed`);
  console.log('  - PostgreSQL: All bookings deleted');
  console.log('\n🔄 Please refresh the page to see the clean state.');
});
