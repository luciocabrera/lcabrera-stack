type ResolveFetchSignalArgs = {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
};

/**
 * Composes the caller's `AbortSignal` with a timeout into the one signal
 * `fetch` accepts.
 *
 * Deliberately **not** in this package's `exports` map — unlike every other
 * file here, it is an implementation detail of `fetchAndValidate` rather than
 * public surface. It lives in its own file because the repo's one-util-per-file
 * rule requires it, not because consumers should reach for it; a caller that
 * does not make the request has no reason to compose its signals.
 *
 * `AbortSignal.any` settles with the reason of whichever source fires first,
 * and that is the point: passing only the timeout's signal when a caller also
 * supplied one would silently discard the caller's cancellation, so a
 * navigation away could no longer abort its own request.
 *
 * Keeping the two sources distinct also keeps them tellable apart downstream —
 * a timeout surfaces as `TimeoutError`, a caller abort as that caller's own
 * reason.
 *
 * @param args - The caller's optional signal and optional timeout in ms.
 * @returns The signal to pass to `fetch`, or `undefined` when neither source is
 *   given — `fetch` then has nothing to abort on and waits exactly as it did
 *   before either option existed.
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
