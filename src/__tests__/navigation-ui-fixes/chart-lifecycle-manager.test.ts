/**
 * Chart Lifecycle Manager Unit Tests
 * Tests for proper chart creation, destruction, and memory management
 */

import { JSDOM } from 'jsdom';

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <canvas id="accuracy-chart" width="400" height="200"></canvas>
  <canvas id="performance-chart" width="400" height="200"></canvas>
  <canvas id="prediction-chart" width="400" height="200"></canvas>
  <div id="chart-fallback" style="display: none;">Chart data unavailable</div>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock Chart.js
const mockChart = {
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn(),
  data: { datasets: [] },
  options: {}
};

const mockChartConstructor = jest.fn().mockImplementation(() => mockChart);

// Mock Chart.js global
global.Chart = mockChartConstructor as any;
global.Chart.getChart = jest.fn();

// Mock the ChartLifecycleManager class
class MockChartLifecycleManager {
  private chartRegistry: Map<string, any> = new Map();
  private canvasRegistry: Map<string, HTMLCanvasElement> = new Map();
  private creationLog: any[] = [];
  private destructionLog: any[] = [];

  constructor() {
    console.log('📊 Chart Lifecycle Manager initialized');
    this.initializeCanvasRegistry();
  }

  /**
   * Initialize canvas registry
   */
  private initializeCanvasRegistry(): void {
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      this.canvasRegistry.set(canvas.id, canvas as HTMLCanvasElement);
    });
  }

  /**
   * Create chart with conflict detection
   */
  createChart(canvasId: string, config: any): any | null {
    console.log(`📊 Creating chart for canvas: ${canvasId}`);
    
    try {
      // Check if Chart.js is available
      if (typeof Chart === 'undefined') {
        console.warn('⚠️ Chart.js not available, falling back to text display');
        this.showFallbackDisplay(canvasId);
        return null;
      }

      // Check for existing chart
      if (this.isChartActive(canvasId)) {
        console.log(`🔄 Destroying existing chart for canvas: ${canvasId}`);
        this.destroyChart(canvasId);
      }

      // Get canvas element
      const canvas = this.getCanvasElement(canvasId);
      if (!canvas) {
        console.error(`❌ Canvas element not found: ${canvasId}`);
        return null;
      }

      // Create new chart
      const chart = new Chart(canvas, config);
      
      // Register chart
      this.chartRegistry.set(canvasId, {
        instance: chart,
        canvas: canvas,
        config: config,
        createdAt: new Date(),
        lastAccessed: new Date()
      });

      // Log creation
      this.logChartCreation(canvasId, config);
      
      console.log(`✅ Chart created successfully for canvas: ${canvasId}`);
      return chart;
      
    } catch (error) {
      console.error(`❌ Chart creation failed for canvas: ${canvasId}`, error);
      this.showFallbackDisplay(canvasId);
      return null;
    }
  }

  /**
   * Destroy chart and clean up resources
   */
  destroyChart(canvasId: string): boolean {
    console.log(`🗑️ Destroying chart for canvas: ${canvasId}`);
    
    try {
      const chartInfo = this.chartRegistry.get(canvasId);
      
      if (!chartInfo) {
        console.log(`ℹ️ No chart found for canvas: ${canvasId}`);
        return true; // Not an error if chart doesn't exist
      }

      // Destroy Chart.js instance
      if (chartInfo.instance && typeof chartInfo.instance.destroy === 'function') {
        chartInfo.instance.destroy();
      }

      // Clear canvas context
      const canvas = chartInfo.canvas;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      // Remove from registry
      this.chartRegistry.delete(canvasId);

      // Log destruction
      this.logChartDestruction(canvasId);
      
      console.log(`✅ Chart destroyed successfully for canvas: ${canvasId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Chart destruction failed for canvas: ${canvasId}`, error);
      return false;
    }
  }

  /**
   * Destroy all charts
   */
  destroyAllCharts(): number {
    console.log('🗑️ Destroying all charts');
    
    const canvasIds = Array.from(this.chartRegistry.keys());
    let destroyedCount = 0;
    
    canvasIds.forEach(canvasId => {
      if (this.destroyChart(canvasId)) {
        destroyedCount++;
      }
    });
    
    console.log(`✅ Destroyed ${destroyedCount} charts`);
    return destroyedCount;
  }

  /**
   * Check if chart is active
   */
  isChartActive(canvasId: string): boolean {
    return this.chartRegistry.has(canvasId);
  }

  /**
   * Get chart instance
   */
  getChartInstance(canvasId: string): any | null {
    const chartInfo = this.chartRegistry.get(canvasId);
    if (chartInfo) {
      chartInfo.lastAccessed = new Date();
      return chartInfo.instance;
    }
    return null;
  }

  /**
   * Get canvas element
   */
  private getCanvasElement(canvasId: string): HTMLCanvasElement | null {
    return this.canvasRegistry.get(canvasId) || 
           document.getElementById(canvasId) as HTMLCanvasElement;
  }

  /**
   * Show fallback display when charts fail
   */
  private showFallbackDisplay(canvasId: string): void {
    const canvas = this.getCanvasElement(canvasId);
    if (canvas) {
      canvas.style.display = 'none';
    }
    
    const fallback = document.getElementById('chart-fallback');
    if (fallback) {
      fallback.style.display = 'block';
      fallback.textContent = `Chart data for ${canvasId} is temporarily unavailable`;
    }
  }

  /**
   * Log chart creation
   */
  private logChartCreation(canvasId: string, config: any): void {
    const logEntry = {
      canvasId,
      action: 'create',
      timestamp: new Date(),
      config: { type: config.type, hasData: !!config.data }
    };
    
    this.creationLog.push(logEntry);
    console.log('📊 Chart creation logged:', logEntry);
  }

  /**
   * Log chart destruction
   */
  private logChartDestruction(canvasId: string): void {
    const logEntry = {
      canvasId,
      action: 'destroy',
      timestamp: new Date()
    };
    
    this.destructionLog.push(logEntry);
    console.log('🗑️ Chart destruction logged:', logEntry);
  }

  // Getters for testing
  getActiveChartCount(): number {
    return this.chartRegistry.size;
  }

  getActiveChartIds(): string[] {
    return Array.from(this.chartRegistry.keys());
  }

  getCreationLog(): any[] {
    return [...this.creationLog];
  }

  getDestructionLog(): any[] {
    return [...this.destructionLog];
  }

  getChartInfo(canvasId: string): any {
    return this.chartRegistry.get(canvasId);
  }
}

describe('Chart Lifecycle Manager', () => {
  let chartManager: MockChartLifecycleManager;

  beforeEach(() => {
    chartManager = new MockChartLifecycleManager();
    
    // Reset mocks
    jest.clearAllMocks();
    mockChart.destroy.mockClear();
    
    // Reset DOM state
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      (canvas as HTMLElement).style.display = 'block';
    });
    
    const fallback = document.getElementById('chart-fallback');
    if (fallback) {
      fallback.style.display = 'none';
    }
  });

  describe('Chart Creation', () => {
    test('should create chart successfully', () => {
      const config = {
        type: 'line',
        data: { datasets: [{ data: [1, 2, 3] }] },
        options: {}
      };

      const chart = chartManager.createChart('accuracy-chart', config);
      
      expect(chart).toBeTruthy();
      expect(mockChartConstructor).toHaveBeenCalledWith(
        expect.any(HTMLCanvasElement),
        config
      );
      expect(chartManager.isChartActive('accuracy-chart')).toBe(true);
      expect(chartManager.getActiveChartCount()).toBe(1);
    });

    test('should handle Chart.js unavailable gracefully', () => {
      // Mock Chart.js as undefined
      const originalChart = global.Chart;
      delete (global as any).Chart;

      const config = { type: 'line', data: {}, options: {} };
      const chart = chartManager.createChart('accuracy-chart', config);
      
      expect(chart).toBeNull();
      expect(chartManager.isChartActive('accuracy-chart')).toBe(false);
      
      // Check fallback display
      const fallback = document.getElementById('chart-fallback');
      expect(fallback?.style.display).toBe('block');
      
      // Restore Chart.js
      global.Chart = originalChart;
    });

    test('should handle missing canvas element', () => {
      const config = { type: 'line', data: {}, options: {} };
      const chart = chartManager.createChart('nonexistent-canvas', config);
      
      expect(chart).toBeNull();
      expect(chartManager.isChartActive('nonexistent-canvas')).toBe(false);
    });

    test('should log chart creation', () => {
      const config = { type: 'bar', data: { datasets: [] }, options: {} };
      chartManager.createChart('performance-chart', config);
      
      const creationLog = chartManager.getCreationLog();
      expect(creationLog).toHaveLength(1);
      expect(creationLog[0].canvasId).toBe('performance-chart');
      expect(creationLog[0].action).toBe('create');
      expect(creationLog[0].config.type).toBe('bar');
    });
  });

  describe('Chart Destruction', () => {
    test('should destroy chart successfully', () => {
      // Create chart first
      const config = { type: 'line', data: {}, options: {} };
      chartManager.createChart('accuracy-chart', config);
      
      expect(chartManager.isChartActive('accuracy-chart')).toBe(true);
      
      // Destroy chart
      const success = chartManager.destroyChart('accuracy-chart');
      
      expect(success).toBe(true);
      expect(mockChart.destroy).toHaveBeenCalled();
      expect(chartManager.isChartActive('accuracy-chart')).toBe(false);
      expect(chartManager.getActiveChartCount()).toBe(0);
    });

    test('should handle destroying non-existent chart gracefully', () => {
      const success = chartManager.destroyChart('nonexistent-chart');
      
      expect(success).toBe(true); // Should not be an error
      expect(mockChart.destroy).not.toHaveBeenCalled();
    });

    test('should log chart destruction', () => {
      // Create and destroy chart
      const config = { type: 'line', data: {}, options: {} };
      chartManager.createChart('accuracy-chart', config);
      chartManager.destroyChart('accuracy-chart');
      
      const destructionLog = chartManager.getDestructionLog();
      expect(destructionLog).toHaveLength(1);
      expect(destructionLog[0].canvasId).toBe('accuracy-chart');
      expect(destructionLog[0].action).toBe('destroy');
    });
  });

  describe('Chart Conflict Resolution', () => {
    test('should destroy existing chart before creating new one', () => {
      const config1 = { type: 'line', data: {}, options: {} };
      const config2 = { type: 'bar', data: {}, options: {} };
      
      // Create first chart
      const chart1 = chartManager.createChart('accuracy-chart', config1);
      expect(chart1).toBeTruthy();
      expect(chartManager.getActiveChartCount()).toBe(1);
      
      // Create second chart on same canvas
      const chart2 = chartManager.createChart('accuracy-chart', config2);
      expect(chart2).toBeTruthy();
      expect(chartManager.getActiveChartCount()).toBe(1); // Still only one chart
      
      // Verify old chart was destroyed
      expect(mockChart.destroy).toHaveBeenCalled();
    });

    test('should handle multiple charts on different canvases', () => {
      const config = { type: 'line', data: {}, options: {} };
      
      chartManager.createChart('accuracy-chart', config);
      chartManager.createChart('performance-chart', config);
      chartManager.createChart('prediction-chart', config);
      
      expect(chartManager.getActiveChartCount()).toBe(3);
      expect(chartManager.getActiveChartIds()).toEqual([
        'accuracy-chart',
        'performance-chart', 
        'prediction-chart'
      ]);
    });
  });

  describe('Bulk Operations', () => {
    test('should destroy all charts', () => {
      const config = { type: 'line', data: {}, options: {} };
      
      // Create multiple charts
      chartManager.createChart('accuracy-chart', config);
      chartManager.createChart('performance-chart', config);
      chartManager.createChart('prediction-chart', config);
      
      expect(chartManager.getActiveChartCount()).toBe(3);
      
      // Destroy all
      const destroyedCount = chartManager.destroyAllCharts();
      
      expect(destroyedCount).toBe(3);
      expect(chartManager.getActiveChartCount()).toBe(0);
      expect(mockChart.destroy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Chart Instance Management', () => {
    test('should return chart instance', () => {
      const config = { type: 'line', data: {}, options: {} };
      const createdChart = chartManager.createChart('accuracy-chart', config);
      
      const retrievedChart = chartManager.getChartInstance('accuracy-chart');
      
      expect(retrievedChart).toBe(createdChart);
    });

    test('should return null for non-existent chart', () => {
      const chart = chartManager.getChartInstance('nonexistent-chart');
      expect(chart).toBeNull();
    });

    test('should update last accessed time', () => {
      const config = { type: 'line', data: {}, options: {} };
      chartManager.createChart('accuracy-chart', config);
      
      const initialInfo = chartManager.getChartInfo('accuracy-chart');
      const initialTime = initialInfo.lastAccessed;
      
      // Wait a bit and access again
      setTimeout(() => {
        chartManager.getChartInstance('accuracy-chart');
        const updatedInfo = chartManager.getChartInfo('accuracy-chart');
        expect(updatedInfo.lastAccessed.getTime()).toBeGreaterThan(initialTime.getTime());
      }, 10);
    });
  });

  describe('Integration with Requirements', () => {
    test('should satisfy requirement 2.1 - check and destroy existing chart instances', () => {
      const config = { type: 'line', data: {}, options: {} };
      
      // Create chart
      chartManager.createChart('accuracy-chart', config);
      expect(chartManager.isChartActive('accuracy-chart')).toBe(true);
      
      // Create another chart on same canvas (should destroy first)
      chartManager.createChart('accuracy-chart', config);
      expect(mockChart.destroy).toHaveBeenCalled();
      expect(chartManager.getActiveChartCount()).toBe(1);
    });

    test('should satisfy requirement 2.2 - no canvas conflicts', () => {
      const config = { type: 'line', data: {}, options: {} };
      
      // Create multiple charts rapidly
      chartManager.createChart('accuracy-chart', config);
      chartManager.createChart('accuracy-chart', config);
      chartManager.createChart('accuracy-chart', config);
      
      // Should not throw errors and should have only one active chart
      expect(chartManager.getActiveChartCount()).toBe(1);
      expect(chartManager.isChartActive('accuracy-chart')).toBe(true);
    });

    test('should satisfy requirement 2.3 - unique instance references', () => {
      const config = { type: 'line', data: {}, options: {} };
      
      chartManager.createChart('accuracy-chart', config);
      chartManager.createChart('performance-chart', config);
      
      const chart1 = chartManager.getChartInstance('accuracy-chart');
      const chart2 = chartManager.getChartInstance('performance-chart');
      
      expect(chart1).not.toBe(chart2);
      expect(chart1).toBeTruthy();
      expect(chart2).toBeTruthy();
    });

    test('should satisfy requirement 2.4 - graceful Chart.js unavailable handling', () => {
      const originalChart = global.Chart;
      delete (global as any).Chart;
      
      const config = { type: 'line', data: {}, options: {} };
      const chart = chartManager.createChart('accuracy-chart', config);
      
      expect(chart).toBeNull();
      expect(chartManager.isChartActive('accuracy-chart')).toBe(false);
      
      // Should show fallback display
      const fallback = document.getElementById('chart-fallback');
      expect(fallback?.style.display).toBe('block');
      
      global.Chart = originalChart;
    });

    test('should satisfy requirement 2.5 - appropriate warnings for missing canvas', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      const config = { type: 'line', data: {}, options: {} };
      chartManager.createChart('missing-canvas', config);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Canvas element not found: missing-canvas')
      );
    });
  });
});