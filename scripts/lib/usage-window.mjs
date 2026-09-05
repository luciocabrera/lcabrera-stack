/**
 * Day arithmetic for the usage report, in UTC.
 *
 * The window is one value computed once and handed to each reader, so sources
 * whose timestamps differ in shape still report against one span. The clock is
 * an argument so a run can be reproduced.
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

export const sumDays = ({ counts, from, to }) =>
  Object.entries(counts)
    .filter(([day]) => day >= from && day <= to)
    .reduce((total, [, count]) => total + count, 0);
