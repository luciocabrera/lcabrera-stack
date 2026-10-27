import type { LoaderFunctionArgs } from 'react-router';

import { serveTablePageRequest } from '@/routes/api/.server/serveTablePageRequest.service';
import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';
import {
  CAR_SALES_FALLBACK_SORT,
  MAX_CAR_SALES_LIMIT,
} from '@/routes/car-sales/config';

export const loader = ({ request }: LoaderFunctionArgs) =>
  serveTablePageRequest({
    fallbackSort: CAR_SALES_FALLBACK_SORT,
    maxLimit: MAX_CAR_SALES_LIMIT,
    request,
    selectPage: selectCarSalesPage,
  });
