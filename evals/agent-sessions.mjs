/**
 * What both model-calling eval runners do with Agent SDK sessions: run them in
 * capped batches, and collect a session's messages without letting a throw
 * lose the ones already received.
 * Usage: imported by `evals/skills/` and `evals/verifier-fixtures/`.
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
