import type { TableColumnDataType } from '../Table.types';

type CompareValuesArgs = {
  a: unknown;
  b: unknown;
  type?: TableColumnDataType;
};

/**
 * Compare two values for sorting purposes
 * 
 * Handles different data types and null/undefined values consistently.
 * Null/undefined values are always sorted to the end.
 * 
 * @param a - First value to compare
 * @param b - Second value to compare
 * @param type - The type of data being compared (affects comparison logic)
 * @returns Negative if a < b, positive if a > b, 0 if equal
 * 
 * @example
 * ```ts
 * compareValues({ a: 5, b: 10, type: 'number' }) // -5
 * compareValues({ a: 'apple', b: 'banana', type: 'string' }) // -1
 * compareValues({ a: null, b: 10, type: 'number' }) // 1 (null goes last)
 * ```
 */
export const compareValues = ({
  a,
  b,
  type = 'string',
}: CompareValuesArgs): number => {
  // Handle nullish values - always sort to the end
  const isANull = a === null || a === undefined;
  const isBNull = b === null || b === undefined;
  
  if (isANull && isBNull) return 0;
  if (isANull) return 1;
  if (isBNull) return -1;

  switch (type) {
    case 'boolean': {
      // false < true
      if (a === b) return 0;
      return (a as boolean) ? 1 : -1;
    }
    case 'currency':
    case 'number': {
      return (a as number) - (b as number);
    }

    case 'date': {
      return new Date(a as string).getTime() - new Date(b as string).getTime();
    }

    default: {
      // Default to string comparison
      const aStr = typeof a === 'string' ? a : JSON.stringify(a);
      const bStr = typeof b === 'string' ? b : JSON.stringify(b);
      return aStr.localeCompare(bStr);
    }
  }
};
