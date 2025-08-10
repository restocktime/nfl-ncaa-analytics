import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching NFL players database from Sleeper...');
    
    const response = await fetch('https://api.sleeper.app/v1/players/nfl', {
      headers: {
        'User-Agent': 'Fantasy-App/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Sleeper API error: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch players: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${Object.keys(data).length} NFL players`);
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=3600', // 1 hour cache for players
    };

    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching NFL players:', error);
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