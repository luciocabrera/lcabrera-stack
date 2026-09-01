import type { LoaderFunctionArgs } from 'react-router';

import { selectCarSalesPage } from '@/routes/car-sales/.server/carSales.service';

import { parseCarSalesPageParams } from './parseCarSalesPageParams.util';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const { limit, skip, sorting } = parseCarSalesPageParams(url.searchParams);

  const page = await selectCarSalesPage({ limit, offset: skip, sorting });

  return Response.json(page);
};
