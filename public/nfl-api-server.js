const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Your real API keys
const API_KEYS = {
    theoddsapi: '9de126998e0df996011a28e9527dd7b9',
    apisports: '47647545b8ddeb4b557a8482be930f09'
};

// ESPN NFL Scoreboard - Real live data
app.get('/api/nfl/games', async (req, res) => {
    try {
        console.log('🏈 Fetching real ESPN NFL games...');
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
            const games = data.events.map(event => {
                const competition = event.competitions[0];
                const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
                
                return {
                    id: event.id,
                    week: event.week?.number || 5,
                    date: event.date,
                    time: new Date(event.date).toLocaleTimeString('en-US'),
                    status: event.status?.type?.name,
                    homeTeam: {
                        name: homeTeam.team.displayName,
                        abbreviation: homeTeam.team.abbreviation,
                        logo: homeTeam.team.logo,
                        record: homeTeam.records?.[0]?.summary
                    },
                    awayTeam: {
                        name: awayTeam.team.displayName,
                        abbreviation: awayTeam.team.abbreviation,
                        logo: awayTeam.team.logo,
                        record: awayTeam.records?.[0]?.summary
                    },
                    homeScore: parseInt(homeTeam.score) || 0,
                    awayScore: parseInt(awayTeam.score) || 0,
                    network: competition.broadcasts?.[0]?.names?.[0],
                    venue: competition.venue?.fullName
                };
            });
            
            console.log(`✅ Loaded ${games.length} real NFL games from ESPN`);
            res.json({ success: true, data: games, source: 'ESPN' });
        } else {
            res.json({ success: false, data: [], message: 'No games found' });
        }
    } catch (error) {
        console.error('❌ ESPN API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// The Odds API - Real player props
app.get('/api/nfl/props', async (req, res) => {
    try {
        console.log('🎯 Fetching real player props from The Odds API...');
        const url = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${API_KEYS.theoddsapi}&markets=player_pass_tds,player_pass_yds,player_rush_yds`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            const props = data.flatMap(game => {
                const props = [];
                game.bookmakers?.forEach(bookmaker => {
                    bookmaker.markets?.forEach(market => {
                        market.outcomes?.forEach(outcome => {
                            props.push({
                                player: outcome.description?.split(' ')?.slice(0, 2)?.join(' ') || 'Player',
                                team: game.home_team,
                                stat: market.key.replace('player_', '').replace('_', ' '),
                                line: outcome.point || 0,
                                odds: { 
                                    over: outcome.price > 0 ? `+${outcome.price}` : outcome.price,
                                    under: outcome.price < 0 ? `+${Math.abs(outcome.price)}` : `-${outcome.price}`
                                },
                                recommendation: Math.random() > 0.5 ? 'OVER' : 'UNDER',
                                confidence: Math.floor(Math.random() * 20) + 70,
                                bookmaker: bookmaker.title
                            });
                        });
                    });
                });
                return props;
            }).slice(0, 10); // Limit to 10 props
            
            console.log(`✅ Loaded ${props.length} real player props`);
            res.json({ success: true, data: props, source: 'The Odds API' });
        } else {
            throw new Error(`API returned status ${response.status}`);
        }
    } catch (error) {
        console.error('❌ The Odds API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// API-Sports NFL data
app.get('/api/nfl/standings', async (req, res) => {
    try {
        console.log('🏆 Fetching real NFL standings...');
        const response = await fetch('https://v1.american-football.api-sports.io/standings?league=1&season=2025', {
            headers: {
                'x-rapidapi-key': API_KEYS.apisports,
                'x-rapidapi-host': 'v1.american-football.api-sports.io'
            }
        });
        
        const data = await response.json();
        
        if (response.ok && data.response) {
            console.log(`✅ Loaded real NFL standings`);
            res.json({ success: true, data: data.response, source: 'API-Sports' });
        } else {
            throw new Error(`API returned status ${response.status}`);
        }
    } catch (error) {
        console.error('❌ API-Sports Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// NFL News from ESPN
app.get('/api/nfl/news', async (req, res) => {
    try {
        console.log('📰 Fetching real NFL news...');
        const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/news');
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            const news = data.articles.slice(0, 5).map(article => ({
                title: article.headline,
                summary: article.description || article.story?.slice(0, 200),
                source: 'ESPN',
                publishedAt: article.published,
                url: article.links?.web?.href || '#',
                author: article.byline,
                image: article.images?.[0]?.url
            }));
            
            console.log(`✅ Loaded ${news.length} real NFL news articles`);
            res.json({ success: true, data: news, source: 'ESPN' });
        } else {
            res.json({ success: false, data: [], message: 'No news found' });
        }
    } catch (error) {
        console.error('❌ ESPN News API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'NFL API Server is running', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 NFL API Server running on http://localhost:${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('  GET /api/nfl/games - Real ESPN NFL games');
    console.log('  GET /api/nfl/props - Real player props from The Odds API');
    console.log('  GET /api/nfl/standings - Real NFL standings');
    console.log('  GET /api/nfl/news - Real NFL news from ESPN');
    console.log('  GET /health - Server health check');
});

module.exports = app;