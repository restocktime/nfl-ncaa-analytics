import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../core/database-service';

export interface User {
    id: string;
    email: string;
    name: string;
    password?: string;
    avatar?: string;
    provider: 'local' | 'google' | 'microsoft';
    providerId?: string;
    role: string;
    preferences: {
        theme: 'dark' | 'light';
        notifications: boolean;
        autoRefresh: boolean;
        language: string;
    };
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    isActive: boolean;
    emailVerified: boolean;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface GoogleProfile {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

export class AuthService {
    private db: DatabaseService;
    private jwtSecret: string;
    private jwtRefreshSecret: string;
    private tokenExpiry: string;
    private refreshTokenExpiry: string;

    constructor() {
        this.db = new DatabaseService();
        this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
        this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key';
        this.tokenExpiry = process.env.JWT_EXPIRY || '24h';
        this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    }

    /**
     * Register a new user with email and password
     */
    async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
        const { email, password, name } = data;

        // Check if user already exists
        const existingUser = await this.findUserByEmail(email);
        if (existingUser) {
            throw new Error('User already exists with this email');
        }

        // Validate password strength
        this.validatePassword(password);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user: User = {
            id: this.generateId(),
            email: email.toLowerCase(),
            name,
            password: hashedPassword,
            provider: 'local',
            role: 'user',
            preferences: {
                theme: 'dark',
                notifications: true,
                autoRefresh: true,
                language: 'en'
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            emailVerified: false
        };

        // Save to database
        await this.saveUser(user);

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        return {
            user: userResponse as User,
            tokens
        };
    }

    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
        const { email, password } = credentials;

        // Find user
        const user = await this.findUserByEmail(email);
        if (!user || user.provider !== 'local') {
            throw new Error('Invalid credentials');
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password!);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.updateUser(user);

        // Generate tokens
        const tokens = this.generateTokens(user);

        // Remove password from response
        const { password: _, ...userResponse } = user;

        return {
            user: userResponse as User,
            tokens
        };
    }

    /**
     * Google OAuth login/register
     */
    async googleAuth(profile: GoogleProfile): Promise<{ user: User; tokens: AuthTokens; isNewUser: boolean }> {
        let user = await this.findUserByProviderId('google', profile.id);
        let isNewUser = false;

        if (!user) {
            // Check if user exists with same email
            const existingUser = await this.findUserByEmail(profile.email);
            
            if (existingUser) {
                // Link Google account to existing user
                existingUser.providerId = profile.id;
                existingUser.avatar = profile.picture;
                existingUser.updatedAt = new Date();
                await this.updateUser(existingUser);
                user = existingUser;
            } else {
                // Create new user
                user = {
                    id: this.generateId(),
                    email: profile.email.toLowerCase(),
                    name: profile.name,
                    avatar: profile.picture,
                    provider: 'google',
                    providerId: profile.id,
                    role: 'user',
                    preferences: {
                        theme: 'dark',
                        notifications: true,
                        autoRefresh: true,
                        language: 'en'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isActive: true,
                    emailVerified: true // Google emails are pre-verified
                };

                await this.saveUser(user);
                isNewUser = true;
            }
        }

        // Update last login
        user.lastLoginAt = new Date();
        await this.updateUser(user);

        // Generate tokens
        const tokens = this.generateTokens(user);

        return {
            user,
            tokens,
            isNewUser
        };
    }

    /**
     * Refresh access token
     */
    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        try {
            const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
            const user = await this.findUserById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('Invalid refresh token');
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Verify access token
     */
    async verifyToken(token: string): Promise<User> {
        try {
            const decoded = jwt.verify(token, this.jwtSecret) as any;
            const user = await this.findUserById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('Invalid token');
            }

            return user;
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Prevent updating sensitive fields
        const allowedUpdates = ['name', 'avatar', 'preferences'];
        const filteredUpdates = Object.keys(updates)
            .filter(key => allowedUpdates.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {} as any);

        const updatedUser = {
            ...user,
            ...filteredUpdates,
            updatedAt: new Date()
        };

        await this.updateUser(updatedUser);
        return updatedUser;
    }

    /**
     * Change password
     */
    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await this.findUserById(userId);
        if (!user || user.provider !== 'local') {
            throw new Error('User not found or not a local account');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password!);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Validate new password
        this.validatePassword(newPassword);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user
        user.password = hashedPassword;
        user.updatedAt = new Date();
        await this.updateUser(user);
    }

    /**
     * Deactivate user account
     */
    async deactivateAccount(userId: string): Promise<void> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.isActive = false;
        user.updatedAt = new Date();
        await this.updateUser(user);
    }

    // Private helper methods
    private generateTokens(user: User): AuthTokens {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiry
        });

        const refreshToken = jwt.sign(
            { userId: user.id },
            this.jwtRefreshSecret,
            { expiresIn: this.refreshTokenExpiry }
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiry(this.tokenExpiry)
        };
    }

    private parseExpiry(expiry: string): number {
        // Convert expiry string to seconds
        const unit = expiry.slice(-1);
        const value = parseInt(expiry.slice(0, -1));

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 24 * 60 * 60; // Default to 24 hours
        }
    }

    private validatePassword(password: string): void {
        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!/(?=.*[a-z])/.test(password)) {
            throw new Error('Password must contain at least one lowercase letter');
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            throw new Error('Password must contain at least one uppercase letter');
        }

        if (!/(?=.*\d)/.test(password)) {
            throw new Error('Password must contain at least one number');
        }
    }

    private generateId(): string {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Database operations (implement based on your database choice)
    private async findUserByEmail(email: string): Promise<User | null> {
        // Implementation depends on your database
        // For demo purposes, using in-memory storage
        return this.getUserFromStorage('email', email);
    }

    private async findUserById(id: string): Promise<User | null> {
        return this.getUserFromStorage('id', id);
    }

    private async findUserByProviderId(provider: string, providerId: string): Promise<User | null> {
        return this.getUserFromStorage('providerId', providerId);
    }

    private async saveUser(user: User): Promise<void> {
        // Implementation depends on your database
        this.saveUserToStorage(user);
    }

    private async updateUser(user: User): Promise<void> {
        this.saveUserToStorage(user);
    }

    // Temporary in-memory storage for demo
    private static users: Map<string, User> = new Map();

    private getUserFromStorage(field: keyof User, value: any): User | null {
        for (const user of AuthService.users.values()) {
            if (user[field] === value) {
                return user;
            }
        }
        return null;
    }

    private saveUserToStorage(user: User): void {
        AuthService.users.set(user.id, user);
    }
}