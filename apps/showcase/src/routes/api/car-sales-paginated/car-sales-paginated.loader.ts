import type { LoaderFunctionArgs } from 'react-router';

import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';
import {
  CAR_SALES_FALLBACK_SORT,
  MAX_CAR_SALES_LIMIT,
} from '@/routes/car-sales/config';
import { serveTablePageRequest } from '@/services/serveTablePageRequest.service';

export const loader = ({ request }: LoaderFunctionArgs) =>
  serveTablePageRequest({
    fallbackSort: CAR_SALES_FALLBACK_SORT,
    maxLimit: MAX_CAR_SALES_LIMIT,
    request,
    selectPage: selectCarSalesPage,
  });
