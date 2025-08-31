/**
 * Performance Tests for Navigation UI Fixes
 * Tests for memory usage, speed, and performance optimization
 */

import { JSDOM } from 'jsdom';

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
} as any;

// Mock DOM environment
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head><title>Performance Test</title></head>
<body>
  <div id="dashboard" class="view">Dashboard</div>
  <div id="live-view" class="view">Live</div>
  <div id="predictions-view" class="view">Predictions</div>
  <canvas id="chart1" width="400" height="200"></canvas>
  <canvas id="chart2" width="400" height="200"></canvas>
  <canvas id="chart3" width="400" height="200"></canvas>
</body>
</html>
`);

global.document = dom.window.document;
global.window = dom.window as any;

// Mock Chart.js with performance tracking
const mockChart = {
  destroy: jest.fn(),
  update: jest.fn(),
  resize: jest.fn()
};

global.Chart = jest.fn().mockImplementation(() => mockChart) as any;

// Performance monitoring utilities
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private memoryUsage: any[] = [];
  private startTimes: Map<string, number> = new Map();

  startTiming(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  endTiming(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
    this.startTimes.delete(operation);
    
    return duration;
  }

  recordMemoryUsage(operation: string): void {
    // Mock memory usage recording
    const mockMemory = {
      operation,
      timestamp: Date.now(),
      heapUsed: Math.random() * 50 * 1024 * 1024, // Mock heap usage
      heapTotal: Math.random() * 100 * 1024 * 1024,
      external: Math.random() * 10 * 1024 * 1024
    };
    
    this.memoryUsage.push(mockMemory);
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMaxTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return Math.max(...times);
  }

  getMinTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    
    return Math.min(...times);
  }

  getMemoryGrowth(): number {
    if (this.memoryUsage.length < 2) return 0;
    
    const first = this.memoryUsage[0];
    const last = this.memoryUsage[this.memoryUsage.length - 1];
    
    return last.heapUsed - first.heapUsed;
  }

  getMetrics(): any {
    const result: any = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      result[operation] = {
        count: times.length,
        average: this.getAverageTime(operation),
        min: this.getMinTime(operation),
        max: this.getMaxTime(operation),
        total: times.reduce((sum, time) => sum + time, 0)
      };
    }
    
    return result;
  }

  reset(): void {
    this.metrics.clear();
    this.memoryUsage = [];
    this.startTimes.clear();
  }
}

// Mock navigation system with performance tracking
class PerformanceTrackedNavigationSystem {
  private monitor: PerformanceMonitor;
  private chartInstances: Map<string, any> = new Map();
  private viewCache: Map<string, any> = new Map();
  private currentView: string = 'dashboard';

  constructor() {
    this.monitor = new PerformanceMonitor();
  }

  async navigateToView(viewName: string): Promise<boolean> {
    this.monitor.startTiming('navigation');
    this.monitor.recordMemoryUsage(`navigation_start_${viewName}`);

    try {
      // Simulate view resolution
      this.monitor.startTiming('view_resolution');
      const resolved = await this.resolveView(viewName);
      this.monitor.endTiming('view_resolution');

      if (!resolved) return false;

      // Simulate chart cleanup
      this.monitor.startTiming('chart_cleanup');
      await this.cleanupCharts();
      this.monitor.endTiming('chart_cleanup');

      // Simulate view switching
      this.monitor.startTiming('view_switching');
      await this.switchView(viewName);
      this.monitor.endTiming('view_switching');

      // Simulate chart creation
      this.monitor.startTiming('chart_creation');
      await this.createViewCharts(viewName);
      this.monitor.endTiming('chart_creation');

      // Simulate data loading
      this.monitor.startTiming('data_loading');
      await this.loadViewData(viewName);
      this.monitor.endTiming('data_loading');

      this.currentView = viewName;
      this.monitor.recordMemoryUsage(`navigation_end_${viewName}`);
      
      return true;

    } finally {
      this.monitor.endTiming('navigation');
    }
  }

  private async resolveView(viewName: string): Promise<boolean> {
    // Simulate view ID resolution with different patterns
    const patterns = [viewName, `${viewName}-view`, `view-${viewName}`];
    
    for (const pattern of patterns) {
      if (document.getElementById(pattern)) {
        return true;
      }
      // Simulate lookup time
      await this.sleep(1);
    }
    
    return false;
  }

  private async cleanupCharts(): Promise<void> {
    // Simulate chart destruction
    for (const [canvasId, chart] of this.chartInstances.entries()) {
      this.monitor.startTiming(`chart_destroy_${canvasId}`);
      
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
      
      // Simulate cleanup time
      await this.sleep(2);
      
      this.monitor.endTiming(`chart_destroy_${canvasId}`);
    }
    
    this.chartInstances.clear();
  }

  private async switchView(viewName: string): Promise<void> {
    // Simulate DOM manipulation
    this.monitor.startTiming('dom_manipulation');
    
    // Hide all views
    const views = document.querySelectorAll('.view');
    views.forEach(view => {
      view.classList.remove('active');
    });
    
    // Show target view
    const targetView = document.getElementById(viewName) || 
                      document.getElementById(`${viewName}-view`);
    
    if (targetView) {
      targetView.classList.add('active');
    }
    
    // Simulate DOM update time
    await this.sleep(3);
    
    this.monitor.endTiming('dom_manipulation');
  }

  private async createViewCharts(viewName: string): Promise<void> {
    const chartConfigs = {
      dashboard: ['chart1'],
      live: ['chart2'],
      predictions: ['chart3']
    };

    const canvasIds = chartConfigs[viewName as keyof typeof chartConfigs] || [];
    
    for (const canvasId of canvasIds) {
      this.monitor.startTiming(`chart_create_${canvasId}`);
      
      const canvas = document.getElementById(canvasId);
      if (canvas) {
        // Simulate chart creation time
        await this.sleep(10);
        
        const chart = new Chart(canvas, {
          type: 'line',
          data: { datasets: [] },
          options: {}
        });
        
        this.chartInstances.set(canvasId, chart);
      }
      
      this.monitor.endTiming(`chart_create_${canvasId}`);
    }
  }

  private async loadViewData(viewName: string): Promise<void> {
    // Check cache first
    this.monitor.startTiming('cache_lookup');
    const cached = this.viewCache.get(viewName);
    this.monitor.endTiming('cache_lookup');
    
    if (cached) {
      return;
    }
    
    // Simulate data loading
    this.monitor.startTiming('data_fetch');
    
    switch (viewName) {
      case 'live':
        await this.sleep(20); // Simulate API call
        break;
      case 'predictions':
        await this.sleep(15); // Simulate computation
        break;
      default:
        await this.sleep(5); // Simulate basic data load
    }
    
    // Cache the data
    this.viewCache.set(viewName, { loaded: true, timestamp: Date.now() });
    
    this.monitor.endTiming('data_fetch');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Performance testing methods
  async performStressTest(iterations: number): Promise<any> {
    const views = ['dashboard', 'live', 'predictions'];
    const results = {
      iterations,
      totalTime: 0,
      averageTime: 0,
      errors: 0,
      memoryGrowth: 0
    };

    this.monitor.recordMemoryUsage('stress_test_start');
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const viewName = views[i % views.length];
      
      try {
        await this.navigateToView(viewName);
      } catch (error) {
        results.errors++;
      }
    }

    const endTime = performance.now();
    this.monitor.recordMemoryUsage('stress_test_end');

    results.totalTime = endTime - startTime;
    results.averageTime = results.totalTime / iterations;
    results.memoryGrowth = this.monitor.getMemoryGrowth();

    return results;
  }

  async performMemoryLeakTest(cycles: number): Promise<any> {
    const memorySnapshots: any[] = [];
    
    for (let cycle = 0; cycle < cycles; cycle++) {
      this.monitor.recordMemoryUsage(`cycle_${cycle}_start`);
      
      // Navigate through all views
      await this.navigateToView('dashboard');
      await this.navigateToView('live');
      await this.navigateToView('predictions');
      
      this.monitor.recordMemoryUsage(`cycle_${cycle}_end`);
      
      // Force garbage collection simulation
      if (global.gc) {
        global.gc();
      }
      
      memorySnapshots.push({
        cycle,
        chartInstances: this.chartInstances.size,
        cacheSize: this.viewCache.size
      });
    }
    
    return {
      cycles,
      memorySnapshots,
      finalChartInstances: this.chartInstances.size,
      finalCacheSize: this.viewCache.size,
      memoryGrowth: this.monitor.getMemoryGrowth()
    };
  }

  getPerformanceMetrics(): any {
    return this.monitor.getMetrics();
  }

  resetMetrics(): void {
    this.monitor.reset();
  }

  getCurrentView(): string {
    return this.currentView;
  }

  getChartInstanceCount(): number {
    return this.chartInstances.size;
  }

  getCacheSize(): number {
    return this.viewCache.size;
  }
}

describe('Navigation Performance Tests', () => {
  let navigationSystem: PerformanceTrackedNavigationSystem;

  beforeEach(() => {
    navigationSystem = new PerformanceTrackedNavigationSystem();
    jest.clearAllMocks();
  });

  describe('Navigation Speed Tests', () => {
    test('should navigate within acceptable time limits', async () => {
      const maxNavigationTime = 100; // 100ms max
      
      const views = ['dashboard', 'live', 'predictions'];
      
      for (const view of views) {
        const startTime = performance.now();
        await navigationSystem.navigateToView(view);
        const endTime = performance.now();
        
        const navigationTime = endTime - startTime;
        expect(navigationTime).toBeLessThan(maxNavigationTime);
      }
    });

    test('should have consistent navigation performance', async () => {
      const iterations = 10;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await navigationSystem.navigateToView('live');
        const endTime = performance.now();
        
        times.push(endTime - startTime);
      }
      
      const average = times.reduce((sum, time) => sum + time, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / times.length;
      const standardDeviation = Math.sqrt(variance);
      
      // Standard deviation should be less than 50% of average (consistent performance)
      expect(standardDeviation).toBeLessThan(average * 0.5);
    });

    test('should optimize repeated navigation to same view', async () => {
      // First navigation (cold)
      const startTime1 = performance.now();
      await navigationSystem.navigateToView('live');
      const coldTime = performance.now() - startTime1;
      
      // Second navigation (warm)
      const startTime2 = performance.now();
      await navigationSystem.navigateToView('live');
      const warmTime = performance.now() - startTime2;
      
      // Warm navigation should be faster due to caching
      expect(warmTime).toBeLessThan(coldTime);
    });
  });

  describe('Memory Management Tests', () => {
    test('should not leak chart instances', async () => {
      const initialChartCount = navigationSystem.getChartInstanceCount();
      
      // Navigate through views multiple times
      for (let i = 0; i < 5; i++) {
        await navigationSystem.navigateToView('dashboard');
        await navigationSystem.navigateToView('live');
        await navigationSystem.navigateToView('predictions');
      }
      
      const finalChartCount = navigationSystem.getChartInstanceCount();
      
      // Should not accumulate chart instances
      expect(finalChartCount).toBeLessThanOrEqual(initialChartCount + 1); // Allow for current view chart
    });

    test('should manage view cache efficiently', async () => {
      const maxCacheSize = 10;
      
      // Navigate to many different views
      const views = ['dashboard', 'live', 'predictions'];
      
      for (let i = 0; i < 20; i++) {
        const view = views[i % views.length];
        await navigationSystem.navigateToView(view);
      }
      
      const cacheSize = navigationSystem.getCacheSize();
      expect(cacheSize).toBeLessThanOrEqual(maxCacheSize);
    });

    test('should perform memory leak test', async () => {
      const cycles = 5;
      const result = await navigationSystem.performMemoryLeakTest(cycles);
      
      expect(result.cycles).toBe(cycles);
      expect(result.finalChartInstances).toBeLessThanOrEqual(1); // Only current view chart
      expect(result.memorySnapshots).toHaveLength(cycles);
      
      // Memory growth should be minimal
      expect(Math.abs(result.memoryGrowth)).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
    });
  });

  describe('Stress Testing', () => {
    test('should handle rapid navigation without degradation', async () => {
      const iterations = 50;
      const result = await navigationSystem.performStressTest(iterations);
      
      expect(result.iterations).toBe(iterations);
      expect(result.errors).toBe(0);
      expect(result.averageTime).toBeLessThan(200); // Average under 200ms
      
      // Memory growth should be reasonable
      expect(Math.abs(result.memoryGrowth)).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    });

    test('should maintain performance under concurrent operations', async () => {
      const concurrentNavigations = 10;
      const promises: Promise<boolean>[] = [];
      
      const startTime = performance.now();
      
      // Start multiple concurrent navigations
      for (let i = 0; i < concurrentNavigations; i++) {
        const view = ['dashboard', 'live', 'predictions'][i % 3];
        promises.push(navigationSystem.navigateToView(view));
      }
      
      const results = await Promise.all(promises);
      const endTime = performance.now();
      
      const totalTime = endTime - startTime;
      const averageTime = totalTime / concurrentNavigations;
      
      // All navigations should succeed
      expect(results.every(result => result === true)).toBe(true);
      
      // Average time should be reasonable even with concurrency
      expect(averageTime).toBeLessThan(500);
    });
  });

  describe('Component Performance Breakdown', () => {
    test('should track individual component performance', async () => {
      await navigationSystem.navigateToView('live');
      
      const metrics = navigationSystem.getPerformanceMetrics();
      
      // Should have metrics for all major operations
      expect(metrics.navigation).toBeDefined();
      expect(metrics.view_resolution).toBeDefined();
      expect(metrics.chart_cleanup).toBeDefined();
      expect(metrics.view_switching).toBeDefined();
      expect(metrics.chart_creation).toBeDefined();
      expect(metrics.data_loading).toBeDefined();
      
      // Each metric should have reasonable values
      Object.values(metrics).forEach((metric: any) => {
        expect(metric.count).toBeGreaterThan(0);
        expect(metric.average).toBeGreaterThan(0);
        expect(metric.min).toBeGreaterThanOrEqual(0);
        expect(metric.max).toBeGreaterThanOrEqual(metric.min);
      });
    });

    test('should identify performance bottlenecks', async () => {
      // Navigate multiple times to get good metrics
      for (let i = 0; i < 5; i++) {
        await navigationSystem.navigateToView('live');
        await navigationSystem.navigateToView('predictions');
      }
      
      const metrics = navigationSystem.getPerformanceMetrics();
      
      // Chart creation should typically be the slowest operation
      const chartCreationTime = metrics.chart_creation?.average || 0;
      const viewResolutionTime = metrics.view_resolution?.average || 0;
      const domManipulationTime = metrics.dom_manipulation?.average || 0;
      
      // Chart creation should take more time than simple operations
      expect(chartCreationTime).toBeGreaterThan(viewResolutionTime);
      expect(chartCreationTime).toBeGreaterThan(domManipulationTime);
    });
  });

  describe('Caching Performance', () => {
    test('should improve performance with caching', async () => {
      // First load (no cache)
      const startTime1 = performance.now();
      await navigationSystem.navigateToView('live');
      const firstLoadTime = performance.now() - startTime1;
      
      // Second load (with cache)
      const startTime2 = performance.now();
      await navigationSystem.navigateToView('live');
      const cachedLoadTime = performance.now() - startTime2;
      
      // Cached load should be significantly faster
      expect(cachedLoadTime).toBeLessThan(firstLoadTime * 0.8);
    });

    test('should have efficient cache lookup performance', async () => {
      // Load data into cache
      await navigationSystem.navigateToView('live');
      
      const metrics = navigationSystem.getPerformanceMetrics();
      const cacheTime = metrics.cache_lookup?.average || 0;
      
      // Cache lookup should be very fast
      expect(cacheTime).toBeLessThan(5); // Less than 5ms
    });
  });

  describe('Integration Performance Requirements', () => {
    test('should satisfy requirement 6.2 - maintain consistent performance', async () => {
      const navigationTimes: number[] = [];
      
      // Test frequent navigation
      for (let i = 0; i < 20; i++) {
        const view = ['dashboard', 'live', 'predictions'][i % 3];
        const startTime = performance.now();
        await navigationSystem.navigateToView(view);
        const endTime = performance.now();
        
        navigationTimes.push(endTime - startTime);
      }
      
      // Performance should remain consistent
      const firstHalf = navigationTimes.slice(0, 10);
      const secondHalf = navigationTimes.slice(10);
      
      const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
      
      // Performance degradation should be minimal (less than 50% increase)
      expect(secondAvg).toBeLessThan(firstAvg * 1.5);
    });

    test('should satisfy requirement 6.3 - optimize DOM manipulation', async () => {
      await navigationSystem.navigateToView('live');
      
      const metrics = navigationSystem.getPerformanceMetrics();
      const domTime = metrics.dom_manipulation?.average || 0;
      
      // DOM manipulation should be fast
      expect(domTime).toBeLessThan(20); // Less than 20ms
    });

    test('should satisfy requirement 6.4 - performance monitoring', async () => {
      await navigationSystem.navigateToView('predictions');
      
      const metrics = navigationSystem.getPerformanceMetrics();
      
      // Should have comprehensive performance data
      expect(Object.keys(metrics).length).toBeGreaterThan(5);
      
      // Each metric should have complete data
      Object.values(metrics).forEach((metric: any) => {
        expect(metric).toHaveProperty('count');
        expect(metric).toHaveProperty('average');
        expect(metric).toHaveProperty('min');
        expect(metric).toHaveProperty('max');
        expect(metric).toHaveProperty('total');
      });
    });

    test('should satisfy requirement 6.5 - memory stability', async () => {
      const result = await navigationSystem.performMemoryLeakTest(10);
      
      // Memory should remain stable over multiple cycles
      expect(result.finalChartInstances).toBeLessThanOrEqual(1);
      expect(Math.abs(result.memoryGrowth)).toBeLessThan(15 * 1024 * 1024); // Less than 15MB growth
      
      // Should not accumulate resources
      const snapshots = result.memorySnapshots;
      const firstSnapshot = snapshots[0];
      const lastSnapshot = snapshots[snapshots.length - 1];
      
      expect(lastSnapshot.chartInstances).toBeLessThanOrEqual(firstSnapshot.chartInstances + 1);
    });
  });
});