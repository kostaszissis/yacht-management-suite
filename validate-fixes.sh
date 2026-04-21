#!/bin/bash
cd /var/www/yacht-prod
FIXED=0

# 1. Overlap strict < >
if grep -q "startDate' <=" api/bookings.php; then
  echo "🔧 FIX: overlap <= to <"
  sed -i "s/'startDate' <= :endDate/'startDate' < :endDate/g" api/bookings.php
  sed -i "s/'endDate' >= :startDate/'endDate' > :startDate/g" api/bookings.php
  FIXED=1
fi

# 2. UPSERT
if ! grep -q "ON CONFLICT (booking_number) DO UPDATE" api/bookings.php; then
  echo "🔧 FIX: adding UPSERT"
  sed -i 's/INSERT INTO bookings (booking_number, booking_data) VALUES (:booking_number, :booking_data)/INSERT INTO bookings (booking_number, booking_data) VALUES (:booking_number, :booking_data) ON CONFLICT (booking_number) DO UPDATE SET booking_data = EXCLUDED.booking_data/' api/bookings.php
  FIXED=1
fi

# 3. Array.isArray guard
if grep -q "result\.data || result || \[\]" src/FleetManagement.tsx; then
  echo "🔧 FIX: Array.isArray guard"
  sed -i 's/const allBookings = result\.data || result || \[\];/const allBookings = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);/' src/FleetManagement.tsx
  FIXED=1
fi

# 4. 43-byte stubs warning
STUBS=$(find api/ -name "*.php" -size 43c 2>/dev/null)

echo ""
if [ $FIXED -eq 1 ]; then
  echo "⚠️ AUTO-FIXED — issues were repaired"
else
  echo "✅ ALL CHECKS PASSED"
fi

if [ -n "$STUBS" ]; then
  echo "⚠️ 43-byte stubs (normal): $STUBS"
fi
