import { useSetGrouping } from './useSetGrouping.hook';

/**
 * Stage grouping switched off entirely — every key and every staged aggregate.
 *
 * Staged, not applied: the drawer's Clear button is a pending edit like every
 * other one in this drawer, so Cancel still puts the grouping back.
 */
export const useClearGrouping = () => {
  const setGrouping = useSetGrouping();

  return () => {
    setGrouping(() => ({ aggregates: {}, keys: [], mode: 'flat' }));
  };
};
