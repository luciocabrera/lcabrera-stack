/**
 * Stream timeout in milliseconds, configurable via STREAM_TIMEOUT_MS.
 * Default: 15 seconds.
 */
export const getStreamTimeout = (): number =>
  Number(process.env.STREAM_TIMEOUT_MS) || 15_000;
