export const formatUtcTime = (value: Date) => {
  const clock = value.toISOString().slice(11, 23);

  if (value.getUTCMilliseconds() !== 0) return clock;

  if (value.getUTCSeconds() !== 0) return clock.slice(0, 8);

  return value.getUTCHours() === 0 && value.getUTCMinutes() === 0
    ? ''
    : clock.slice(0, 5);
};
