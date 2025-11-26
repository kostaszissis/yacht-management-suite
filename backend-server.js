// =====================================================
// YACHT MANAGEMENT SUITE - API SERVER
// =====================================================
// PostgreSQL backend for bookings, vessels, and email
// Deploy to: /var/www/yacht-api/server.js

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// =====================================================
// POSTGRESQL CONNECTION
// =====================================================
const pool = new Pool({
  user: 'yachtadmin',
  host: 'localhost',
  database: 'yachtdb',
  password: 'YachtDB2024!',
  port: 5432,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to PostgreSQL:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
});

// =====================================================
// DATABASE INITIALIZATION
// =====================================================
async function initializeDatabase() {
  try {
    // Create vessels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vessels (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        model VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create bookings table
    await pool.query(`
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
    `);

    // Create index on last_modified for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_last_modified
      ON bookings(last_modified DESC);
    `);

    // Create index on booking_data for vessel name search
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_vessel_name
      ON bookings USING gin ((booking_data->'vesselName'));
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

initializeDatabase();

// =====================================================
// EMAIL CONFIGURATION
// =====================================================
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// =====================================================
// VESSELS ENDPOINTS
// =====================================================

// GET /api/vessels - Get all vessels
app.get('/api/vessels', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vessels ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching vessels:', error);
    res.status(500).json({ error: 'Failed to fetch vessels' });
  }
});

// POST /api/vessels - Create new vessel
app.post('/api/vessels', async (req, res) => {
  try {
    const { id, name, type, model } = req.body;

    if (!id || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields: id, name, type' });
    }

    const result = await pool.query(
      `INSERT INTO vessels (id, name, type, model)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id.toUpperCase(), name, type, model || '']
    );

    console.log('✅ Vessel created:', id);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Vessel with this ID already exists' });
    }
    console.error('❌ Error creating vessel:', error);
    res.status(500).json({ error: 'Failed to create vessel' });
  }
});

// PUT /api/vessels/:id - Update vessel
app.put('/api/vessels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, model } = req.body;

    const result = await pool.query(
      `UPDATE vessels
       SET name = $1, type = $2, model = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, type, model || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    console.log('✅ Vessel updated:', id);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error updating vessel:', error);
    res.status(500).json({ error: 'Failed to update vessel' });
  }
});

// DELETE /api/vessels/:id - Delete vessel
app.delete('/api/vessels/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM vessels WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vessel not found' });
    }

    console.log('✅ Vessel deleted:', id);
    res.json({ message: 'Vessel deleted successfully', vessel: result.rows[0] });
  } catch (error) {
    console.error('❌ Error deleting vessel:', error);
    res.status(500).json({ error: 'Failed to delete vessel' });
  }
});

// =====================================================
// BOOKINGS ENDPOINTS
// =====================================================

// GET /api/bookings - Get all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { vessel, startDate, endDate, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT * FROM bookings';
    const params = [];
    const conditions = [];

    // Filter by vessel name
    if (vessel) {
      conditions.push(`booking_data->>'vesselName' = $${params.length + 1}`);
      params.push(vessel);
    }

    // Filter by date range
    if (startDate) {
      conditions.push(`booking_data->>'checkInDate' >= $${params.length + 1}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`booking_data->>'checkOutDate' <= $${params.length + 1}`);
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY last_modified DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Format response to match localStorage structure
    const bookings = {};
    result.rows.forEach(row => {
      bookings[row.booking_number] = {
        bookingData: row.booking_data,
        page2DataCheckIn: row.page2_data_checkin,
        page2DataCheckOut: row.page2_data_checkout,
        page3DataCheckIn: row.page3_data_checkin,
        page3DataCheckOut: row.page3_data_checkout,
        page4DataCheckIn: row.page4_data_checkin,
        page4DataCheckOut: row.page4_data_checkout,
        lastModified: row.last_modified,
        synced: row.synced
      };
    });

    res.json({ bookings, total: result.rowCount });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:bookingNumber - Get single booking
app.get('/api/bookings/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;

    const result = await pool.query(
      'SELECT * FROM bookings WHERE booking_number = $1',
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const row = result.rows[0];
    const booking = {
      bookingData: row.booking_data,
      page2DataCheckIn: row.page2_data_checkin,
      page2DataCheckOut: row.page2_data_checkout,
      page3DataCheckIn: row.page3_data_checkin,
      page3DataCheckOut: row.page3_data_checkout,
      page4DataCheckIn: row.page4_data_checkin,
      page4DataCheckOut: row.page4_data_checkout,
      lastModified: row.last_modified,
      synced: row.synced
    };

    res.json(booking);
  } catch (error) {
    console.error('❌ Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /api/bookings - Create new booking
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      bookingNumber,
      bookingData,
      page2DataCheckIn,
      page2DataCheckOut,
      page3DataCheckIn,
      page3DataCheckOut,
      page4DataCheckIn,
      page4DataCheckOut
    } = req.body;

    if (!bookingNumber || !bookingData) {
      return res.status(400).json({ error: 'Missing required fields: bookingNumber, bookingData' });
    }

    const result = await pool.query(
      `INSERT INTO bookings (
        booking_number,
        booking_data,
        page2_data_checkin,
        page2_data_checkout,
        page3_data_checkin,
        page3_data_checkout,
        page4_data_checkin,
        page4_data_checkout,
        synced
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        bookingNumber,
        JSON.stringify(bookingData),
        page2DataCheckIn ? JSON.stringify(page2DataCheckIn) : null,
        page2DataCheckOut ? JSON.stringify(page2DataCheckOut) : null,
        page3DataCheckIn ? JSON.stringify(page3DataCheckIn) : null,
        page3DataCheckOut ? JSON.stringify(page3DataCheckOut) : null,
        page4DataCheckIn ? JSON.stringify(page4DataCheckIn) : null,
        page4DataCheckOut ? JSON.stringify(page4DataCheckOut) : null,
        false
      ]
    );

    console.log('✅ Booking created:', bookingNumber);

    const row = result.rows[0];
    res.status(201).json({
      bookingNumber: row.booking_number,
      bookingData: row.booking_data,
      page2DataCheckIn: row.page2_data_checkin,
      page2DataCheckOut: row.page2_data_checkout,
      page3DataCheckIn: row.page3_data_checkin,
      page3DataCheckOut: row.page3_data_checkout,
      page4DataCheckIn: row.page4_data_checkin,
      page4DataCheckOut: row.page4_data_checkout,
      lastModified: row.last_modified,
      synced: row.synced
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Booking with this number already exists' });
    }
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// PUT /api/bookings/:bookingNumber - Update booking
app.put('/api/bookings/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;
    const {
      bookingData,
      page2DataCheckIn,
      page2DataCheckOut,
      page3DataCheckIn,
      page3DataCheckOut,
      page4DataCheckIn,
      page4DataCheckOut,
      synced
    } = req.body;

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (bookingData !== undefined) {
      updates.push(`booking_data = $${paramIndex}`);
      params.push(JSON.stringify(bookingData));
      paramIndex++;
    }

    if (page2DataCheckIn !== undefined) {
      updates.push(`page2_data_checkin = $${paramIndex}`);
      params.push(page2DataCheckIn ? JSON.stringify(page2DataCheckIn) : null);
      paramIndex++;
    }

    if (page2DataCheckOut !== undefined) {
      updates.push(`page2_data_checkout = $${paramIndex}`);
      params.push(page2DataCheckOut ? JSON.stringify(page2DataCheckOut) : null);
      paramIndex++;
    }

    if (page3DataCheckIn !== undefined) {
      updates.push(`page3_data_checkin = $${paramIndex}`);
      params.push(page3DataCheckIn ? JSON.stringify(page3DataCheckIn) : null);
      paramIndex++;
    }

    if (page3DataCheckOut !== undefined) {
      updates.push(`page3_data_checkout = $${paramIndex}`);
      params.push(page3DataCheckOut ? JSON.stringify(page3DataCheckOut) : null);
      paramIndex++;
    }

    if (page4DataCheckIn !== undefined) {
      updates.push(`page4_data_checkin = $${paramIndex}`);
      params.push(page4DataCheckIn ? JSON.stringify(page4DataCheckIn) : null);
      paramIndex++;
    }

    if (page4DataCheckOut !== undefined) {
      updates.push(`page4_data_checkout = $${paramIndex}`);
      params.push(page4DataCheckOut ? JSON.stringify(page4DataCheckOut) : null);
      paramIndex++;
    }

    if (synced !== undefined) {
      updates.push(`synced = $${paramIndex}`);
      params.push(synced);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`last_modified = CURRENT_TIMESTAMP`);
    params.push(bookingNumber);

    const query = `
      UPDATE bookings
      SET ${updates.join(', ')}
      WHERE booking_number = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('✅ Booking updated:', bookingNumber);

    const row = result.rows[0];
    res.json({
      bookingNumber: row.booking_number,
      bookingData: row.booking_data,
      page2DataCheckIn: row.page2_data_checkin,
      page2DataCheckOut: row.page2_data_checkout,
      page3DataCheckIn: row.page3_data_checkin,
      page3DataCheckOut: row.page3_data_checkout,
      page4DataCheckIn: row.page4_data_checkin,
      page4DataCheckOut: row.page4_data_checkout,
      lastModified: row.last_modified,
      synced: row.synced
    });
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// DELETE /api/bookings/:bookingNumber - Delete booking
app.delete('/api/bookings/:bookingNumber', async (req, res) => {
  try {
    const { bookingNumber } = req.params;

    const result = await pool.query(
      'DELETE FROM bookings WHERE booking_number = $1 RETURNING booking_number',
      [bookingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    console.log('✅ Booking deleted:', bookingNumber);
    res.json({ message: 'Booking deleted successfully', bookingNumber });
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// =====================================================
// EMAIL ENDPOINTS
// =====================================================

// POST /email/send-checkin-email
app.post('/email/send-checkin-email', async (req, res) => {
  try {
    const { bookingData, pdfBase64, mode, recipients } = req.body;

    const subject = mode === 'in'
      ? `Check-in Report - ${bookingData.vesselName} - ${bookingData.bookingNumber}`
      : `Check-out Report - ${bookingData.vesselName} - ${bookingData.bookingNumber}`;

    const html = `
      <h2>Yacht ${mode === 'in' ? 'Check-in' : 'Check-out'} Report</h2>
      <p><strong>Booking Number:</strong> ${bookingData.bookingNumber}</p>
      <p><strong>Vessel:</strong> ${bookingData.vesselName}</p>
      <p><strong>Skipper:</strong> ${bookingData.skipperName}</p>
      <p><strong>Date:</strong> ${mode === 'in' ? bookingData.checkInDate : bookingData.checkOutDate}</p>
      <br>
      <p>Please find the attached PDF report.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject,
      html,
      attachments: pdfBase64 ? [{
        filename: `${mode}-report-${bookingData.bookingNumber}.pdf`,
        content: pdfBase64,
        encoding: 'base64'
      }] : []
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Check-in/out email sent');

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending check-in email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// POST /email/send-charter-email
app.post('/email/send-charter-email', async (req, res) => {
  try {
    const { charter, boatName, boatType, action, recipients } = req.body;

    const subject = `Charter ${action === 'accepted' ? 'Accepted' : 'Rejected'} - ${boatName} - ${charter.code}`;

    const html = `
      <h2>Charter ${action === 'accepted' ? 'Acceptance' : 'Rejection'} Notification</h2>
      <p><strong>Charter Code:</strong> ${charter.code}</p>
      <p><strong>Vessel:</strong> ${boatName} (${boatType})</p>
      <p><strong>Period:</strong> ${charter.startDate} - ${charter.endDate}</p>
      <p><strong>Amount:</strong> €${charter.amount}</p>
      <p><strong>Status:</strong> ${action === 'accepted' ? '✅ ACCEPTED' : '❌ REJECTED'}</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Charter email sent');

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending charter email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// POST /email/send-email - Generic email
app.post('/email/send-email', async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: html || text,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Generic email sent');

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`🚀 Yacht Management API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Vessels API: http://localhost:${PORT}/api/vessels`);
  console.log(`📍 Bookings API: http://localhost:${PORT}/api/bookings`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('PostgreSQL pool closed');
  });
});
