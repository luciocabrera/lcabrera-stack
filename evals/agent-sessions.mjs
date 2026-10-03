/**
 * What the model-calling eval runners do with Agent SDK sessions: run them in
 * capped batches, collect a session's messages without letting a throw lose
 * the ones already received, and say why a no-tools session failed.
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

export const drain = async (session) => {
  const messages = [];
  try {
    for await (const message of session) {
      messages.push(message);
    }
    return { messages };
  } catch (error) {
    return { error: errorText(error), messages };
  }
};

const toolsProblem = (init) => {
  if (init === undefined) {
    return 'the session never reported its tools';
  }
  if (!Array.isArray(init.tools)) {
    return 'the session reported no tool list';
  }
  return init.tools.length === 0
    ? undefined
    : `the session held ${init.tools.join(', ')}`;
};

export const finalResult = (messages) =>
  messages.findLast((message) => message.type === 'result');

const succeeded = (result) =>
  result?.subtype === 'success' && result.is_error !== true;

const endingOf = (result) => result?.subtype ?? 'no result';

const resultProblem = (result) =>
  succeeded(result) ? undefined : `the session ended with ${endingOf(result)}`;

export const sessionProblem = (messages) =>
  toolsProblem(
    messages.find(
      (message) => message.type === 'system' && message.subtype === 'init',
    ),
  ) ?? resultProblem(finalResult(messages));

export const withoutSeparator = (args) =>
  args[0] === '--' ? args.slice(1) : args;
