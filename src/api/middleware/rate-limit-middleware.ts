/**
 * Rate limiting middleware for API endpoints
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request should be rate limited
   */
  checkRateLimit(clientId: string): { allowed: boolean; info: RateLimitInfo } {
    const now = Date.now();
    const key = clientId;
    
    let entry = this.store.get(key);
    
    // Create new entry if doesn't exist or window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.store.set(key, entry);
    }

    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - entry.count - 1),
      resetTime: entry.resetTime
    };

    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return { allowed: false, info };
    }

    // Increment counter
    entry.count++;
    info.remaining = Math.max(0, this.config.maxRequests - entry.count);

    return { allowed: true, info };
  }

  /**
   * Get client identifier from request
   */
  getClientId(req: any): string {
    // Try to get user ID from authenticated request
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    // Fall back to IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0] : req.connection?.remoteAddress;
    return `ip:${ip || 'unknown'}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for specific client
   */
  reset(clientId: string): void {
    this.store.delete(clientId);
  }

  /**
   * Get current stats
   */
  getStats(): { totalClients: number; activeWindows: number } {
    const now = Date.now();
    let activeWindows = 0;
    
    for (const entry of this.store.values()) {
      if (now < entry.resetTime) {
        activeWindows++;
      }
    }

    return {
      totalClients: this.store.size,
      activeWindows
    };
  }
}