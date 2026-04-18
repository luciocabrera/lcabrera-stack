/**
 * Lighthouse Configuration
 * Audits homepage for performance, accessibility, SEO, and best practices
 */

export default {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: [
      'performance',
      'accessibility',
      'best-practices',
      'seo',
      'pwa',
    ],
    formFactor: 'mobile',
    throttling: {
      rttMs: 40,
      throughputKbps: 11024,
      cpuSlowdownMultiplier: 1,
    },
    // Emulate slow 4G network
    skipAudits: [],
    // All audits enabled by default
  },
};
