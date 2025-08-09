const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve the simple app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'simple.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Simple Football Analytics',
        version: '1.0.0'
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Simple Football Analytics running at http://localhost:${port}`);
    console.log(`📱 Open your browser and go to: http://localhost:${port}`);
    console.log(`🏈 Ready to load real NFL preseason games!`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
});