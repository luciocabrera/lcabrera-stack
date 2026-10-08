import { describe, expect, it, vi } from 'vite-plus/test';

import type { IngestQuery } from '../ingest/ingest.types.ts';

import { envelopeFileSystem } from '../ingest/envelopeFileSystem.util.ts';
import {
  INSERT_BASELINE_SQL,
  SELECT_SUBJECT_ID_SQL,
} from './baseline.constants.ts';
import { baselineFixtures } from './baselineFixtures.util.ts';
import { recordBaseline } from './recordBaseline.service.ts';
import { stubBaselineRun } from './stubBaselineRun.util.ts';

const { skills } = await baselineFixtures();

const URL_ = 'postgres://writer:secret@localhost:5434/eval_history';
const BASELINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

type RunArgs = {
  readonly baselineId: string;
  readonly outcome: 'fail' | 'pass';
};

const run = ({ baselineId, outcome }: RunArgs) =>
  stubBaselineRun({
    baselineId,
    fixture: skills,
    trialsBySkill: { 'react-19': [{ outcome }, { outcome: 'pass' }] },
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
  });

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

  it('writes nothing, and says why, when one run is all it has', async () => {
    const { connect, sent } = database();
    const summary = await recordRuns({
      connect: connect,
      envelopes: [run({ baselineId: BASELINE, outcome: 'pass' })],
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.stderr.at(-1)).toBe(
      'evals:baseline: nothing had two usable runs, so no baseline was written',
    );
    expect(sent.map(({ text }) => text)).not.toContain(INSERT_BASELINE_SQL);
  });

  it('refuses an unset database before reading anything', async () => {
    const summary = await recordBaseline({
      baselineId: BASELINE,
      connectionString: undefined,
      fileSystem: envelopeFileSystem([]),
      paths: ['/results/skills'],
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.stderr[0]).toMatch(/EVALS_DATABASE_URL is unset/u);
  });
});
