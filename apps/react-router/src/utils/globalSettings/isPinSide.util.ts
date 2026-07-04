import type { PinSide } from '@/types/ui.types';

import { PIN_SIDE_VALUES } from './globalSettings.constants';

/**
 * Narrow an unknown cookie value to a pin side preference.
 * @param value - Raw value read from the settings cookie payload.
 * @returns True when the value is a valid pin side.
 */
export const isPinSide = (value: unknown): value is PinSide => {
  return (
    typeof value === 'string' &&
    PIN_SIDE_VALUES.includes(value as (typeof PIN_SIDE_VALUES)[number])
  );
};
