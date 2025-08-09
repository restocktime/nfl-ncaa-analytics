const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the NFL Analytics Pro app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint for testing the player props prediction system
app.post('/api/predictions/save', (req, res) => {
    const prediction = req.body;
    console.log('📊 Prediction saved:', prediction);
    res.json({ 
        success: true, 
        message: 'Prediction saved successfully',
        prediction: prediction
    });
});

// API endpoint for updating prediction results
app.post('/api/predictions/update-results', (req, res) => {
    const updates = req.body;
    console.log('🔄 Updating prediction results:', updates);
    res.json({ 
        success: true, 
        updated: updates.length,
        message: `Updated ${updates.length} predictions`
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'NFL Analytics Pro',
        version: '2.0.0',
        features: [
            'Player Props ML',
            'Preseason Detection', 
            'Prediction Tracking',
            'Real-time Updates',
            'Result Tracking System'
        ]
    });
});

// ESPN API proxy to avoid CORS issues (optional)
app.get('/api/espn/*', async (req, res) => {
    try {
        const espnUrl = req.originalUrl.replace('/api/espn', 'https://site.api.espn.com/apis/site/v2/sports/football/nfl');
        const response = await fetch(espnUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('ESPN API Error:', error);
        res.status(500).json({ error: 'Failed to fetch ESPN data' });
    }
});

// Start server
app.listen(port, () => {
    console.log('🏈 ================================');
    console.log('🚀 NFL Analytics Pro Server Started!');
    console.log('🏈 ================================');
    console.log(`📱 Web App: http://localhost:${port}`);
    console.log(`🔧 Health Check: http://localhost:${port}/health`);
    console.log(`📊 Features:`);
    console.log(`   ✅ Player Props ML System`);
    console.log(`   ✅ Preseason Awareness`);
    console.log(`   ✅ Prediction Tracking`);
    console.log(`   ✅ Result Tracking System`);
    console.log(`   ✅ Real-time Game Updates`);
    console.log('🏈 ================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down NFL Analytics Pro server...');
    process.exit(0);
});