#!/bin/bash

# =====================================================
# YACHT MANAGEMENT API - DEPLOYMENT SCRIPT
# =====================================================
# Deploys backend to /var/www/yacht-api/

echo "🚀 Starting Yacht Management API Deployment..."

# Configuration
DEPLOY_DIR="/var/www/yacht-api"
SERVER_FILE="backend-server.js"
PACKAGE_FILE="backend-package.json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Please run as root or with sudo${NC}"
  exit 1
fi

# Step 1: Create deployment directory
echo -e "${YELLOW}📁 Creating deployment directory...${NC}"
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Step 2: Copy files
echo -e "${YELLOW}📋 Copying server files...${NC}"
cp $SERVER_FILE server.js
cp $PACKAGE_FILE package.json

# Step 3: Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Step 4: Setup PostgreSQL
echo -e "${YELLOW}🐘 Setting up PostgreSQL database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE yachtdb;" 2>/dev/null
sudo -u postgres psql -c "CREATE USER yachtadmin WITH PASSWORD 'YachtDB2024!';" 2>/dev/null
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE yachtdb TO yachtadmin;" 2>/dev/null

echo -e "${GREEN}✅ PostgreSQL database configured${NC}"

# Step 5: Create .env file
echo -e "${YELLOW}🔐 Creating environment variables...${NC}"
cat > .env << EOF
# Email Configuration
EMAIL_USER=info@tailwindyachting.com
EMAIL_PASS=your-gmail-app-password

# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration (already in server.js)
DB_USER=yachtadmin
DB_HOST=localhost
DB_NAME=yachtdb
DB_PASSWORD=YachtDB2024!
DB_PORT=5432
EOF

echo -e "${GREEN}✅ Environment file created${NC}"
echo -e "${RED}⚠️  Please edit .env and add your Gmail app password${NC}"

# Step 6: Setup PM2
echo -e "${YELLOW}⚙️  Setting up PM2 process manager...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Stop existing process if running
pm2 delete yacht-api 2>/dev/null

# Start new process
pm2 start server.js --name yacht-api
pm2 save
pm2 startup

echo -e "${GREEN}✅ PM2 configured and started${NC}"

# Step 7: Setup Nginx reverse proxy (optional)
echo -e "${YELLOW}🌐 Nginx configuration...${NC}"
cat > /etc/nginx/sites-available/yacht-api << 'NGINX_EOF'
server {
    listen 80;
    server_name yachtmanagementsuite.com;

    # API endpoint
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Email endpoint
    location /email/ {
        proxy_pass http://localhost:3001/email/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/yacht-api /etc/nginx/sites-enabled/yacht-api 2>/dev/null

# Test and reload Nginx
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Nginx configured${NC}"

# Step 8: Setup SSL with Certbot (optional)
echo ""
echo -e "${YELLOW}🔒 To enable HTTPS, run:${NC}"
echo "   sudo certbot --nginx -d yachtmanagementsuite.com"
echo ""

# Step 9: Setup firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # Direct API access (optional, can be removed)

echo -e "${GREEN}✅ Firewall configured${NC}"

# Step 10: Show status
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "📍 API Server Status:"
pm2 status
echo ""
echo -e "📍 API Endpoints:"
echo "   - http://yachtmanagementsuite.com/api/vessels"
echo "   - http://yachtmanagementsuite.com/api/bookings"
echo "   - http://yachtmanagementsuite.com/email/send-checkin-email"
echo "   - http://yachtmanagementsuite.com/health"
echo ""
echo -e "📍 Server Logs:"
echo "   pm2 logs yacht-api"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "   1. Edit /var/www/yacht-api/.env and add your Gmail app password"
echo "   2. Restart server: pm2 restart yacht-api"
echo "   3. Test endpoints with curl or Postman"
echo "   4. Enable HTTPS: sudo certbot --nginx -d yachtmanagementsuite.com"
echo ""
echo -e "${GREEN}🎉 Happy sailing!${NC}"
