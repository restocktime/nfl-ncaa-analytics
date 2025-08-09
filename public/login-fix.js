// Simple login fix for Football Analytics
class LoginFix {
    constructor() {
        this.apiUrl = 'http://localhost:3000';
        this.init();
    }

    init() {
        console.log('🔧 Login fix initialized');
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLoginFix());
        } else {
            this.setupLoginFix();
        }
    }

    setupLoginFix() {
        console.log('🔧 Setting up login fix...');
        
        // Override the existing login handler
        if (window.footballApp) {
            window.footballApp.handleLogin = this.handleLogin.bind(this);
            window.footballApp.handleRegister = this.handleRegister.bind(this);
            console.log('✅ Login handlers overridden');
        }
        
        // Also setup direct event listeners as backup
        this.setupDirectListeners();
    }

    setupDirectListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
            console.log('✅ Direct login listener attached');
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
            console.log('✅ Direct register listener attached');
        }

        // Quick login buttons
        this.addQuickLoginButtons();
    }

    addQuickLoginButtons() {
        const loginModal = document.getElementById('login-modal');
        if (!loginModal) return;

        const quickLoginHtml = `
            <div class="quick-login-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #333;">
                <h4 style="color: #fff; margin-bottom: 15px; text-align: center;">Quick Demo Login</h4>
                <div class="quick-login-buttons" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-quick-login" data-email="analyst@nfl.com" data-password="password123" 
                            style="flex: 1; min-width: 120px; padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        NFL Analyst
                    </button>
                    <button class="btn-quick-login" data-email="coach@football.com" data-password="coach2024" 
                            style="flex: 1; min-width: 120px; padding: 8px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Coach
                    </button>
                    <button class="btn-quick-login" data-email="fan@sports.com" data-password="fanatic123" 
                            style="flex: 1; min-width: 120px; padding: 8px 12px; background: #ffc107; color: black; border: none; border-radius: 4px; cursor: pointer;">
                        Sports Fan
                    </button>
                </div>
                <p style="color: #ccc; font-size: 12px; text-align: center; margin-top: 10px;">
                    Or use any email/password (6+ chars)
                </p>
            </div>
        `;

        const loginFormContainer = loginModal.querySelector('.auth-form');
        if (loginFormContainer) {
            loginFormContainer.insertAdjacentHTML('beforeend', quickLoginHtml);

            // Add click handlers for quick login buttons
            const quickLoginButtons = loginFormContainer.querySelectorAll('.btn-quick-login');
            quickLoginButtons.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const email = btn.dataset.email;
                    const password = btn.dataset.password;
                    this.performLogin(email, password);
                });
            });

            console.log('✅ Quick login buttons added');
        }
    }

    async handleLogin(e) {
        console.log('🔐 Handling login with fix...');
        
        const form = e.target.closest('form') || document.getElementById('login-form');
        const email = form.querySelector('#email')?.value || form.querySelector('input[name="email"]')?.value;
        const password = form.querySelector('#password')?.value || form.querySelector('input[name="password"]')?.value;
        
        if (!email || !password) {
            alert('Please enter both email and password');
            return;
        }

        await this.performLogin(email, password);
    }

    async handleRegister(e) {
        console.log('📝 Handling registration with fix...');
        
        const form = e.target.closest('form') || document.getElementById('register-form');
        const name = form.querySelector('#register-name')?.value || form.querySelector('input[name="name"]')?.value;
        const email = form.querySelector('#register-email')?.value || form.querySelector('input[name="email"]')?.value;
        const password = form.querySelector('#register-password')?.value || form.querySelector('input[name="password"]')?.value;
        
        if (!name || !email || !password) {
            alert('Please fill in all fields');
            return;
        }

        await this.performRegister(name, email, password);
    }

    async performLogin(email, password) {
        const submitBtn = document.querySelector('#login-form button[type="submit"]') || 
                         document.querySelector('#login-form .btn-primary');
        
        if (submitBtn) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${this.apiUrl}/api/v1/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Store auth data
                    localStorage.setItem('fa_token', data.data.tokens.accessToken);
                    localStorage.setItem('fa_user', JSON.stringify(data.data.user));

                    // Update app state if available
                    if (window.footballApp) {
                        window.footballApp.currentUser = data.data.user;
                        window.footballApp.isAuthenticated = true;
                    }

                    // Hide login modal and show app
                    document.getElementById('login-modal').style.display = 'none';
                    document.getElementById('main-app').style.display = 'flex';

                    // Initialize app if method exists
                    if (window.footballApp && window.footballApp.initializeApp) {
                        await window.footballApp.initializeApp();
                    }

                    console.log('✅ Login successful');
                    alert('Login successful! Loading NFL preseason games...');
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('❌ Login failed:', error);
                alert('Login failed: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    async performRegister(name, email, password) {
        const submitBtn = document.querySelector('#register-form button[type="submit"]') || 
                         document.querySelector('#register-form .btn-primary');
        
        if (submitBtn) {
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
                    // Store auth data
                    localStorage.setItem('fa_token', data.data.tokens.accessToken);
                    localStorage.setItem('fa_user', JSON.stringify(data.data.user));

                    // Update app state if available
                    if (window.footballApp) {
                        window.footballApp.currentUser = data.data.user;
                        window.footballApp.isAuthenticated = true;
                    }

                    // Hide register modal and show app
                    document.getElementById('register-modal').style.display = 'none';
                    document.getElementById('main-app').style.display = 'flex';

                    // Initialize app if method exists
                    if (window.footballApp && window.footballApp.initializeApp) {
                        await window.footballApp.initializeApp();
                    }

                    console.log('✅ Registration successful');
                    alert('Registration successful! Loading NFL preseason games...');
                } else {
                    throw new Error(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('❌ Registration failed:', error);
                alert('Registration failed: ' + error.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }
}

// Initialize the login fix
window.loginFix = new LoginFix();