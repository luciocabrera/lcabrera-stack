import { getApiBaseUrl } from '@lcabrera/api/config/get-api-base-url.util';

import type { FilterOptionsTransport } from '#ui/components/Table/Table.types';

import {
  BFF_DISTINCT_PATH,
  LOADER_FILTER_OPTIONS_PATH,
} from './filters.constants';

export const getFilterOptionsBaseUrl = (transport: FilterOptionsTransport) =>
  transport === 'loader'
    ? LOADER_FILTER_OPTIONS_PATH
    : `${getApiBaseUrl()}${BFF_DISTINCT_PATH}`;
