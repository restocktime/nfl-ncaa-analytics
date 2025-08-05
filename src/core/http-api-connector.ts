import { injectable } from 'inversify';
import { BaseAPIConnector } from './api-connector';
import { APIRequest, APIResponse, APIError } from '../types/api.types';

/**
 * HTTP-based API connector implementation using Node.js built-in modules
 */
@injectable()
export class HttpAPIConnector extends BaseAPIConnector {
  /**
   * Perform the actual HTTP request using Node.js built-in modules
   */
  protected async performRequest<T>(request: APIRequest): Promise<APIResponse<T>> {
    const url = this.buildUrl(request.url);
    const headers = this.mergeHeaders(request.headers);
    const timeout = request.timeout || 30000;

    this.logger.debug(`Making ${request.method} request to ${url}`, {
      headers: this.sanitizeHeaders(headers)
    });

    try {
      // Use dynamic import for Node.js built-in modules
      const { default: fetch } = await import('node-fetch');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: request.method,
        headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Update rate limit info from response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key.toLowerCase()] = value;
      });
      this.updateRateLimitInfo(responseHeaders);

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        data = await response.json() as T;
      } else {
        data = await response.text() as unknown as T;
      }

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data,
          this.isRetryableStatus(response.status)
        );
      }

      const apiResponse: APIResponse<T> = {
        data,
        status: response.status,
        headers: responseHeaders,
        timestamp: new Date()
      };

      this.logger.debug(`${this.name} API request successful`, {
        status: response.status,
        url
      });

      return apiResponse;
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      // Handle network errors, timeouts, etc.
      const err = error as Error;
      const isTimeout = err.name === 'AbortError';
      const message = isTimeout ? 'Request timeout' : `Network error: ${err.message}`;
      
      throw new APIError(
        message,
        undefined,
        undefined,
        true // Network errors are generally retryable
      );
    }
  }

  /**
   * Perform health check by making a simple request
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      // Most APIs have a health or status endpoint
      const healthRequest: APIRequest = {
        url: '/health',
        method: 'GET'
      };

      await this.performRequest(healthRequest);
    } catch (error) {
      // If health endpoint doesn't exist, try root endpoint
      try {
        const rootRequest: APIRequest = {
          url: '/',
          method: 'GET'
        };
        await this.performRequest(rootRequest);
      } catch (rootError) {
        throw new APIError(
          `Health check failed: ${(error as Error).message}`,
          undefined,
          undefined,
          false
        );
      }
    }
  }

  /**
   * Determine if HTTP status code is retryable
   */
  private isRetryableStatus(status: number): boolean {
    // Retry on server errors and some client errors
    return status >= 500 || status === 408 || status === 429;
  }

  /**
   * Sanitize headers for logging (remove sensitive information)
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveKeys = ['authorization', 'x-api-key', 'cookie', 'x-auth-token'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}