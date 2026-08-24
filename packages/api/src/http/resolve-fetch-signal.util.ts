type ResolveFetchSignalArgs = {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/**
 * Deliberately **not** in this package's `exports` map — unlike every other file here, it
 * is an implementation detail of `fetchAndValidate` rather than public surface.
 * `AbortSignal.any` settles with the reason of whichever source fires first, and that is
 * the point: passing only the timeout's signal when a caller also supplied one would
 * silently discard the caller's cancellation, so a navigation away could no longer abort
 * its own request.
 */
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
