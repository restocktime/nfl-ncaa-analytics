import { AuthMiddleware, AuthUser, UserRole, AuthRequest } from '../../api/middleware/auth-middleware';

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  const testSecret = 'test-jwt-secret';

  beforeEach(() => {
    authMiddleware = new AuthMiddleware(testSecret);
  });

  describe('Token Generation', () => {
    it('should generate valid JWT token', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ANALYST
      };

      const token = authMiddleware.generateToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', () => {
      const user1 = {
        id: 'user-123',
        email: 'user1@example.com',
        role: UserRole.USER
      };

      const user2 = {
        id: 'user-456',
        email: 'user2@example.com',
        role: UserRole.ANALYST
      };

      const token1 = authMiddleware.generateToken(user1);
      const token2 = authMiddleware.generateToken(user2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('Token Authentication', () => {
    it('should authenticate valid token', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.ANALYST
      };

      const token = authMiddleware.generateToken(user);
      const request: AuthRequest = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      const authenticatedUser = await authMiddleware.authenticate(request);
      
      expect(authenticatedUser).toBeDefined();
      expect(authenticatedUser?.id).toBe(user.id);
      expect(authenticatedUser?.email).toBe(user.email);
      expect(authenticatedUser?.role).toBe(user.role);
    });

    it('should return null for missing authorization header', async () => {
      const request: AuthRequest = {
        headers: {}
      };

      const result = await authMiddleware.authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should return null for invalid authorization format', async () => {
      const request: AuthRequest = {
        headers: {
          authorization: 'InvalidFormat token'
        }
      };

      const result = await authMiddleware.authenticate(request);
      
      expect(result).toBeNull();
    });

    it('should return null for malformed token', async () => {
      const request: AuthRequest = {
        headers: {
          authorization: 'Bearer invalid.token.format'
        }
      };

      const result = await authMiddleware.authenticate(request);
      
      expect(result).toBeNull();
    });
  });

  describe('Authorization', () => {
    it('should allow admin access to all permissions', () => {
      const adminUser: AuthUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        permissions: ['read:basic']
      };

      const hasPermission = authMiddleware.authorize(adminUser, 'write:advanced');
      
      expect(hasPermission).toBe(true);
    });

    it('should allow user with specific permission', () => {
      const analystUser: AuthUser = {
        id: 'analyst-123',
        email: 'analyst@example.com',
        role: UserRole.ANALYST,
        permissions: ['read:probabilities', 'write:predictions']
      };

      const hasPermission = authMiddleware.authorize(analystUser, 'read:probabilities');
      
      expect(hasPermission).toBe(true);
    });

    it('should deny user without specific permission', () => {
      const basicUser: AuthUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.USER,
        permissions: ['read:basic']
      };

      const hasPermission = authMiddleware.authorize(basicUser, 'write:predictions');
      
      expect(hasPermission).toBe(false);
    });

    it('should handle empty permissions array', () => {
      const limitedUser: AuthUser = {
        id: 'limited-123',
        email: 'limited@example.com',
        role: UserRole.USER,
        permissions: []
      };

      const hasPermission = authMiddleware.authorize(limitedUser, 'read:basic');
      
      expect(hasPermission).toBe(false);
    });
  });

  describe('User Roles', () => {
    it('should handle all defined user roles', () => {
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.ANALYST).toBe('analyst');
      expect(UserRole.USER).toBe('user');
    });

    it('should create users with different roles', () => {
      const adminUser: AuthUser = {
        id: 'admin-1',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        permissions: []
      };

      const analystUser: AuthUser = {
        id: 'analyst-1',
        email: 'analyst@test.com',
        role: UserRole.ANALYST,
        permissions: ['read:probabilities']
      };

      const regularUser: AuthUser = {
        id: 'user-1',
        email: 'user@test.com',
        role: UserRole.USER,
        permissions: ['read:basic']
      };

      expect(adminUser.role).toBe(UserRole.ADMIN);
      expect(analystUser.role).toBe(UserRole.ANALYST);
      expect(regularUser.role).toBe(UserRole.USER);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined JWT secret gracefully', () => {
      const middleware = new AuthMiddleware();
      
      const user = {
        id: 'test-user',
        email: 'test@example.com',
        role: UserRole.USER
      };

      const token = middleware.generateToken(user);
      expect(token).toBeDefined();
    });

    it('should handle special characters in user data', () => {
      const user = {
        id: 'user-with-special-chars-!@#$%',
        email: 'test+special@example.com',
        role: UserRole.ANALYST
      };

      const token = authMiddleware.generateToken(user);
      expect(token).toBeDefined();
      
      const request: AuthRequest = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };

      // This should not throw an error
      expect(async () => {
        await authMiddleware.authenticate(request);
      }).not.toThrow();
    });
  });
});