/*
 * Transcripts are the only record of a skill or subagent being invoked, and the
 * failure to guard against is the quiet one: a reader that cannot see them
 * produces the same empty tally as a harness nobody used. These checks pin the
 * shapes it counts, the ones it must not count, and that it says when it read
 * nothing at all.
 *
 * The unreadable-directory case is driven by mode bits, so it is skipped for a
 * root user, for whom mode bits deny nothing. The unreadable-file case beside it
 * needs no such guard and covers the same contract.
 */
import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import {
  namesADirectoryUnderAny,
  transcriptDirectoryFor,
} from './usage-scope.mjs';
import {
  invocationsInEntry,
  readTranscriptUsage,
  tallyByDay,
} from './usage-transcripts.mjs';

const ROOTS = ['/home/dev/repo', '/home/dev/worktree'];

const entryWith = ({ content, cwd = '/home/dev/repo' }) => ({
  cwd,
  message: { content },
  timestamp: '2026-09-04T09:12:00.000Z',
});

describe('invocationsInEntry', () => {
  it('counts a Skill call by the skill it names', () => {
    const entry = entryWith({
      content: [
        { input: { skill: 'unslop' }, name: 'Skill', type: 'tool_use' },
      ],
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([
      { day: '2026-09-04', kind: 'skills', name: 'unslop' },
    ]);
  });

  it('counts an Agent call by its subagent type', () => {
    const entry = entryWith({
      content: [
        {
          input: { subagent_type: 'refactor-verifier' },
          name: 'Agent',
          type: 'tool_use',
        },
      ],
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([
      { day: '2026-09-04', kind: 'subagents', name: 'refactor-verifier' },
    ]);
  });

  it('counts a call made from a linked worktree of the same repository', () => {
    const entry = entryWith({
      content: [{ input: { skill: 'epic' }, name: 'Skill', type: 'tool_use' }],
      cwd: '/home/dev/worktree/packages/ui',
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toHaveLength(1);
  });

  it('ignores a call made from another repository', () => {
    const entry = entryWith({
      content: [{ input: { skill: 'epic' }, name: 'Skill', type: 'tool_use' }],
      cwd: '/home/dev/other-repo',
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([]);
  });

  it('ignores a tool call that is neither a skill nor a subagent', () => {
    const entry = entryWith({
      content: [
        { input: { file_path: 'a.ts' }, name: 'Read', type: 'tool_use' },
      ],
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([]);
  });
});

describe('tallyByDay', () => {
  it('counts each name per day', () => {
    const tally = tallyByDay([
      { day: '2026-09-03', kind: 'skills', name: 'unslop' },
      { day: '2026-09-03', kind: 'skills', name: 'unslop' },
      { day: '2026-09-04', kind: 'skills', name: 'unslop' },
      { day: '2026-09-04', kind: 'subagents', name: 'fallow-scan' },
    ]);

    expect(tally).toEqual({
      skills: { unslop: { '2026-09-03': 2, '2026-09-04': 1 } },
      subagents: { 'fallow-scan': { '2026-09-04': 1 } },
    });
  });
});

const transcriptRootWith = ({ entries, launchedIn }) => {
  const tree = mkdtempSync(join(tmpdir(), 'usage-tree-'));
  const root = mkdtempSync(join(tmpdir(), 'usage-transcripts-'));
  const cwd = launchedIn === undefined ? tree : join(tree, launchedIn);
  const directory = join(root, transcriptDirectoryFor(cwd));
  mkdirSync(directory);
  writeFileSync(
    join(directory, 'session.jsonl'),
    entries.map((entry) => JSON.stringify({ ...entry, cwd })).join('\n'),
  );
  return { root, tree };
};

const skillEntryOn = (timestamp) => ({
  message: {
    content: [{ input: { skill: 'unslop' }, name: 'Skill', type: 'tool_use' }],
  },
  timestamp,
});

describe('readTranscriptUsage', () => {
  it('reports that it could not read, rather than an empty tally', () => {
    const result = readTranscriptUsage({
      root: join('/nonexistent', 'claude', 'projects'),
      since: '2026-08-01',
      workingTrees: ROOTS,
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('no transcript directory');
  });

  it('counts an invocation older than the retention default when no horizon is given', () => {
    const { root, tree } = transcriptRootWith({
      entries: [
        skillEntryOn('2026-06-10T09:00:00.000Z'),
        skillEntryOn('2026-09-04T09:00:00.000Z'),
      ],
    });

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.tally.skills.unslop).toEqual({
      '2026-06-10': 1,
      '2026-09-04': 1,
    });
  });

  it('reads a session launched from a directory below a working tree', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
      launchedIn: join('apps', 'showcase'),
    });

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(true);
    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
  });

  it('reports a transcript it could not read rather than abandoning the run', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    mkdirSync(join(root, transcriptDirectoryFor(tree), 'vanished.jsonl'));

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(true);
    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
    expect(result.unreadable).toHaveLength(1);
    expect(result.unreadable[0].path).toContain('vanished.jsonl');
  });

  it.skipIf(process.getuid?.() === 0)(
    'reports a transcript directory it could not list rather than abandoning the run',
    () => {
      const { root, tree } = transcriptRootWith({
        entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
      });
      const sealed = join(root, transcriptDirectoryFor(join(tree, 'apps')));
      mkdirSync(sealed);
      chmodSync(sealed, 0o000);

      const result = readTranscriptUsage({ root, workingTrees: [tree] });
      chmodSync(sealed, 0o700);

      expect(result.available).toBe(true);
      expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
      expect(result.unreadable).toHaveLength(1);
      expect(result.unreadable[0].path).toBe(sealed);
    },
  );

  it("ignores a sibling repository whose path shares this one's encoded prefix", () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    const sibling = `${tree}-docs`;
    const siblingDirectory = join(root, transcriptDirectoryFor(sibling));
    mkdirSync(siblingDirectory);
    writeFileSync(
      join(siblingDirectory, 'session.jsonl'),
      [
        JSON.stringify({
          ...skillEntryOn('2026-09-04T10:00:00.000Z'),
          cwd: sibling,
        }),
      ].join('\n'),
    );

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(
      namesADirectoryUnderAny({
        directoryName: transcriptDirectoryFor(sibling),
        roots: [tree],
      }),
    ).toBe(true);
    expect(result.files).toBe(1);
    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
  });

  it('reports not read when only a prefix sibling has transcripts', () => {
    const root = mkdtempSync(join(tmpdir(), 'usage-transcripts-'));
    const tree = mkdtempSync(join(tmpdir(), 'usage-tree-'));
    const sibling = `${tree}-docs`;
    const siblingDirectory = join(root, transcriptDirectoryFor(sibling));
    mkdirSync(siblingDirectory);
    writeFileSync(
      join(siblingDirectory, 'session.jsonl'),
      JSON.stringify({
        ...skillEntryOn('2026-09-04T10:00:00.000Z'),
        cwd: sibling,
      }),
    );

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('records a working tree');
  });

  it('reads no transcript filed for another repository', () => {
    const { root } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    const elsewhere = mkdtempSync(join(tmpdir(), 'usage-other-tree-'));

    const result = readTranscriptUsage({
      root,
      workingTrees: [elsewhere],
    });

    expect(result.available).toBe(false);
    expect(result.reason).toContain('records a working tree');
  });

  it('drops what falls before a simulated horizon', () => {
    const { root, tree } = transcriptRootWith({
      entries: [
        skillEntryOn('2026-06-10T09:00:00.000Z'),
        skillEntryOn('2026-09-04T09:00:00.000Z'),
      ],
    });

    const result = readTranscriptUsage({
      root,
      since: '2026-09-04',
      workingTrees: [tree],
    });

    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
  });
});
