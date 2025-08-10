import { withCors, preflight } from "../../cors";

export async function OPTIONS() {
  return preflight();
}

export async function GET(
  _req: Request,
  { params }: { params: { leagueId: string } }
) {
  const { leagueId } = params;
  
  if (!leagueId) {
    return withCors({ error: "leagueId required" }, { status: 400 });
  }

  try {
    const upstream = `https://api.sleeper.app/v1/league/${encodeURIComponent(leagueId)}/rosters`;
    const res = await fetch(upstream, { 
      cache: "no-store",
      headers: {
        'User-Agent': 'sleeper-api-proxy/1.0'
      }
    });

    const data = await res.json().catch(() => ({ error: "Invalid JSON response" }));
    
    return withCors(data, { status: res.status });
  } catch (error) {
    return withCors(
      { 
        error: "Failed to fetch rosters data", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}