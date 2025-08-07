// Football Analytics Pro - Premium Dashboard Application

class FootballAnalyticsPro {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.wsUrl = 'ws://localhost:8082';
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // User management
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Data cache
        this.cache = {
            teams: [],
            players: [],
            games: [],
            predictions: new Map()
        };
        
        // UI state
        this.currentView = 'dashboard';
        this.sidebarCollapsed = false;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Football Analytics Pro...');
        
        // Check for existing authentication
        this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.showLoginModal();
        } else {
            await this.initializeApp();
        }
    }

    // Authentication Methods
    checkAuthentication() {
        const token = localStorage.getItem('fa_token');
        const userData = localStorage.getItem('fa_user');
        
        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                console.log('✅ User authenticated:', this.currentUser.name);
            } catch (error) {
                console.error('❌ Error parsing user data:', error);
                this.clearAuthentication();
            }
        }
    }

    showLoginModal() {
        const loginModal = document.getElementById('login-modal');
        const mainApp = document.getElementById('main-app');
        
        loginModal.style.display = 'flex';
        mainApp.style.display = 'none';
        
        this.setupLoginHandlers();
    }

    setupLoginHandlers() {
        console.log('🔧 Setting up login handlers...');
        
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (!loginForm || !registerForm) {
            console.error('❌ Login or register form not found!');
            return;
        }
        
        // Password visibility toggles
        this.setupPasswordToggle('password-toggle', 'password');
        this.setupPasswordToggle('register-password-toggle', 'register-password');
        this.setupPasswordToggle('confirm-password-toggle', 'confirm-password');
        
        // Form submissions
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Login form submitted');
            await this.handleLogin(e);
        });
        
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Register form submitted');
            await this.handleRegister(e);
        });
        
        // Modal switching
        const showRegisterBtn = document.getElementById('show-register');
        const showLoginBtn = document.getElementById('show-login');
        
        if (showRegisterBtn) {
            showRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to register modal');
                this.showRegisterModal();
            });
        }
        
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔄 Switching to login modal');
                this.showLoginModal();
            });
        }
        
        // Social auth buttons - Login modal
        const googleLoginBtn = document.querySelector('#login-modal .btn-social.google');
        const microsoftLoginBtn = document.querySelector('#login-modal .btn-social.microsoft');
        
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔐 Google login clicked');
                this.handleGoogleAuth();
            });
        } else {
            console.warn('⚠️ Google login button not found');
        }
        
        if (microsoftLoginBtn) {
            microsoftLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔐 Microsoft login clicked');
                this.handleSocialLogin('microsoft');
            });
        } else {
            console.warn('⚠️ Microsoft login button not found');
        }
        
        // Social auth buttons - Register modal
        const googleRegisterBtn = document.querySelector('#register-modal .btn-social.google');
        const microsoftRegisterBtn = document.querySelector('#register-modal .btn-social.microsoft');
        
        if (googleRegisterBtn) {
            googleRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔐 Google register clicked');
                this.handleGoogleAuth();
            });
        } else {
            console.warn('⚠️ Google register button not found');
        }
        
        if (microsoftRegisterBtn) {
            microsoftRegisterBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔐 Microsoft register clicked');
                this.handleSocialLogin('microsoft');
            });
        } else {
            console.warn('⚠️ Microsoft register button not found');
        }
        
        // Check for OAuth callback parameters
        this.checkOAuthCallback();
        
        console.log('✅ Login handlers setup complete');
    }

    setupPasswordToggle(toggleId, inputId) {
        const toggle = document.getElementById(toggleId);
        const input = document.getElementById(inputId);
        
        if (toggle && input) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                console.log(`👁️ Password toggle clicked: ${toggleId}`);
                
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                
                const icon = toggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            });
        } else {
            console.warn(`⚠️ Password toggle elements not found: ${toggleId}, ${inputId}`);
        }
    }

    showRegisterModal() {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'flex';
    }

    checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');
        const error = urlParams.get('error');
        const isNewUser = urlParams.get('new_user');
        
        if (error) {
            this.showLoginError(error);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        if (token && refreshToken) {
            // Store tokens
            localStorage.setItem('fa_token', token);
            localStorage.setItem('fa_refresh_token', refreshToken);
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Get user profile and initialize app
            this.handleOAuthSuccess(token, isNewUser === 'true');
        }
    }

    async handleOAuthSuccess(token, isNewUser) {
        try {
            // Get user profile
            const response = await fetch(`${this.apiUrl}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.data.user;
                this.isAuthenticated = true;
                
                // Hide modals and show app
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('main-app').style.display = 'flex';
                
                if (isNewUser) {
                    this.addNotification('Welcome to Football Analytics Pro!', 'success');
                } else {
                    this.addNotification('Welcome back!', 'success');
                }
                
                await this.initializeApp();
            } else {
                throw new Error('Failed to get user profile');
            }
        } catch (error) {
            console.error('OAuth success handling failed:', error);
            this.showLoginError('Authentication failed. Please try again.');
            this.clearAuthentication();
        }
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const rememberMe = formData.get('remember-me');
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call (replace with real authentication)
            await this.simulateLogin(email, password);
            
            // Store authentication data
            const userData = {
                id: '1',
                name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                email: email,
                role: 'Pro Analyst',
                avatar: null,
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    autoRefresh: true
                }
            };
            
            const token = 'demo_token_' + Date.now();
            
            if (rememberMe) {
                localStorage.setItem('fa_token', token);
                localStorage.setItem('fa_user', JSON.stringify(userData));
            } else {
                sessionStorage.setItem('fa_token', token);
                sessionStorage.setItem('fa_user', JSON.stringify(userData));
            }
            
            this.currentUser = userData;
            this.isAuthenticated = true;
            
            // Hide login modal and show app
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('main-app').style.display = 'flex';
            
            await this.initializeApp();
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            this.showLoginError('Invalid credentials. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async simulateLogin(email, password) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simple validation for demo
        if (email && password.length >= 6) {
            return true;
        } else {
            throw new Error('Invalid credentials');
        }
    }

    async handleRegister(e) {
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validate passwords match
        if (password !== confirmPassword) {
            this.showRegisterError('Passwords do not match');
            return;
        }
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${this.apiUrl}/api/v1/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store authentication data
                localStorage.setItem('fa_token', data.data.tokens.accessToken);
                localStorage.setItem('fa_refresh_token', data.data.tokens.refreshToken);
                localStorage.setItem('fa_user', JSON.stringify(data.data.user));
                
                this.currentUser = data.data.user;
                this.isAuthenticated = true;
                
                // Hide register modal and show app
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('main-app').style.display = 'flex';
                
                this.addNotification('Account created successfully! Welcome to Football Analytics Pro!', 'success');
                await this.initializeApp();
            } else {
                this.showRegisterError(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            this.showRegisterError('Registration failed. Please try again.');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleGoogleAuth() {
        try {
            // Get Google OAuth URL from server
            const response = await fetch(`${this.apiUrl}/api/v1/auth/google`);
            const data = await response.json();
            
            if (data.success) {
                // Redirect to Google OAuth
                window.location.href = data.data.authUrl;
            } else {
                throw new Error(data.error || 'Failed to get Google OAuth URL');
            }
        } catch (error) {
            console.error('Google OAuth failed:', error);
            this.showLoginError('Google authentication is not available');
        }
    }

    handleSocialLogin(provider) {
        if (provider === 'google') {
            this.handleGoogleAuth();
            return;
        }
        
        // For other providers (Microsoft, etc.), implement similar OAuth flow
        this.showLoginError(`${provider} authentication is not yet implemented`);
    }

    showRegisterError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.register-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'register-error';
            errorDiv.style.cssText = `
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                color: #ef4444;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                animation: fadeInUp 0.3s ease-out;
            `;
            
            const form = document.getElementById('register-form');
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        errorDiv.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showLoginError(message) {
        // Create or update error message
        let errorDiv = document.querySelector('.login-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'login-error';
            errorDiv.style.cssText = `
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid #ef4444;
                color: #ef4444;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                animation: fadeInUp 0.3s ease-out;
            `;
            
            const form = document.getElementById('login-form');
            form.insertBefore(errorDiv, form.firstChild);
        }
        
        errorDiv.textContent = message;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    clearAuthentication() {
        localStorage.removeItem('fa_token');
        localStorage.removeItem('fa_user');
        sessionStorage.removeItem('fa_token');
        sessionStorage.removeItem('fa_user');
        
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    logout() {
        this.clearAuthentication();
        
        // Close WebSocket connection
        if (this.ws) {
            this.ws.close();
        }
        
        // Reset UI
        document.getElementById('main-app').style.display = 'none';
        this.showLoginModal();
    }

    // App Initialization
    async initializeApp() {
        console.log('🎯 Initializing main application...');
        
        // Show loading overlay
        this.showLoading();
        
        // Setup UI components
        this.setupEventListeners();
        this.setupUserProfile();
        this.connectWebSocket();
        
        // Load initial data
        await this.loadInitialData();
        
        // Initialize charts
        this.initializeCharts();
        
        // Hide loading overlay
        this.hideLoading();
        
        console.log('✅ Application initialized successfully!');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            this.toggleSidebar();
        });
        
        // Navigation menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) {
                    this.switchView(view);
                }
            });
        });
        
        // User profile menu
        document.getElementById('user-profile').addEventListener('click', () => {
            this.toggleUserMenu();
        });
        
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        // Notification center
        document.getElementById('notification-btn').addEventListener('click', () => {
            this.toggleNotificationPanel();
        });
        
        document.getElementById('close-notifications').addEventListener('click', () => {
            this.toggleNotificationPanel();
        });
        
        // Global search
        document.getElementById('global-search').addEventListener('input', (e) => {
            this.handleGlobalSearch(e.target.value);
        });
        
        // Refresh button
        document.getElementById('refresh-games').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Compare tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchCompareTab(btn.dataset.tab);
            });
        });
        
        // Team/Player selectors
        document.getElementById('team-a-select').addEventListener('change', () => {
            this.updateTeamComparison();
        });
        
        document.getElementById('team-b-select').addEventListener('change', () => {
            this.updateTeamComparison();
        });
        
        document.getElementById('player-a-select').addEventListener('change', () => {
            this.updatePlayerComparison();
        });
        
        document.getElementById('player-b-select').addEventListener('change', () => {
            this.updatePlayerComparison();
        });
        
        // Auto-refresh data every 30 seconds
        setInterval(() => {
            if (this.currentUser?.preferences?.autoRefresh) {
                this.refreshData();
            }
        }, 30000);
    }

    setupUserProfile() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.name;
            
            // Update avatar if available
            const avatar = document.querySelector('.user-avatar i');
            if (this.currentUser.avatar) {
                avatar.parentElement.innerHTML = `<img src="${this.currentUser.avatar}" alt="Avatar">`;
            } else {
                avatar.className = 'fas fa-user';
            }
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    toggleUserMenu() {
        const userProfile = document.getElementById('user-profile');
        const userMenu = document.getElementById('user-menu');
        
        userProfile.classList.toggle('active');
        userMenu.classList.toggle('active');
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notification-panel');
        panel.classList.toggle('active');
    }

    switchView(viewName) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
        
        // Update page title and breadcrumb
        const titles = {
            'dashboard': 'Dashboard',
            'live-games': 'Live Games',
            'predictions': 'Predictions',
            'compare': 'Compare',
            'teams': 'Teams',
            'players': 'Players',
            'statistics': 'Statistics',
            'historical': 'Historical',
            'monte-carlo': 'Monte Carlo',
            'ml-models': 'ML Models',
            'alerts': 'Alerts'
        };
        
        document.getElementById('page-title').textContent = titles[viewName] || viewName;
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb');
        const category = this.getViewCategory(viewName);
        breadcrumb.innerHTML = `
            <span>${category}</span>
            <i class="fas fa-chevron-right"></i>
            <span>${titles[viewName]}</span>
        `;
        
        // Show/hide views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        this.currentView = viewName;
        
        // Load view-specific data
        this.loadViewData(viewName);
    }

    getViewCategory(viewName) {
        const categories = {
            'dashboard': 'Analytics',
            'live-games': 'Analytics',
            'predictions': 'Analytics',
            'compare': 'Analytics',
            'teams': 'Data',
            'players': 'Data',
            'statistics': 'Data',
            'historical': 'Data',
            'monte-carlo': 'Tools',
            'ml-models': 'Tools',
            'alerts': 'Tools'
        };
        
        return categories[viewName] || 'Analytics';
    }

    switchCompareTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Show/hide tab content
        document.querySelectorAll('.compare-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.getElementById(`${tabName}-compare`).classList.add('active');
    }

    async loadViewData(viewName) {
        switch (viewName) {
            case 'compare':
                await this.loadCompareData();
                break;
            case 'teams':
                await this.loadTeamsData();
                break;
            case 'players':
                await this.loadPlayersData();
                break;
            // Add more view-specific data loading
        }
    }

    async loadCompareData() {
        // Populate team selectors
        const teamASelect = document.getElementById('team-a-select');
        const teamBSelect = document.getElementById('team-b-select');
        
        teamASelect.innerHTML = '<option value="">Select Team A</option>';
        teamBSelect.innerHTML = '<option value="">Select Team B</option>';
        
        this.cache.teams.forEach(team => {
            const optionA = new Option(team.name, team.id);
            const optionB = new Option(team.name, team.id);
            teamASelect.add(optionA);
            teamBSelect.add(optionB);
        });
        
        // Populate player selectors
        const playerASelect = document.getElementById('player-a-select');
        const playerBSelect = document.getElementById('player-b-select');
        
        playerASelect.innerHTML = '<option value="">Select Player A</option>';
        playerBSelect.innerHTML = '<option value="">Select Player B</option>';
        
        this.cache.players.forEach(player => {
            const team = this.cache.teams.find(t => t.id === player.teamId);
            const playerName = `${player.name} (${team?.abbreviation || 'N/A'})`;
            
            const optionA = new Option(playerName, player.id);
            const optionB = new Option(playerName, player.id);
            playerASelect.add(optionA);
            playerBSelect.add(optionB);
        });
    }

    updateTeamComparison() {
        const teamAId = document.getElementById('team-a-select').value;
        const teamBId = document.getElementById('team-b-select').value;
        
        if (teamAId && teamBId && teamAId !== teamBId) {
            const teamA = this.cache.teams.find(t => t.id === teamAId);
            const teamB = this.cache.teams.find(t => t.id === teamBId);
            
            this.renderTeamComparison(teamA, teamB);
        }
    }

    renderTeamComparison(teamA, teamB) {
        const container = document.getElementById('team-comparison-results');
        
        // Generate mock comparison data
        const comparisonData = {
            offense: {
                teamA: 85 + Math.random() * 10,
                teamB: 85 + Math.random() * 10
            },
            defense: {
                teamA: 80 + Math.random() * 15,
                teamB: 80 + Math.random() * 15
            },
            specialTeams: {
                teamA: 75 + Math.random() * 20,
                teamB: 75 + Math.random() * 20
            },
            coaching: {
                teamA: 85 + Math.random() * 10,
                teamB: 85 + Math.random() * 10
            }
        };
        
        container.innerHTML = `
            <div class="comparison-grid">
                <div class="comparison-header">
                    <div class="team-comparison-card">
                        <div class="team-logo">${teamA.abbreviation}</div>
                        <h3>${teamA.name}</h3>
                        <p>${teamA.conference} ${teamA.division}</p>
                    </div>
                    <div class="comparison-vs">VS</div>
                    <div class="team-comparison-card">
                        <div class="team-logo">${teamB.abbreviation}</div>
                        <h3>${teamB.name}</h3>
                        <p>${teamB.conference} ${teamB.division}</p>
                    </div>
                </div>
                
                <div class="comparison-metrics">
                    ${Object.entries(comparisonData).map(([metric, values]) => `
                        <div class="metric-comparison">
                            <div class="metric-name">${metric.charAt(0).toUpperCase() + metric.slice(1)}</div>
                            <div class="metric-bars">
                                <div class="metric-bar">
                                    <div class="metric-value">${values.teamA.toFixed(1)}</div>
                                    <div class="bar-container">
                                        <div class="bar-fill team-a" style="width: ${values.teamA}%"></div>
                                    </div>
                                </div>
                                <div class="metric-bar">
                                    <div class="bar-container">
                                        <div class="bar-fill team-b" style="width: ${values.teamB}%"></div>
                                    </div>
                                    <div class="metric-value">${values.teamB.toFixed(1)}</div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="comparison-prediction">
                    <h4>Head-to-Head Prediction</h4>
                    <div class="prediction-result">
                        ${comparisonData.offense.teamA + comparisonData.defense.teamA > comparisonData.offense.teamB + comparisonData.defense.teamB 
                            ? `<strong>${teamA.name}</strong> favored by ${Math.abs((comparisonData.offense.teamA + comparisonData.defense.teamA) - (comparisonData.offense.teamB + comparisonData.defense.teamB)).toFixed(1)} points`
                            : `<strong>${teamB.name}</strong> favored by ${Math.abs((comparisonData.offense.teamB + comparisonData.defense.teamB) - (comparisonData.offense.teamA + comparisonData.defense.teamA)).toFixed(1)} points`
                        }
                    </div>
                </div>
            </div>
        `;
        
        // Add comparison styles
        this.addComparisonStyles();
    }

    addComparisonStyles() {
        if (document.getElementById('comparison-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'comparison-styles';
        style.textContent = `
            .comparison-grid {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .comparison-header {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                gap: 2rem;
                align-items: center;
            }
            
            .team-comparison-card {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .team-logo {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: var(--primary-gradient);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 1.5rem;
                margin: 0 auto 1rem;
            }
            
            .comparison-vs {
                font-size: 2rem;
                font-weight: 800;
                background: var(--primary-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-align: center;
            }
            
            .comparison-metrics {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
            
            .metric-comparison {
                background: rgba(255, 255, 255, 0.02);
                border-radius: 12px;
                padding: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.05);
            }
            
            .metric-name {
                text-align: center;
                font-weight: 600;
                color: var(--white);
                margin-bottom: 1rem;
                font-size: 1.125rem;
            }
            
            .metric-bars {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                align-items: center;
            }
            
            .metric-bar {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .metric-bar:first-child {
                flex-direction: row-reverse;
            }
            
            .metric-value {
                font-weight: 700;
                color: var(--white);
                min-width: 40px;
                text-align: center;
            }
            
            .bar-container {
                flex: 1;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .bar-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.8s ease;
            }
            
            .bar-fill.team-a {
                background: linear-gradient(90deg, #667eea, #764ba2);
            }
            
            .bar-fill.team-b {
                background: linear-gradient(90deg, #f093fb, #f5576c);
            }
            
            .comparison-prediction {
                text-align: center;
                padding: 2rem;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 16px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .comparison-prediction h4 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--white);
                margin-bottom: 1rem;
            }
            
            .prediction-result {
                font-size: 1.125rem;
                color: var(--dark-300);
            }
            
            .prediction-result strong {
                background: var(--primary-gradient);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        `;
        
        document.head.appendChild(style);
    }

    handleGlobalSearch(query) {
        if (query.length < 2) return;
        
        // Simple search implementation
        const results = [];
        
        // Search teams
        this.cache.teams.forEach(team => {
            if (team.name.toLowerCase().includes(query.toLowerCase()) ||
                team.abbreviation.toLowerCase().includes(query.toLowerCase())) {
                results.push({ type: 'team', data: team });
            }
        });
        
        // Search players
        this.cache.players.forEach(player => {
            if (player.name.toLowerCase().includes(query.toLowerCase())) {
                results.push({ type: 'player', data: player });
            }
        });
        
        console.log('🔍 Search results:', results);
        // Implement search results display
    }

    // Data Loading Methods
    async loadInitialData() {
        try {
            // Load all data in parallel
            const [teams, games, players, systemStatus] = await Promise.all([
                this.fetchTeams(),
                this.fetchGames(),
                this.fetchPlayers(),
                this.fetchSystemStatus()
            ]);

            // Cache data
            this.cache.teams = teams;
            this.cache.games = games;
            this.cache.players = players;

            // Update UI
            this.updateKPICards(teams, games, players);
            this.renderGames(games);
            
            // Load predictions for each game
            for (const game of games) {
                const predictions = await this.fetchPredictions(game.id);
                this.cache.predictions.set(game.id, predictions);
                this.updateGamePredictions(game.id, predictions);
            }

            this.updateApiStatus('connected');
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            this.updateApiStatus('disconnected');
            this.addNotification('Failed to load initial data', 'error');
        }
    }

    async refreshData() {
        try {
            const games = await this.fetchGames();
            this.cache.games = games;
            
            // Update predictions for each game
            for (const game of games) {
                const predictions = await this.fetchPredictions(game.id);
                this.cache.predictions.set(game.id, predictions);
                this.updateGamePredictions(game.id, predictions);
            }
            
            this.addNotification('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('❌ Error refreshing data:', error);
            this.addNotification('Failed to refresh data', 'error');
        }
    }

    // API Methods
    async fetchTeams() {
        const response = await fetch(`${this.apiUrl}/api/v1/teams`);
        const data = await response.json();
        return data.data;
    }

    async fetchGames() {
        const response = await fetch(`${this.apiUrl}/api/v1/games`);
        const data = await response.json();
        return data.data;
    }

    async fetchPlayers() {
        const response = await fetch(`${this.apiUrl}/api/v1/players`);
        const data = await response.json();
        return data.data;
    }

    async fetchPredictions(gameId) {
        const response = await fetch(`${this.apiUrl}/api/v1/predictions/${gameId}`);
        const data = await response.json();
        return data.data;
    }

    async fetchSystemStatus() {
        const response = await fetch(`${this.apiUrl}/api/v1/system/status`);
        const data = await response.json();
        return data.data;
    }

    // WebSocket Methods
    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.onopen = () => {
                console.log('🔌 WebSocket connected');
                this.updateWebSocketStatus('connected');
                this.addNotification('Live updates connected', 'success');
                this.reconnectAttempts = 0;
                
                // Subscribe to updates
                this.ws.send(JSON.stringify({
                    type: 'subscribe',
                    channel: 'game-updates',
                    userId: this.currentUser?.id
                }));
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                }
            };

            this.ws.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.updateWebSocketStatus('disconnected');
                this.addNotification('Live updates disconnected', 'warning');
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateWebSocketStatus('disconnected');
            };
        } catch (error) {
            console.error('❌ Error connecting to WebSocket:', error);
            this.updateWebSocketStatus('disconnected');
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.updateWebSocketStatus('connecting');
            
            setTimeout(() => {
                this.connectWebSocket();
            }, this.reconnectDelay * this.reconnectAttempts);
        }
    }

    handleWebSocketMessage(message) {
        console.log('📨 WebSocket message:', message);
        
        switch (message.type) {
            case 'connection':
                this.addNotification(message.message, 'info');
                break;
                
            case 'subscription-confirmed':
                console.log(`✅ Subscribed to ${message.channel}`);
                break;
                
            case 'probability-update':
                this.handleProbabilityUpdate(message);
                break;
                
            default:
                console.log(`📨 Unknown message type: ${message.type}`);
        }
    }

    handleProbabilityUpdate(message) {
        const { gameId, probabilities, gameState } = message;
        
        // Update cached predictions
        if (this.cache.predictions.has(gameId)) {
            const cached = this.cache.predictions.get(gameId);
            cached.probabilities = probabilities;
            this.cache.predictions.set(gameId, cached);
        }
        
        // Update UI
        this.updateGameProbabilitiesLive(gameId, probabilities, gameState);
        
        // Add notification
        this.addNotification(
            `Game ${gameId} probabilities updated`,
            'info'
        );
    }

    // UI Update Methods
    updateKPICards(teams, games, players) {
        document.getElementById('teams-count').textContent = teams.length;
        document.getElementById('games-count').textContent = games.length;
        document.getElementById('predictions-count').textContent = games.length;
        
        // Animate counters
        this.animateCounter('teams-count', 0, teams.length, 1000);
        this.animateCounter('games-count', 0, games.length, 1200);
        this.animateCounter('predictions-count', 0, games.length, 1400);
    }

    animateCounter(elementId, start, end, duration) {
        const element = document.getElementById(elementId);
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * this.easeOutCubic(progress));
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    renderGames(games) {
        const container = document.getElementById('games-grid');
        container.innerHTML = '';

        games.forEach((game, index) => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.id = `game-${game.id}`;
            gameCard.style.animationDelay = `${index * 0.1}s`;
            
            const scheduledTime = new Date(game.scheduledTime);
            const timeString = scheduledTime.toLocaleDateString() + ' ' + 
                             scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            gameCard.innerHTML = `
                <div class="game-header">
                    <div class="game-title">Week ${game.week} - ${game.gameType}</div>
                    <div class="game-time">${timeString}</div>
                </div>
                <div class="game-matchup">
                    <div class="team">
                        <div class="team-name" id="away-team-${game.id}">Loading...</div>
                        <div class="team-record">Away</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <div class="team-name" id="home-team-${game.id}">Loading...</div>
                        <div class="team-record">Home</div>
                    </div>
                </div>
                <div class="probabilities" id="probabilities-${game.id}">
                    <div class="prob-item">
                        <div class="prob-value">--%</div>
                        <div class="prob-label">Away Win</div>
                    </div>
                    <div class="prob-item">
                        <div class="prob-value">--%</div>
                        <div class="prob-label">Home Win</div>
                    </div>
                </div>
                <div class="confidence">
                    <div>Confidence: <span id="confidence-${game.id}">--%</span></div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" id="confidence-bar-${game.id}" style="width: 0%"></div>
                    </div>
                </div>
                <div class="game-state" id="game-state-${game.id}" style="margin-top: 1rem; font-size: 0.875rem; color: var(--dark-400);">
                    <!-- Live game state will appear here -->
                </div>
            `;
            container.appendChild(gameCard);

            // Load team names
            this.loadTeamNames(game);
        });
    }

    async loadTeamNames(game) {
        try {
            const homeTeam = this.cache.teams.find(t => t.id === game.homeTeamId);
            const awayTeam = this.cache.teams.find(t => t.id === game.awayTeamId);

            if (homeTeam && awayTeam) {
                document.getElementById(`home-team-${game.id}`).textContent = homeTeam.name;
                document.getElementById(`away-team-${game.id}`).textContent = awayTeam.name;
            }
        } catch (error) {
            console.error('❌ Error loading team names:', error);
        }
    }

    updateGamePredictions(gameId, predictions) {
        const probContainer = document.getElementById(`probabilities-${gameId}`);
        if (!probContainer) return;

        const { probabilities } = predictions;
        
        probContainer.innerHTML = `
            <div class="prob-item">
                <div class="prob-value">${(probabilities.awayTeamWinProbability * 100).toFixed(1)}%</div>
                <div class="prob-label">Away Win</div>
            </div>
            <div class="prob-item">
                <div class="prob-value">${(probabilities.homeTeamWinProbability * 100).toFixed(1)}%</div>
                <div class="prob-label">Home Win</div>
            </div>
        `;

        // Update confidence with animation
        const confidenceSpan = document.getElementById(`confidence-${gameId}`);
        const confidenceBar = document.getElementById(`confidence-bar-${gameId}`);
        
        if (confidenceSpan && confidenceBar) {
            const confidencePercent = (probabilities.confidence * 100).toFixed(1);
            confidenceSpan.textContent = `${confidencePercent}%`;
            
            // Animate confidence bar
            setTimeout(() => {
                confidenceBar.style.width = `${confidencePercent}%`;
            }, 100);
        }
    }

    updateGameProbabilitiesLive(gameId, probabilities, gameState) {
        // Update probabilities with smooth animation
        this.updateGamePredictions(gameId, { probabilities });
        
        // Update game state if provided
        if (gameState) {
            const gameStateContainer = document.getElementById(`game-state-${gameId}`);
            if (gameStateContainer) {
                gameStateContainer.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05);">
                        <div><strong>Q${gameState.quarter}</strong> - ${gameState.timeRemaining}</div>
                        <div style="font-weight: 700; font-size: 1.125rem;">${gameState.homeScore} - ${gameState.awayScore}</div>
                        <div>📍 ${gameState.possession === 'home' ? 'Home' : 'Away'}</div>
                    </div>
                `;
            }
        }
    }

    // Charts Initialization
    initializeCharts() {
        this.initializeAccuracyChart();
        this.initializeConferenceChart();
    }

    initializeAccuracyChart() {
        const ctx = document.getElementById('accuracy-chart');
        if (!ctx) return;

        // Generate sample data
        const data = {
            labels: Array.from({length: 30}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                return date.toLocaleDateString();
            }),
            datasets: [{
                label: 'Prediction Accuracy',
                data: Array.from({length: 30}, () => 75 + Math.random() * 20),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        };

        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        beginAtZero: false,
                        min: 70,
                        max: 100,
                        ticks: {
                            color: '#a0aec0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                }
            }
        });
    }

    initializeConferenceChart() {
        const ctx = document.getElementById('conference-chart');
        if (!ctx) return;

        const data = {
            labels: ['SEC', 'Big Ten', 'Big 12', 'ACC', 'Pac-12'],
            datasets: [{
                label: 'Wins',
                data: [45, 42, 38, 35, 32],
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(250, 112, 154, 0.8)'
                ],
                borderColor: [
                    '#667eea',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#fa709a'
                ],
                borderWidth: 2
            }]
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#a0aec0',
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Status Update Methods
    updateApiStatus(status) {
        const statusElement = document.getElementById('api-status');
        statusElement.className = `status-item ${status}`;
    }

    updateWebSocketStatus(status) {
        const statusElement = document.getElementById('ws-status');
        statusElement.className = `status-item ${status}`;
    }

    // Notification Methods
    addNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        console.log(`📢 Notification: ${message} (${type})`);
        
        // Update notification badge
        const badge = document.querySelector('.notification-badge');
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        
        // Add to notification panel (implement if needed)
    }

    // Loading Methods
    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 1500);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FootballAnalyticsPro();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 Page hidden - pausing updates');
    } else {
        console.log('📱 Page visible - resuming updates');
    }
});