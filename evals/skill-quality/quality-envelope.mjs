import { canonicalHash } from '@repo/eval-history/hashing/canonicalHash.util';
/**
 * The skill-quality run as envelope records: each judged skill a subject and a
 * task, and each judge session a trial holding the scores. The raw reply is
 * the trial's transcript; the trial keeps only its hash.
 * Usage: imported by `verify-skill-quality.mjs`.
 */
import { createHash } from 'node:crypto';

import { sessionTrial, taskRecord } from '../run-envelope.mjs';
import { judgePrompt, RUBRIC } from './skill-quality.mjs';

const qualityTaskKey = (skill) => `skill-quality/${skill}`;

export const qualityTask = (skill) =>
  taskRecord({
    judge_prompt_hash: canonicalHash({
      prompt: judgePrompt(''),
      rubric: RUBRIC,
    }),
    kind: 'quality',
    subject: { kind: 'skill', name: skill },
    task_hash: canonicalHash(RUBRIC),
    task_key: qualityTaskKey(skill),
  });

const replyHash = (reply) => createHash('sha256').update(reply).digest('hex');

const scoresOf = (judgement) =>
  judgement ?? { dimensions: [], overall: 0, summary: '' };

export const qualityTrial = ({
  error,
  judgement,
  metrics,
  model,
  queuedAt,
  reply,
  sessionFailed,
  skill,
  transcript,
}) =>
  sessionTrial({
    detail: {
      ...scoresOf(judgement),
      judge_model: model,
      problem: error ?? null,
      reply_sha256: replyHash(reply),
      schema: 'quality/1',
    },
    error,
    fallbackClass: sessionFailed ? 'harness' : 'unparsed_reply',
    metrics,
    passed: judgement !== undefined,
    queuedAt,
    taskKey: qualityTaskKey(skill),
    transcript,
    trialIndex: 0,
  });
