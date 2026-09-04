/*
 * Transcripts are the only record of a skill or subagent being invoked, and the
 * failure to guard against is the quiet one: a reader that cannot see them
 * produces the same empty tally as a harness nobody used. These checks pin the
 * shapes it counts, the ones it must not count, and that it says when it read
 * nothing at all.
 */
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

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
});
