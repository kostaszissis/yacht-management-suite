# 🚀 Yacht Management API - Deployment Guide

Complete PostgreSQL API for Yacht Management Suite with bookings, vessels, and email services.

---

## 📦 Files Created

1. **backend-server.js** - Main API server with all endpoints
2. **backend-package.json** - Node.js dependencies
3. **backend-deploy.sh** - Automated deployment script
4. **MIGRATION-GUIDE.md** - Frontend migration instructions
5. **DEPLOYMENT-README.md** - This file

---

## ⚡ Quick Start (5 Minutes)

### Option A: Automated Deployment (Recommended)

```bash
# 1. Copy files to server
scp backend-server.js backend-package.json backend-deploy.sh user@server:/tmp/

# 2. SSH to server
ssh user@server

# 3. Run deployment script
cd /tmp
sudo chmod +x backend-deploy.sh
sudo ./backend-deploy.sh

# 4. Edit environment variables
sudo nano /var/www/yacht-api/.env
# Add your Gmail app password

# 5. Restart server
pm2 restart yacht-api

# 6. Test
curl http://localhost:3001/health
```

### Option B: Manual Deployment

```bash
# 1. Create directory
sudo mkdir -p /var/www/yacht-api
cd /var/www/yacht-api

# 2. Copy files
sudo cp backend-server.js server.js
sudo cp backend-package.json package.json

# 3. Install dependencies
sudo npm install

# 4. Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE yachtdb;
CREATE USER yachtadmin WITH PASSWORD 'YachtDB2024!';
GRANT ALL PRIVILEGES ON DATABASE yachtdb TO yachtadmin;
\q
EOF

# 5. Create .env file
sudo nano .env
# Add:
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
# PORT=3001

# 6. Start with PM2
pm2 start server.js --name yacht-api
pm2 save
pm2 startup

# 7. Test
curl http://localhost:3001/health
```

---

## 🧪 Testing API Endpoints

### Test Vessels API
```bash
# Get all vessels
curl http://localhost:3001/api/vessels

# Create vessel
curl -X POST http://localhost:3001/api/vessels \
  -H "Content-Type: application/json" \
  -d '{"id":"BOB","name":"Lagoon 42-BOB","type":"Catamaran","model":"Lagoon 42"}'

# Update vessel
curl -X PUT http://localhost:3001/api/vessels/BOB \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","type":"Catamaran","model":"Lagoon 42"}'

# Delete vessel
curl -X DELETE http://localhost:3001/api/vessels/BOB
```

### Test Bookings API
```bash
# Get all bookings
curl http://localhost:3001/api/bookings

# Get single booking
curl http://localhost:3001/api/bookings/BOOKING001

# Create booking
curl -X POST http://localhost:3001/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "bookingNumber": "BOOKING001",
    "bookingData": {
      "vesselName": "Lagoon 42-BOB",
      "skipperFirstName": "John",
      "skipperLastName": "Doe",
      "checkInDate": "2025-01-20",
      "checkOutDate": "2025-01-27"
    }
  }'

# Update booking
curl -X PUT http://localhost:3001/api/bookings/BOOKING001 \
  -H "Content-Type: application/json" \
  -d '{
    "page2DataCheckIn": {
      "items": [{"id": "electric_fridge", "inOk": true}]
    }
  }'

# Delete booking
curl -X DELETE http://localhost:3001/api/bookings/BOOKING001
```

---

## 🌐 Nginx Configuration

The deployment script creates an Nginx configuration automatically. Manual setup:

```nginx
server {
    listen 80;
    server_name yachtmanagementsuite.com;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /email/ {
        proxy_pass http://localhost:3001/email/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/yacht-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Enable HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yachtmanagementsuite.com

# Auto-renewal (already setup by certbot)
sudo certbot renew --dry-run
```

---

## 📊 Database Schema

### Vessels Table
```sql
CREATE TABLE vessels (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  model VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings Table
```sql
CREATE TABLE bookings (
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

## 🔧 Server Management

### PM2 Commands
```bash
# Status
pm2 status

# Logs
pm2 logs yacht-api

# Restart
pm2 restart yacht-api

# Stop
pm2 stop yacht-api

# Delete
pm2 delete yacht-api

# Monitor
pm2 monit
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql yachtdb

# List all bookings
SELECT booking_number, booking_data->>'vesselName' as vessel
FROM bookings
ORDER BY last_modified DESC;

# Backup database
pg_dump -U yachtadmin yachtdb > backup.sql

# Restore database
psql -U yachtadmin yachtdb < backup.sql
```

---

## 🎯 API Reference

### Base URL
```
Production: https://yachtmanagementsuite.com
Local: http://localhost:3001
```

### Endpoints

#### Vessels
- `GET /api/vessels` - Get all vessels
- `POST /api/vessels` - Create vessel
- `PUT /api/vessels/:id` - Update vessel
- `DELETE /api/vessels/:id` - Delete vessel

#### Bookings
- `GET /api/bookings` - Get all bookings (supports filters)
- `GET /api/bookings/:bookingNumber` - Get single booking
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:bookingNumber` - Update booking
- `DELETE /api/bookings/:bookingNumber` - Delete booking

Query Parameters for GET /api/bookings:
- `vessel` - Filter by vessel name
- `startDate` - Filter by check-in date (YYYY-MM-DD)
- `endDate` - Filter by check-out date (YYYY-MM-DD)
- `limit` - Limit results (default: 100)
- `offset` - Pagination offset (default: 0)

#### Email
- `POST /email/send-checkin-email` - Send check-in/out email
- `POST /email/send-charter-email` - Send charter acceptance/rejection
- `POST /email/send-email` - Send generic email

#### Health
- `GET /health` - Server health check

---

## 🐛 Troubleshooting

### Issue: Cannot connect to database
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l | grep yachtdb

# Recreate database
sudo -u postgres psql
DROP DATABASE yachtdb;
CREATE DATABASE yachtdb;
GRANT ALL PRIVILEGES ON DATABASE yachtdb TO yachtadmin;
\q
```

### Issue: Port 3001 already in use
```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or change port in server.js
# const PORT = 3002;
```

### Issue: PM2 not starting
```bash
# Check logs
pm2 logs yacht-api --lines 100

# Delete and restart
pm2 delete yacht-api
pm2 start server.js --name yacht-api
```

### Issue: CORS errors
Check that backend has CORS enabled for your frontend domain:
```javascript
app.use(cors({
  origin: 'https://yachtmanagementsuite.com',
  credentials: true
}));
```

---

## 📈 Performance & Monitoring

### Setup Monitoring
```bash
# Install PM2 monitoring (optional)
pm2 install pm2-logrotate

# Setup log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Enable monitoring dashboard
pm2 link <secret> <public>  # Get keys from pm2.io
```

### Database Optimization
```sql
-- Create indexes for faster queries
CREATE INDEX idx_bookings_last_modified ON bookings(last_modified DESC);
CREATE INDEX idx_bookings_vessel_name ON bookings USING gin ((booking_data->'vesselName'));

-- Analyze database
ANALYZE bookings;
ANALYZE vessels;
```

---

## 🔐 Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Setup firewall (UFW)
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Use environment variables for secrets
- [ ] Setup regular database backups
- [ ] Enable PM2 log rotation
- [ ] Restrict API access to frontend domain
- [ ] Setup rate limiting (optional)
- [ ] Enable PostgreSQL SSL connection (optional)

---

## 📝 Next Steps

1. ✅ Deploy backend (this guide)
2. 📱 Update frontend (see MIGRATION-GUIDE.md)
3. 🧪 Test all functionality
4. 🚀 Deploy to production
5. 📊 Setup monitoring
6. 🔒 Enable HTTPS
7. 💾 Setup automated backups

---

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs yacht-api`
- Check database: `sudo -u postgres psql yachtdb`
- Review MIGRATION-GUIDE.md for frontend changes
- Test endpoints with curl/Postman

---

## 📄 License

© 2025 Tailwind Yachting - All Rights Reserved
