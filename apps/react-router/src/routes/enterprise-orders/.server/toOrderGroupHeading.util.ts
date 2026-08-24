import type { TableColumn } from '@lcabrera/ui/components/Table';

import { parseDrillGroup } from '@lcabrera/api/olap/parse-drill-group.util';
import { toGroupLabel } from '@lcabrera/server/db/olap/to-group-label.util';

import type { EnterpriseOrderTableRow } from '@/routes/enterprise-orders/config';

const HEADING_SEPARATOR = ' · ';

type ToOrderGroupHeadingArgs = {
  readonly columns: readonly TableColumn<EnterpriseOrderTableRow>[];
  readonly params: URLSearchParams;
};

/**
 * The group-details modal's heading — one `Label: value` per key, outermost
 * first, or `undefined` when the request names no readable group.
 *
 * **Built here rather than in the component, because the token carries no
 * labels.** `encodeDrillGroup` drops the group row's formatted `label` on
 * purpose — a display string has no business reaching a query — so the modal has
 * only raw values to work from, and turning those back into text is
 * `toGroupLabel`'s job in the Node-only package. Rebuilding it on the client
 * would be a second formatter free to disagree with the row the reader clicked;
 * putting the label in the URL instead would freeze it into a shared link that
 * outlives the value it describes.
 *
 * The column's declared `label` is what names each key, so the heading reads
 * the way the grid's own headers do rather than in raw column keys.
 */
export const toOrderGroupHeading = ({
  columns,
  params,
}: ToOrderGroupHeadingArgs) => {
  const request = parseDrillGroup(params);

  if (request === undefined) return;

  return request.group.path
    .map(({ columnKey, value }) => {
      const column = columns.find((entry) => String(entry.key) === columnKey);

      return `${column?.label ?? columnKey}: ${toGroupLabel(value)}`;
    })
    .join(HEADING_SEPARATOR);
};
