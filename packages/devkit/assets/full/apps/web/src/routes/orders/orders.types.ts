import type { TablePage } from '@lcabrera/server/table-page/table-page.types';
import type { TableGroupRow } from '@lcabrera/ui/components/Table/Table.types';

export type Order = {
  readonly customer_name: string;
  readonly customer_type: string;
  readonly order_date: string;
  readonly order_id: number;
  readonly order_number: string;
  readonly order_status: string;
  readonly payment_status: string;
  readonly priority: string;
  readonly product_category: string;
  readonly quantity: number;
  readonly shipping_country: string;
  readonly total_amount: string;
  readonly unit_price: string;
};

export type OrderRow =
  | (Order & { readonly tableGroup?: never })
  | (TableGroupRow & { readonly [K in keyof Order]?: never });

export type OrdersPage = Omit<TablePage<Order>, 'data'> & {
  readonly data: readonly OrderRow[];
};
