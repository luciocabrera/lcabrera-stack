import { TableRouteView } from '@lcabrera/ui';

import type { WideAlltypes150, WideAlltypes150Response } from '@/services';

import { fetchWideAlltypes150Page } from '@/services';

export const WideAlltypes150Page = () => (
  <TableRouteView<WideAlltypes150, WideAlltypes150Response>
    fetchPage={fetchWideAlltypes150Page}
  />
);
