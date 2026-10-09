export const durationLabel = (milliseconds: number) => {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${String(hours)}h ${String(minutes % 60)}m`;
  }

  return minutes > 0
    ? `${String(minutes)}m ${String(seconds % 60)}s`
    : `${String(seconds)}s`;
};
