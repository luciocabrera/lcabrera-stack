import { carSalesApi } from '@/services';

export const loader = async () => {
  const response = await carSalesApi.fetchCarSales();

  return {
    carSales: response.data,
    total: response.total,
  };
};
