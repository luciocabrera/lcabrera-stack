import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { RunEnvelope } from '../envelope/envelope.types.ts';
import type { ReadEnvelope } from './report.types.ts';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { sha256Hex } from '../hashing/sha256Hex.util.ts';
import { evalsReport } from './evalsReport.service.ts';
import { fixtureEnvelope } from './fixtureEnvelope.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const base: RunEnvelope = runEnvelopeSchema.parse(fixtures.get('skills.json'));

const MAIN_OUTCOMES = {
  'skills/react-19/near-miss-1': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-1': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-2': ['pass', 'pass', 'pass'],
  'skills/react-19/trigger-3': ['pass', 'pass', 'fail'],
} as const;

const FEATURE_OUTCOMES = {
  ...MAIN_OUTCOMES,
  'skills/react-19/trigger-1': ['pass', 'fail', 'fail'],
  'skills/react-19/trigger-3': ['pass', 'pass', 'pass'],
} as const;

const FEATURE = 'feat/1234-tighten-react-19';

const RUNS = {
  'few-main.json': fixtureEnvelope({
    base,
    outcomes: { 'skills/react-19/trigger-1': ['pass', 'error', 'fail'] },
    runId: '00000000-0000-4000-8000-000000000005',
  }),
  'few-one-cause.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    contentHash: sha256Hex('react-19 edited'),
    outcomes: { 'skills/react-19/trigger-1': ['pass', 'timeout', 'pass'] },
    runId: '00000000-0000-4000-8000-000000000006',
  }),
  'main.json': fixtureEnvelope({
    base,
    outcomes: MAIN_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000001',
  }),
  'one-cause.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    contentHash: sha256Hex('react-19 edited'),
    costUsd: 1.45,
    durationMs: 13_000,
    outcomes: FEATURE_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000002',
  }),
  'other-model.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    modelId: 'claude-sonnet-5-5',
    outcomes: MAIN_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000004',
  }),
  'two-causes.json': fixtureEnvelope({
    base,
    branch: FEATURE,
    catalogHash: sha256Hex('catalog edited'),
    contentHash: sha256Hex('react-19 edited'),
    outcomes: FEATURE_OUTCOMES,
    runId: '00000000-0000-4000-8000-000000000003',
  }),
};

const readEnvelope: ReadEnvelope = (file) => {
  const envelope = RUNS[file as keyof typeof RUNS] as RunEnvelope | undefined;

  return Promise.resolve(
    envelope === undefined
      ? ({ file, ok: false, problems: ['could not read: ENOENT'] } as const)
      : ({ envelope, file, ok: true, sha256: sha256Hex(file) } as const),
  );
};

type ReportArgs = {
  readonly a: keyof typeof RUNS;
  readonly allowModelChange?: boolean;
  readonly b: keyof typeof RUNS;
  readonly json?: boolean;
};

const report = ({ a, allowModelChange = false, b, json = false }: ReportArgs) =>
  evalsReport({
    a,
    allowModelChange,
    b,
    connectionString: undefined,
    json,
    readEnvelope,
    thresholds: { minTrialsForRate: 6, z: 1.96 },
  });

describe('evalsReport over fixture runs', () => {
  it('names the one hash that changed, with n and the interval on each side', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'one-cause.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('`react-19` content hash. That is one cause.');
    expect(markdown).toMatch(/91\.7% \(n=12, \d+\.\d%–\d+\.\d%\)/u);
    expect(markdown).toMatchSnapshot();
  });

  it('says multiple causes when two hashes changed', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'two-causes.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('skill catalog hash, `react-19` content hash');
    expect(markdown).toContain('multiple causes');
    expect(markdown).toMatchSnapshot();
  });

  it('says insufficient data, with n, when too few trials were counted', async () => {
    const { exitCode, stdout } = await report({
      a: 'few-main.json',
      b: 'few-one-cause.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain(
      'insufficient data (n=2, 1 passed, 1 not counted)',
    );
    expect(markdown).toContain('A rate needs 6 counted trials');
    expect(markdown).toMatchSnapshot();
  });

  it('refuses runs of two models and says why', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'other-model.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(1);
    expect(markdown).toContain('not compared');
    expect(markdown).toContain('--allow-model-change');
    expect(markdown).not.toContain('Pass rate');
    expect(markdown).toMatchSnapshot();
  });

  it('compares runs of two models under --allow-model-change, listing the model as the change', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      allowModelChange: true,
      b: 'other-model.json',
    });
    const [markdown = ''] = stdout;

    expect(exitCode).toBe(0);
    expect(markdown).toContain('(claude-opus-5-5 → claude-sonnet-5-5)');
    expect(markdown).toContain('Changed: model. That is one cause.');
    expect(markdown).toMatchSnapshot();
  });

  it('prints the same comparison as JSON under --json', async () => {
    const { exitCode, stdout } = await report({
      a: 'main.json',
      b: 'one-cause.json',
      json: true,
    });
    const parsed: unknown = JSON.parse(stdout[0] ?? '');

    expect(exitCode).toBe(0);
    expect(parsed).toMatchObject({
      comparisons: [
        {
          changed: { changed: 'content:skill/react-19', kind: 'single' },
          kind: 'comparison',
        },
      ],
    });
    expect(parsed).toMatchSnapshot();
  });
});

describe('evalsReport input', () => {
  it('needs --compare or both --a and --b', async () => {
    const result = await evalsReport({
      a: 'main.json',
      allowModelChange: false,
      connectionString: undefined,
      json: false,
      readEnvelope,
      thresholds: { minTrialsForRate: 6, z: 1.96 },
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr[0]).toMatch(/pass --compare <branch>/u);
  });

  it('refuses --suite without --compare', async () => {
    const result = await evalsReport({
      a: 'main.json',
      allowModelChange: false,
      b: 'one-cause.json',
      connectionString: undefined,
      json: false,
      readEnvelope,
      suite: 'skills',
      thresholds: { minTrialsForRate: 6, z: 1.96 },
    });

    expect(result.exitCode).toBe(1);
  });

  it('names a file it could not read', async () => {
    const { exitCode, stderr } = await report({
      a: 'main.json',
      b: 'absent.json' as keyof typeof RUNS,
    });

    expect(exitCode).toBe(1);
    expect(stderr[0]).toContain(
      'absent.json is neither a run id nor a readable envelope',
    );
  });

  it('needs EVALS_DATABASE_URL to compare against a branch', async () => {
    const result = await evalsReport({
      allowModelChange: false,
      branch: FEATURE,
      compare: 'main',
      connectionString: undefined,
      json: false,
      readEnvelope,
      thresholds: { minTrialsForRate: 6, z: 1.96 },
    });

    expect(result.exitCode).toBe(1);
    expect(result.stderr[0]).toContain('EVALS_DATABASE_URL is unset');
  });
});
