import { TableRouteView } from '@lcabrera/ui';

import type { CarSale } from '@/services';

import { fetchCarSalesPage } from '@/services';

import type { CarSalesPaginatedResponse } from './CarSales.types';

export const CarSales = () => (
  <TableRouteView<CarSale, CarSalesPaginatedResponse>
    fetchPage={fetchCarSalesPage}
  />
);
