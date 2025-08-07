import { OAuth2Client } from 'google-auth-library';

export interface GoogleOAuthConfig {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface GoogleUserProfile {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
}

export class GoogleOAuthService {
    private client: OAuth2Client;
    private config: GoogleOAuthConfig;

    constructor(config: GoogleOAuthConfig) {
        this.config = config;
        this.client = new OAuth2Client(
            config.clientId,
            config.clientSecret,
            config.redirectUri
        );
    }

    /**
     * Generate Google OAuth URL for authentication
     */
    getAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ];

        return this.client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent'
        });
    }

    /**
     * Exchange authorization code for tokens and get user profile
     */
    async getProfile(code: string): Promise<GoogleUserProfile> {
        try {
            // Exchange code for tokens
            const { tokens } = await this.client.getToken(code);
            this.client.setCredentials(tokens);

            // Get user profile
            const response = await fetch(
                `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch user profile from Google');
            }

            const profile: GoogleUserProfile = await response.json();

            if (!profile.verified_email) {
                throw new Error('Google account email is not verified');
            }

            return profile;
        } catch (error) {
            console.error('Google OAuth error:', error);
            throw new Error('Failed to authenticate with Google');
        }
    }

    /**
     * Verify Google ID token (for client-side authentication)
     */
    async verifyIdToken(idToken: string): Promise<GoogleUserProfile> {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: this.config.clientId
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid Google ID token');
            }

            return {
                id: payload.sub,
                email: payload.email!,
                name: payload.name!,
                picture: payload.picture,
                verified_email: payload.email_verified || false
            };
        } catch (error) {
            console.error('Google ID token verification error:', error);
            throw new Error('Invalid Google ID token');
        }
    }

    /**
     * Revoke Google tokens
     */
    async revokeTokens(accessToken: string): Promise<void> {
        try {
            await this.client.revokeToken(accessToken);
        } catch (error) {
            console.error('Failed to revoke Google tokens:', error);
            // Don't throw error as this is not critical
        }
    }
}