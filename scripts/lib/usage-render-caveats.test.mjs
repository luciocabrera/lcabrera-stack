/*
 * Every source this report reads can cover less than the window printed above
 * it — transcripts expire, a shallow clone truncates git, a snapshot starts
 * late, and a read can fail outright. These checks pin that the markdown says
 * so, because the file is what gets read later and the console warning does not
 * travel with it.
 */
import { describe, expect, it } from 'vite-plus/test';

import { reportWith } from './usage-render-fixtures.mjs';

describe('renderReport coverage caveats', () => {
  it('claims no transcript coverage when the transcripts could not be read', () => {
    const shortWindow = { days: 30, end: '2026-09-04', start: '2026-08-06' };
    const markdown = reportWith({
      registers: [],
      skills: [],
      subagents: [],
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
      window: shortWindow,
      workflows: {
        available: true,
        rows: [{ count: 42, file: 'check-safe.yml', window: shortWindow }],
      },
    });

    expect(markdown).toContain('**The transcripts could not be read**');
    expect(markdown).toContain('no transcript directory');
    expect(markdown).not.toContain('cover the whole window');
    expect(markdown).not.toContain(
      'every transcript still on disk was read whatever its age',
    );
  });

  it('says what the snapshot still carries when the transcripts could not be read', () => {
    const markdown = reportWith({
      transcripts: {
        available: false,
        reason: 'no transcript directory at /home/dev/.claude/projects',
        retentionDays: 30,
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-08-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'hold only what the local snapshot carries, which reaches back to 2026-08-01',
    );
  });

  it('flags a simulated transcript horizon and names the day it starts at', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-09-04',
        reachBack: '2026-09-04',
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

  it('names the file that declared the retention it reports', () => {
    expect(reportWith({})).toContain(
      'Transcripts are kept for 30 day(s) (`cleanupPeriodDays` in `.claude/settings.json`)',
    );
  });

  it('says an assumed retention was assumed rather than declared', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-08-06',
        reachBack: '2026-08-06',
        retentionDays: 30,
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-08-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'No `cleanupPeriodDays` is declared in any settings file this run could read',
    );
    expect(markdown).toContain('assumed rather than observed');
    expect(markdown).not.toContain('Transcripts are kept for 30 day(s)');
  });

  it('says the unobserved part of the window is unobserved, not empty', () => {
    const markdown = reportWith({});

    expect(markdown).toContain('reach back only to 2026-08-06');
    expect(markdown).toContain(
      'the earliest day it holds a record for is 2026-08-01',
    );
    expect(markdown).toContain(
      'Observation runs continuously back only to 2026-08-06',
    );
    expect(markdown).toContain('unobserved rather than empty');
    expect(markdown).not.toContain('cover it in full');
  });

  it('does not read a recorded day earlier than observation as coverage', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-08-06',
        reachBack: '2026-08-06',
        retentionDays: 30,
        retentionDeclaredIn: '.claude/settings.json',
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-06-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'Observation runs continuously back only to 2026-08-06',
    );
    expect(markdown).toContain('A recorded day earlier than that is a record');
    expect(markdown).not.toContain('cover it in full');
  });

  it('claims whole-window coverage only when observation reaches the start', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-05-30',
        reachBack: '2026-08-06',
        retentionDays: 30,
        retentionDeclaredIn: '.claude/settings.json',
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-06-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'observed the window continuously back to 2026-06-07, so the invocation counts above cover it in full',
    );
  });

  it('says a run that set its own clock observed nothing of its own', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        clockOverridden: true,
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
    });

    expect(markdown).toContain('This run set its own clock with `--now`');
    expect(markdown).toContain('recorded no observation of its own');
  });

  it('says how far back it vouches when the retention changed since the last run', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        clockOverridden: false,
        files: 3,
        observedBackTo: '2026-09-04',
        reachBack: '2026-08-06',
        retentionDays: 30,
        retentionDeclaredIn: '.claude/settings.json',
        retentionSeenSince: '2026-09-04',
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-08-01',
          path: 'reports/usage/snapshot.json',
        },
      },
    });

    expect(markdown).toContain(
      'This run claims observation only from 2026-09-04',
    );
    expect(markdown).toContain('does not vouch for it');
  });

  it('says nothing about vouching when the retention has held the whole horizon', () => {
    expect(reportWith({})).not.toContain(
      'This run claims observation only from',
    );
  });

  it('says a skipped transcript makes the counts a lower bound', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-08-06',
        reachBack: '2026-08-06',
        retentionDays: 30,
        retentionDeclaredIn: '.claude/settings.json',
        simulatedHorizon: false,
        snapshot: {
          earliestDay: '2026-08-01',
          path: 'reports/usage/snapshot.json',
        },
        unreadable: [
          {
            path: '/home/dev/.claude/projects/-home-dev-repo/gone.jsonl',
            reason: 'ENOENT: no such file or directory',
          },
        ],
      },
    });

    expect(markdown).toContain(
      '1 transcript path(s) could not be read in full',
    );
    expect(markdown).toContain('a lower bound rather than a total');
    expect(markdown).toContain(
      'this run added no day of its own to the coverage above',
    );
    expect(markdown).toContain('gone.jsonl');
    expect(markdown).toContain('3 transcript file(s), 1 skipped as unreadable');
  });

  it('says nothing about skipped transcripts when every one was read', () => {
    expect(reportWith({})).not.toContain(
      'could not be read in full** and were skipped',
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

  it('says the previous snapshot was kept rather than overwritten', () => {
    const markdown = reportWith({
      transcripts: {
        available: true,
        files: 3,
        observedBackTo: '2026-08-06',
        reachBack: '2026-08-06',
        retentionDays: 30,
        retentionDeclaredIn: '.claude/settings.json',
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
