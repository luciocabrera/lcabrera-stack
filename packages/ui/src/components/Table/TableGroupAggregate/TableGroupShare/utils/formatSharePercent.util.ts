/**
 * Percent formatters, keyed by locale.
 *
 * Constructing an `Intl.NumberFormat` dominates the cost of formatting — it
 * loads locale data — while the formatter for a locale never changes. A share
 * renders in every measure cell of every group row, so building one per render
 * would pay that cost thousands of times for one object (#648). The same shape
 * `getCurrencySymbol` uses, and for the same reason.
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (locale: string | undefined) => {
  // `undefined` is a real key here rather than a missing one: it means "the
  // runtime's own locale", which is a different formatter from any named one.
  const key = locale ?? '';
  const cached = formatterCache.get(key);

  if (cached !== undefined) return cached;

  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  });

  formatterCache.set(key, formatter);

  return formatter;
};

type FormatSharePercentArgs = {
  readonly locale: string | undefined;
  readonly ratio: number;
};

/** A share as a percentage, to one decimal place, in the table's locale. */
export const formatSharePercent = ({ locale, ratio }: FormatSharePercentArgs) =>
  getFormatter(locale).format(ratio);
