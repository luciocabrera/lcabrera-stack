/*
 * A usage report that prints bare numbers invites the wrong conclusion from
 * every one of them, so the wording is part of the contract: what the number
 * came from, what window it covers, why a zero settles nothing, and why the
 * path rules get no number at all.
 */
import { describe, expect, it } from 'vite-plus/test';

import { renderReport } from './usage-render.mjs';

const WINDOW = { days: 90, end: '2026-09-04', start: '2026-06-07' };

const reportWith = (overrides) =>
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
      files: 3,
      retentionDays: 30,
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

describe('renderReport', () => {
  it('names the command that reproduces every number', () => {
    expect(reportWith({})).toContain('vp run usage:report');
  });

  it('says a zero is a question and names the three ways it ends', () => {
    const markdown = reportWith({});

    expect(markdown).toContain('A zero is a question, not a verdict');
    expect(markdown).toContain('The description does not trigger');
    expect(markdown).toContain('The job moved somewhere else');
    expect(markdown).toContain('It is genuinely unneeded');
  });

  it('says transcripts are local and Claude-only', () => {
    expect(reportWith({})).toContain(
      '**Transcripts are local and Claude-only.** Copilot and Gemini leave none',
    );
  });

  it('gives every count its source and its window', () => {
    const markdown = reportWith({});

    expect(markdown).toContain(
      '| `unslop` | 6 | 4 | 2 | Claude Code transcripts + local snapshot | 2026-06-07 → 2026-09-04 (90d) |',
    );
    expect(markdown).toContain(
      '| `check-safe.yml` | 42 | GitHub Actions run history (`gh api`) | 2026-06-07 → 2026-09-04 (90d) |',
    );
    expect(markdown).toContain('`git log` over `docs/product/requirements`');
  });

  it('lists a path rule as unmeasurable, with the reason and no number', () => {
    const markdown = reportWith({});
    const row = markdown
      .split('\n')
      .find((line) => line.includes('.claude/rules/typescript.md'));

    expect(row).toContain('not measurable');
    expect(row).toContain('no invocation is recorded');
    expect(/\d/u.test(row)).toBe(false);
  });

  it('explains why the proxy for a path rule is not reported', () => {
    expect(reportWith({})).toContain(
      'a rule everyone has internalised and a rule nobody',
    );
  });

  it('prints "not read" rather than a zero when the transcripts are missing', () => {
    const markdown = reportWith({
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
        available: false,
        reason: 'no transcript directory at /home/dev/.claude/projects',
        retentionDays: 30,
        simulatedHorizon: false,
        snapshot: {
          earliestDay: undefined,
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain('| `fallow-scan` | not read | not read | 0 |');
    expect(markdown).toContain('no number here is an observation of absence');
  });

  it('reports an unreadable GitHub API as unread, not as no runs', () => {
    const markdown = reportWith({
      workflows: {
        available: false,
        reason: 'gh api failed: authentication required',
        rows: [{ file: 'check-safe.yml', window: WINDOW }],
      },
    });

    expect(markdown).toContain('not a run count of zero');
    expect(markdown).toContain('authentication required');
  });

  it('flags a simulated transcript horizon and names the day it starts at', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        readFrom: '2026-09-04',
        retentionDays: 1,
        simulatedHorizon: true,
        snapshot: {
          earliestDay: '2026-08-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain('simulated transcript horizon of 1 day(s)');
    expect(markdown).toContain('cover 2026-09-04 onward');
    expect(markdown).toContain('2026-09-04 → 2026-09-04 (simulated horizon)');
  });

  it('says an ordinary run read every transcript on disk, under the window it prints', () => {
    const markdown = reportWith({});

    expect(markdown).toContain(
      'every transcript still on disk was read whatever its age',
    );
    expect(markdown).toContain(
      '| Claude Code transcripts | skill and subagent invocations | 2026-06-07 → 2026-09-04 (90d) |',
    );
  });

  it('says the earlier part of a window neither source reaches is unobserved', () => {
    const markdown = reportWith({});

    expect(markdown).toContain('reach back only to 2026-08-06');
    expect(markdown).toContain(
      'the earliest day either source has a record for is 2026-08-01',
    );
    expect(markdown).toContain(
      'Neither source reaches 2026-06-07, so the window above is observed only from 2026-08-01 onward',
    );
    expect(markdown).not.toContain('cover the whole window');
  });

  it('claims whole-window transcript coverage only when a source reaches its start', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        retentionDays: 30,
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-06-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'Together they reach back to 2026-06-07, so the invocation counts above cover the whole window',
    );
  });

  it('says in the report itself that a shallow clone bounds the git counts', () => {
    const markdown = reportWith({ shallowClone: true });

    expect(markdown).toContain('This is a shallow clone');
    expect(markdown).toContain(
      '| `docs/product/requirements/one.md` | 3 | 2026-09-01 | `git log` over `docs/product/requirements` | 2026-06-07 → 2026-09-04 (90d), bounded by the fetched history |',
    );
    expect(markdown).toContain(
      '| `git log` | requirement and coordination register activity | 2026-06-07 → 2026-09-04 (90d), bounded by the fetched history |',
    );
  });

  it('leaves the git windows unqualified when the clone is complete', () => {
    expect(reportWith({})).not.toContain('shallow clone');
  });

  it('keeps a multi-line reason with a pipe inside one table cell', () => {
    const markdown = reportWith({
      workflows: {
        available: true,
        rows: [
          {
            file: 'check-safe.yml',
            reason: 'gh api failed\nwith: a | b\n\n  and a trailing line',
            window: WINDOW,
          },
        ],
      },
    });
    const rows = markdown
      .split('\n')
      .filter((line) => line.includes('check-safe.yml'));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe(
      '| `check-safe.yml` | not read — gh api failed with: a \\| b and a trailing line | GitHub Actions run history (`gh api`) | 2026-06-07 → 2026-09-04 (90d) |',
    );
    expect(rows[0].split(' | ')).toHaveLength(4);
  });

  it('keeps a multi-line reason on one line when a whole source is unread', () => {
    const markdown = reportWith({
      workflows: {
        available: false,
        reason: 'gh: To get started with GitHub CLI\nplease run: gh auth login',
        rows: [{ file: 'check-safe.yml', window: WINDOW }],
      },
    });
    const carrying = markdown
      .split('\n')
      .filter((line) => line.includes('gh auth login'));

    expect(carrying.length).toBeGreaterThan(0);
    expect(
      carrying.every((line) => line.startsWith('|') || line.startsWith('>')),
    ).toBe(true);
    expect(markdown).not.toContain('\nplease run');
  });

  it('says the previous snapshot was kept rather than overwritten', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        retentionDays: 30,
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-09-04',
          path: 'reports/usage/snapshot.json',
          setAside: {
            movedTo:
              'reports/usage/snapshot.json.20260904T100000000Z.unreadable',
            reason: 'Unexpected end of JSON input',
          },
        },
      },
    });

    expect(markdown).toContain('The previous snapshot could not be read');
    expect(markdown).toContain(
      'reports/usage/snapshot.json.20260904T100000000Z.unreadable',
    );
  });
});
