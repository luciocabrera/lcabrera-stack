import { DEFAULT_CURRENCY } from '@lcabrera/utils/formatters/formatters.constants';
import { getDefaultLocale } from '@lcabrera/utils/formatters/get-default-locale.util';

type GetCurrencySymbolArgs = {
  readonly currency?: string;
};

/**
 * Resolves the currency symbol (e.g. `$`, `€`) for the given ISO currency code
 * via `Intl.NumberFormat`, used as the currency-field input adornment. Falls
 * back to the currency code itself when the symbol can't be derived. Pure — the
 * locale is the fixed default (`getDefaultLocale`) for SSR-stable output.
 */
export const getCurrencySymbol = ({ currency }: GetCurrencySymbolArgs) => {
  const resolvedCurrency = currency ?? DEFAULT_CURRENCY;

  try {
    const parts = new Intl.NumberFormat(getDefaultLocale(), {
      currency: resolvedCurrency,
      style: 'currency',
    }).formatToParts(0);

    return (
      parts.find((part) => part.type === 'currency')?.value ?? resolvedCurrency
    );
  } catch {
    return resolvedCurrency;
  }
};
