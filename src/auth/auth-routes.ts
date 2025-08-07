import { Router, Request, Response } from 'express';
import { AuthService } from './auth-service';
import { GoogleOAuthService } from './google-oauth';
import { AuthMiddleware, AuthenticatedRequest } from './auth-middleware';

export class AuthRoutes {
    private router: Router;
    private authService: AuthService;
    private googleOAuth: GoogleOAuthService;
    private authMiddleware: AuthMiddleware;

    constructor() {
        this.router = Router();
        this.authService = new AuthService();
        this.authMiddleware = new AuthMiddleware();
        
        // Initialize Google OAuth if credentials are provided
        if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
            this.googleOAuth = new GoogleOAuthService({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
            });
        }

        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Apply CORS and rate limiting to all auth routes
        this.router.use(this.authMiddleware.corsAuth);
        this.router.use(this.authMiddleware.rateLimitAuth());

        // Registration
        this.router.post('/register', this.register.bind(this));

        // Login
        this.router.post('/login', this.login.bind(this));

        // Google OAuth routes
        if (this.googleOAuth) {
            this.router.get('/google', this.googleAuthUrl.bind(this));
            this.router.get('/google/callback', this.googleCallback.bind(this));
            this.router.post('/google/verify', this.googleVerifyToken.bind(this));
        }

        // Token refresh
        this.router.post('/refresh', this.refreshToken.bind(this));

        // Logout
        this.router.post('/logout', this.authMiddleware.authenticate, this.logout.bind(this));

        // Profile management (protected routes)
        this.router.get('/me', this.authMiddleware.authenticate, this.getProfile.bind(this));
        this.router.put('/me', this.authMiddleware.authenticate, this.updateProfile.bind(this));
        this.router.put('/change-password', this.authMiddleware.authenticate, this.changePassword.bind(this));
        this.router.delete('/deactivate', this.authMiddleware.authenticate, this.deactivateAccount.bind(this));

        // Health check
        this.router.get('/health', this.healthCheck.bind(this));
    }

    /**
     * User registration
     */
    private async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, name } = req.body;

            if (!email || !password || !name) {
                res.status(400).json({
                    success: false,
                    error: 'Email, password, and name are required',
                    code: 'MISSING_FIELDS'
                });
                return;
            }

            const result = await this.authService.register({ email, password, name });

            res.status(201).json({
                success: true,
                data: {
                    user: result.user,
                    tokens: result.tokens
                },
                message: 'Account created successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: 'REGISTRATION_FAILED'
            });
        }
    }

    /**
     * User login
     */
    private async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Email and password are required',
                    code: 'MISSING_CREDENTIALS'
                });
                return;
            }

            const result = await this.authService.login({ email, password });

            res.json({
                success: true,
                data: {
                    user: result.user,
                    tokens: result.tokens
                },
                message: 'Login successful'
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message,
                code: 'LOGIN_FAILED'
            });
        }
    }

    /**
     * Get Google OAuth URL
     */
    private async googleAuthUrl(req: Request, res: Response): Promise<void> {
        try {
            if (!this.googleOAuth) {
                res.status(501).json({
                    success: false,
                    error: 'Google OAuth not configured',
                    code: 'OAUTH_NOT_CONFIGURED'
                });
                return;
            }

            const authUrl = this.googleOAuth.getAuthUrl();

            res.json({
                success: true,
                data: { authUrl },
                message: 'Google OAuth URL generated'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                code: 'OAUTH_URL_FAILED'
            });
        }
    }

    /**
     * Handle Google OAuth callback
     */
    private async googleCallback(req: Request, res: Response): Promise<void> {
        try {
            if (!this.googleOAuth) {
                res.status(501).json({
                    success: false,
                    error: 'Google OAuth not configured',
                    code: 'OAUTH_NOT_CONFIGURED'
                });
                return;
            }

            const { code } = req.query;

            if (!code || typeof code !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Authorization code is required',
                    code: 'MISSING_AUTH_CODE'
                });
                return;
            }

            const profile = await this.googleOAuth.getProfile(code);
            const result = await this.authService.googleAuth({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                picture: profile.picture
            });

            // Redirect to frontend with tokens (in production, use secure cookies)
            const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
            redirectUrl.searchParams.set('token', result.tokens.accessToken);
            redirectUrl.searchParams.set('refresh_token', result.tokens.refreshToken);
            
            if (result.isNewUser) {
                redirectUrl.searchParams.set('new_user', 'true');
            }

            res.redirect(redirectUrl.toString());
        } catch (error: any) {
            const errorUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
            errorUrl.searchParams.set('error', error.message);
            res.redirect(errorUrl.toString());
        }
    }

    /**
     * Verify Google ID token (for client-side authentication)
     */
    private async googleVerifyToken(req: Request, res: Response): Promise<void> {
        try {
            if (!this.googleOAuth) {
                res.status(501).json({
                    success: false,
                    error: 'Google OAuth not configured',
                    code: 'OAUTH_NOT_CONFIGURED'
                });
                return;
            }

            const { idToken } = req.body;

            if (!idToken) {
                res.status(400).json({
                    success: false,
                    error: 'Google ID token is required',
                    code: 'MISSING_ID_TOKEN'
                });
                return;
            }

            const profile = await this.googleOAuth.verifyIdToken(idToken);
            const result = await this.authService.googleAuth({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                picture: profile.picture
            });

            res.json({
                success: true,
                data: {
                    user: result.user,
                    tokens: result.tokens,
                    isNewUser: result.isNewUser
                },
                message: 'Google authentication successful'
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message,
                code: 'GOOGLE_AUTH_FAILED'
            });
        }
    }

    /**
     * Refresh access token
     */
    private async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Refresh token is required',
                    code: 'MISSING_REFRESH_TOKEN'
                });
                return;
            }

            const tokens = await this.authService.refreshToken(refreshToken);

            res.json({
                success: true,
                data: { tokens },
                message: 'Token refreshed successfully'
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: error.message,
                code: 'TOKEN_REFRESH_FAILED'
            });
        }
    }

    /**
     * Logout user
     */
    private async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            // In a real implementation, you might want to blacklist the token
            // or store logout events for security auditing

            res.json({
                success: true,
                message: 'Logout successful'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                code: 'LOGOUT_FAILED'
            });
        }
    }

    /**
     * Get user profile
     */
    private async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            res.json({
                success: true,
                data: { user: req.user },
                message: 'Profile retrieved successfully'
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
                code: 'PROFILE_FETCH_FAILED'
            });
        }
    }

    /**
     * Update user profile
     */
    private async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const updates = req.body;
            const updatedUser = await this.authService.updateProfile(req.user.id, updates);

            res.json({
                success: true,
                data: { user: updatedUser },
                message: 'Profile updated successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: 'PROFILE_UPDATE_FAILED'
            });
        }
    }

    /**
     * Change password
     */
    private async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    error: 'Current password and new password are required',
                    code: 'MISSING_PASSWORDS'
                });
                return;
            }

            await this.authService.changePassword(req.user.id, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password changed successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: 'PASSWORD_CHANGE_FAILED'
            });
        }
    }

    /**
     * Deactivate user account
     */
    private async deactivateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
        try {
            await this.authService.deactivateAccount(req.user.id);

            res.json({
                success: true,
                message: 'Account deactivated successfully'
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
                code: 'ACCOUNT_DEACTIVATION_FAILED'
            });
        }
    }

    /**
     * Health check for auth service
     */
    private async healthCheck(req: Request, res: Response): Promise<void> {
        res.json({
            success: true,
            data: {
                service: 'Authentication Service',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                features: {
                    registration: true,
                    login: true,
                    googleOAuth: !!this.googleOAuth,
                    tokenRefresh: true,
                    profileManagement: true
                }
            }
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}