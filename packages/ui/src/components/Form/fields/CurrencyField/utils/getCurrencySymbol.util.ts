import { DEFAULT_CURRENCY } from '@lcabrera/utils/formatters/formatters.constants';
import { getDefaultLocale } from '@lcabrera/utils/formatters/get-default-locale.util';

type GetCurrencySymbolArgs = {
  readonly currency?: string;
};

const symbolCache = new Map<string, string>();

export const getCurrencySymbol = ({ currency }: GetCurrencySymbolArgs) => {
  const resolvedCurrency = currency ?? DEFAULT_CURRENCY;
  const locale = getDefaultLocale();
  const cacheKey = `${locale}:${resolvedCurrency}`;

  const cached = symbolCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const parts = new Intl.NumberFormat(locale, {
      currency: resolvedCurrency,
      style: 'currency',
    }).formatToParts(0);
    const symbol =
      parts.find((part) => part.type === 'currency')?.value ?? resolvedCurrency;

    symbolCache.set(cacheKey, symbol);

    return symbol;
  } catch {
    symbolCache.set(cacheKey, resolvedCurrency);

    return resolvedCurrency;
  }
};
