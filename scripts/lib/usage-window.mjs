/**
 * Day arithmetic for the usage report, in UTC.
 *
 * Every source the report reads carries a timestamp in a different shape, and
 * every number it prints has to name the window it covers — so the window is
 * one value computed once and handed to each reader, never re-derived per
 * source. The clock is an argument so a run can be reproduced.
 */
const MS_PER_DAY = 86_400_000;

export const dayOf = (isoTimestamp) => String(isoTimestamp).slice(0, 10);

export const shiftDay = (day, deltaDays) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + deltaDays * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);

export const windowOf = ({ days, now }) => {
  const end = dayOf(now);
  return { days, end, start: shiftDay(end, -(days - 1)) };
};

export const isWithinWindow = ({ day, window }) =>
  day >= window.start && day <= window.end;

export const sumDays = ({ counts, from, to }) =>
  Object.entries(counts)
    .filter(([day]) => day >= from && day <= to)
    .reduce((total, [, count]) => total + count, 0);
