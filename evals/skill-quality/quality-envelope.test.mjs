import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  finishedSession,
  STARTED_AT,
  TEST_REGRESSION_CONFIG,
  testIdentity,
  testPlan,
} from '../envelope-test-support.mjs';
import { assembleEnvelope, skillSubjects } from '../run-envelope.mjs';
import { scrubSecrets } from '../transcript-scrub.mjs';

import { qualityTask, qualityTrial } from './quality-envelope.mjs';
import {
  envelopeResults,
  reportData,
  reportDataFromEnvelope,
} from './quality-report.mjs';
import { RUBRIC } from './skill-quality.mjs';

const judgement = {
  dimensions: RUBRIC.map(({ name }) => ({ feedback: 'ok', name, score: 4 })),
  overall: 4,
  summary: 'Solid.',
};

const trialFor = (overrides) =>
  qualityTrial({
    error: undefined,
    judgement,
    metrics: finishedSession(),
    model: 'claude-opus-5-5',
    queuedAt: STARTED_AT,
    reply: '{"dimensions": []}',
    sessionFailed: false,
    skill: 'unslop',
    transcript: null,
    ...overrides,
  });

const hashes = {
  catalog_hash: 'e'.repeat(64),
  skills: [
    { content_hash: 'f'.repeat(64), name: 'react-19' },
    { content_hash: '1'.repeat(64), name: 'unslop' },
  ],
};

const envelope = assembleEnvelope({
  finishedAt: STARTED_AT + 5000,
  identity: testIdentity,
  plan: testPlan({
    catalogHash: hashes.catalog_hash,
    subjects: skillSubjects({ hashes, selected: ['react-19', 'unslop'] }),
    suite: 'skill-quality',
    tasks: ['react-19', 'unslop'].map(qualityTask),
  }),
  regressionConfig: TEST_REGRESSION_CONFIG,
  status: 'complete',
  trials: [
    trialFor({}),
    trialFor({
      error: 'the reply has no "clarity" dimension',
      judgement: undefined,
      skill: 'react-19',
    }),
  ],
});

describe('qualityTrial', () => {
  it('keeps the scores and the reply hash, not the reply', () => {
    expect(trialFor({})).toMatchObject({
      detail: {
        problem: null,
        judge_model: 'claude-opus-5-5',
        overall: 4,
        reply_sha256: expect.stringMatching(/^[0-9a-f]{64}$/u),
        schema: 'quality/1',
        summary: 'Solid.',
      },
      outcome: 'pass',
    });
  });

  it('records a reply that did not parse as an error', () => {
    expect(trialFor({ error: 'not JSON', judgement: undefined })).toMatchObject(
      { error_class: 'unparsed_reply', outcome: 'error' },
    );
  });
});

describe('a skill-quality envelope', () => {
  it('passes the schema', () => {
    expect(parseEnvelope(envelope).ok).toBe(true);
  });

  it('keeps the judge model and every dimension score through the secret scrubber', () => {
    const token = `ghp_${'a'.repeat(36)}`;
    const leaky = assembleEnvelope({
      finishedAt: STARTED_AT + 5000,
      identity: testIdentity,
      plan: testPlan({
        catalogHash: hashes.catalog_hash,
        subjects: skillSubjects({ hashes, selected: ['unslop'] }),
        suite: 'skill-quality',
        tasks: [qualityTask('unslop')],
      }),
      regressionConfig: TEST_REGRESSION_CONFIG,
      status: 'complete',
      trials: [
        trialFor({
          judgement: {
            ...judgement,
            dimensions: judgement.dimensions.map((dimension) => ({
              ...dimension,
              feedback: `Echoes ${token} and postgres://user:hunter2-secret@db/x`,
            })),
            summary: 'Quotes the value s3cret-value-123 from the session.',
          },
        }),
      ],
    });
    const scrubbed = JSON.parse(
      scrubSecrets(JSON.stringify(leaky), {
        env: { EVALS_API_TOKEN: 's3cret-value-123' },
      }),
    );
    const parsed = parseEnvelope(scrubbed);
    const [trial] = scrubbed.trials;

    expect(parsed.ok).toBe(true);
    expect(JSON.stringify(scrubbed)).not.toMatch(/ghp_a|hunter2|s3cret/u);
    expect(trial.detail.judge_model).toBe('claude-opus-5-5');
    expect(
      trial.detail.dimensions.map(({ name, score }) => [name, score]),
    ).toEqual(RUBRIC.map(({ name }) => [name, 4]));
  });

  it('feeds the report the data it built from the in-memory results', () => {
    const results = [
      { error: 'the reply has no "clarity" dimension', skill: 'react-19' },
      { judgement, skill: 'unslop' },
    ];
    expect(envelopeResults(envelope)).toStrictEqual(results);
    expect(reportDataFromEnvelope({ envelope, history: [] })).toStrictEqual(
      reportData({
        generatedAt: '2026-10-06T09:00:05.000Z',
        history: [],
        model: 'claude-opus-5-5',
        results,
      }),
    );
  });

  it('renders an unparsed reply as not judged with its problem text', () => {
    const [unparsed] = reportDataFromEnvelope({ envelope, history: [] }).skills;
    expect(unparsed).toStrictEqual({
      error: 'the reply has no "clarity" dimension',
      skill: 'react-19',
    });
  });

  it('falls back to the error class for an envelope that recorded no problem', () => {
    const legacy = {
      ...envelope,
      trials: envelope.trials.map(({ detail, ...trial }) => ({
        ...trial,
        detail: Object.fromEntries(
          Object.entries(detail).filter(([key]) => key !== 'problem'),
        ),
      })),
    };
    expect(envelopeResults(legacy)[0]).toStrictEqual({
      error: 'unparsed_reply',
      skill: 'react-19',
    });
  });
});
