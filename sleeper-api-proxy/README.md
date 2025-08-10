# 🏈 Sleeper API Proxy

A Vercel-hosted Next.js proxy for the Sleeper Fantasy API to bypass CORS restrictions.

## Architecture

- **Platform**: Vercel (Next.js App Router)
- **Purpose**: Proxy Sleeper API calls to bypass client-side CORS/egress blocks
- **CORS**: All endpoints return proper CORS headers allowing any origin

## API Endpoints

### 1. User Lookup
```
GET /api/sleeper/user/[username]
```
Proxies to: `https://api.sleeper.app/v1/user/{username}`

Example:
```javascript
const user = await fetch('https://YOUR-DOMAIN.vercel.app/api/sleeper/user/Restocktime').then(r => r.json());
```

### 2. User Leagues (NFL 2024)
```
GET /api/sleeper/leagues/[userId]
```
Proxies to: `https://api.sleeper.app/v1/user/{userId}/leagues/nfl/2024`

Example:
```javascript
const leagues = await fetch(`https://YOUR-DOMAIN.vercel.app/api/sleeper/leagues/${user.user_id}`).then(r => r.json());
```

### 3. League Rosters
```
GET /api/sleeper/rosters/[leagueId]
```
Proxies to: `https://api.sleeper.app/v1/league/{leagueId}/rosters`

Example:
```javascript
const rosters = await fetch(`https://YOUR-DOMAIN.vercel.app/api/sleeper/rosters/${leagues[0].league_id}`).then(r => r.json());
```

## Complete Usage Example

```javascript
const BASE = "https://YOUR-VERCEL-DOMAIN.vercel.app";

// 1. Get user data
const user = await fetch(`${BASE}/api/sleeper/user/Restocktime`).then(r => r.json());

// 2. Get user's leagues for 2024
const leagues = await fetch(`${BASE}/api/sleeper/leagues/${user.user_id}`).then(r => r.json());

// 3. Get rosters for first league
const rosters = await fetch(`${BASE}/api/sleeper/rosters/${leagues[0].league_id}`).then(r => r.json());

// 4. Find user's roster
const myRoster = Array.isArray(rosters) ? rosters.find(r => r.owner_id === user.user_id) : null;
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Deploy to Vercel:
```bash
npx vercel --prod
```

3. Use the provided URL in your frontend code.

## CORS Headers

All endpoints include:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Description of error",
  "details": "Additional error details"
}
```

## No Authentication Required

Sleeper's API is public for the read operations we're proxying, so no API keys or authentication needed.