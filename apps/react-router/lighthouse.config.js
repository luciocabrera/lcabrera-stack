/**
 * Lighthouse Configuration
 * Audits homepage for performance, accessibility, SEO, and best practices
 */

export default {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    onlyCategories: [
      'performance',
      'accessibility',
      'best-practices',
      'seo',
      'pwa',
    ],
    // Emulate slow 4G network
    skipAudits: [],
    throttling: {
      cpuSlowdownMultiplier: 1,
      rttMs: 40,
      throughputKbps: 11_024,
    },
    // All audits enabled by default
  },
};
