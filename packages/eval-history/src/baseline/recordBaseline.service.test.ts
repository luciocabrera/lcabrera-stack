import { describe, expect, it, vi } from 'vite-plus/test';

import type { IngestQuery } from '../ingest/ingest.types.ts';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import { memoryFileSystem } from '../ingest/memoryFileSystem.util.ts';
import {
  DELETE_BASELINE_SQL,
  INSERT_BASELINE_SQL,
  SELECT_SUBJECT_ID_SQL,
} from './baseline.constants.ts';
import { baselineFixtures } from './baselineFixtures.service.ts';
import { recordBaseline } from './recordBaseline.service.ts';
import { stubBaselineRun } from './stubBaselineRun.service.ts';

const { skills } = await baselineFixtures();

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';
const BASELINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

type RunArgs = {
  readonly baselineId: string;
  readonly outcome: 'error' | 'fail' | 'pass';
};

const run = ({ baselineId, outcome }: RunArgs) =>
  stubBaselineRun({
    baselineId,
    fixture: skills,
    trialsBySkill: { 'react-19': [{ outcome }, { outcome: 'pass' }] },
  });

const skipped = () =>
  stubBaselineRun({
    baselineId: BASELINE,
    fixture: skills,
    trialsBySkill: { 'react-19': [{ outcome: 'skipped' }] },
  });

const ROWS_BY_STATEMENT = [
  ['insert into evals.eval_run', [{ run_id: 'stored' }]],
  ['eval_subject_version', [{ id: 1, subject_id: 9 }]],
  ['eval_task_version', [{ id: 9 }]],
  [SELECT_SUBJECT_ID_SQL, [{ id: 9 }]],
] as const;

const rowsFor = (text: string) =>
  ROWS_BY_STATEMENT.find(([statement]) => text.includes(statement))?.[1] ?? [];

const database = () => {
  const sent: IngestQuery[] = [];
  const connect = vi.fn(() =>
    Promise.resolve({
      client: {
        query: (query: IngestQuery) => {
          sent.push(query);

          return Promise.resolve({ rows: rowsFor(query.text) });
        },
      },
      end: () => Promise.resolve(),
    }),
  );

  return { connect, sent };
};

type RecordRunsArgs = {
  readonly connect: NonNullable<
    Parameters<typeof recordBaseline>[0]['connect']
  >;
  readonly envelopes: readonly ReturnType<typeof run>[];
};

const recordRuns = ({ connect, envelopes }: RecordRunsArgs) =>
  recordBaseline({
    baselineId: BASELINE,
    connect,
    connectionString: URL_,
    fileSystem: envelopeFileSystem(envelopes),
    paths: ['/results/skills'],
    runs: envelopes.filter(
      ({ run: { baseline_id } }) => baseline_id === BASELINE,
    ).length,
  });

const filesOf = (
  envelopes: readonly { readonly run: { readonly run_id: string } }[],
) =>
  Object.fromEntries(
    envelopes.map((envelope) => [
      `/results/skills/${envelope.run.run_id}.json`,
      JSON.stringify(envelope),
    ]),
  );

describe('recordBaseline', () => {
  it('ingests only its own runs, then writes the baseline rows', async () => {
    const { connect, sent } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: OTHER, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'fail' }),
      ],
    });
    const runInserts = sent.filter(({ text }) =>
      text.includes('insert into evals.eval_run'),
    );
    const baselineInserts = sent.filter(
      ({ text }) => text === INSERT_BASELINE_SQL,
    );

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toEqual([]);
    expect(runInserts).toHaveLength(2);
    expect(runInserts.every(({ values }) => values?.includes(BASELINE))).toBe(
      true,
    );
    expect(baselineInserts.map(({ values }) => values?.slice(0, 5))).toEqual([
      [BASELINE, 'skills', 'claude-opus-5-5', undefined, 'pass_rate'],
      [BASELINE, 'skills', 'claude-opus-5-5', 9, 'pass_rate'],
    ]);
    expect(summary.stdout.slice(-3)).toEqual([
      `Baseline ${BASELINE}: skills on claude-opus-5-5 at aaaaaaaaaaaa`,
      '  suite skills pass_rate: mean 0.7500, sd 0.3536 over 2 runs',
      '  skill react-19 pass_rate: mean 0.7500, sd 0.3536 over 2 runs',
    ]);
  });

  it('fails without writing when no envelope carries the baseline id', async () => {
    const { connect } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [run({ baselineId: OTHER, outcome: 'pass' })],
    });

    expect(summary).toEqual({
      exitCode: 1,
      stderr: [
        `evals:baseline: no envelope under /results/skills belongs to baseline ${BASELINE}`,
      ],
      stdout: [],
    });
    expect(connect).not.toHaveBeenCalled();
  });

  it('writes nothing when the runs cannot reach the database', async () => {
    const summary = await recordRuns({
      connect: () => Promise.reject(new Error('connect ECONNREFUSED')),
      envelopes: [
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'pass' }),
      ],
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.stderr.at(-1)).toBe(
      'evals:baseline: not every run reached the database, so no baseline was written',
    );
  });

  it('ingests a first run, writes no rows yet, and says how to continue', async () => {
    const { connect, sent } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [run({ baselineId: BASELINE, outcome: 'pass' })],
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toEqual([]);
    expect(summary.stdout.at(-1)).toBe(
      `evals:baseline: baseline ${BASELINE} holds 1 usable run(s) and is written once it holds 2; add runs with --baseline-id ${BASELINE}`,
    );
    expect(
      sent.filter(({ text }) => text.includes('insert into evals.eval_run')),
    ).toHaveLength(1);
    expect(sent.map(({ text }) => text)).not.toContain(INSERT_BASELINE_SQL);
    expect(sent.map(({ text }) => text)).not.toContain(DELETE_BASELINE_SQL);
  });

  it('rewrites the rows over every run once a continued baseline holds enough', async () => {
    const { connect, sent } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'fail' }),
        run({ baselineId: BASELINE, outcome: 'fail' }),
      ],
    });
    const texts = sent.map(({ text }) => text);

    expect(summary.exitCode).toBe(0);
    expect(texts.indexOf(DELETE_BASELINE_SQL)).toBeLessThan(
      texts.indexOf(INSERT_BASELINE_SQL),
    );
    expect(
      sent.find(({ text }) => text === DELETE_BASELINE_SQL)?.values,
    ).toEqual([BASELINE]);
    expect(summary.stdout.at(-1)).toBe(
      '  skill react-19 pass_rate: mean 0.6667, sd 0.2887 over 3 runs',
    );
  });

  it('writes nothing when two usable runs give no subject a counted result', async () => {
    const { connect, sent } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [skipped(), skipped()],
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.stderr.at(-1)).toBe(
      'evals:baseline: no subject had a counted result in two runs, so no baseline was written',
    );
    expect(sent.map(({ text }) => text)).not.toContain(INSERT_BASELINE_SQL);
  });

  it('leaves out a run the session limit cut off, and says so', async () => {
    const { connect } = database();
    const limited = stubBaselineRun({
      baselineId: BASELINE,
      fixture: skills,
      status: 'partial',
      trialsBySkill: {
        'react-19': [
          { outcome: 'pass' },
          { errorClass: 'session_limit', outcome: 'error' },
        ],
      },
    });
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connect,
      connectionString: URL_,
      fileSystem: envelopeFileSystem([
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'pass' }),
        limited,
      ]),
      paths: ['/results/skills'],
      runs: 3,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toEqual([
      `evals:baseline: run ${limited.run.run_id} was cut off by the session limit, so it is left out`,
    ]);
    expect(summary.stdout.at(-1)).toBe(
      '  skill react-19 pass_rate: mean 1.0000, sd 0.0000 over 2 runs',
    );
  });

  it('names an envelope of its baseline that fails to parse', async () => {
    const { connect } = database();
    const broken = {
      ...run({ baselineId: BASELINE, outcome: 'pass' }),
      schema_version: 99,
    };
    const valid = [
      run({ baselineId: BASELINE, outcome: 'pass' }),
      run({ baselineId: BASELINE, outcome: 'pass' }),
    ];
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connect,
      connectionString: URL_,
      fileSystem: memoryFileSystem(filesOf([...valid, broken])),
      paths: ['/results/skills'],
      runs: 3,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toHaveLength(1);
    expect(summary.stderr[0]).toContain(
      `evals:baseline: /results/skills/${broken.run.run_id}.json carries baseline ${BASELINE} but is not a valid envelope, so it is left out: `,
    );
  });

  it('names a commissioned run that left no envelope and records the rest', async () => {
    const { connect } = database();
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connect,
      connectionString: URL_,
      fileSystem: envelopeFileSystem([
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'pass' }),
      ]),
      paths: ['/results/skills'],
      runs: 3,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toEqual([
      `evals:baseline: 1 of 3 runs left no envelope for baseline ${BASELINE} under /results/skills, so a runner failed before recording`,
    ]);
  });

  it('names a run whose every trial ended in error and records the rest', async () => {
    const { connect } = database();
    const failed = run({ baselineId: BASELINE, outcome: 'error' });
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connect,
      connectionString: URL_,
      fileSystem: envelopeFileSystem([
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'pass' }),
        { ...failed, trials: failed.trials.slice(0, 1) },
      ]),
      paths: ['/results/skills'],
      runs: 3,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toEqual([
      `evals:baseline: every trial of run ${failed.run.run_id} ended in error, which points at the harness rather than the model, so it is left out`,
    ]);
  });

  it('warns about a file it cannot read and records the rest', async () => {
    const { connect } = database();
    const stale = '/results/skills/33333333-3333-4333-8333-333333333333.json';
    const files = memoryFileSystem({
      ...filesOf([
        run({ baselineId: BASELINE, outcome: 'pass' }),
        run({ baselineId: BASELINE, outcome: 'pass' }),
      ]),
      [stale]: '',
    });
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connect,
      connectionString: URL_,
      fileSystem: {
        ...files,
        readFile: (file: string) =>
          file === stale
            ? Promise.reject(new Error('permission denied'))
            : files.readFile(file),
      },
      paths: ['/results/skills'],
      runs: 2,
    });

    expect(summary.exitCode).toBe(0);
    expect(summary.stderr).toHaveLength(1);
    expect(summary.stderr[0]).toContain(
      `evals:baseline: ${stale} is left out, and no baseline can be read from it: could not read`,
    );
  });

  it('refuses an unset database before reading anything', async () => {
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connectionString: undefined,
      fileSystem: envelopeFileSystem([]),
      paths: ['/results/skills'],
      runs: 2,
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.stderr[0]).toMatch(/EVALS_DATABASE_URL is unset/u);
  });
});
