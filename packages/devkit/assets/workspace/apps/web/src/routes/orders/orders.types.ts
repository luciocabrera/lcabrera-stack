import type { TablePageResponse } from '@lcabrera/ui';

export type Order = {
  readonly customer: string;
  readonly orderedOn: string;
  readonly orderId: number;
  readonly quantity: number;
  readonly status: OrderStatus;
  readonly total: number;
  readonly unitPrice: number;
};

export type OrdersPage = TablePageResponse<Order>;

export type OrderStatus = 'delivered' | 'pending' | 'shipped';
