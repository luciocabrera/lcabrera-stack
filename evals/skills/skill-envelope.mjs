/**
 * The skill-trigger run as envelope records: each selected skill a subject,
 * each Waza task a task, and each session a trial with what it loaded.
 * Usage: imported by `verify-skill-triggers.mjs`.
 */
import { contentHash } from '@repo/eval-history/hashing/contentHash.util';

import { sessionTrial, taskRecord } from '../run-envelope.mjs';

const skillTaskKey = ({ skill, task }) => `skills/${skill}/${task.id}`;

export const skillTask = ({ fixtureHash, skill, source, task }) =>
  taskRecord({
    fixture_hash: fixtureHash,
    kind: task.shouldTrigger ? 'trigger' : 'near-miss',
    set: task.set,
    source: task.source ?? null,
    subject: { kind: 'skill', name: skill },
    tags: task.tags ?? [],
    task_hash: contentHash(source),
    task_key: skillTaskKey({ skill, task }),
  });

export const skillTrial = ({
  error,
  fixtureRead,
  initTools = [],
  invoked,
  metrics,
  passed,
  queuedAt,
  skill,
  task,
  transcript,
  trial,
}) =>
  sessionTrial({
    detail: {
      expected_skill: skill,
      fixture_read: task.fixture === undefined ? null : fixtureRead,
      init_tools: initTools,
      invoked,
      schema: 'skills/1',
      should_trigger: task.shouldTrigger,
    },
    error,
    metrics,
    passed,
    queuedAt,
    taskKey: skillTaskKey({ skill, task }),
    transcript,
    trialIndex: trial - 1,
  });
