/**
 * Performance Render Tracker
 *
 * Utility to track and analyze React component render counts and timing.
 * Only active in development mode.
 *
 * @example
 * ```tsx
 * // In a component
 * import { useRenderTracker, renderStats } from '@/utils/performance';
 *
 * const MyComponent = () => {
 *   useRenderTracker('MyComponent');
 *   // ...
 * };
 *
 * // To view stats in console
 * renderStats.print();
 * renderStats.reset();
 * ```
 */

type RenderRecord = {
  count: number;
  lastRenderTime: number;
  renderTimes: number[];
  totalTime: number;
};

type RenderStats = Map<string, RenderRecord>;

type WindowWithRenderStats = Window & {
  __renderStats?: typeof renderStats;
};

// Global render stats store
const stats: RenderStats = new Map();

// Session start time for relative timestamps
const sessionStart = performance.now();

/**
 * Track a render for a component
 */
export const trackRender = (componentName: string): void => {
  if (import.meta.env.PROD) return;

  const now = performance.now();
  const existing = stats.get(componentName);

  if (existing) {
    existing.count += 1;
    existing.lastRenderTime = now - sessionStart;
    // Keep last 100 render times for analysis
    if (existing.renderTimes.length < 100) {
      existing.renderTimes.push(now - sessionStart);
    }
  } else {
    stats.set(componentName, {
      count: 1,
      lastRenderTime: now - sessionStart,
      renderTimes: [now - sessionStart],
      totalTime: 0,
    });
  }
};

/**
 * Mark the end of a render (for timing)
 */
export const trackRenderComplete = (
  componentName: string,
  startTime: number,
): void => {
  if (import.meta.env.PROD) return;

  const duration = performance.now() - startTime;
  const existing = stats.get(componentName);

  if (existing) {
    existing.totalTime += duration;
  }
};

/**
 * Get render statistics
 */
export const renderStats = {
  /**
   * Copy stats to clipboard (if available)
   * Returns the JSON string for fallback
   */
  copy: async (): Promise<string> => {
    const json = renderStats.toJSON();
    try {
      await navigator.clipboard.writeText(json);
      // eslint-disable-next-line no-console -- Debug utility output for local profiling.
      console.log('✅ Stats copied to clipboard!');
    } catch {
      // eslint-disable-next-line no-console -- Debug utility output for local profiling.
      console.log('📋 Copy manually:', json);
    }
    return json;
  },

  /**
   * Get all stats as an array sorted by render count
   */
  getAll: (): (RenderRecord & { name: string })[] => {
    return [...stats.entries()]
      .map(([name, record]) => ({ name, ...record }))
      .sort((a, b) => b.count - a.count);
  },

  /**
   * Get stats for a specific component
   */
  getComponent: (name: string): RenderRecord | undefined => {
    return stats.get(name);
  },

  /**
   * Get summary of total renders across all components
   */
  getSummary: (): {
    avgRendersPerComponent: number;
    componentCount: number;
    mostRendered: { count: number; name: string }[];
    totalRenders: number;
  } => {
    const all = renderStats.getAll();
    const totalRenders = all.reduce((sum, r) => sum + r.count, 0);

    return {
      avgRendersPerComponent:
        all.length > 0 ? Math.round(totalRenders / all.length) : 0,
      componentCount: all.length,
      mostRendered: all
        .slice(0, 10)
        .map((r) => ({ count: r.count, name: r.name })),
      totalRenders,
    };
  },

  /**
   * Print formatted stats to console
   */
  print: (): void => {
    if (import.meta.env.PROD) return;

    const all = renderStats.getAll();
    const summary = renderStats.getSummary();

    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.group('📊 Render Statistics');
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log(`Total components tracked: ${summary.componentCount}`);
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log(`Total renders: ${summary.totalRenders}`);
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log(`Avg renders per component: ${summary.avgRendersPerComponent}`);
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log('');
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log('Top 10 most rendered:');
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.table(
      summary.mostRendered.map((r) => ({
        Component: r.name,
        'Render Count': r.count,
      })),
    );
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log('');
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.log('All components:');
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.table(
      all.map((r) => ({
        'Avg Time (ms)': r.count > 0 ? (r.totalTime / r.count).toFixed(2) : 0,
        Component: r.name,
        'Render Count': r.count,
        'Total Time (ms)': r.totalTime.toFixed(2),
      })),
    );
    // eslint-disable-next-line no-console -- Debug utility output for local profiling.
    console.groupEnd();
  },

  /**
   * Reset all statistics
   */
  reset: (): void => {
    stats.clear();
  },

  /**
   * Export stats as JSON string for copying/sharing
   * Usage: copy(__renderStats.toJSON())
   */
  toJSON: (): string => {
    const all = renderStats.getAll();
    const summary = renderStats.getSummary();

    const exportData = {
      capturedAt: new Date().toISOString(),
      components: all.map((r) => ({
        avgTimeMs: r.count > 0 ? Number((r.totalTime / r.count).toFixed(2)) : 0,
        name: r.name,
        renderCount: r.count,
        totalTimeMs: Number(r.totalTime.toFixed(2)),
      })),
      summary: {
        avgRendersPerComponent: summary.avgRendersPerComponent,
        componentCount: summary.componentCount,
        totalRenders: summary.totalRenders,
      },
    };

    return JSON.stringify(exportData, null, 2);
  },
};

// Expose to window for easy console access
if (import.meta.env.DEV && globalThis.window !== undefined) {
  const windowWithRenderStats = globalThis.window as WindowWithRenderStats;
  windowWithRenderStats.__renderStats = renderStats;
}
