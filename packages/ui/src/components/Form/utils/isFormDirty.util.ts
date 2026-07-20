import { areArraysEqual } from '@repo/utils/comparison/are-arrays-equal.util';

type IsFormDirtyArgs<TValues extends Record<string, unknown>> = {
  readonly accessors: readonly (keyof TValues & string)[];
  readonly currentValues: TValues;
  readonly initialValues: TValues;
};

/**
 * Subset comparison restricted to the form's own accessors (not a full
 * isShallowEqual, since a caller-provided store may carry extra keys).
 * Arrays (multi-select) compare by value, not reference — VirtualSelect's
 * onChange always hands back a new array even when the selection is
 * unchanged from initialValues.
 */
export const isFormDirty = <TValues extends Record<string, unknown>>({
  accessors,
  currentValues,
  initialValues,
}: IsFormDirtyArgs<TValues>) => {
  return accessors.some((accessor) => {
    const initial = initialValues[accessor];
    const current = currentValues[accessor];

    if (Array.isArray(initial) && Array.isArray(current)) {
      return !areArraysEqual({ left: initial, right: current });
    }

    return initial !== current;
  });
};
