const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Simple demo server for Football Analytics System
 * Shows the system working with sample data
 */

// Sample data
const teams = [
  {
    id: '1',
    name: 'Alabama Crimson Tide',
    abbreviation: 'ALA',
    conference: 'SEC',
    division: 'West',
    logoUrl: 'https://example.com/alabama-logo.png',
    primaryColor: '#9E1B32',
    secondaryColor: '#FFFFFF',
    venue: 'Bryant-Denny Stadium',
    city: 'Tuscaloosa',
    state: 'Alabama'
  },
  {
    id: '2',
    name: 'Georgia Bulldogs',
    abbreviation: 'UGA',
    conference: 'SEC',
    division: 'East',
    logoUrl: 'https://example.com/georgia-logo.png',
    primaryColor: '#BA0C2F',
    secondaryColor: '#000000',
    venue: 'Sanford Stadium',
    city: 'Athens',
    state: 'Georgia'
  },
  {
    id: '3',
    name: 'Michigan Wolverines',
    abbreviation: 'MICH',
    conference: 'Big Ten',
    division: 'East',
    logoUrl: 'https://example.com/michigan-logo.png',
    primaryColor: '#00274C',
    secondaryColor: '#FFCB05',
    venue: 'Michigan Stadium',
    city: 'Ann Arbor',
    state: 'Michigan'
  },
  {
    id: '4',
    name: 'Texas Longhorns',
    abbreviation: 'TEX',
    conference: 'Big 12',
    division: '',
    logoUrl: 'https://example.com/texas-logo.png',
    primaryColor: '#BF5700',
    secondaryColor: '#FFFFFF',
    venue: 'Darrell K Royal Stadium',
    city: 'Austin',
    state: 'Texas'
  }
];

const players = [
  {
    id: '1',
    name: 'Bryce Young',
    teamId: '1',
    position: 'QB',
    jerseyNumber: 9,
    height: 72,
    weight: 194,
    year: 'Junior',
    hometown: 'Pasadena, CA'
  },
  {
    id: '2',
    name: 'Jahmyr Gibbs',
    teamId: '1',
    position: 'RB',
    jerseyNumber: 1,
    height: 69,
    weight: 200,
    year: 'Junior',
    hometown: 'Dalton, GA'
  },
  {
    id: '3',
    name: 'Stetson Bennett',
    teamId: '2',
    position: 'QB',
    jerseyNumber: 13,
    height: 71,
    weight: 190,
    year: 'Senior',
    hometown: 'Blackshear, GA'
  },
  {
    id: '4',
    name: 'Kenny McIntosh',
    teamId: '2',
    position: 'RB',
    jerseyNumber: 6,
    height: 72,
    weight: 210,
    year: 'Senior',
    hometown: 'Sunrise, FL'
  }
];

const games = [
  {
    id: '1',
    homeTeamId: '1',
    awayTeamId: '2',
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Bryant-Denny Stadium',
    city: 'Tuscaloosa',
    state: 'Alabama',
    weather: {
      temperature: 75,
      humidity: 65,
      windSpeed: 8,
      conditions: 'Partly Cloudy',
      precipitation: 0
    },
    season: 2024,
    week: 8,
    gameType: 'Regular Season',
    status: 'Scheduled'
  },
  {
    id: '2',
    homeTeamId: '3',
    awayTeamId: '4',
    scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Michigan Stadium',
    city: 'Ann Arbor',
    state: 'Michigan',
    weather: {
      temperature: 68,
      humidity: 70,
      windSpeed: 12,
      conditions: 'Clear',
      precipitation: 0
    },
    season: 2024,
    week: 9,
    gameType: 'Regular Season',
    status: 'Scheduled'
  }
];

// Generate probabilities
function generateProbabilities(gameId) {
  const homeWinProb = 0.45 + Math.random() * 0.3;
  const awayWinProb = 1 - homeWinProb;
  
  return {
    gameId,
    homeTeamWinProbability: homeWinProb,
    awayTeamWinProbability: awayWinProb,
    overUnderProbability: {
      over: 0.48 + Math.random() * 0.04,
      under: 0.48 + Math.random() * 0.04
    },
    spreadProbability: {
      home: homeWinProb * 0.8,
      away: awayWinProb * 0.8
    },
    confidence: 0.75 + Math.random() * 0.2,
    lastUpdated: new Date().toISOString(),
    factors: {
      homeFieldAdvantage: 0.03,
      recentForm: Math.random() * 0.1 - 0.05,
      injuries: Math.random() * 0.05,
      weather: Math.random() * 0.02,
      motivation: Math.random() * 0.03
    }
  };
}

// User management
const users = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'demo-jwt-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'demo-refresh-secret-key';

// Helper functions
function generateTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return {
    accessToken,
    refreshToken,
    expiresIn: 24 * 60 * 60 // 24 hours in seconds
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Generate live update
function generateLiveUpdate(gameId) {
  const probabilities = generateProbabilities(gameId);
  
  return {
    type: 'probability-update',
    gameId,
    timestamp: new Date().toISOString(),
    probabilities: {
      homeWin: probabilities.homeTeamWinProbability,
      awayWin: probabilities.awayTeamWinProbability,
      confidence: probabilities.confidence
    },
    gameState: {
      quarter: Math.floor(Math.random() * 4) + 1,
      timeRemaining: `${Math.floor(Math.random() * 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      homeScore: Math.floor(Math.random() * 35),
      awayScore: Math.floor(Math.random() * 35),
      possession: Math.random() > 0.5 ? 'home' : 'away'
    }
  };
}

// Create Express app
const app = express();
const port = 3000;
const wsPort = 8082;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Football Analytics API',
    version: '1.0.0'
  });
});

app.get('/ready', (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      cache: 'connected',
      external_apis: 'connected'
    }
  });
});

app.get('/api-docs', (req, res) => {
  res.json({
    title: 'Football Analytics API',
    version: '1.0.0',
    description: 'Real-time football analytics and predictions',
    endpoints: {
      'GET /health': 'Health check',
      'GET /ready': 'Readiness check',
      'GET /api/v1/teams': 'Get all teams',
      'GET /api/v1/games': 'Get all games',
      'GET /api/v1/games/:id': 'Get specific game',
      'GET /api/v1/predictions/:gameId': 'Get game predictions',
      'GET /api/v1/players': 'Get all players'
    }
  });
});

app.get('/api/v1/teams', (req, res) => {
  res.json({
    success: true,
    data: teams,
    count: teams.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/games', (req, res) => {
  res.json({
    success: true,
    data: games,
    count: games.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/games/:id', (req, res) => {
  const game = games.find(g => g.id === req.params.id);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    data: game,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/predictions/:gameId', (req, res) => {
  const game = games.find(g => g.id === req.params.gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found',
      timestamp: new Date().toISOString()
    });
  }

  const probabilities = generateProbabilities(req.params.gameId);
  res.json({
    success: true,
    data: {
      gameId: req.params.gameId,
      probabilities,
      lastUpdated: new Date().toISOString(),
      model: 'ensemble-v1.0',
      confidence: probabilities.confidence
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/players', (req, res) => {
  res.json({
    success: true,
    data: players,
    count: players.length,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/system/status', (req, res) => {
  res.json({
    success: true,
    data: {
      system: 'Football Analytics Pro',
      status: 'operational',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        'api-gateway': 'healthy',
        'websocket-service': 'healthy',
        'probability-engine': 'healthy',
        'data-ingestion': 'healthy',
        'ml-models': 'healthy',
        'monte-carlo': 'healthy',
        'authentication': 'healthy'
      },
      features: {
        'real-time-updates': true,
        'monte-carlo-simulations': true,
        'ml-predictions': true,
        'historical-analysis': true,
        'user-authentication': true,
        'team-comparison': true,
        'player-comparison': true,
        'advanced-charts': true
      },
      metrics: {
        'active-users': users.size,
        'total-predictions': games.length * 100,
        'accuracy-rate': 87.3,
        'uptime-percentage': 99.9
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Authentication endpoints
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email',
        code: 'USER_EXISTS'
      });
    }
    
    // Validate password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long',
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = {
      id: generateId(),
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      provider: 'local',
      role: 'user',
      preferences: {
        theme: 'dark',
        notifications: true,
        autoRefresh: true,
        language: 'en'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      emailVerified: false
    };
    
    // Save user
    users.set(user.id, user);
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        tokens
      },
      message: 'Account created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'REGISTRATION_FAILED'
    });
  }
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    // Find user
    const user = Array.from(users.values()).find(u => u.email === email.toLowerCase() && u.provider === 'local');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }
    
    // Update last login
    user.lastLoginAt = new Date().toISOString();
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Remove password from response
    const { password: _, ...userResponse } = user;
    
    res.json({
      success: true,
      data: {
        user: userResponse,
        tokens
      },
      message: 'Login successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LOGIN_FAILED'
    });
  }
});

app.post('/api/v1/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token && users.has(token)) {
    users.delete(token);
  }
  
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString()
  });
});

// Google OAuth endpoints (real implementation)
app.get('/api/v1/auth/google', (req, res) => {
  const googleClientId = 'your_google_client_id_here';
  const redirectUri = 'http://localhost:3000/auth/google/callback';
  
  const authUrl = `https://accounts.google.com/oauth/authorize?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email%20profile&response_type=code&access_type=offline&prompt=consent`;
  
  res.json({
    success: true,
    data: { authUrl },
    message: 'Google OAuth URL generated'
  });
});

app.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', `Google OAuth error: ${error}`);
    return res.redirect(errorUrl.toString());
  }
  
  if (!code) {
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', 'Authorization code not provided');
    return res.redirect(errorUrl.toString());
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: 'your_google_client_id_here',
        client_secret: 'your_google_client_secret_here',
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: 'http://localhost:3000/auth/google/callback'
      })
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    const tokenData = await tokenResponse.json();
    
    // Get user profile
    const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`);
    
    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const profile = await profileResponse.json();
    
    // Check if user already exists
    let user = Array.from(users.values()).find(u => u.email === profile.email.toLowerCase());
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      user = {
        id: generateId(),
        email: profile.email.toLowerCase(),
        name: profile.name,
        avatar: profile.picture,
        provider: 'google',
        providerId: profile.id,
        role: 'user',
        preferences: {
          theme: 'dark',
          notifications: true,
          autoRefresh: true,
          language: 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        emailVerified: true
      };
      
      users.set(user.id, user);
      isNewUser = true;
    } else {
      // Update existing user with Google info
      user.avatar = profile.picture;
      user.providerId = profile.id;
      user.lastLoginAt = new Date().toISOString();
      users.set(user.id, user);
    }
    
    // Generate JWT tokens
    const tokens = generateTokens(user);
    
    // Redirect to frontend with tokens
    const redirectUrl = new URL('http://localhost:3000');
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refresh_token', tokens.refreshToken);
    if (isNewUser) {
      redirectUrl.searchParams.set('new_user', 'true');
    }
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const errorUrl = new URL('http://localhost:3000');
    errorUrl.searchParams.set('error', `Authentication failed: ${error.message}`);
    res.redirect(errorUrl.toString());
  }
});

app.get('/api/v1/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }
    
    const decoded = verifyToken(token);
    const user = users.get(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    // Remove password from response
    const { password, ...userResponse } = user;
    
    res.json({
      success: true,
      data: { user: userResponse },
      message: 'Profile retrieved successfully'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
});

// Enhanced team comparison endpoint
app.get('/api/v1/compare/teams/:teamAId/:teamBId', (req, res) => {
  const { teamAId, teamBId } = req.params;
  
  const teamA = teams.find(t => t.id === teamAId);
  const teamB = teams.find(t => t.id === teamBId);
  
  if (!teamA || !teamB) {
    return res.status(404).json({
      success: false,
      error: 'One or both teams not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate comparison metrics
  const comparison = {
    teamA: {
      ...teamA,
      metrics: {
        offense: 85 + Math.random() * 10,
        defense: 80 + Math.random() * 15,
        specialTeams: 75 + Math.random() * 20,
        coaching: 85 + Math.random() * 10,
        overall: 82 + Math.random() * 12
      }
    },
    teamB: {
      ...teamB,
      metrics: {
        offense: 85 + Math.random() * 10,
        defense: 80 + Math.random() * 15,
        specialTeams: 75 + Math.random() * 20,
        coaching: 85 + Math.random() * 10,
        overall: 82 + Math.random() * 12
      }
    },
    prediction: {
      favorite: Math.random() > 0.5 ? teamA.name : teamB.name,
      spread: (Math.random() * 14 + 1).toFixed(1),
      confidence: (Math.random() * 0.2 + 0.8).toFixed(3)
    }
  };
  
  res.json({
    success: true,
    data: comparison,
    timestamp: new Date().toISOString()
  });
});

// Enhanced player comparison endpoint
app.get('/api/v1/compare/players/:playerAId/:playerBId', (req, res) => {
  const { playerAId, playerBId } = req.params;
  
  const playerA = players.find(p => p.id === playerAId);
  const playerB = players.find(p => p.id === playerBId);
  
  if (!playerA || !playerB) {
    return res.status(404).json({
      success: false,
      error: 'One or both players not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate comparison stats
  const comparison = {
    playerA: {
      ...playerA,
      stats: {
        passingYards: Math.floor(Math.random() * 3000 + 2000),
        touchdowns: Math.floor(Math.random() * 25 + 15),
        completionPercentage: (Math.random() * 0.2 + 0.6).toFixed(3),
        rating: (Math.random() * 40 + 120).toFixed(1)
      }
    },
    playerB: {
      ...playerB,
      stats: {
        passingYards: Math.floor(Math.random() * 3000 + 2000),
        touchdowns: Math.floor(Math.random() * 25 + 15),
        completionPercentage: (Math.random() * 0.2 + 0.6).toFixed(3),
        rating: (Math.random() * 40 + 120).toFixed(1)
      }
    }
  };
  
  res.json({
    success: true,
    data: comparison,
    timestamp: new Date().toISOString()
  });
});

// WebSocket server
const wsServer = createServer();
const wss = new WebSocket.Server({ server: wsServer });

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');

  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to Football Analytics WebSocket',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message);

      if (message.type === 'ping') {
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
      } else if (message.type === 'subscribe') {
        ws.send(JSON.stringify({
          type: 'subscription-confirmed',
          channel: message.channel,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

// Send live updates every 5 seconds
setInterval(() => {
  games.forEach(game => {
    const update = generateLiveUpdate(game.id);
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(update));
      }
    });
  });
}, 5000);

// Start servers
app.listen(port, () => {
  console.log('🚀 Football Analytics System - Demo Server');
  console.log('===========================================');
  console.log(`📊 API Server:     http://localhost:${port}`);
  console.log(`🔌 WebSocket:      ws://localhost:${wsPort}`);
  console.log('');
  console.log('🔍 Try these endpoints:');
  console.log(`  Health:          http://localhost:${port}/health`);
  console.log(`  API Docs:        http://localhost:${port}/api-docs`);
  console.log(`  Teams:           http://localhost:${port}/api/v1/teams`);
  console.log(`  Games:           http://localhost:${port}/api/v1/games`);
  console.log(`  Predictions:     http://localhost:${port}/api/v1/predictions/1`);
  console.log(`  System Status:   http://localhost:${port}/api/v1/system/status`);
  console.log('');
  console.log('🎉 Ready for connections!');
});

wsServer.listen(wsPort, () => {
  console.log(`🔌 WebSocket server running on ws://localhost:${wsPort}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  process.exit(0);
});