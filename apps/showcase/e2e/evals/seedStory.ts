import type { SeedRun, SeedScore, SeedTask, SeedTrial } from './seedEnvelope';

export const SEED_MODEL = 'claude-opus-5-5';

export const SEED_EARLIER_MODEL = 'claude-sonnet-5';

export const SEED_FEATURE_BRANCH = 'feat/trigger-wording';

export const SEED_SKIPPED_BRANCH = 'feat/skipped';

export const SEED_QUALITY_BASELINE = '0b5e1100-0000-4000-8000-000000000001';

export const SEED_RUNS = {
  featureSkills: 'f1000000-0000-4000-8000-000000000001',
  qualityBaselineFirst: 'a1000000-0000-4000-8000-000000000001',
  qualityBaselineSecond: 'a2000000-0000-4000-8000-000000000002',
  qualityBaselineThird: 'a3000000-0000-4000-8000-000000000003',
  qualityLatest: 'a5000000-0000-4000-8000-000000000005',
  qualityPrevious: 'a4000000-0000-4000-8000-000000000004',
  rules: 'c1000000-0000-4000-8000-000000000001',
  skillsFirst: '51000000-0000-4000-8000-000000000001',
  skillsLatest: '54000000-0000-4000-8000-000000000004',
  skillsPrevious: '53000000-0000-4000-8000-000000000003',
  skillsSecond: '52000000-0000-4000-8000-000000000002',
  skippedSkills: 'e0000000-0000-4000-8000-000000000001',
  verifier: 'b1000000-0000-4000-8000-000000000001',
} as const;

export const SEED_TASKS = {
  dropped: 'skills/react-19/trigger-2',
  nearMiss: 'skills/store-pattern/near-miss-1',
  steady: 'skills/react-19/trigger-1',
  troubled: 'skills/store-pattern/trigger-1',
  wobbly: 'skills/react-19/trigger-3',
} as const;

export const SEED_ANNOTATION = {
  at: '2026-10-11T12:00:00.000Z',
  kind: 'incident',
} as const;

export const SEED_VERIFIER_TASKS = 170;

const REACT = { kind: 'skill', name: 'react-19' } as const;

const STORE = { kind: 'skill', name: 'store-pattern' } as const;

const SKILL_TASKS: readonly SeedTask[] = [
  {
    expectedSkill: 'react-19',
    key: SEED_TASKS.steady,
    kind: 'trigger',
    subject: REACT,
  },
  {
    expectedSkill: 'react-19',
    key: SEED_TASKS.dropped,
    kind: 'trigger',
    subject: REACT,
  },
  {
    expectedSkill: 'react-19',
    key: SEED_TASKS.wobbly,
    kind: 'trigger',
    subject: REACT,
  },
  {
    expectedSkill: 'store-pattern',
    key: SEED_TASKS.nearMiss,
    kind: 'near-miss',
    subject: STORE,
  },
  {
    expectedSkill: 'store-pattern',
    key: SEED_TASKS.troubled,
    kind: 'trigger',
    subject: STORE,
  },
];

const QUALITY_TASKS: readonly SeedTask[] = [
  { key: 'skill-quality/react-19', kind: 'quality', subject: REACT },
  {
    key: 'skill-quality/unslop',
    kind: 'quality',
    subject: { kind: 'skill', name: 'unslop' },
  },
];

const PASSING: readonly SeedTrial[] = ['pass', 'pass', 'pass'];

const FAILING: readonly SeedTrial[] = ['fail', 'fail', 'fail'];

const SKIPPED: readonly SeedTrial[] = ['skipped', 'skipped', 'skipped'];

const TASK_NAMES = [
  'dropped',
  'nearMiss',
  'steady',
  'troubled',
  'wobbly',
] as const satisfies readonly (keyof typeof SEED_TASKS)[];

type SkillsArgs = {
  readonly overrides?: Partial<
    Record<(typeof TASK_NAMES)[number], readonly SeedTrial[]>
  >;
  readonly run: Omit<SeedRun, 'suite' | 'tasks' | 'trials'>;
};

const skillsRun = ({ overrides = {}, run }: SkillsArgs) => ({
  ...run,
  suite: 'skills' as const,
  tasks: SKILL_TASKS,
  trials: Object.fromEntries(
    TASK_NAMES.map((name) => [SEED_TASKS[name], overrides[name] ?? PASSING]),
  ),
});

type QualityArgs = {
  readonly baselineId?: string;
  readonly react: SeedScore;
  readonly runId: string;
  readonly startedAt: string;
  readonly unslop: number;
};

const qualityRun = ({
  baselineId,
  react,
  runId,
  startedAt,
  unslop,
}: QualityArgs) => ({
  ...(baselineId !== undefined && { baselineId }),
  branch: 'main',
  modelId: SEED_MODEL,
  runId,
  scores: {
    'skill-quality/react-19': react,
    'skill-quality/unslop': {
      dimensions: { description: unslop },
      overall: unslop,
    },
  },
  startedAt,
  suite: 'skill-quality' as const,
  tasks: QUALITY_TASKS,
  trials: {
    'skill-quality/react-19': [react.overall >= 3 ? 'pass' : 'fail'] as const,
    'skill-quality/unslop': ['pass'] as const,
  },
});

const VERIFIER_TASKS: readonly SeedTask[] = Array.from(
  { length: SEED_VERIFIER_TASKS },
  (_, index) => ({
    key: `verifier-fixtures/fixture-${String(index + 1).padStart(3, '0')}`,
    kind: 'fixture',
    subject: { kind: 'agent', name: 'refactor-verifier' },
  }),
);

export const SEED_STORY: readonly SeedRun[] = [
  {
    ...skillsRun({
      run: {
        branch: SEED_SKIPPED_BRANCH,
        modelId: SEED_MODEL,
        runId: SEED_RUNS.skippedSkills,
        startedAt: '2026-10-03T02:00:00.000Z',
      },
    }),
    trials: Object.fromEntries(
      Object.values(SEED_TASKS).map((key) => [key, SKIPPED]),
    ),
  },
  skillsRun({
    overrides: { wobbly: ['pass', 'fail', 'pass'] },
    run: {
      branch: 'main',
      modelId: SEED_EARLIER_MODEL,
      runId: SEED_RUNS.skillsFirst,
      startedAt: '2026-10-05T02:00:00.000Z',
    },
  }),
  qualityRun({
    baselineId: SEED_QUALITY_BASELINE,
    react: { dimensions: { description: 4 }, overall: 4 },
    runId: SEED_RUNS.qualityBaselineFirst,
    startedAt: '2026-10-07T03:00:00.000Z',
    unslop: 3,
  }),
  qualityRun({
    baselineId: SEED_QUALITY_BASELINE,
    react: { dimensions: { description: 5 }, overall: 5 },
    runId: SEED_RUNS.qualityBaselineSecond,
    startedAt: '2026-10-08T03:00:00.000Z',
    unslop: 4,
  }),
  qualityRun({
    baselineId: SEED_QUALITY_BASELINE,
    react: { dimensions: { description: 4 }, overall: 4 },
    runId: SEED_RUNS.qualityBaselineThird,
    startedAt: '2026-10-09T03:00:00.000Z',
    unslop: 3,
  }),
  skillsRun({
    overrides: {
      troubled: ['pass', 'error:error_max_turns', 'pass'],
      wobbly: ['pass', 'pass', 'fail'],
    },
    run: {
      branch: 'main',
      contentVersion: { 'react-19': 'v2' },
      modelId: SEED_MODEL,
      runId: SEED_RUNS.skillsSecond,
      startedAt: '2026-10-10T02:00:00.000Z',
    },
  }),
  skillsRun({
    run: {
      branch: 'main',
      contentVersion: { 'react-19': 'v2' },
      modelId: SEED_MODEL,
      runId: SEED_RUNS.skillsPrevious,
      startedAt: '2026-10-12T02:00:00.000Z',
    },
  }),
  skillsRun({
    overrides: {
      dropped: ['pass', 'fail', 'fail'],
      troubled: ['pass', 'error:rate_limit', 'timeout'],
    },
    run: {
      branch: 'main',
      contentVersion: { 'react-19': 'v2' },
      modelId: SEED_MODEL,
      runId: SEED_RUNS.skillsLatest,
      startedAt: '2026-10-13T02:00:00.000Z',
    },
  }),
  skillsRun({
    overrides: { nearMiss: FAILING, steady: FAILING, troubled: FAILING },
    run: {
      branch: SEED_FEATURE_BRANCH,
      catalog: 'v2',
      contentVersion: { 'react-19': 'v2' },
      modelId: SEED_MODEL,
      runId: SEED_RUNS.featureSkills,
      startedAt: '2026-10-14T02:00:00.000Z',
    },
  }),
  qualityRun({
    react: { dimensions: { description: 4, examples: 3 }, overall: 4 },
    runId: SEED_RUNS.qualityPrevious,
    startedAt: '2026-10-15T03:00:00.000Z',
    unslop: 4,
  }),
  qualityRun({
    react: { dimensions: { description: 2, examples: 4 }, overall: 2 },
    runId: SEED_RUNS.qualityLatest,
    startedAt: '2026-10-16T03:00:00.000Z',
    unslop: 3,
  }),
  {
    branch: 'main',
    modelId: SEED_MODEL,
    runId: SEED_RUNS.verifier,
    startedAt: '2026-10-17T04:00:00.000Z',
    suite: 'verifier-fixtures',
    tasks: VERIFIER_TASKS,
    trials: Object.fromEntries(
      VERIFIER_TASKS.map(({ key }, index) => [
        key,
        index % 85 === 0 ? ['pass', 'fail', 'pass'] : PASSING,
      ]),
    ),
  },
  {
    branch: 'main',
    isCostReported: false,
    modelId: SEED_MODEL,
    runId: SEED_RUNS.rules,
    startedAt: '2026-10-18T05:00:00.000Z',
    suite: 'rules-consistency',
    tasks: [
      {
        key: 'rules-consistency/typescript/indexed',
        kind: 'rule-check',
        subject: { kind: 'rule', name: 'typescript' },
      },
    ],
    trials: { 'rules-consistency/typescript/indexed': SKIPPED },
  },
];
