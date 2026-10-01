import { useFetcher } from 'react-router';

import {
  PERSIST_TABLE_STATE_FETCHER_KEY,
  PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
} from '#ui/constants/globalSettings.constants';

export const useRetainTablePersistFetchers = () => {
  useFetcher({ key: PERSIST_TABLE_STATE_FETCHER_KEY });
  useFetcher({ key: PERSIST_TABLE_UI_FLAGS_FETCHER_KEY });
};
