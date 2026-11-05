import { describe, expect, it } from 'vite-plus/test';

import { openCase } from './adjudicate-command.mjs';

const FILE = 'packages/x/src/a.util.ts';

const candidate = (leftLine) => ({
  candidate_id: `sc_${leftLine}`,
  left: {
    end_line: leftLine + 7,
    name: 'sumPrices',
    path: FILE,
    start_line: leftLine,
  },
  right: {
    end_line: 8,
    name: 'sumCosts',
    path: 'packages/x/src/b.util.ts',
    start_line: 1,
  },
  review_key: 'scr_1',
  similarity: 0.93,
});

const REPORT = {
  candidates: [candidate(20), candidate(1)],
  completion: { status: 'complete' },
  generation: { scope: { paths: [FILE] }, threshold: 0.8 },
};

const run = ({ modelReady = true, report = REPORT } = {}) => {
  const calls = [];
  const written = [];
  openCase({
    argv: ['fallow', `${FILE}:1-8:similar-code`],
    effects: {
      caseNames: () => [],
      fallowRegistry: () => {
        throw new Error('similar-code is not in the issue registry');
      },
      isRepoFile: () => true,
      now: () => '2026-11-05T10:00:00.000Z',
      readText: () => 'export const a = 1;\n',
      run: ({ args, tool }) => {
        calls.push([tool, ...args]);
        return {
          status: 0,
          stdout: JSON.stringify(
            args.includes('status') ? { model_ready: modelReady } : report,
          ),
        };
      },
      shas: () => ({ base: '1'.repeat(40), head: '2'.repeat(40) }),
      write: () => undefined,
      writeJson: (_path, value) => written.push(value),
    },
  });
  return { calls, value: written[0] };
};

describe('openCase — a similar-code candidate', () => {
  it('opens a case on the candidate at the finding, from the report for that file', () => {
    const { calls, value } = run();
    expect(calls).toEqual([
      ['fallow', 'similar-code', 'status', '--format', 'json', '--quiet'],
      [
        'fallow',
        'similar-code',
        '--format',
        'json',
        '--quiet',
        `--file=${FILE}`,
      ],
    ]);
    expect(value.finding).toEqual([candidate(1)]);
    expect(value.case.rule).toBe('similar-code');
    expect(value.explain).toBeNull();
    expect(value.trace).toBeNull();
  });

  it('runs no analysis and fetches nothing when the model is not installed', () => {
    expect(() => run({ modelReady: false })).toThrow(
      "similar-code has no local model installed, so it compared nothing. Installing it is the repository owner's decision; this command never fetches it.",
    );
  });

  it('refuses a partial run as inconclusive', () => {
    expect(() =>
      run({ report: { candidates: [], completion: { status: 'partial' } } }),
    ).toThrow('similar-code finished with completion "partial"');
  });

  it('refuses a location no candidate names', () => {
    expect(() =>
      run({
        report: {
          candidates: [candidate(20)],
          completion: { status: 'complete' },
        },
      }),
    ).toThrow('fallow does not report similar-code');
  });

  it('reads a candidate only from the candidates section', () => {
    expect(() =>
      run({
        report: { completion: { status: 'complete' }, other: [candidate(1)] },
      }),
    ).toThrow('fallow does not report similar-code');
  });
});
