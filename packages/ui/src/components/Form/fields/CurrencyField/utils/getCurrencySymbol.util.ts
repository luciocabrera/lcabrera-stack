import { DEFAULT_CURRENCY } from '@lcabrera/utils/formatters/formatters.constants';
import { getDefaultLocale } from '@lcabrera/utils/formatters/get-default-locale.util';

type GetCurrencySymbolArgs = {
  readonly currency?: string;
};

type ReadCurrencySymbolArgs = {
  readonly currency: string;
  readonly locale: string;
};

const symbolCache = new Map<string, string>();

const readCurrencySymbol = ({ currency, locale }: ReadCurrencySymbolArgs) => {
  try {
    const parts = new Intl.NumberFormat(locale, {
      currency,
      style: 'currency',
    }).formatToParts(0);

    return parts.find((part) => part.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
};

export const getCurrencySymbol = ({ currency }: GetCurrencySymbolArgs) => {
  const resolvedCurrency = currency ?? DEFAULT_CURRENCY;
  const locale = getDefaultLocale();
  const cacheKey = `${locale}:${resolvedCurrency}`;

  const cached = symbolCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const symbol = readCurrencySymbol({ currency: resolvedCurrency, locale });
  symbolCache.set(cacheKey, symbol);

  return symbol;
};
