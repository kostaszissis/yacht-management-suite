<!-- Concise guidance for AI coding agents working on this repo -->
# Yacht-checkin — Copilot Instructions (short & practical)

Goal: get productive quickly — focus on the three places that must stay in sync: frontend -> API -> storage.

Big picture
- Frontend: React (TypeScript) in `src/` using Create React App + CRACO. Key scripts: `npm start`, `npm run build`, `npm test`.
- Backend: Node/Express API in `backend-server.js` (Postgres JSONB). Run locally with `node backend-server.js` (PORT 3001 default).
- Legacy/aux: PHP endpoints in `backend/` (chat endpoints + one-time helper scripts like `create-chat-tables.php`).

Read first
- `src/services/apiService.ts` — API_URL (default: production), hybrid sync helpers (getBookingsHybrid, saveBookingHybrid, syncUnsyncedBookings), and localStorage patterns.
- `backend-server.js` — DB schema, endpoints (/api/bookings, /api/vessels, /email/*) and payload examples.
- `src/firebase.ts` — Firestore mirror and storage handlers (signatures/photos) — update if Firestore is in use.

Key rules & examples
- Canonical booking shape (used across DB, API, localStorage): bookingNumber -> { bookingData, page2DataCheckIn, page2DataCheckOut, page3..., page4..., lastModified, synced }.
- API responses often return bookings as an OBJECT keyed by bookingNumber (not an array). Use helper conversions in `mergeCharters()`.
- Per-vessel localStorage keys: `fleet_{id}_ΝΑΥΛΑ` (note the Greek suffix) — keep this when you touch localStorage.
- Always encode booking IDs for URLs: use `encodeURIComponent(bookingNumber)` (IDs can contain spaces/special chars).

API snippets (for tests/implementation)
- POST /api/bookings body: { bookingNumber, bookingData, page2DataCheckIn?, page2DataCheckOut?, page3..., page4... }
- GET /api/bookings -> { bookings: { <bookingNumber>: {...} }, total }
- POST /email/send-checkin-email -> { bookingData, pdfBase64, mode:'in'|'out', recipients: ['a@b.com'] }

Developer flow & quick sanity checks
- Frontend dev: `npm install` → `npm start` (localhost:3000) — CRACO is used (see package.json).
- Backend dev: `node backend-server.js` (defaults to 3001) → health: http://localhost:3001/health
- Use Postman / curl to exercise APIs; check server console for helpful messages (e.g. '✅ Booking created').

When adding/changing booking fields — REQUIRED coordinated changes
1) backend: `backend-server.js` (DB JSONB schema & API endpoints)
2) frontend: `src/services/apiService.ts` (persistence, merging, encodeURIComponent usage)
3) optional: `src/firebase.ts` (if Firestore used)
4) UI: components under `src/` and localStorage migration logic

Security note
- Repo includes example credentials and one-time helper scripts (e.g. `create-chat-tables.php`) — do not leave these in production and use `.env` for secrets.

Start here: open `src/services/apiService.ts` and `backend-server.js` — they define the canonical data shapes and the majority of cross-cutting behavior.
