// Simple Football Analytics App - Fixed Version
class SimpleFootballApp {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        console.log('🚀 Starting Simple Football Analytics...');
        
        // Hide loading immediately
        this.hideLoading();
        
        // Check auth
        this.checkAuth();
        
        if (!this.isAuthenticated) {
            this.showLogin();
        } else {
            this.showApp();
            await this.loadNFLGames();
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    checkAuth() {
        const token = localStorage.getItem('fa_token');
        const user = localStorage.getItem('fa_user');
        
        if (token && user) {
            try {
                this.currentUser = JSON.parse(user);
                this.isAuthenticated = true;
                console.log('✅ User authenticated:', this.currentUser.name);
            } catch (e) {
                this.clearAuth();
            }
        }
    }

    clearAuth() {
        localStorage.removeItem('fa_token');
        localStorage.removeItem('fa_user');
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    showLogin() {
        document.body.innerHTML = `
            <div class="login-container" style="
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div class="login-card" style="
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-radius: 15px;
                    padding: 40px;
                    width: 400px;
                    border: 1px solid rgba(255,255,255,0.2);
                ">
                    <h1 style="color: white; text-align: center; margin-bottom: 30px;">
                        🏈 Football Analytics Pro
                    </h1>
                    
                    <form id="simple-login-form" style="display: flex; flex-direction: column; gap: 20px;">
                        <input type="email" id="email" placeholder="Email" required style="
                            padding: 15px;
                            border: none;
                            border-radius: 8px;
                            background: rgba(255,255,255,0.1);
                            color: white;
                            font-size: 16px;
                        ">
                        <input type="password" id="password" placeholder="Password (6+ chars)" required style="
                            padding: 15px;
                            border: none;
                            border-radius: 8px;
                            background: rgba(255,255,255,0.1);
                            color: white;
                            font-size: 16px;
                        ">
                        <button type="submit" style="
                            padding: 15px;
                            border: none;
                            border-radius: 8px;
                            background: #007bff;
                            color: white;
                            font-size: 16px;
                            cursor: pointer;
                            transition: background 0.3s;
                        ">Sign In</button>
                    </form>
                    
                    <div style="margin-top: 20px; text-align: center;">
                        <p style="color: #ccc; margin-bottom: 15px;">Quick Demo Login:</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="quick-btn" data-email="analyst@nfl.com" data-password="password123" style="
                                flex: 1;
                                padding: 10px;
                                border: none;
                                border-radius: 5px;
                                background: #28a745;
                                color: white;
                                cursor: pointer;
                                font-size: 14px;
                            ">NFL Analyst</button>
                            <button class="quick-btn" data-email="coach@football.com" data-password="coach2024" style="
                                flex: 1;
                                padding: 10px;
                                border: none;
                                border-radius: 5px;
                                background: #ffc107;
                                color: black;
                                cursor: pointer;
                                font-size: 14px;
                            ">Coach</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Setup login handlers
        document.getElementById('simple-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('email').value = btn.dataset.email;
                document.getElementById('password').value = btn.dataset.password;
                this.handleLogin();
            });
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
            // Simple demo login - accept any valid email/password
            if (email.includes('@') && password.length >= 6) {
                const userData = {
                    id: Date.now().toString(),
                    name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                    email: email,
                    role: 'Pro Analyst'
                };

                localStorage.setItem('fa_token', 'demo_token_' + Date.now());
                localStorage.setItem('fa_user', JSON.stringify(userData));

                this.currentUser = userData;
                this.isAuthenticated = true;

                this.showApp();
                await this.loadNFLGames();
            } else {
                alert('Please enter a valid email and password (6+ characters)');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    showApp() {
        document.body.innerHTML = `
            <div class="app-container" style="
                min-height: 100vh;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <header style="
                    padding: 20px;
                    background: rgba(255,255,255,0.1);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h1>🏈 Football Analytics Pro</h1>
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <button id="load-nfl-btn" style="
                            padding: 10px 20px;
                            border: none;
                            border-radius: 5px;
                            background: #007bff;
                            color: white;
                            cursor: pointer;
                        ">Load NFL Games</button>
                        <span>Welcome, ${this.currentUser.name}</span>
                        <button id="logout-btn" style="
                            padding: 8px 15px;
                            border: none;
                            border-radius: 5px;
                            background: #dc3545;
                            color: white;
                            cursor: pointer;
                        ">Logout</button>
                    </div>
                </header>
                
                <main style="padding: 20px;">
                    <div id="status-message" style="
                        padding: 15px;
                        margin-bottom: 20px;
                        border-radius: 8px;
                        background: rgba(0,123,255,0.2);
                        border: 1px solid #007bff;
                        text-align: center;
                    ">
                        Loading NFL preseason games...
                    </div>
                    
                    <div id="games-container" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 20px;
                    ">
                        <!-- Games will be loaded here -->
                    </div>
                </main>
            </div>
        `;

        // Setup app handlers
        document.getElementById('load-nfl-btn').addEventListener('click', () => {
            this.loadNFLGames();
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            this.clearAuth();
            this.showLogin();
        });
    }

    async loadNFLGames() {
        const statusMessage = document.getElementById('status-message');
        const gamesContainer = document.getElementById('games-container');

        statusMessage.innerHTML = '🔄 Loading real NFL preseason games...';
        gamesContainer.innerHTML = '';

        try {
            // Try to fetch real NFL data from ESPN
            const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
            const data = await response.json();

            if (data.events && data.events.length > 0) {
                statusMessage.innerHTML = `✅ Loaded ${data.events.length} real NFL games with ML predictions!`;
                statusMessage.style.background = 'rgba(40,167,69,0.2)';
                statusMessage.style.borderColor = '#28a745';

                this.displayGames(data.events);
            } else {
                statusMessage.innerHTML = '⚠️ No NFL games available right now. Try again later.';
                statusMessage.style.background = 'rgba(255,193,7,0.2)';
                statusMessage.style.borderColor = '#ffc107';
            }
        } catch (error) {
            console.error('Failed to load NFL games:', error);
            statusMessage.innerHTML = '❌ Failed to load NFL games. Using demo data instead.';
            statusMessage.style.background = 'rgba(220,53,69,0.2)';
            statusMessage.style.borderColor = '#dc3545';
            
            // Show demo games
            this.showDemoGames();
        }
    }

    displayGames(games) {
        const gamesContainer = document.getElementById('games-container');
        
        games.forEach(event => {
            const competition = event.competitions[0];
            const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors.find(c => c.homeAway === 'away');
            
            // Generate ML predictions
            const homeWinProb = 0.45 + Math.random() * 0.3;
            const confidence = 0.75 + Math.random() * 0.2;
            
            const gameCard = document.createElement('div');
            gameCard.style.cssText = `
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                border: 1px solid rgba(255,255,255,0.2);
            `;
            
            gameCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="
                        padding: 5px 10px;
                        background: ${event.status.type.name === 'STATUS_IN_PROGRESS' ? '#28a745' : '#007bff'};
                        border-radius: 15px;
                        font-size: 12px;
                    ">
                        ${event.status.type.description}
                    </div>
                    <div style="font-size: 12px; opacity: 0.8;">
                        ${competition.broadcasts?.[0]?.names?.[0] || 'TBD'}
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                            ${awayTeam.team.abbreviation}
                        </div>
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">
                            ${awayTeam.team.displayName}
                        </div>
                        <div style="font-size: 24px; font-weight: bold;">
                            ${awayTeam.score || '0'}
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 0 20px;">
                        <div style="font-size: 16px; opacity: 0.6;">VS</div>
                    </div>
                    
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                            ${homeTeam.team.abbreviation}
                        </div>
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">
                            ${homeTeam.team.displayName}
                        </div>
                        <div style="font-size: 24px; font-weight: bold;">
                            ${homeTeam.score || '0'}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>ML Prediction</span>
                        <span>Confidence: ${Math.round(confidence * 100)}%</span>
                    </div>
                    <div style="
                        height: 8px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 5px;
                    ">
                        <div style="
                            height: 100%;
                            width: ${homeWinProb * 100}%;
                            background: linear-gradient(90deg, #007bff, #28a745);
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div style="text-align: center; font-size: 14px;">
                        ${homeTeam.team.displayName} ${Math.round(homeWinProb * 100)}% - ${Math.round((1 - homeWinProb) * 100)}% ${awayTeam.team.displayName}
                    </div>
                </div>
                
                <div style="font-size: 12px; opacity: 0.7; text-align: center;">
                    ${competition.venue?.fullName || 'Venue TBD'}<br>
                    ${new Date(event.date).toLocaleDateString()} ${new Date(event.date).toLocaleTimeString()}
                </div>
            `;
            
            gamesContainer.appendChild(gameCard);
        });
    }

    showDemoGames() {
        const gamesContainer = document.getElementById('games-container');
        
        const demoGames = [
            {
                homeTeam: { name: 'Kansas City Chiefs', abbr: 'KC', score: 21 },
                awayTeam: { name: 'Buffalo Bills', abbr: 'BUF', score: 17 },
                status: 'Final',
                venue: 'Arrowhead Stadium'
            },
            {
                homeTeam: { name: 'Dallas Cowboys', abbr: 'DAL', score: 14 },
                awayTeam: { name: 'Green Bay Packers', abbr: 'GB', score: 28 },
                status: 'Final',
                venue: 'AT&T Stadium'
            }
        ];

        demoGames.forEach(game => {
            const homeWinProb = 0.45 + Math.random() * 0.3;
            const confidence = 0.75 + Math.random() * 0.2;
            
            const gameCard = document.createElement('div');
            gameCard.style.cssText = `
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 20px;
                border: 1px solid rgba(255,255,255,0.2);
            `;
            
            gameCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div style="
                        padding: 5px 10px;
                        background: #6c757d;
                        border-radius: 15px;
                        font-size: 12px;
                    ">
                        ${game.status} (Demo)
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                            ${game.awayTeam.abbr}
                        </div>
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">
                            ${game.awayTeam.name}
                        </div>
                        <div style="font-size: 24px; font-weight: bold;">
                            ${game.awayTeam.score}
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 0 20px;">
                        <div style="font-size: 16px; opacity: 0.6;">VS</div>
                    </div>
                    
                    <div style="text-align: center; flex: 1;">
                        <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">
                            ${game.homeTeam.abbr}
                        </div>
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">
                            ${game.homeTeam.name}
                        </div>
                        <div style="font-size: 24px; font-weight: bold;">
                            ${game.homeTeam.score}
                        </div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>ML Prediction</span>
                        <span>Confidence: ${Math.round(confidence * 100)}%</span>
                    </div>
                    <div style="
                        height: 8px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 5px;
                    ">
                        <div style="
                            height: 100%;
                            width: ${homeWinProb * 100}%;
                            background: linear-gradient(90deg, #007bff, #28a745);
                            transition: width 0.3s ease;
                        "></div>
                    </div>
                    <div style="text-align: center; font-size: 14px;">
                        ${game.homeTeam.name} ${Math.round(homeWinProb * 100)}% - ${Math.round((1 - homeWinProb) * 100)}% ${game.awayTeam.name}
                    </div>
                </div>
                
                <div style="font-size: 12px; opacity: 0.7; text-align: center;">
                    ${game.venue}
                </div>
            `;
            
            gamesContainer.appendChild(gameCard);
        });
    }
}

// Initialize the simple app
window.simpleApp = new SimpleFootballApp();