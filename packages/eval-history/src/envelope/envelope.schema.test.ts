import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { SUITES } from './envelope.constants.ts';
import { runEnvelopeSchema } from './envelope.schema.ts';
import { envelopeJsonSchema } from './envelopeJsonSchema.util.ts';
import { readJsonFiles } from './readJsonFiles.service.ts';

const envelopeFiles = await readJsonFiles({
  directory: fileURLToPath(new URL('.', import.meta.url)),
});

const readFixture = (suite: string) =>
  runEnvelopeSchema.parse(envelopeFiles.get(`fixtures/${suite}.json`));

const issuePaths = (input: unknown) =>
  runEnvelopeSchema
    .safeParse(input)
    .error?.issues.map(({ path }) => path.join('.')) ?? [];

describe('runEnvelopeSchema', () => {
  it.each(SUITES)('accepts the %s fixture as that suite', (suite) => {
    const envelope = readFixture(suite);

    expect(envelope.run.suite).toBe(suite);
    expect(envelope.trials.length).toBeGreaterThan(0);
  });

  it('rejects an envelope whose run has no run_id', () => {
    const envelope = readFixture('skills');
    const run = Object.fromEntries(
      Object.entries(envelope.run).filter(([key]) => key !== 'run_id'),
    );

    expect(issuePaths({ ...envelope, run })).toEqual(['run.run_id']);
  });

  it('rejects a run_id that is not a v4 uuid', () => {
    const envelope = readFixture('skills');

    expect(
      issuePaths({ ...envelope, run: { ...envelope.run, run_id: 'run-1' } }),
    ).toEqual(['run.run_id']);
  });

  it('rejects a schema_version it does not know', () => {
    const envelope = readFixture('skills');

    expect(issuePaths({ ...envelope, schema_version: 2 })).toEqual([
      'schema_version',
    ]);
  });

  it('rejects a content hash that is not 64 lowercase hex characters', () => {
    const envelope = readFixture('skills');
    const [subject] = envelope.subjects;

    expect(
      issuePaths({
        ...envelope,
        subjects: [{ ...subject, content_hash: 'ABC' }],
      }),
    ).toEqual(['subjects.0.content_hash']);
  });

  it('rejects a trial whose detail belongs to another suite', () => {
    const skills = readFixture('skills');
    const rules = readFixture('rules-consistency');
    const [trial] = skills.trials;

    expect(
      issuePaths({
        ...skills,
        trials: [{ ...trial, detail: rules.trials[0]?.detail }],
      }),
    ).toEqual(['trials.0.detail.schema']);
  });

  it('rejects a trial naming a task the envelope does not declare', () => {
    const envelope = readFixture('skills');
    const [trial] = envelope.trials;

    expect(
      issuePaths({
        ...envelope,
        trials: [{ ...trial, task_key: 'skills/unknown/trigger-1' }],
      }),
    ).toEqual(['trials.0.task_key']);
  });

  it('rejects an error trial with no error_class', () => {
    const envelope = readFixture('skills');
    const [passed] = envelope.trials;

    expect(
      issuePaths({
        ...envelope,
        trials: [{ ...passed, outcome: 'error' }],
      }),
    ).toEqual(['trials.0.error_class']);
  });

  it('requires a count for every outcome in by_outcome', () => {
    const envelope = readFixture('skills');
    const byOutcome = Object.fromEntries(
      Object.entries(envelope.run.totals.by_outcome).filter(
        ([outcome]) => outcome !== 'skipped',
      ),
    );

    expect(
      issuePaths({
        ...envelope,
        run: {
          ...envelope.run,
          totals: { ...envelope.run.totals, by_outcome: byOutcome },
        },
      }),
    ).toEqual(['run.totals.by_outcome.skipped']);
  });
});

describe('envelope.schema.json', () => {
  it('matches the Zod schema; run schema:write when this fails', () => {
    expect(envelopeFiles.get('envelope.schema.json')).toEqual(
      envelopeJsonSchema(),
    );
  });
});
