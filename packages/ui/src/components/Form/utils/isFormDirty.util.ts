import { areArraysEqual } from '@lcabrera/utils/comparison/are-arrays-equal.util';

type IsFormDirtyArgs<TValues extends Record<string, unknown>> = {
  readonly accessors: readonly (keyof TValues & string)[];
  readonly currentValues: TValues;
  readonly initialValues: TValues;
};

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
