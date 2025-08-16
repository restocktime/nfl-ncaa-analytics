# Sunday Edge Pro - Production Deployment Guide

## Overview
Your site now has a secure backend API service that handles all API requests, keeping your API keys safe and avoiding CORS issues.

## Architecture Changes
- ✅ **Secure Backend**: API keys stored server-side, not in frontend code
- ✅ **CORS Solutions**: Backend handles external API calls
- ✅ **Caching**: 5-minute cache reduces API calls and improves performance
- ✅ **Rate Limiting**: Prevents abuse and manages API quotas
- ✅ **Error Handling**: Graceful fallbacks and user-friendly error messages

## Quick Start (Local Testing)

### 1. Start the Backend API Service
```bash
cd /Users/isaac/Desktop/nfl:ncaa
./start-backend.sh
```

### 2. Open Your Site
Open `public/index.html` in your browser. The site will automatically connect to the local API service.

## Production Deployment Options

### Option 1: Railway (Recommended)
Railway is perfect for your Node.js backend:

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy Backend**:
   ```bash
   cd server
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set ODDS_API_KEY=22e59e4eccd8562ad4b697aeeaccb0fb
   railway variables set NODE_ENV=production
   ```

4. **Update Frontend**: Replace the API base URL in `js/api-client.js`:
   ```javascript
   // Change this line:
   return 'https://api.sundayedgepro.com';
   // To your Railway URL:
   return 'https://your-app-name.up.railway.app';
   ```

### Option 2: Netlify + Vercel
- **Frontend (Netlify)**: Deploy `public/` folder to Netlify
- **Backend (Vercel)**: Deploy `server/` folder to Vercel

### Option 3: Single VPS (DigitalOcean/Linode)
Deploy both frontend and backend on one server using PM2.

## Environment Variables Required
```env
ODDS_API_KEY=22e59e4eccd8562ad4b697aeeaccb0fb
PORT=3001
NODE_ENV=production
```

## Domain Setup
1. **API Subdomain**: Point `api.sundayedgepro.com` to your backend service
2. **Main Domain**: Point `sundayedgepro.com` to your frontend (current setup)
3. **CORS Configuration**: Update the CORS origins in `server/api-service.js`

## Testing the Fix
1. Start the backend: `./start-backend.sh`
2. Open the site in browser
3. Check browser console for "✅ Secure API service online"
4. Verify live NFL data loads without errors

## API Endpoints Available
- `GET /api/status` - Service health check
- `GET /api/nfl/odds` - Live betting odds
- `GET /api/nfl/scores` - ESPN live scores
- `GET /api/nfl/comprehensive` - Combined odds + scores

## Next Steps
1. **Test locally first** - Make sure everything works
2. **Choose deployment platform** - Railway recommended
3. **Deploy backend service** - Get your API URL
4. **Update frontend config** - Point to your API URL
5. **Deploy frontend** - Upload to your current hosting

Your site will now have:
- ✅ **Live real NFL data** from multiple sources
- ✅ **Secure API key management** 
- ✅ **No CORS issues**
- ✅ **Better performance** with caching
- ✅ **Error handling** with user-friendly messages

The new architecture is production-ready and scalable!