type EvalsHrefArgs = {
  readonly runId: string;
  readonly trialId?: string;
};

export const evalsHref = ({ runId, trialId }: EvalsHrefArgs) => {
  const run = `/evals/runs/${encodeURIComponent(runId)}`;

  return trialId === undefined
    ? run
    : `${run}?${new URLSearchParams({ trial: trialId }).toString()}`;
};
