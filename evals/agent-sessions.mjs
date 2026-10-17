/**
 * What the model-calling eval runners do with Agent SDK sessions: run them in
 * capped batches until told to stop, collect a session's messages without
 * letting a throw lose the ones already received, stamp when it was queued,
 * started, answered and finished, read its cost, tokens and timing, say why a
 * session failed (the subscription's session limit apart from other rate
 * limits) or held tools other than the ones it was given, check a --runs
 * count, and sum the cost a run's sessions reported.
 * Usage: imported by `evals/skills/`, `evals/verifier-fixtures/` and
 * `evals/skill-quality/`.
 */
import { SESSION_LIMIT_ERROR_CLASS } from '@repo/eval-history/envelope/envelope.constants';

export const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

export const errorText = (error) =>
  error instanceof Error ? error.message : String(error);

export const runBatches = async ([batch, ...rest], isStopped = () => false) =>
  batch === undefined || isStopped()
    ? []
    : [
        ...(await Promise.all(batch.map((job) => job()))),
        ...(await runBatches(rest, isStopped)),
      ];

const isAnswer = (message) =>
  message.type === 'assistant' || message.type === 'stream_event';

const firstAnswerAt = ({ clock, message, stamped }) =>
  stamped ?? (isAnswer(message) ? clock() : undefined);

export const drain = async (session, clock = Date.now) => {
  const messages = [];
  let firstTokenAt;
  try {
    for await (const message of session) {
      firstTokenAt = firstAnswerAt({ clock, message, stamped: firstTokenAt });
      messages.push(message);
    }
    return { firstTokenAt, messages };
  } catch (error) {
    return { error: errorText(error), firstTokenAt, messages };
  }
};

export const timedDrain = async ({ clock = Date.now, open, queuedAt }) => {
  const startedAt = clock();
  const { firstTokenAt, ...drained } = await drain(open(), clock);
  return {
    ...drained,
    timestamps: {
      finished: clock(),
      firstToken: firstTokenAt,
      queued: queuedAt,
      started: startedAt,
    },
  };
};

const sameTools = (held, expected) =>
  held.length === expected.length &&
  expected.every((tool) => held.includes(tool));

const heldText = (held, expected) =>
  expected.length === 0
    ? `the session held ${held.join(', ')}`
    : `the session held ${held.join(', ') || 'no tools'} instead of ${expected.join(', ')}`;

const toolsProblem = (init, expected) => {
  if (init === undefined) {
    return 'the session never reported its tools';
  }
  if (!Array.isArray(init.tools)) {
    return 'the session reported no tool list';
  }
  return sameTools(init.tools, expected)
    ? undefined
    : heldText(init.tools, expected);
};

export const finalResult = (messages) =>
  messages.findLast((message) => message.type === 'result');

const hasSucceeded = (result) =>
  result?.subtype === 'success' && result.is_error !== true;

const endingOf = (result) => result?.subtype ?? 'no result';

const resultProblem = (result) =>
  hasSucceeded(result)
    ? undefined
    : `the session ended with ${endingOf(result)}`;

export const sessionProblem = (messages, expectedTools = []) =>
  toolsProblem(
    messages.find(
      (message) => message.type === 'system' && message.subtype === 'init',
    ),
    expectedTools,
  ) ?? resultProblem(finalResult(messages));

const TOKEN_FIELDS = {
  cache_read: 'cacheReadInputTokens',
  cache_write: 'cacheCreationInputTokens',
  input: 'inputTokens',
  output: 'outputTokens',
};

const summedTokens = (modelUsage) =>
  Object.fromEntries(
    Object.entries(TOKEN_FIELDS).map(([field, sdkField]) => [
      field,
      modelUsage === undefined
        ? null
        : Object.values(modelUsage).reduce(
            (total, usage) => total + (usage[sdkField] ?? 0),
            0,
          ),
    ]),
  );

const RESULT_CLASSES = [
  [
    'max_turns',
    (result) =>
      result.subtype === 'error_max_turns' ||
      result.terminal_reason === 'max_turns',
  ],
  [
    'budget',
    (result) =>
      result.subtype === 'error_max_budget_usd' ||
      result.terminal_reason === 'budget_exhausted',
  ],
  [
    'rate_limit',
    (result) =>
      result.api_error_status === 429 ||
      ['blocking_limit', 'rapid_refill_breaker'].includes(
        result.terminal_reason,
      ),
  ],
  ['auth', (result) => [401, 403].includes(result.api_error_status)],
];

const THROW_CLASSES = [
  ['max_turns', /maximum number of turns/iu],
  ['budget', /budget/iu],
  ['rate_limit', /rate.?limit|usage limit|\b429\b/iu],
  [
    'auth',
    /\b40[13]\b|authenticat|unauthori[sz]ed|not logged in|invalid api key/iu,
  ],
];

const SESSION_LIMIT_TEXT = /\bhit your session limit\b/iu;

const isLimitRejection = (message) =>
  message.type === 'rate_limit_event' &&
  message.rate_limit_info?.status === 'rejected';

const isLimitText = (text = '') => SESSION_LIMIT_TEXT.test(text);

const hitSessionLimit = ({ messages, result, thrown }) =>
  messages.some((message) => isLimitRejection(message)) ||
  isLimitText(result?.result) ||
  isLimitText(thrown);

const resultClass = (result) =>
  RESULT_CLASSES.find(([, matches]) => matches(result))?.[0] ?? 'execution';

const thrownClass = (thrown) =>
  THROW_CLASSES.find(([, pattern]) => pattern.test(thrown))?.[0] ?? 'drain';

const hasEndedCleanly = (result, thrown) =>
  hasSucceeded(result) && thrown === undefined;

const failureClass = (result, thrown) =>
  result === undefined || hasSucceeded(result)
    ? thrownClass(thrown)
    : resultClass(result);

const errorClass = ({ messages, result, thrown = '' }) =>
  hitSessionLimit({ messages, result, thrown })
    ? SESSION_LIMIT_ERROR_CLASS
    : failureClass(result, thrown);

const REPORTED_FIELDS = {
  cost_usd_reported: 'total_cost_usd',
  duration_api_ms: 'duration_api_ms',
  duration_ms: 'duration_ms',
  session_id: 'session_id',
  stop_reason: 'stop_reason',
  turns: 'num_turns',
};

const reportedFields = (result) =>
  Object.fromEntries(
    Object.entries(REPORTED_FIELDS).map(([field, sdkField]) => [
      field,
      result?.[sdkField] ?? null,
    ]),
  );

const isoAt = (epochMs) =>
  epochMs === undefined ? null : new Date(epochMs).toISOString();

const firstTokenTime = (result, { firstToken, started }) =>
  isoAt(
    started === undefined || result?.ttft_ms === undefined
      ? firstToken
      : started + result.ttft_ms,
  );

const stampedTimes = (result, timestamps) => ({
  finished_at: isoAt(timestamps.finished),
  first_token_at: firstTokenTime(result, timestamps),
  queued_at: isoAt(timestamps.queued),
  started_at: isoAt(timestamps.started),
});

const usageFields = (modelUsage) => ({
  model_usage: modelUsage ?? {},
  tokens: summedTokens(modelUsage),
});

export const sessionMetrics = (messages, timestamps, thrown) => {
  const result = finalResult(messages);
  return {
    ...reportedFields(result),
    ...stampedTimes(result, timestamps),
    error_class: hasEndedCleanly(result, thrown)
      ? null
      : errorClass({ messages, result, thrown }),
    ...usageFields(result?.modelUsage),
  };
};

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;

export const wholeNumberProblem = ({ minimum, reason = '', value }) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum
    ? null
    : `--runs must be a whole number of at least ${minimum}${reason}; got "${value}"`;
};

export const wholeNumber = ({ minimum, reason, value }) => {
  const problem = wholeNumberProblem({ minimum, reason, value });
  if (problem !== null) {
    throw new Error(problem);
  }
  return Number(value);
};

const reportedCost = (metrics) => metrics?.cost_usd_reported;

export const costLine = (metrics) => {
  const costs = metrics
    .map((entry) => reportedCost(entry))
    .filter((cost) => Number.isFinite(cost));
  const total = costs.reduce((sum, cost) => sum + cost, 0);
  const missing = metrics.length - costs.length;
  const reported = `Cost: $${total.toFixed(2)} reported over ${costs.length} session(s)`;
  return missing === 0 ? reported : `${reported}; ${missing} reported none`;
};
