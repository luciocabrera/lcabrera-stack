import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

export const getExtent = (values: readonly number[]) =>
  values.reduce<readonly [number, number] | undefined>((extent, value) => {
    if (!isFiniteNumber(value)) return extent;

    return extent === undefined
      ? [value, value]
      : [Math.min(extent[0], value), Math.max(extent[1], value)];
  }, undefined);
