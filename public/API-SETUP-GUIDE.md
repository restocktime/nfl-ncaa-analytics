# IBY NFL Analytics - Real API Setup Guide

## 🚀 **Connect Your Real NFL Data APIs**

Your IBY NFL Analytics platform is ready for real data! Follow this guide to connect your APIs and get live NFL data.

---

## 📋 **Required API Services**

### **1. Sports Data APIs**
- **ESPN API** - Free tier available
- **SportRadar NFL API** - Real-time NFL data  
- **API-Football** - NFL games and stats
- **RapidAPI Sports** - Multiple NFL endpoints

### **2. Betting/Odds APIs** 
- **The Odds API** - Real-time betting odds
- **DraftKings API** - Player props and lines
- **FanDuel API** - Sportsbook data

### **3. News & Fantasy APIs**
- **NewsAPI** - NFL news articles
- **FantasyPros API** - Fantasy rankings
- **Sleeper API** - Fantasy data

---

## 🔑 **Step 1: Get Your API Keys**

### **ESPN API** (FREE)
1. Visit: https://developer.espn.com/
2. Create account and get API key
3. Free tier: 1000 requests/day

### **SportRadar NFL API** 
1. Visit: https://developer.sportradar.com/
2. Sign up for NFL API trial
3. Get your API key

### **The Odds API**
1. Visit: https://the-odds-api.com/
2. Sign up for free account  
3. 500 free requests/month

### **NewsAPI**
1. Visit: https://newsapi.org/
2. Register for free account
3. 100 requests/day free

---

## ⚙️ **Step 2: Configure Your APIs**

Edit the file: `iby-api-config.js`

```javascript
loadAPIKeys() {
    return {
        // Replace with your real API keys
        espn: 'your_espn_api_key_here',
        sportsradar: 'your_sportsradar_key_here', 
        theoddsapi: 'your_odds_api_key_here',
        newsapi: 'your_news_api_key_here',
        rapidapi: 'your_rapidapi_key_here'
    };
}
```

---

## 🔌 **Step 3: Test Your Connections**

1. Save your API keys in `iby-api-config.js`
2. Refresh your IBY platform
3. Open browser console (F12)
4. Look for connection test results:

```
🔌 API Connection Test: 3/5 successful
✅ ESPN API - Connected
✅ NewsAPI - Connected  
❌ SportRadar - Check API key
```

---

## 📊 **Available Data Endpoints**

Your IBY platform can fetch:

### **NFL Games**
- Live scores and schedules
- Team records and standings
- Game status updates

### **Player Props**
- Passing yards O/U
- Touchdown props
- Rushing yards
- Reception totals

### **Injury Reports**
- Real-time injury updates
- Player status (OUT/QUESTIONABLE/PROBABLE)
- Fantasy impact analysis

### **News & Updates**
- Breaking NFL news
- Trade rumors
- Fantasy analysis

---

## 🎯 **Popular FREE API Combinations**

### **Option 1: Basic Setup (FREE)**
- ESPN API (games & scores)
- NewsAPI (news articles)
- The Odds API (basic props)

### **Option 2: Enhanced Setup**
- SportRadar trial (premium data)
- FantasyPros API (fantasy rankings)
- Multiple news sources

### **Option 3: Premium Setup**
- Multiple paid APIs for redundancy
- Real-time WebSocket connections
- Advanced analytics data

---

## 🚨 **Troubleshooting**

### **Common Issues:**

**❌ "Source not available" warnings**
- API key not configured correctly
- API service is down
- Rate limit exceeded

**❌ CORS errors**  
- Need to proxy requests through your backend
- Some APIs don't allow direct browser calls

**❌ Rate limit errors**
- Reduce refresh intervals
- Implement request caching
- Upgrade API plan

---

## 🔄 **Environment Variables (Recommended)**

For security, use environment variables:

```bash
# Create .env file
ESPN_API_KEY=your_espn_key
SPORTSRADAR_API_KEY=your_sportsradar_key  
THE_ODDS_API_KEY=your_odds_api_key
NEWS_API_KEY=your_news_api_key
```

Then update the config to use:
```javascript
espn: process.env.ESPN_API_KEY || 'fallback_key'
```

---

## 📈 **API Rate Limits**

| API Service | Free Tier | Paid Tier |
|-------------|-----------|-----------|
| ESPN | 1000/day | Custom |
| SportRadar | 1000/month trial | 1000+/hour |
| The Odds API | 500/month | 1000+/month |
| NewsAPI | 100/day | 1000+/day |

---

## 🛡️ **Security Best Practices**

1. **Never expose API keys in frontend code**
2. **Use environment variables**  
3. **Implement rate limiting**
4. **Cache API responses**
5. **Use HTTPS only**

---

## 🎉 **Next Steps**

1. ✅ **Get your API keys** from the services above
2. ✅ **Update `iby-api-config.js`** with your keys
3. ✅ **Test connections** in browser console
4. ✅ **Enjoy real NFL data** in your IBY platform!

---

## 📞 **Support**

Need help? Check the browser console for detailed error messages and connection status.

**Your IBY NFL Analytics platform is ready for real data!** 🏈

---

*Created by IBY @benyakar94 - IG*