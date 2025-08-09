/**
 * NFL Analytics Pro - Production Server
 * Advanced Sports Intelligence Platform
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security and performance middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com"
            ],
            fontSrc: [
                "'self'", 
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    }
}));

app.use(compression());
app.use(cors());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: NODE_ENV === 'production' ? '1y' : '0',
    etag: true,
    lastModified: true
}));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'modern-index.html'));
});

// API Routes for future expansion
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: NODE_ENV
    });
});

app.get('/api/games', (req, res) => {
    // In production, this would fetch from a real database
    res.json({ 
        message: 'Games data loaded from client-side JavaScript',
        source: 'live-nfl-games-today.js'
    });
});

app.get('/api/teams', (req, res) => {
    res.json({ 
        message: 'Teams data loaded from client-side JavaScript',
        source: 'nfl-2024-data.js'
    });
});

// Prediction API endpoint
app.post('/api/predict', (req, res) => {
    const { gameId, modelType } = req.body;
    
    // In production, this would run actual ML models
    res.json({
        gameId,
        modelType,
        prediction: {
            homeWinProbability: Math.random() * 100,
            awayWinProbability: Math.random() * 100,
            confidence: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)],
            timestamp: new Date().toISOString()
        }
    });
});

// Monte Carlo simulation endpoint
app.post('/api/simulate', (req, res) => {
    const { gameId, iterations = 10000 } = req.body;
    
    // Simulate processing time
    setTimeout(() => {
        res.json({
            gameId,
            iterations,
            results: {
                homeWinProbability: Math.random() * 100,
                awayWinProbability: Math.random() * 100,
                confidenceInterval: 95,
                standardDeviation: Math.random() * 10 + 5,
                processingTime: `${Math.random() * 2 + 0.5}s`
            },
            timestamp: new Date().toISOString()
        });
    }, 1000);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        error: {
            message: NODE_ENV === 'production' 
                ? 'Internal server error' 
                : err.message,
            status: err.status || 500,
            timestamp: new Date().toISOString()
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Resource not found',
            status: 404,
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        }
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🏈 NFL Analytics Pro Server Started
    =====================================
    Port: ${PORT}
    Environment: ${NODE_ENV}
    Time: ${new Date().toISOString()}
    URL: http://localhost:${PORT}
    
    🚀 Ready to serve advanced NFL analytics!
    `);
});

module.exports = app;