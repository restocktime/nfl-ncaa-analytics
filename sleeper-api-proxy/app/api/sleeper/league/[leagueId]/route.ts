import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { leagueId: string } }
) {
  const { leagueId } = params;

  try {
    console.log(`Fetching league data for: ${leagueId}`);
    
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`, {
      headers: {
        'User-Agent': 'Fantasy-App/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Sleeper API error: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch league: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching league:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}