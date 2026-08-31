type ResolveFetchSignalArgs = {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

export const resolveFetchSignal = ({
  signal,
  timeoutMs,
}: ResolveFetchSignalArgs) => {
  if (timeoutMs === undefined) {
    return signal;
  }

  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  return signal === undefined
    ? timeoutSignal
    : AbortSignal.any([signal, timeoutSignal]);
};
