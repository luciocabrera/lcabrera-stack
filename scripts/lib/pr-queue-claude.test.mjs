/**
 * Two properties matter here and neither is about formatting: the prompt must
 * carry the policy verbatim (an operator following a paraphrase of its own rules
 * is not following them), and a response the model got wrong must come back as a
 * failure rather than as a confident half-parsed verdict.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  buildDecisionPrompt,
  DECIDE_TOOLS,
  DECISION_SCHEMA,
  decideArgs,
  parseDecision,
} from './pr-queue-claude.mjs';

const pr = {
  author: 'someone',
  baseRefName: 'main',
  body: '',
  checks: {
    all: [{ name: 'Quality Gate', state: 'SUCCESS' }],
    failed: [],
    pending: [],
  },
  files: [{ additions: 3, deletions: 1, path: 'src/a.ts' }],
  headRefName: 'feat/a',
  isDraft: false,
  mergeable: 'MERGEABLE',
  mergeStateStatus: 'CLEAN',
  number: 42,
  reviewDecision: '',
  size: 4,
  threads: {
    total: 1,
    unresolved: [
      {
        author: 'copilot',
        body: 'hard-coded count',
        isOutdated: false,
        path: 'a.md',
      },
    ],
  },
  title: 'feat(a): thing',
  url: 'https://github.com/o/r/pull/42',
};

const gate = {
  blockers: [{ detail: '1 unresolved thread', id: 'E4' }],
  flags: [{ detail: 'tests changed', id: 'S2' }],
  stops: [],
  verdict: 'ACT',
};

const position = {
  edges: [{ from: 41, rule: 'O3', to: 42 }],
  index: 0,
  number: 42,
  total: 2,
};

describe('buildDecisionPrompt', () => {
  const policy =
    '# PR Queue Operator Policy\nS2 — any test deletion escalates.';
  const prompt = buildDecisionPrompt({ gate, policy, position, pr });

  it('carries the policy verbatim rather than a summary of it', () => {
    expect(prompt).toContain(policy);
  });

  it('states the mechanical ceiling as binding', () => {
    expect(prompt).toContain('ceiling verdict: ACT');
    expect(prompt).toMatch(/may never be weaker than the ceiling/);
  });

  it('surfaces every unresolved thread so A4 has something to act on', () => {
    expect(prompt).toContain('hard-coded count');
    expect(prompt).toContain('copilot');
  });

  it('includes the ordering edges that place this PR', () => {
    expect(prompt).toContain('O3: #41 merges before #42');
  });

  it('names the flags the model has to discharge', () => {
    expect(prompt).toContain('S2: tests changed');
  });

  it('forbids deferring to a human without a §5 trigger', () => {
    expect(prompt).toMatch(/only ESCALATE, and only\s+with a §5 trigger id/);
  });
});

describe('decideArgs', () => {
  const args = decideArgs({ model: 'sonnet' });

  it('forces structured output', () => {
    expect(args).toContain('--json-schema');
    expect(args[args.indexOf('--output-format') + 1]).toBe('json');
  });

  it('grants no write tool to the decide pass', () => {
    const tools = args[args.indexOf('--allowedTools') + 1];
    expect(tools).toBe(DECIDE_TOOLS.join(','));
    for (const forbidden of ['Edit', 'Write', 'gh pr merge']) {
      expect(tools).not.toContain(forbidden);
    }
  });

  it('passes no prompt in argv — it goes on stdin', () => {
    expect(args).not.toContain('--print=');
    expect(args.some((argument) => argument.includes('POLICY'))).toBe(false);
  });
});

describe('DECISION_SCHEMA', () => {
  it('admits exactly the four policy verdicts', () => {
    expect(DECISION_SCHEMA.properties.verdict.enum).toEqual([
      'MERGE',
      'ACT',
      'WAIT',
      'ESCALATE',
    ]);
  });

  it('requires evidence, so a bare verdict cannot validate', () => {
    expect(DECISION_SCHEMA.required).toContain('evidence');
    expect(DECISION_SCHEMA.required).toContain('ruleIds');
  });
});

describe('parseDecision', () => {
  const decision = {
    actions: [],
    evidence: [{ observation: 'clean', probe: 'gh pr checks 42' }],
    reasoning: 'all gates pass',
    ruleIds: ['E1'],
    verdict: 'MERGE',
  };

  it('reads the decision out of the CLI envelope', () => {
    const stdout = JSON.stringify({ result: JSON.stringify(decision) });
    expect(parseDecision(stdout).decision).toEqual(decision);
  });

  it('recovers a fenced response', () => {
    const stdout = JSON.stringify({
      result: `\`\`\`json\n${JSON.stringify(decision)}\n\`\`\``,
    });
    expect(parseDecision(stdout).decision.verdict).toBe('MERGE');
  });

  it('accepts an already-parsed object result', () => {
    expect(
      parseDecision(JSON.stringify({ result: decision })).decision,
    ).toEqual(decision);
  });

  it('reports an error envelope as an error, not a verdict', () => {
    const stdout = JSON.stringify({ is_error: true, result: 'rate limited' });
    expect(parseDecision(stdout)).toEqual({ error: 'rate limited' });
  });

  it('refuses a response with no verdict rather than inventing one', () => {
    const stdout = JSON.stringify({
      result: JSON.stringify({ reasoning: 'x' }),
    });
    expect(parseDecision(stdout).decision).toBeUndefined();
    expect(parseDecision(stdout).error).toMatch(/no verdict/);
  });

  it('refuses unparseable output', () => {
    expect(parseDecision('not json').error).toMatch(/unparseable/);
  });
});
