# 🚀 NFL Analytics Production Deployment

## Quick Deploy to Production Server

### Option 1: Single File Deployment (Recommended)

1. **Upload files to your server:**
   ```bash
   # Copy these files to your production server:
   - deploy-database-server.js
   - package-deploy.json
   - nfl-analytics.db (optional - has fallback data)
   - All your HTML files (index.html, player-props-hub.html, etc.)
   ```

2. **Install dependencies and start:**
   ```bash
   # On your production server
   npm install --production
   npm start
   ```

3. **Server will run on port 3001 with API endpoints:**
   - `https://sundayedgepro.com/api/nfl/teams`
   - `https://sundayedgepro.com/api/nfl/players` 
   - `https://sundayedgepro.com/api/nfl/team/Kansas%20City%20Chiefs/roster`

### Option 2: Use Existing Web Server

If you already have a web server running, you can run the database API on a different port:

```bash
# Start database server on port 3001
PORT=3001 node deploy-database-server.js

# Configure your web server (nginx/apache) to proxy /api/nfl requests to port 3001
```

### Option 3: PM2 Process Manager (Production)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start deploy-database-server.js --name nfl-database

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

## 🔧 Configuration

The server automatically detects the environment:

- **Local development**: Uses `http://localhost:3001/api/nfl`
- **Production**: Uses your domain `/api/nfl` endpoints

## 📊 What's Included

### Fallback Data (No Database Required)
- 32 NFL teams with correct names and abbreviations
- Key players for major teams including:
  - **Raiders QB**: Geno Smith (as you confirmed)
  - **Chiefs**: Patrick Mahomes, Travis Kelce, DeAndre Hopkins
  - **Bills**: Josh Allen, Stefon Diggs
  - **Colts**: Anthony Richardson, Daniel Jones

### Full Database (If Available)
- 2,538 players from your SQLite database
- Complete team rosters
- Player stats and experience years

## 🚀 Deployment Commands

```bash
# Test locally first
node deploy-database-server.js

# Check health endpoint
curl http://localhost:3001/health

# Test teams endpoint
curl http://localhost:3001/api/nfl/teams

# Test Raiders roster (should show Geno Smith)
curl "http://localhost:3001/api/nfl/search/players?q=Geno"
```

## 🌐 Web Server Configuration

### Nginx Example
```nginx
location /api/nfl/ {
    proxy_pass http://localhost:3001/api/nfl/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### Apache Example  
```apache
ProxyPass /api/nfl/ http://localhost:3001/api/nfl/
ProxyPassReverse /api/nfl/ http://localhost:3001/api/nfl/
```

## ✅ Production Checklist

- [ ] Upload `deploy-database-server.js` to server
- [ ] Copy `package-deploy.json` as `package.json` 
- [ ] Run `npm install --production`
- [ ] Start server with `npm start` or PM2
- [ ] Test health endpoint: `/health`
- [ ] Test teams endpoint: `/api/nfl/teams`
- [ ] Verify Raiders show Geno Smith as QB
- [ ] Configure web server proxy (if needed)
- [ ] Set up SSL certificates for HTTPS
- [ ] Configure firewall for port 3001 (if standalone)

Your NFL analytics system will be **production-ready** with stable database API endpoints! 🏈