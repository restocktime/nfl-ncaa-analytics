// Football Analytics Pro - Fixed Button Version

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
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Hide loading overlay immediately
        this.hideLoading();
        
        // Check for existing authentication
        this.checkAuthentication();
        
        if (!this.isAuthenticated) {
            this.showLoginModal();
        } else {
            await this.initializeApp();
        }
    }

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
        console.log('🔐 Showing login modal...');
        
        const loginModal = document.getElementById('login-modal');
        const mainApp = document.getElementById('main-app');
        const loadingOverlay = document.getElementById('loading-overlay');
        
        if (!loginModal) {
            console.error('❌ Login modal not found!');
            return;
        }
        
        // Hide loading overlay if it's showing
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        loginModal.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        // Setup handlers immediately and with retries
        this.setupLoginHandlersRobust();
        
        console.log('✅ Login modal displayed');
    }

    setupLoginHandlersRobust() {
        console.log('🔧 Setting up robust login handlers...');
        
        // Use event delegation for bulletproof event handling
        document.addEventListener('click', (e) => {
            this.handleGlobalClick(e);
        });
        
        document.addEventListener('submit', (e) => {
            this.handleGlobalSubmit(e);
        });
        
        // Also try direct attachment with retries
        this.attachDirectHandlers();
        
        console.log('✅ Robust handlers setup complete');
    }

    handleGlobalClick(e) {
        const target = e.target;
        const targetId = target.id;
        const targetClasses = target.className;
        
        console.log(`🖱️ Click detected: ${target.tagName}#${targetId}.${targetClasses}`);
        
        // Handle Google login buttons
        if (target.matches('.btn-social.google') || target.closest('.btn-social.google')) {
            e.preventDefault();
            console.log('🔐 Google login clicked via delegation');
            this.handleGoogleAuth();
            return;
        }
        
        // Handle Microsoft login buttons
        if (target.matches('.btn-social.microsoft') || target.closest('.btn-social.microsoft')) {
            e.preventDefault();
            console.log('🔐 Microsoft login clicked via delegation');
            this.handleSocialLogin('microsoft');
            return;
        }
        
        // Handle show register link
        if (targetId === 'show-register' || target.closest('#show-register')) {
            e.preventDefault();
            console.log('🔄 Show register clicked via delegation');
            this.showRegisterModal();
            return;
        }
        
        // Handle show login link
        if (targetId === 'show-login' || target.closest('#show-login')) {
            e.preventDefault();
            console.log('🔄 Show login clicked via delegation');
            this.showLoginModal();
            return;
        }
        
        // Handle password toggles
        if (target.matches('.password-toggle') || target.closest('.password-toggle')) {
            e.preventDefault();
            this.handlePasswordToggle(target.closest('.password-toggle'));
            return;
        }
    }

    handleGlobalSubmit(e) {
        const form = e.target;
        const formId = form.id;
        
        console.log(`📝 Form submit detected: ${formId}`);
        
        if (formId === 'login-form') {
            e.preventDefault();
            console.log('📝 Login form submitted via delegation');
            this.handleLogin(e);
            return;
        }
        
        if (formId === 'register-form') {
            e.preventDefault();
            console.log('📝 Register form submitted via delegation');
            this.handleRegister(e);
            return;
        }
    }

    attachDirectHandlers() {
        // Try multiple times to attach handlers
        let attempts = 0;
        const maxAttempts = 10;
        
        const tryAttach = () => {
            attempts++;
            console.log(`🔄 Direct handler attachment attempt ${attempts}`);
            
            // Login form
            const loginForm = document.getElementById('login-form');
            if (loginForm && !loginForm._handlerAttached) {
                loginForm.onsubmit = (e) => {
                    e.preventDefault();
                    console.log('📝 Login form submitted directly');
                    this.handleLogin(e);
                };
                loginForm._handlerAttached = true;
                console.log('✅ Login form direct handler attached');
            }
            
            // Register form
            const registerForm = document.getElementById('register-form');
            if (registerForm && !registerForm._handlerAttached) {
                registerForm.onsubmit = (e) => {
                    e.preventDefault();
                    console.log('📝 Register form submitted directly');
                    this.handleRegister(e);
                };
                registerForm._handlerAttached = true;
                console.log('✅ Register form direct handler attached');
            }
            
            // Google buttons
            const googleButtons = document.querySelectorAll('.btn-social.google');
            googleButtons.forEach((btn, index) => {
                if (!btn._handlerAttached) {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        console.log(`🔐 Google button ${index} clicked directly`);
                        this.handleGoogleAuth();
                    };
                    btn._handlerAttached = true;
                    console.log(`✅ Google button ${index} direct handler attached`);
                }
            });
            
            // Microsoft buttons
            const microsoftButtons = document.querySelectorAll('.btn-social.microsoft');
            microsoftButtons.forEach((btn, index) => {
                if (!btn._handlerAttached) {
                    btn.onclick = (e) => {
                        e.preventDefault();
                        console.log(`🔐 Microsoft button ${index} clicked directly`);
                        this.handleSocialLogin('microsoft');
                    };
                    btn._handlerAttached = true;
                    console.log(`✅ Microsoft button ${index} direct handler attached`);
                }
            });
            
            // Show register/login links
            const showRegister = document.getElementById('show-register');
            if (showRegister && !showRegister._handlerAttached) {
                showRegister.onclick = (e) => {
                    e.preventDefault();
                    console.log('🔄 Show register clicked directly');
                    this.showRegisterModal();
                };
                showRegister._handlerAttached = true;
                console.log('✅ Show register direct handler attached');
            }
            
            const showLogin = document.getElementById('show-login');
            if (showLogin && !showLogin._handlerAttached) {
                showLogin.onclick = (e) => {
                    e.preventDefault();
                    console.log('🔄 Show login clicked directly');
                    this.showLoginModal();
                };
                showLogin._handlerAttached = true;
                console.log('✅ Show login direct handler attached');
            }
            
            // Retry if needed
            if (attempts < maxAttempts) {
                setTimeout(tryAttach, 200);
            }
        };
        
        tryAttach();
    }

    handlePasswordToggle(toggleBtn) {
        const formGroup = toggleBtn.closest('.form-group');
        const input = formGroup ? formGroup.querySelector('input[type="password"], input[type="text"]') : null;
        
        if (input) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            }
            
            console.log(`👁️ Password visibility toggled: ${isPassword ? 'shown' : 'hidden'}`);
        }
    }

    showRegisterModal() {
        console.log('📝 Showing register modal...');
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) {
            registerModal.style.display = 'flex';
            console.log('✅ Register modal displayed');
        }
    }

    async handleLogin(e) {
        console.log('🔐 Handling login...');
        
        const form = e.target;
        const formData = new FormData(form);
        const email = formData.get('email') || document.getElementById('email')?.value;
        const password = formData.get('password') || document.getElementById('password')?.value;
        
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitBtn.disabled = true;
            
            try {
                // Simulate login
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Create user data
                const userData = {
                    id: '1',
                    name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
                    email: email,
                    role: 'Pro Analyst'
                };
                
                const token = 'demo_token_' + Date.now();
                
                localStorage.setItem('fa_token', token);
                localStorage.setItem('fa_user', JSON.stringify(userData));
                
                this.currentUser = userData;
                this.isAuthenticated = true;
                
                // Hide login modal and show app
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('main-app').style.display = 'flex';
                
                await this.initializeApp();
                
            } catch (error) {
                console.error('❌ Login failed:', error);
                alert('Login failed. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    async handleRegister(e) {
        console.log('📝 Handling registration...');
        
        const form = e.target;
        const formData = new FormData(form);
        const name = formData.get('name') || document.getElementById('register-name')?.value;
        const email = formData.get('email') || document.getElementById('register-email')?.value;
        const password = formData.get('password') || document.getElementById('register-password')?.value;
        const confirmPassword = formData.get('confirmPassword') || document.getElementById('confirm-password')?.value;
        
        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.btn-primary');
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
            submitBtn.disabled = true;
            
            try {
                // Simulate registration
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                const userData = {
                    id: '1',
                    name: name,
                    email: email,
                    role: 'Pro Analyst'
                };
                
                const token = 'demo_token_' + Date.now();
                
                localStorage.setItem('fa_token', token);
                localStorage.setItem('fa_user', JSON.stringify(userData));
                
                this.currentUser = userData;
                this.isAuthenticated = true;
                
                // Hide register modal and show app
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('main-app').style.display = 'flex';
                
                await this.initializeApp();
                
            } catch (error) {
                console.error('❌ Registration failed:', error);
                alert('Registration failed. Please try again.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    async handleGoogleAuth() {
        console.log('🔐 Handling Google authentication...');
        
        try {
            const response = await fetch(`${this.apiUrl}/api/v1/auth/google`);
            const data = await response.json();
            
            if (data.success) {
                window.location.href = data.data.authUrl;
            } else {
                throw new Error(data.error || 'Failed to get Google OAuth URL');
            }
        } catch (error) {
            console.error('Google OAuth failed:', error);
            alert('Google authentication is temporarily unavailable. Please use email/password login.');
        }
    }

    handleSocialLogin(provider) {
        console.log(`🔐 Handling ${provider} authentication...`);
        
        if (provider === 'google') {
            this.handleGoogleAuth();
            return;
        }
        
        alert(`${provider} authentication is not yet implemented`);
    }

    clearAuthentication() {
        localStorage.removeItem('fa_token');
        localStorage.removeItem('fa_user');
        sessionStorage.removeItem('fa_token');
        sessionStorage.removeItem('fa_user');
        
        this.currentUser = null;
        this.isAuthenticated = false;
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.classList.add('hidden');
        }
    }

    async initializeApp() {
        console.log('🎯 Initializing main application...');
        
        // Hide modals
        const loginModal = document.getElementById('login-modal');
        const registerModal = document.getElementById('register-modal');
        const mainApp = document.getElementById('main-app');
        
        if (loginModal) loginModal.style.display = 'none';
        if (registerModal) registerModal.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        
        // Setup main app handlers
        this.setupMainAppHandlers();
        
        console.log('✅ Application initialized successfully!');
    }

    setupMainAppHandlers() {
        // Add main app event handlers here
        console.log('🔧 Setting up main app handlers...');
        
        // Logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                this.logout();
            };
        }
    }

    logout() {
        this.clearAuthentication();
        
        // Reset UI
        document.getElementById('main-app').style.display = 'none';
        this.showLoginModal();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🎯 DOM loaded, initializing Football Analytics Pro...');
        const app = new FootballAnalyticsPro();
        
        // Make app globally accessible for debugging
        window.footballApp = app;
        
        console.log('✅ Football Analytics Pro initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Football Analytics Pro:', error);
        
        // Show error message to user
        document.body.innerHTML = `
            <div style="
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #0a0a0a;
                color: #fff;
                font-family: Inter, sans-serif;
                text-align: center;
            ">
                <div>
                    <h1 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Application Error</h1>
                    <p>Failed to initialize Football Analytics Pro</p>
                    <p style="color: #888; font-size: 0.875rem; margin-top: 1rem;">
                        Check the browser console for details
                    </p>
                    <button onclick="location.reload()" style="
                        background: #3b82f6;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        margin-top: 1rem;
                        cursor: pointer;
                    ">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
    }
});