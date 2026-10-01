/**
 * Subscribes to the table-state cookie fetcher for as long as the grid is mounted.
 *
 * The settings panel submits that fetcher and then unmounts. React Router
 * aborts an in-flight fetcher when its last subscriber unmounts, which drops
 * the redirect that reloads the grid. Call this from the grid shell, not from
 * the panel.
 */
import { PERSIST_TABLE_STATE_FETCHER_KEY } from '#ui/constants/globalSettings.constants';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

export const useKeepTableStateFetcherMounted = () => {
  usePersistCookieAction({ fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY });
};
