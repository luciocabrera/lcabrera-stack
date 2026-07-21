import type { FilterOptionsTransport } from '@repo/ui/components/Table/Table.types';

import { getApiBaseUrl } from '@repo/data-access/api';

import {
  BFF_DISTINCT_PATH,
  LOADER_FILTER_OPTIONS_PATH,
} from './filters.constants';

/**
 * Resolves the request base for a distinct descriptor's transport: the
 * BFF's generic distinct endpoint (`getApiBaseUrl()` handles dev proxy,
 * prod same-origin, and VITE_API_URL) or the same-origin filter-options
 * resource route.
 */
export const getFilterOptionsBaseUrl = (transport: FilterOptionsTransport) =>
  transport === 'loader'
    ? LOADER_FILTER_OPTIONS_PATH
    : `${getApiBaseUrl()}${BFF_DISTINCT_PATH}`;
