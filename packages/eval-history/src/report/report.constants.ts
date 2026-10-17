export const RUN_HASH_KEYS = {
  agentPrompt: 'agent-prompt',
  catalog: 'catalog',
  harness: 'harness',
  judgePrompt: 'judge-prompt',
  model: 'model',
} as const;

export const SCOPED_HASH_PREFIXES = {
  content: 'content:',
  expected: 'expected:',
  fixture: 'fixture:',
  task: 'task:',
} as const;

export const HASH_LABELS: Readonly<Record<string, string>> = {
  [RUN_HASH_KEYS.agentPrompt]: 'agent prompt hash',
  [RUN_HASH_KEYS.catalog]: 'skill catalog hash',
  [RUN_HASH_KEYS.harness]: 'harness version',
  [RUN_HASH_KEYS.judgePrompt]: 'judge prompt hash',
  [RUN_HASH_KEYS.model]: 'model',
  [SCOPED_HASH_PREFIXES.content]: 'content hash',
  [SCOPED_HASH_PREFIXES.expected]: 'expected hash',
  [SCOPED_HASH_PREFIXES.fixture]: 'fixture hash',
  [SCOPED_HASH_PREFIXES.task]: 'task hash',
};

export const ABSENT_CELL = '—';

export const SHORT_SHA_LENGTH = 7;

export const AGREEMENT_HEADING = '### Judge agreement';

export const AGREEMENT_NEEDS_DATABASE =
  'Not shown: hand grades are stored only in the database, and both runs were read from envelope files. To include it, name a run by its id or use --compare, with EVALS_DATABASE_URL set.';
