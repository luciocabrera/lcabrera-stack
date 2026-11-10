const CONFUSION_PATH = '/evals/confusion';

export const confusionRunHref = (runId?: string) =>
  runId === undefined
    ? CONFUSION_PATH
    : `${CONFUSION_PATH}?${new URLSearchParams({ run: runId }).toString()}`;
