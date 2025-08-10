import { withCors, preflight } from "../../cors";

export async function OPTIONS() {
  return preflight();
}

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  
  if (!userId) {
    return withCors({ error: "userId required" }, { status: 400 });
  }

  try {
    const upstream = `https://api.sleeper.app/v1/user/${encodeURIComponent(userId)}/leagues/nfl/2024`;
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
        error: "Failed to fetch leagues data", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}