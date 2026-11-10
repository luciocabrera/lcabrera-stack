import type {
  AccuracyViewRow,
  AdjudicationCase,
  AdjudicationVerdict,
} from './EvalsAdjudications.types';

const JUDGE_PROMPT = 'a'.repeat(64);
const ADVERSARY_PROMPT = 'b'.repeat(64);
const EDITED_ADVERSARY_PROMPT = 'c'.repeat(64);

export const adjudication = (
  overrides: Partial<AdjudicationCase> & Pick<AdjudicationCase, 'caseId'>,
): AdjudicationCase => ({
  analyzer: 'biome',
  builderModel: 'claude-opus-5-5',
  createdAt: new Date('2026-11-01T10:00:00.000Z'),
  outcome: 'dismissed',
  pr: 1594,
  rule: 'lint/a11y/noNoninteractiveElementToInteractiveRole',
  truth: undefined,
  truthSource: undefined,
  ...overrides,
});

export const seat = (
  overrides: Partial<AdjudicationVerdict> &
    Pick<AdjudicationVerdict, 'caseId' | 'model' | 'role' | 'verdict'>,
): AdjudicationVerdict => ({
  agentPromptHash: overrides.role === 'judge' ? JUDGE_PROMPT : ADVERSARY_PROMPT,
  costUsd: 0.1,
  durationMs: 30_000,
  tokensIn: 1000,
  tokensOut: 2000,
  ...overrides,
});

export const CASES: readonly AdjudicationCase[] = [
  adjudication({
    analyzer: 'oxlint',
    caseId: 'FP-0004',
    createdAt: new Date('2026-11-04T10:00:00.000Z'),
    outcome: 'fixed',
    rule: 'unicorn/no-nested-ternary',
  }),
  adjudication({
    caseId: 'FP-0003',
    createdAt: new Date('2026-11-03T10:00:00.000Z'),
    truth: 'REAL',
    truthSource: 'reopened',
  }),
  adjudication({
    analyzer: 'fallow',
    builderModel: undefined,
    caseId: 'FP-0002',
    createdAt: new Date('2026-11-02T10:00:00.000Z'),
    outcome: 'split',
    pr: undefined,
    rule: 'complexity',
    truth: 'REAL',
    truthSource: 'lucio',
  }),
  adjudication({
    caseId: 'FP-0001',
    truth: 'FALSE_POSITIVE',
    truthSource: 'lucio',
  }),
];

type PanelArgs = {
  readonly caseId: string;
  readonly verdicts: readonly [Verdict, Verdict, Verdict];
};

type Verdict = AdjudicationVerdict['verdict'];

const panel = ({ caseId, verdicts }: PanelArgs) => {
  const [opus, sonnet, fable] = verdicts;

  return [
    seat({ caseId, model: 'claude-opus-5-5', role: 'judge', verdict: opus }),
    seat({
      caseId,
      durationMs: 20_000,
      model: 'claude-sonnet-5-5',
      role: 'judge',
      verdict: sonnet,
    }),
    seat({
      caseId,
      costUsd: 1,
      durationMs: 90_000,
      model: 'claude-fable-5-1',
      role: 'adversary',
      verdict: fable,
    }),
  ];
};

export const VERDICTS: readonly AdjudicationVerdict[] = [
  ...panel({
    caseId: 'FP-0001',
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
  }),
  ...panel({
    caseId: 'FP-0002',
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'REAL'],
  }).map((verdict) =>
    verdict.role === 'adversary' ? { ...verdict, costUsd: undefined } : verdict,
  ),
  ...panel({
    caseId: 'FP-0003',
    verdicts: ['FALSE_POSITIVE', 'FALSE_POSITIVE', 'FALSE_POSITIVE'],
  }).map((verdict) =>
    verdict.role === 'adversary'
      ? { ...verdict, agentPromptHash: EDITED_ADVERSARY_PROMPT }
      : verdict,
  ),
  ...panel({ caseId: 'FP-0004', verdicts: ['REAL', 'REAL', 'REAL'] }),
];

export const ACCURACY: readonly AccuracyViewRow[] = [
  {
    correct: 2,
    falseAlarms: 0,
    missedReal: 1,
    model: 'claude-fable-5-1',
    verdicts: 3,
    verifierRole: 'adversary',
  },
  {
    correct: 1,
    falseAlarms: 0,
    missedReal: 2,
    model: 'claude-opus-5-5',
    verdicts: 3,
    verifierRole: 'judge',
  },
];
