type FormatRunElapsedArgs = {
  readonly nowMs: number;
  readonly startedAtMs: number;
};

/**
 * Human-readable elapsed time for an in-flight run — `less than a minute`, `5m`,
 * `1h 5m`. Pure: the caller (a loader/action, where reading the clock is allowed)
 * supplies `nowMs`, so this stays testable and never reads the clock itself. A
 * negative delta (clock skew between the DB and the server) clamps to
 * `less than a minute` rather than showing a nonsense duration.
 */
export const formatRunElapsed = ({
  nowMs,
  startedAtMs,
}: FormatRunElapsedArgs) => {
  const totalSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  if (totalSeconds < 60) {
    return 'less than a minute';
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
