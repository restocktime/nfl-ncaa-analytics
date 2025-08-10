# Deployment Instructions

## Quick Deploy to Vercel

1. **Create a new repository on GitHub** and push this code:
```bash
git init
git add .
git commit -m "Initial commit: Sleeper API proxy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/sleeper-api-proxy.git
git push -u origin main
```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Deploy with default settings

3. **Get your deployment URL**:
   - After deployment, you'll get a URL like: `https://sleeper-api-proxy-abc123.vercel.app`
   - Use this URL in your frontend code

## Alternative: Deploy via Vercel CLI

```bash
npx vercel login
npx vercel --prod
```

## Test Your Deployment

Once deployed, test the endpoints:

```bash
# Test user endpoint
curl https://YOUR-DOMAIN.vercel.app/api/sleeper/user/Restocktime

# Test leagues endpoint (use user_id from previous response)
curl https://YOUR-DOMAIN.vercel.app/api/sleeper/leagues/USER_ID_HERE

# Test rosters endpoint (use league_id from previous response)
curl https://YOUR-DOMAIN.vercel.app/api/sleeper/rosters/LEAGUE_ID_HERE
```

## Update Your Frontend

Replace all `api.sleeper.app` calls with your Vercel proxy URL:

```javascript
// OLD
const user = await fetch('https://api.sleeper.app/v1/user/Restocktime');

// NEW
const user = await fetch('https://YOUR-DOMAIN.vercel.app/api/sleeper/user/Restocktime');
```