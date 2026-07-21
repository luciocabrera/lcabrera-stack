import { describe, expect, it } from 'vitest';

import { logSafe, summaryLines } from './sonar-summary.mjs';

const NOW = Date.parse('2026-07-21T12:00:00Z');

const reportAt = (analysisDate) => ({
  analysisDate,
  project: 'luciocabrera_vite-react-compiler',
  qualityGate: { status: 'OK' },
  summary: { bySeverity: { MAJOR: 1 }, hotspots: 0, issues: 1 },
  target: { type: 'branch', value: 'main' },
});

describe('summaryLines', () => {
  it('reports findings and a fresh analysis without flagging it', () => {
    const parts = summaryLines(
      reportAt('2026-07-21T11:00:00Z'),
      'reports/sonar/full-latest.json',
      NOW,
    );
    expect(parts.stale).toBe(false);
    expect(parts.findings[1]).toContain('quality gate: OK');
    expect(parts.findings[2]).toContain('issues: 1 (MAJOR 1)');
    expect(parts.freshness).toHaveLength(1);
    expect(parts.freshness[0]).toContain('1 hour ago');
  });

  it('adds an explicit warning line when the analysis is stale', () => {
    // The regression this guards: a gate status printed with no indication that
    // the analysis behind it ran ten days ago.
    const parts = summaryLines(reportAt('2026-07-11T11:02:07+0000'), 'x', NOW);
    expect(parts.stale).toBe(true);
    expect(parts.freshness).toHaveLength(2);
    expect(parts.freshness[0]).toContain('10 days ago');
    expect(parts.freshness[1]).toContain('predate the current code');
    // The gate line itself must stay untouched — the warning is additive, so a
    // caller grepping for the status still finds exactly what it did before.
    expect(parts.findings[1]).toBe('  quality gate: OK');
  });

  it('treats a report with no analysis date as stale', () => {
    const parts = summaryLines(reportAt(null), 'x', NOW);
    expect(parts.stale).toBe(true);
    expect(parts.freshness[0]).toContain('unverified');
  });

  it('omits the severity suffix when there are no issues', () => {
    const report = {
      ...reportAt('2026-07-21T11:00:00Z'),
      summary: { bySeverity: {}, hotspots: 0, issues: 0 },
    };
    expect(summaryLines(report, 'x', NOW).findings[2]).toBe(
      '  issues: 0  hotspots: 0',
    );
  });
});

describe('logSafe', () => {
  it('flattens line breaks so API text cannot forge a log line (CWE-117)', () => {
    expect(logSafe('a\nb\rc')).toBe('a b c');
  });

  it('stringifies non-strings', () => {
    expect(logSafe(42)).toBe('42');
    expect(logSafe(null)).toBe('null');
  });
});
