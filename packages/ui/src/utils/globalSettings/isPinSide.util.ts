import type { PinSide } from '#ui/types/ui.types';

import { PIN_SIDE_VALUES } from './globalSettings.constants';

export const isPinSide = (value: unknown): value is PinSide => {
  return (
    typeof value === 'string' &&
    PIN_SIDE_VALUES.includes(value as (typeof PIN_SIDE_VALUES)[number])
  );
};
