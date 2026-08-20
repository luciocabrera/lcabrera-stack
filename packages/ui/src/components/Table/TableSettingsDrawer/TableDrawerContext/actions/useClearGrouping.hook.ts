import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage grouping switched off entirely — every key and every staged aggregate.
 *
 * Staged, not applied: the drawer's Clear button is a pending edit like every
 * other one in this drawer, so Cancel still puts the grouping back.
 *
 * The granularities go with the keys, for the aggregates' reason: a granularity
 * describes a key, so with no key there is nothing for it to describe, and one
 * left behind would refuse the next grouping the user applies (#786).
 */
export const useClearGrouping = () => {
  const setGrouping = useSetGrouping();

  return () => {
    setGrouping(() => ({
      aggregates: {},
      keys: [],
      mode: 'flat',
      periods: {},
      shares: [],
    }));
  };
};
