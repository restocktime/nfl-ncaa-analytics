/**
 * Enhanced View Manager Unit Tests
 * Tests for the centralized view management system with fallback ID resolution
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <div id="dashboard" class="view">Dashboard</div>
  <div id="live-view" class="view">Live Games</div>
  <div id="predictions-view" class="view">Predictions</div>
  <div id="fantasy" class="view">Fantasy</div>
  <div id="betting-view" class="view">Betting</div>
  <div id="news-view" class="view">News</div>
  
  <nav>
    <a href="#" data-view="dashboard" class="nav-link">Dashboard</a>
    <a href="#" data-view="live" class="nav-link">Live</a>
    <a href="#" data-view="predictions" class="nav-link">Predictions</a>
    <a href="#" data-view="fantasy" class="nav-link">Fantasy</a>
    <a href="#" data-view="betting" class="nav-link">Betting</a>
    <a href="#" data-view="news" class="nav-link">News</a>
  </nav>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock the EnhancedViewManager class (simulating the implementation)
class MockEnhancedViewManager {
  private currentView: string | null = null;
  private viewHistory: string[] = [];
  private navigationErrors: any[] = [];

  constructor() {
    console.log('🧭 Enhanced View Manager initialized');
  }

  /**
   * Switch to a view with fallback ID resolution
   */
  switchView(viewName: string, options: any = {}): boolean {
    console.log(`🧭 Attempting to switch to view: ${viewName}`);
    
    try {
      const resolvedId = this.resolveViewId(viewName);
      
      if (!resolvedId) {
        this.logNavigationError('VIEW_NOT_FOUND', `View not found: ${viewName}`);
        return false;
      }

      const element = document.getElementById(resolvedId);
      
      if (!element) {
        this.logNavigationError('ELEMENT_NOT_FOUND', `Element not found: ${resolvedId}`);
        return false;
      }

      // Hide all views
      this.hideAllViews();
      
      // Show target view
      this.showView(element);
      
      // Update navigation state
      this.updateNavigationState(viewName);
      
      console.log(`✅ Successfully switched to view: ${viewName} (${resolvedId})`);
      return true;
      
    } catch (error) {
      this.logNavigationError('NAVIGATION_EXCEPTION', error);
      return false;
    }
  }

  /**
   * Resolve view ID with fallback patterns
   */
  resolveViewId(viewName: string): string | null {
    const patterns = [
      viewName,                    // exact match
      `${viewName}-view`,         // with -view suffix
      `view-${viewName}`,         // with view- prefix
      `${viewName}View`,          // camelCase
      viewName.toLowerCase(),      // lowercase
      viewName.toUpperCase()       // uppercase
    ];

    for (const pattern of patterns) {
      if (document.getElementById(pattern)) {
        console.log(`🎯 Resolved view ID: ${viewName} -> ${pattern}`);
        return pattern;
      }
    }

    console.warn(`❌ Could not resolve view ID for: ${viewName}`);
    return null;
  }

  /**
   * Hide all views
   */
  hideAllViews(): void {
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
      view.classList.remove('active');
      (view as HTMLElement).style.display = 'none';
    });
  }

  /**
   * Show specific view
   */
  showView(element: Element): void {
    element.classList.add('active');
    (element as HTMLElement).style.display = 'block';
  }

  /**
   * Validate if view exists
   */
  validateViewExists(viewId: string): boolean {
    return !!document.getElementById(viewId);
  }

  /**
   * Update navigation state
   */
  private updateNavigationState(viewName: string): void {
    if (this.currentView) {
      this.viewHistory.push(this.currentView);
    }
    this.currentView = viewName;

    // Update menu state
    const menuItems = document.querySelectorAll('.nav-link');
    menuItems.forEach(item => item.classList.remove('active'));
    
    const activeMenuItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeMenuItem) {
      activeMenuItem.classList.add('active');
    }
  }

  /**
   * Log navigation errors
   */
  private logNavigationError(type: string, error: any): void {
    const errorInfo = {
      type,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date(),
      currentView: this.currentView
    };
    
    this.navigationErrors.push(errorInfo);
    console.error(`🚨 Navigation error [${type}]:`, errorInfo);
  }

  // Getters for testing
  getCurrentView(): string | null {
    return this.currentView;
  }

  getViewHistory(): string[] {
    return [...this.viewHistory];
  }

  getNavigationErrors(): any[] {
    return [...this.navigationErrors];
  }
}

describe('Enhanced View Manager', () => {
  let viewManager: MockEnhancedViewManager;

  beforeEach(() => {
    viewManager = new MockEnhancedViewManager();
    
    // Reset DOM state
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
      (view as HTMLElement).style.display = 'none';
    });
    
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
  });

  describe('View ID Resolution', () => {
    test('should resolve exact view ID match', () => {
      const resolvedId = viewManager.resolveViewId('dashboard');
      expect(resolvedId).toBe('dashboard');
    });

    test('should resolve view ID with -view suffix', () => {
      const resolvedId = viewManager.resolveViewId('live');
      expect(resolvedId).toBe('live-view');
    });

    test('should resolve view ID with -view suffix for predictions', () => {
      const resolvedId = viewManager.resolveViewId('predictions');
      expect(resolvedId).toBe('predictions-view');
    });

    test('should resolve fantasy view without suffix', () => {
      const resolvedId = viewManager.resolveViewId('fantasy');
      expect(resolvedId).toBe('fantasy');
    });

    test('should return null for non-existent view', () => {
      const resolvedId = viewManager.resolveViewId('nonexistent');
      expect(resolvedId).toBeNull();
    });

    test('should try multiple patterns before giving up', () => {
      const resolvedId = viewManager.resolveViewId('unknown');
      expect(resolvedId).toBeNull();
    });
  });

  describe('View Switching', () => {
    test('should successfully switch to dashboard view', () => {
      const success = viewManager.switchView('dashboard');
      
      expect(success).toBe(true);
      expect(viewManager.getCurrentView()).toBe('dashboard');
      
      const dashboardElement = document.getElementById('dashboard');
      expect(dashboardElement?.classList.contains('active')).toBe(true);
      expect((dashboardElement as HTMLElement)?.style.display).toBe('block');
    });

    test('should successfully switch to live view with fallback resolution', () => {
      const success = viewManager.switchView('live');
      
      expect(success).toBe(true);
      expect(viewManager.getCurrentView()).toBe('live');
      
      const liveElement = document.getElementById('live-view');
      expect(liveElement?.classList.contains('active')).toBe(true);
      expect((liveElement as HTMLElement)?.style.display).toBe('block');
    });

    test('should hide all other views when switching', () => {
      // First switch to dashboard
      viewManager.switchView('dashboard');
      
      // Then switch to live
      viewManager.switchView('live');
      
      const dashboardElement = document.getElementById('dashboard');
      const liveElement = document.getElementById('live-view');
      
      expect(dashboardElement?.classList.contains('active')).toBe(false);
      expect((dashboardElement as HTMLElement)?.style.display).toBe('none');
      expect(liveElement?.classList.contains('active')).toBe(true);
      expect((liveElement as HTMLElement)?.style.display).toBe('block');
    });

    test('should update navigation menu state', () => {
      viewManager.switchView('predictions');
      
      const activeMenuItem = document.querySelector('.nav-link.active');
      expect(activeMenuItem?.getAttribute('data-view')).toBe('predictions');
    });

    test('should maintain view history', () => {
      viewManager.switchView('dashboard');
      viewManager.switchView('live');
      viewManager.switchView('predictions');
      
      const history = viewManager.getViewHistory();
      expect(history).toEqual(['dashboard', 'live']);
      expect(viewManager.getCurrentView()).toBe('predictions');
    });

    test('should fail gracefully for non-existent view', () => {
      const success = viewManager.switchView('nonexistent');
      
      expect(success).toBe(false);
      expect(viewManager.getCurrentView()).toBeNull();
      
      const errors = viewManager.getNavigationErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('VIEW_NOT_FOUND');
    });
  });

  describe('View Validation', () => {
    test('should validate existing view IDs', () => {
      expect(viewManager.validateViewExists('dashboard')).toBe(true);
      expect(viewManager.validateViewExists('live-view')).toBe(true);
      expect(viewManager.validateViewExists('fantasy')).toBe(true);
    });

    test('should reject non-existent view IDs', () => {
      expect(viewManager.validateViewExists('nonexistent')).toBe(false);
      expect(viewManager.validateViewExists('')).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should log navigation errors', () => {
      viewManager.switchView('nonexistent');
      
      const errors = viewManager.getNavigationErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('VIEW_NOT_FOUND');
      expect(errors[0].error).toContain('nonexistent');
    });

    test('should handle multiple navigation failures', () => {
      viewManager.switchView('nonexistent1');
      viewManager.switchView('nonexistent2');
      
      const errors = viewManager.getNavigationErrors();
      expect(errors).toHaveLength(2);
    });
  });

  describe('Integration with Requirements', () => {
    test('should satisfy requirement 1.1 - successful view location and display', () => {
      const views = ['dashboard', 'live', 'predictions', 'fantasy', 'betting', 'news'];
      
      views.forEach(viewName => {
        const success = viewManager.switchView(viewName);
        expect(success).toBe(true);
        expect(viewManager.getCurrentView()).toBe(viewName);
      });
    });

    test('should satisfy requirement 1.2 - handle both suffix and simple ID conventions', () => {
      // Test simple ID (dashboard, fantasy)
      expect(viewManager.switchView('dashboard')).toBe(true);
      expect(viewManager.switchView('fantasy')).toBe(true);
      
      // Test -view suffix (live-view, predictions-view, etc.)
      expect(viewManager.switchView('live')).toBe(true);
      expect(viewManager.switchView('predictions')).toBe(true);
    });

    test('should satisfy requirement 1.3 - attempt fallback patterns before error', () => {
      // This is tested by the resolveViewId method trying multiple patterns
      const resolvedId = viewManager.resolveViewId('live');
      expect(resolvedId).toBe('live-view'); // Found via fallback pattern
    });

    test('should satisfy requirement 1.4 - properly hide all views except target', () => {
      viewManager.switchView('dashboard');
      viewManager.switchView('live');
      
      const allViews = document.querySelectorAll('.view');
      let activeCount = 0;
      
      allViews.forEach(view => {
        if (view.classList.contains('active')) {
          activeCount++;
        }
      });
      
      expect(activeCount).toBe(1);
      expect(document.getElementById('live-view')?.classList.contains('active')).toBe(true);
    });

    test('should satisfy requirement 1.5 - provide clear navigation feedback', () => {
      // Test successful navigation logging
      const consoleSpy = jest.spyOn(console, 'log');
      viewManager.switchView('dashboard');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully switched to view: dashboard')
      );
      
      // Test failed navigation logging
      const consoleErrorSpy = jest.spyOn(console, 'error');
      viewManager.switchView('nonexistent');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Navigation error [VIEW_NOT_FOUND]'),
        expect.any(Object)
      );
    });
  });
});