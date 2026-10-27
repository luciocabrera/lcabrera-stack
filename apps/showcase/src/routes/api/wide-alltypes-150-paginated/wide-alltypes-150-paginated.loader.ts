import type { LoaderFunctionArgs } from 'react-router';

import { serveTablePageRequest } from '@/routes/api/.server/serveTablePageRequest.service';
import { selectWideAlltypes150Page } from '@/routes/wide-alltypes-150/.server/wideAlltypes150.service';
import {
  MAX_WIDE_ALLTYPES_LIMIT,
  WIDE_ALLTYPES_FALLBACK_SORT,
} from '@/routes/wide-alltypes-150/config';

export const loader = ({ request }: LoaderFunctionArgs) =>
  serveTablePageRequest({
    fallbackSort: WIDE_ALLTYPES_FALLBACK_SORT,
    maxLimit: MAX_WIDE_ALLTYPES_LIMIT,
    request,
    selectPage: selectWideAlltypes150Page,
  });
