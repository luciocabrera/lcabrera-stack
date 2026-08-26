import { TableRouteView } from '@lcabrera/ui';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { fetchWideAlltypes150Page } from '@/services';

/**
 * Offset-and-sort only, like car-sales: the varied column types make generic
 * server-side filtering impractical here, and the endpoint cannot seek — so
 * this route opts into neither capability.
 */
export const WideAlltypes150Page = () => (
  <TableRouteView<WideAlltypes150, WideAlltypes150Response>
    fetchPage={fetchWideAlltypes150Page}
  />
);
