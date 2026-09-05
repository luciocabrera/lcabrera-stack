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
 *
 * `complete` is the same failure one step further on. It is what lets the caller
 * write a permanent record that a day was observed, so the cases below pin that
 * it holds only for a read that took in every transcript it found — one skipped
 * path, one unparsable tool-call record, or nothing in scope at all, and the
 * read vouches for no day.
 *
 * `readFrom` is the other half of that: a read handed a horizon looked at fewer
 * days than the store holds, whatever day the horizon names, so it is reported
 * back rather than left for the caller to re-derive from the flag it passed.
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
  transcriptRead,
} from './usage-transcripts.mjs';

const ROOTS = ['/home/dev/repo', '/home/dev/worktree'];

const entryWith = ({ content, cwd = '/home/dev/repo' }) => ({
  cwd,
  message: { content },
  timestamp: '2026-09-04T09:12:00.000Z',
});

describe('transcriptRead', () => {
  it('vouches for nothing until it is given transcripts it read', () => {
    expect(transcriptRead({})).toEqual({
      available: false,
      complete: false,
      files: 0,
      readFrom: undefined,
      reason: undefined,
      tally: {},
      unreadable: [],
    });
  });

  it('vouches for what it read only while it skipped nothing', () => {
    const skipped = [{ path: '/gone.jsonl', reason: 'ENOENT' }];

    expect(transcriptRead({ files: 2 }).complete).toBe(true);
    expect(transcriptRead({ files: 2, skipped }).complete).toBe(false);
  });

  it('reports the horizon it was handed, so the caller can tell a narrowed read', () => {
    expect(transcriptRead({ files: 2 }).readFrom).toBeUndefined();
    expect(transcriptRead({ files: 2, readFrom: '2026-09-04' }).readFrom).toBe(
      '2026-09-04',
    );
  });
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

  it('counts a subagent call that records no type, under a name saying so', () => {
    const entry = entryWith({
      content: [{ input: { prompt: 'go' }, name: 'Agent', type: 'tool_use' }],
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([
      { day: '2026-09-04', kind: 'subagents', name: 'unnamed subagent' },
    ]);
  });

  it('does not attribute an untyped subagent call to a type it did not name', () => {
    const entry = entryWith({
      content: [
        { input: { subagent_type: 7 }, name: 'Task', type: 'tool_use' },
      ],
    });

    expect(invocationsInEntry({ entry, roots: ROOTS })).toEqual([
      { day: '2026-09-04', kind: 'subagents', name: 'unnamed subagent' },
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
    expect(result.complete).toBe(false);
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
    expect(result.complete).toBe(true);
    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
  });

  it('reports a transcript it could not read rather than abandoning the run', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    mkdirSync(join(root, transcriptDirectoryFor(tree), 'vanished.jsonl'));

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(true);
    expect(result.complete).toBe(false);
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
      expect(result.complete).toBe(false);
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

  it('vouches for no day when a record naming a tool call will not parse', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    writeFileSync(
      join(root, transcriptDirectoryFor(tree), 'session.jsonl'),
      [
        JSON.stringify({
          ...skillEntryOn('2026-09-04T09:00:00.000Z'),
          cwd: tree,
        }),
        '{"type":"tool_use","name":"Skill","input":{"skill":"unsl',
      ].join('\n'),
    );

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.tally.skills.unslop).toEqual({ '2026-09-04': 1 });
    expect(result.unreadable[0].reason).toContain('could not be parsed');
  });

  it('vouches for no day when a transcript records a tool call it names no directory for', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    writeFileSync(
      join(root, transcriptDirectoryFor(tree), 'headless.jsonl'),
      `${JSON.stringify(skillEntryOn('2026-09-04T09:30:00.000Z'))}\n`,
    );

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.available).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.unreadable[0].path).toContain('headless.jsonl');
  });

  it('counts a transcript holding no tool call as nothing skipped, whatever else it lacks', () => {
    const { root, tree } = transcriptRootWith({
      entries: [skillEntryOn('2026-09-04T09:00:00.000Z')],
    });
    const directory = join(root, transcriptDirectoryFor(tree));
    writeFileSync(join(directory, 'empty.jsonl'), '');
    writeFileSync(
      join(directory, 'pointer.jsonl'),
      `${JSON.stringify({ messageCount: 0, type: 'teleported-from' })}\n`,
    );

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.complete).toBe(true);
    expect(result.unreadable).toEqual([]);
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
    expect(result.readFrom).toBe('2026-09-04');
  });

  it('reads every day on disk and reports no horizon when it was given none', () => {
    const { root, tree } = transcriptRootWith({
      entries: [
        skillEntryOn('2026-06-10T09:00:00.000Z'),
        skillEntryOn('2026-09-04T09:00:00.000Z'),
      ],
    });

    const result = readTranscriptUsage({ root, workingTrees: [tree] });

    expect(result.readFrom).toBeUndefined();
    expect(result.tally.skills.unslop).toEqual({
      '2026-06-10': 1,
      '2026-09-04': 1,
    });
  });
});
