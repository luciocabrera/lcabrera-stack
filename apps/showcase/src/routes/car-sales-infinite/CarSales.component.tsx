import { TableRouteView } from '@lcabrera/ui';

import type { CarSale } from '@/services';

import { fetchCarSalesPage } from '@/services';

import type { CarSalesPaginatedResponse } from './CarSales.types';

/**
 * The car-sales endpoint pages by offset and sorts only — it understands
 * neither a keyset cursor nor a server-side filter — so this route opts into
 * neither and its load-more carries `limit`, `skip` and `sort`.
 */
export const CarSales = () => (
  <TableRouteView<CarSale, CarSalesPaginatedResponse>
    fetchPage={fetchCarSalesPage}
  />
);
