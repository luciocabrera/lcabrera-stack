import { compareCodeUnits } from './compareCodeUnits.util.ts';
import { isPlainObject } from './isPlainObject.util.ts';

type JsonReplacer = (key: string, value: unknown) => unknown;

export const sortedKeysReplacer: JsonReplacer = (_key, value) =>
  isPlainObject(value)
    ? Object.fromEntries(
        Object.keys(value)
          .toSorted(compareCodeUnits)
          .map((key) => [key, value[key]]),
      )
    : value;
