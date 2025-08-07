/**
 * Authentication and authorization middleware for the API Gateway
 */
export interface AuthRequest {
  headers: { [key: string]: string };
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export enum UserRole {
  ADMIN = 'admin',
  ANALYST = 'analyst',
  USER = 'user'
}

export class AuthMiddleware {
  private jwtSecret: string;

  constructor(jwtSecret: string = process.env.JWT_SECRET || 'default-secret') {
    this.jwtSecret = jwtSecret;
  }

  /**
   * Authenticate JWT token from request headers
   */
  async authenticate(req: AuthRequest): Promise<AuthUser | null> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = this.verifyJWT(token);
      return decoded as AuthUser;
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Check if user has required permission
   */
  authorize(user: AuthUser, requiredPermission: string): boolean {
    if (user.role === UserRole.ADMIN) {
      return true; // Admin has all permissions
    }

    return user.permissions.includes(requiredPermission);
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: Omit<AuthUser, 'permissions'>): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return this.signJWT(payload);
  }

  private verifyJWT(token: string): any {
    // Simple JWT verification - in production use proper JWT library
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private signJWT(payload: any): string {
    // Simple JWT signing - in production use proper JWT library
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    
    return `${encodedHeader}.${encodedPayload}.signature`;
  }
}