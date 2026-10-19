export const confusionSelection = (params: URLSearchParams) => {
  const runId = params.get('run');

  return runId === null
    ? ({ kind: 'recent' } as const)
    : ({ kind: 'run', runId } as const);
};
