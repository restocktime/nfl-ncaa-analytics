/**
 * Site-wide Password Protection System
 * Protects all pages except weekly-nfl-picks.html (has own protection)
 */

// Password protection configuration
const SITE_PASSWORD = 'IBYTESTING';
const STORAGE_KEY = 'sundayEdgeProAccess';

// Check if current page should be protected
function shouldProtectPage() {
    const currentPage = window.location.pathname;
    // Only weekly-nfl-picks.html should be publicly accessible (with its own password)
    // All other pages need the main site password
    return !currentPage.includes('weekly-nfl-picks.html');
}

// Check if user is already authenticated
function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY) === 'granted';
}

// Create password overlay
function createPasswordOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'sitePasswordOverlay';
    overlay.innerHTML = `
        <style>
            #sitePasswordOverlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }

            .site-password-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 3rem;
                text-align: center;
                max-width: 450px;
                width: 90%;
                color: white;
            }

            .site-password-title {
                font-size: 2.2rem;
                margin-bottom: 0.5rem;
                background: linear-gradient(45deg, #ffffff, #a8d8ea);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
            }

            .site-password-subtitle {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.9;
                line-height: 1.5;
            }

            .site-private-message {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 10px;
                padding: 1rem;
                margin-bottom: 2rem;
                color: #fecaca;
            }

            .site-private-message .icon {
                font-size: 1.2rem;
                margin-right: 0.5rem;
            }

            .site-password-input {
                width: 100%;
                padding: 1.2rem;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                font-size: 1.1rem;
                margin: 1rem 0;
                text-align: center;
                backdrop-filter: blur(10px);
                font-weight: 500;
            }

            .site-password-input::placeholder {
                color: rgba(255, 255, 255, 0.7);
            }

            .site-password-input:focus {
                outline: none;
                border-color: #22c55e;
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
            }

            .site-password-submit {
                background: linear-gradient(45deg, #22c55e, #16a34a);
                color: #ffffff;
                border: none;
                padding: 1.2rem 2.5rem;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                font-size: 1.1rem;
            }

            .site-password-submit:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(34, 197, 94, 0.3);
            }

            .site-password-error {
                color: #fca5a5;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.2);
                border-radius: 8px;
                padding: 0.8rem;
                margin-top: 1rem;
                font-size: 0.9rem;
                display: none;
            }

            .site-logo {
                font-size: 1.2rem;
                margin-bottom: 1rem;
                opacity: 0.8;
            }
        </style>
        <div class="site-password-card">
            <div class="site-logo">
                <i class="fas fa-football-ball"></i> SundayEdgePro
            </div>
            <div class="site-password-title">
                <i class="fas fa-shield-alt"></i><br>
                Private Access
            </div>
            <div class="site-password-subtitle">
                Professional NFL Analytics Platform
            </div>
            <div class="site-private-message">
                <i class="fas fa-exclamation-triangle icon"></i>
                <strong>Not Open to Public</strong><br>
                This site contains proprietary analytics and is restricted to authorized users only.
            </div>
            <input type="password" id="sitePasswordInput" class="site-password-input" placeholder="Enter access code">
            <button onclick="checkSitePassword()" class="site-password-submit">
                <i class="fas fa-unlock"></i> Access Platform
            </button>
            <div id="sitePasswordError" class="site-password-error">
                <i class="fas fa-times-circle"></i> Invalid access code. Please contact administrator.
            </div>
        </div>
    `;
    
    return overlay;
}

// Check password function
function checkSitePassword() {
    const password = document.getElementById('sitePasswordInput').value;
    const errorDiv = document.getElementById('sitePasswordError');
    
    if (password === SITE_PASSWORD) {
        // Grant access
        localStorage.setItem(STORAGE_KEY, 'granted');
        document.getElementById('sitePasswordOverlay').remove();
        
        // Show main content
        document.body.style.overflow = 'auto';
        const mainContent = document.querySelector('.main-content, main, body > *:not(#sitePasswordOverlay)');
        if (mainContent) {
            mainContent.style.display = 'block';
        }
        
        console.log('✅ Site access granted');
    } else {
        // Show error
        errorDiv.style.display = 'block';
        document.getElementById('sitePasswordInput').value = '';
        document.getElementById('sitePasswordInput').focus();
    }
}

// Initialize protection
function initializeSiteProtection() {
    if (!shouldProtectPage()) {
        console.log('⚠️ Page has own protection, skipping site protection');
        return;
    }
    
    if (isAuthenticated()) {
        console.log('✅ User already authenticated for site');
        return;
    }
    
    console.log('🔒 Applying site password protection');
    
    // Hide main content
    document.body.style.overflow = 'hidden';
    const mainContent = document.querySelector('.main-content, main');
    if (mainContent) {
        mainContent.style.display = 'none';
    }
    
    // Add password overlay
    const overlay = createPasswordOverlay();
    document.body.appendChild(overlay);
    
    // Focus password input
    setTimeout(() => {
        const input = document.getElementById('sitePasswordInput');
        if (input) {
            input.focus();
            
            // Allow Enter key to submit
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    checkSitePassword();
                }
            });
        }
    }, 100);
}

// Global function for password check
window.checkSitePassword = checkSitePassword;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSiteProtection);
} else {
    initializeSiteProtection();
}

console.log('🛡️ Site password protection system loaded');