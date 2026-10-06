import { parseEnvelope } from '@repo/eval-history/envelope/parseEnvelope.util';
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';
import { describe, expect, it } from 'vite-plus/test';

import {
  finishedSession,
  STARTED_AT,
  TEST_REGRESSION_CONFIG,
  testIdentity,
  testPlan,
} from '../envelope-test-support.mjs';
import { assembleEnvelope, skillSubjects } from '../run-envelope.mjs';

import { skillTask, skillTrial } from './skill-envelope.mjs';

const SOURCE = 'id: trigger\nset: regression\n';
const FIXTURE_HASH = 'c'.repeat(64);
const task = {
  fixture: 'form',
  id: 'trigger',
  set: 'regression',
  shouldTrigger: true,
  source: undefined,
  tags: ['positive-trigger'],
};
const transcript = { bytes: 10, sha256: 'd'.repeat(64), uri: 'x.json' };

const trial = (overrides) =>
  skillTrial({
    error: undefined,
    fixtureRead: true,
    initTools: ['Read', 'Skill'],
    invoked: ['react-19'],
    metrics: finishedSession(),
    passed: true,
    queuedAt: STARTED_AT,
    skill: 'react-19',
    task,
    transcript,
    trial: 1,
    ...overrides,
  });

describe('skillTask', () => {
  it('keys the task by skill and id and hashes the task file', () => {
    expect(
      skillTask({
        fixtureHash: FIXTURE_HASH,
        skill: 'react-19',
        source: SOURCE,
        task,
      }),
    ).toMatchObject({
      fixture_hash: FIXTURE_HASH,
      kind: 'trigger',
      set: 'regression',
      source: null,
      tags: ['positive-trigger'],
      task_hash: contentHash(SOURCE),
      task_key: 'skills/react-19/trigger',
    });
  });
});

describe('skillTrial', () => {
  it('records what the session loaded with its tokens, cost and durations', () => {
    expect(trial({})).toMatchObject({
      cost_usd_reported: 0.12,
      detail: {
        expected_skill: 'react-19',
        fixture_read: true,
        init_tools: ['Read', 'Skill'],
        invoked: ['react-19'],
        schema: 'skills/1',
        should_trigger: true,
      },
      duration_ms: 1200,
      outcome: 'pass',
      task_key: 'skills/react-19/trigger',
      tokens: { input: 100, output: 20 },
      transcript,
      trial_index: 0,
    });
  });

  it('leaves fixture_read null for a task with no fixture', () => {
    expect(
      trial({ task: { ...task, fixture: undefined } }).detail.fixture_read,
    ).toBeNull();
  });
});

describe('a skills envelope', () => {
  it('holds one trial per session and passes the schema', () => {
    const hashes = {
      catalog_hash: 'e'.repeat(64),
      skills: [
        { content_hash: 'f'.repeat(64), name: 'react-19' },
        { content_hash: '1'.repeat(64), name: 'unslop' },
      ],
    };
    const trials = [trial({}), trial({ passed: false, trial: 2 })];
    const envelope = assembleEnvelope({
      finishedAt: STARTED_AT + 5000,
      identity: testIdentity,
      plan: testPlan({
        catalogHash: hashes.catalog_hash,
        subjects: skillSubjects({ hashes, selected: ['react-19'] }),
        suite: 'skills',
        tasks: [
          skillTask({
            fixtureHash: FIXTURE_HASH,
            skill: 'react-19',
            source: SOURCE,
            task,
          }),
        ],
      }),
      regressionConfig: TEST_REGRESSION_CONFIG,
      status: 'complete',
      trials,
    });
    expect(parseEnvelope(envelope).ok).toBe(true);
    expect(envelope.subjects.map(({ name }) => name)).toStrictEqual([
      'react-19',
    ]);
    expect(envelope.run.totals).toMatchObject({
      by_outcome: { fail: 1, pass: 1 },
      cost_usd_reported: 0.24,
      trials: 2,
    });
  });
});
