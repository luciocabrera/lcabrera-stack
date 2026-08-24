export const getStreamTimeout = () =>
  Number(process.env.STREAM_TIMEOUT_MS) || 15_000;
