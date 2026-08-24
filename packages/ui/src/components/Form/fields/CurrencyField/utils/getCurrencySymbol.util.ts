import { DEFAULT_CURRENCY } from '@lcabrera/utils/formatters/formatters.constants';
import { getDefaultLocale } from '@lcabrera/utils/formatters/get-default-locale.util';

type GetCurrencySymbolArgs = {
  readonly currency?: string;
};

/**
 * Constructing the `Intl.NumberFormat` dominates this function's cost by orders of
 * magnitude — it loads locale data — while the symbol for a given key never changes, so it
 * is derived once per key instead of on every render.
 * The key includes the locale so that a future non-constant `getDefaultLocale` cannot
 * silently return another locale's symbol.
 */
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
    // A currency code Intl rejects throws deterministically, so the fallback is
    // cached too rather than re-throwing on every render.
    symbolCache.set(cacheKey, resolvedCurrency);

    return resolvedCurrency;
  }
};
