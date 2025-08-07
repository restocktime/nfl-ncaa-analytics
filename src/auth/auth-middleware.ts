import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth-service';

export interface AuthenticatedRequest extends Request {
    user?: any;
}

export class AuthMiddleware {
    private authService: AuthService;

    constructor() {
        this.authService = new AuthService();
    }

    /**
     * Middleware to authenticate requests
     */
    authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    success: false,
                    error: 'Access token required',
                    code: 'MISSING_TOKEN'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            const user = await this.authService.verifyToken(token);

            req.user = user;
            next();
        } catch (error) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }
    };

    /**
     * Middleware to check if user has required role
     */
    requireRole = (roles: string | string[]) => {
        const requiredRoles = Array.isArray(roles) ? roles : [roles];

        return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication required',
                    code: 'NOT_AUTHENTICATED'
                });
            }

            if (!requiredRoles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        };
    };

    /**
     * Optional authentication middleware (doesn't fail if no token)
     */
    optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const user = await this.authService.verifyToken(token);
                req.user = user;
            }
        } catch (error) {
            // Ignore authentication errors for optional auth
        }

        next();
    };

    /**
     * Rate limiting middleware for auth endpoints
     */
    rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
        const attempts = new Map<string, { count: number; resetTime: number }>();

        return (req: Request, res: Response, next: NextFunction) => {
            const clientId = req.ip || 'unknown';
            const now = Date.now();
            
            const clientAttempts = attempts.get(clientId);
            
            if (clientAttempts) {
                if (now > clientAttempts.resetTime) {
                    // Reset window
                    attempts.set(clientId, { count: 1, resetTime: now + windowMs });
                } else if (clientAttempts.count >= maxAttempts) {
                    return res.status(429).json({
                        success: false,
                        error: 'Too many authentication attempts',
                        code: 'RATE_LIMIT_EXCEEDED',
                        retryAfter: Math.ceil((clientAttempts.resetTime - now) / 1000)
                    });
                } else {
                    clientAttempts.count++;
                }
            } else {
                attempts.set(clientId, { count: 1, resetTime: now + windowMs });
            }

            next();
        };
    };

    /**
     * CORS middleware for auth endpoints
     */
    corsAuth = (req: Request, res: Response, next: NextFunction) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://your-domain.com'
        ];

        const origin = req.headers.origin;
        
        if (origin && allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }

        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        next();
    };
}