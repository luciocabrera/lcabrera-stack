import type { DateFormatPreset } from './formatters.types';

export const getDateTimeFormatOptions = (
  preset: DateFormatPreset,
): Intl.DateTimeFormatOptions => {
  switch (preset) {
    case 'full': {
      return { dateStyle: 'full' };
    }
    case 'long': {
      return { dateStyle: 'long' };
    }
    case 'medium': {
      return { dateStyle: 'medium' };
    }
    case 'short': {
      return { dateStyle: 'short' };
    }
  }
};
