import { withCors, preflight } from "../../cors";

export async function OPTIONS() {
  return preflight();
}

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  
  if (!username) {
    return withCors({ error: "username required" }, { status: 400 });
  }

  try {
    const upstream = `https://api.sleeper.app/v1/user/${encodeURIComponent(username)}`;
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
        error: "Failed to fetch user data", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}