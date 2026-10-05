/**
 * What the model-calling eval runners do with Agent SDK sessions: run them in
 * capped batches, collect a session's messages without letting a throw lose
 * the ones already received, stamp when it was queued, started, answered and
 * finished, read its cost, tokens and timing, and say why a session failed or
 * held tools other than the ones it was given.
 * Usage: imported by `evals/skills/`, `evals/verifier-fixtures/` and
 * `evals/skill-quality/`.
 */
export const chunk = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

export const errorText = (error) =>
  error instanceof Error ? error.message : String(error);

export const runBatches = async ([batch, ...rest]) =>
  batch === undefined
    ? []
    : [
        ...(await Promise.all(batch.map((job) => job()))),
        ...(await runBatches(rest)),
      ];

const answers = (message) =>
  message.type === 'assistant' || message.type === 'stream_event';

const firstAnswerAt = ({ clock, message, stamped }) =>
  stamped ?? (answers(message) ? clock() : undefined);

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

const succeeded = (result) =>
  result?.subtype === 'success' && result.is_error !== true;

const endingOf = (result) => result?.subtype ?? 'no result';

const resultProblem = (result) =>
  succeeded(result) ? undefined : `the session ended with ${endingOf(result)}`;

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

const resultClass = (result) =>
  RESULT_CLASSES.find(([, matches]) => matches(result))?.[0] ?? 'execution';

const thrownClass = (thrown) =>
  THROW_CLASSES.find(([, pattern]) => pattern.test(thrown))?.[0] ?? 'drain';

const endedCleanly = (result, thrown) =>
  succeeded(result) && thrown === undefined;

const errorClass = (result, thrown) =>
  result === undefined || succeeded(result)
    ? thrownClass(thrown ?? '')
    : resultClass(result);

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
  result?.ttft_ms === undefined || started === undefined
    ? isoAt(firstToken)
    : isoAt(started + result.ttft_ms);

const stampedTimes = (result, timestamps) => ({
  finished_at: isoAt(timestamps.finished),
  first_token_at: firstTokenTime(result, timestamps),
  queued_at: isoAt(timestamps.queued),
  started_at: isoAt(timestamps.started),
});

export const sessionMetrics = (messages, timestamps, thrown) => {
  const result = finalResult(messages);
  return {
    ...reportedFields(result),
    ...stampedTimes(result, timestamps),
    error_class: endedCleanly(result, thrown)
      ? null
      : errorClass(result, thrown),
    model_usage: result?.modelUsage ?? {},
    tokens: summedTokens(result?.modelUsage),
  };
};

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;
