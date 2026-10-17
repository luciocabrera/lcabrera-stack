import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';

export const sharedHash = (values: readonly (string | undefined)[]) => {
  const distinct = [
    ...new Set(values.filter((value) => value !== undefined)),
  ].toSorted(compareCodeUnits);

  return distinct.length === 0 ? undefined : distinct.join(',');
};
