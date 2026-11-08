/**
 * Whether a value is a real `YYYY-MM-DD` calendar day, so an expiry such as
 * `never` or `2027-02-30` cannot pass a date comparison by string order.
 */
export const isCalendarDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
};
