/**
 * Constructing an `Intl.NumberFormat` dominates the cost of formatting — it loads locale
 * data — while the formatter for a locale never changes.
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (locale: string | undefined) => {
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

export const formatSharePercent = ({ locale, ratio }: FormatSharePercentArgs) =>
  getFormatter(locale).format(ratio);
