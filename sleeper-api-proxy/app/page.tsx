export default function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏈 Sleeper API Proxy</h1>
      <p>This is a Vercel-hosted proxy for the Sleeper API to bypass CORS restrictions.</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><code>GET /api/sleeper/user/[username]</code> - Get user data</li>
        <li><code>GET /api/sleeper/leagues/[userId]</code> - Get user's NFL 2024 leagues</li>
        <li><code>GET /api/sleeper/rosters/[leagueId]</code> - Get league rosters</li>
      </ul>
      
      <h2>Example Usage:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
{`// 1. Get user data
const user = await fetch('/api/sleeper/user/Restocktime').then(r => r.json());

// 2. Get user's leagues
const leagues = await fetch(\`/api/sleeper/leagues/\${user.user_id}\`).then(r => r.json());

// 3. Get league rosters
const rosters = await fetch(\`/api/sleeper/rosters/\${leagues[0].league_id}\`).then(r => r.json());`}
      </pre>
      
      <p style={{ color: '#666' }}>
        All endpoints support CORS and can be called from any origin.
      </p>
    </div>
  );
}