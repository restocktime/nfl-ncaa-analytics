/**
 * Global Error Handler
 * Prevents site crashes from JavaScript errors
 * Provides graceful degradation and user notifications
 */

(function() {
    'use strict';

    // Global error handling
    window.addEventListener('error', function(event) {
        console.error('Global error caught:', event.error);

        // Prevent default browser error handling
        event.preventDefault();

        // Show user-friendly notification
        showErrorNotification('A component failed to load. The site will continue working with available features.');

        return true;
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);

        event.preventDefault();

        // Check if it's an API error
        if (event.reason && event.reason.message && event.reason.message.includes('API')) {
            showErrorNotification('Live data temporarily unavailable. Using cached data.');
        } else {
            showErrorNotification('A background operation failed. Core functionality remains available.');
        }

        return true;
    });

    // Create notification system
    function createNotificationContainer() {
        if (document.getElementById('global-error-notifications')) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'global-error-notifications';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            max-width: 400px;
            pointer-events: none;
        `;

        // Wait for DOM to be ready
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                document.body.appendChild(container);
            });
        }
    }

    // Show error notification
    function showErrorNotification(message, duration = 5000) {
        createNotificationContainer();

        const container = document.getElementById('global-error-notifications');
        if (!container) {
            console.warn('Could not create notification container');
            return;
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
            background: rgba(255, 59, 48, 0.95);
            color: white;
            padding: 16px 20px;
            margin-bottom: 12px;
            border-radius: 12px;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
            pointer-events: auto;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            font-size: 14px;
            line-height: 1.4;
            display: flex;
            align-items: center;
            gap: 12px;
        `;

        notification.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="white"/>
            </svg>
            <span>${message}</span>
        `;

        container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Animate out and remove
        setTimeout(() => {
            notification.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // Safe script loader
    window.safeLoadScript = function(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;

        script.onload = function() {
            if (callback) callback(null);
        };

        script.onerror = function(error) {
            console.error('Failed to load script:', src);
            showErrorNotification(`Failed to load component: ${src.split('/').pop()}`);
            if (callback) callback(error);
        };

        document.head.appendChild(script);
    };

    // Safe API call wrapper
    window.safeAPICall = async function(url, options = {}) {
        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call failed:', url, error);
            throw error;
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createNotificationContainer);
    } else {
        createNotificationContainer();
    }

    console.log('✅ Global error handler initialized');
})();
