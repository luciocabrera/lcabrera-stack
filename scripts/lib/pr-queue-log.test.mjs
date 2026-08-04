/**
 * Policy §7 sets the bar the log has to clear: a reader must be able to
 * re-derive a verdict from the log alone. So these assert the log carries the
 * things that make that possible — the probes, the rule ids, the ordering edges,
 * whether anything actually ran — and that a verdict with no evidence is called
 * out in the log rather than rendering as a clean entry.
 */
import { describe, expect, it } from 'vite-plus/test';

import { renderEntry, renderLog, toJson } from './pr-queue-log.mjs';

const entry = (overrides = {}) => ({
  decision: {
    actions: [
      { command: 'gh pr merge 42 --squash', rule: 'A5', why: 'all gates pass' },
    ],
    evidence: [
      { observation: '14 checks, all pass', probe: 'gh pr checks 42' },
    ],
    reasoning: 'Every §2 gate holds.',
    ruleIds: ['E1', 'E3', 'A5'],
    verdict: 'MERGE',
    ...overrides.decision,
  },
  gate: { verdict: 'MERGE', ...overrides.gate },
  position: {
    edges: [{ from: 41, rule: 'O3', to: 42 }],
    index: 0,
    number: 42,
    total: 1,
    ...overrides.position,
  },
  pr: {
    author: 'someone',
    baseRefName: 'main',
    files: [{ path: 'a.ts' }],
    headRefName: 'feat/a',
    isDraft: false,
    number: 42,
    size: 4,
    title: 'feat(a): thing',
    url: 'https://github.com/o/r/pull/42',
    ...overrides.pr,
  },
});

describe('renderEntry', () => {
  it('carries the probes, the rules and the commands', () => {
    const markdown = renderEntry(entry());
    expect(markdown).toContain('gh pr checks 42');
    expect(markdown).toContain('14 checks, all pass');
    expect(markdown).toContain('`E1`, `E3`, `A5`');
    expect(markdown).toContain('gh pr merge 42 --squash');
  });

  it('shows the ceiling when the model tightened past it', () => {
    const markdown = renderEntry(
      entry({ decision: { verdict: 'ESCALATE' }, gate: { verdict: 'ACT' } }),
    );
    expect(markdown).toContain('tightened to `ESCALATE`');
  });

  it('names an evidence-free verdict as the S10 problem it is', () => {
    const markdown = renderEntry(entry({ decision: { evidence: [] } }));
    expect(markdown).toMatch(/S10/);
  });

  it('says a PR is unconstrained rather than silently showing nothing', () => {
    const markdown = renderEntry(entry({ position: { edges: [] } }));
    expect(markdown).toContain('O5');
  });
});

describe('renderLog', () => {
  const pass = {
    cycle: [],
    model: 'sonnet',
    repository: 'o/r',
    startedAt: '2026-08-04T12:00:00.000Z',
  };

  it('states the mode unambiguously — a reader must never have to infer it', () => {
    expect(renderLog({ entries: [entry()], mode: 'dry-run', pass })).toContain(
      'nothing was executed',
    );
    expect(renderLog({ entries: [entry()], mode: 'apply', pass })).toContain(
      'were executed',
    );
  });

  it('counts every verdict class in the header', () => {
    const markdown = renderLog({
      entries: [entry(), entry({ decision: { verdict: 'ESCALATE' } })],
      mode: 'dry-run',
      pass,
    });
    expect(markdown).toContain('1 MERGE');
    expect(markdown).toContain('1 ESCALATE');
  });

  it('surfaces a dependency cycle at the top', () => {
    const markdown = renderLog({
      entries: [entry()],
      mode: 'dry-run',
      pass: { ...pass, cycle: [7, 8] },
    });
    expect(markdown).toContain('Dependency cycle');
    expect(markdown).toContain('#7, #8');
  });
});

describe('toJson', () => {
  it('keeps the fields a later pass diffs against', () => {
    const json = toJson({
      entries: [entry()],
      mode: 'dry-run',
      pass: { cycle: [], model: 'sonnet', repository: 'o/r', startedAt: 'x' },
    });
    expect(json.decisions[0]).toMatchObject({
      ceiling: 'MERGE',
      number: 42,
      position: 1,
      verdict: 'MERGE',
    });
    expect(json.mode).toBe('dry-run');
  });
});
