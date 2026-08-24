import { DEFAULT_LOCALE } from './formatters.constants';

// explicit return type deliberately widens the locale literal to string
export const getDefaultLocale = (): string => DEFAULT_LOCALE;
