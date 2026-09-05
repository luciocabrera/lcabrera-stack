/**
 * One rendered report the render tests vary, so a case states only the field it
 * is about.
 *
 * The default is deliberately the awkward one: a 90-day window over a 30-day
 * retention, observed back only to the day retention reaches, with a recorded
 * day that is earlier still. Most of the wording this module's tests pin exists
 * for exactly that mismatch, so a fixture that avoided it would let a false
 * coverage claim pass.
 */
import { renderReport } from './usage-render.mjs';

export const WINDOW = { days: 90, end: '2026-09-04', start: '2026-06-07' };

export const reportWith = (overrides) =>
  renderReport({
    command: 'vp run usage:report',
    generatedAt: '2026-09-04T10:00:00.000Z',
    pathRules: ['typescript.md'],
    registers: [
      {
        available: true,
        commits: 3,
        detail: 'per-file',
        directory: 'docs/product/requirements',
        files: {
          'docs/product/requirements/one.md': {
            commits: 3,
            lastTouched: '2026-09-01',
          },
        },
        heading: 'Product requirement register',
        note: 'note',
        window: WINDOW,
      },
    ],
    shallowClone: false,
    skills: [
      {
        carriedFromSnapshot: 2,
        fromTranscripts: 4,
        inInventory: true,
        name: 'unslop',
        total: 6,
        window: WINDOW,
      },
    ],
    subagents: [
      {
        carriedFromSnapshot: 0,
        fromTranscripts: 0,
        inInventory: true,
        name: 'fallow-scan',
        total: 0,
        window: WINDOW,
      },
    ],
    transcripts: {
      available: true,
      clockOverridden: false,
      files: 3,
      observedBackTo: '2026-08-06',
      reachBack: '2026-08-06',
      retentionDays: 30,
      retentionDeclaredIn: '.claude/settings.json',
      retentionSeenSince: '2026-08-06',
      simulatedHorizon: false,
      snapshot: {
        earliestDay: '2026-08-01',
        path: 'reports/usage/snapshot.json',
      },
    },
    window: WINDOW,
    workflows: {
      available: true,
      rows: [{ count: 42, file: 'check-safe.yml', window: WINDOW }],
    },
    ...overrides,
  });
