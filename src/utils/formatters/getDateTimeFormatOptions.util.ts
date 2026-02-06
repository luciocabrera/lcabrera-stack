import type { DateFormatPreset } from '../../types/format.types';

/**
 * Map preset names to Intl.DateTimeFormat options
 */
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
