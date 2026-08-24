import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { TableRouteView } from '@lcabrera/ui';
import { Modal } from '@lcabrera/ui/components/Modal';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';

import type {
  EnterpriseOrdersResponse,
  EnterpriseOrderTableRow,
} from '../config';
import type { loader } from './group-details.loader';

import { ENTERPRISE_ORDERS_PATH } from '../config';
import { fetchOrderGroupPage } from '../fetchOrderGroupPage.service';
import { styles } from './GroupDetails.stylex';

const FALLBACK_TITLE = 'Group';

/**
 * One group's rows as a full table, overlaid on the grouped list via its
 * `<Outlet/>` (#870).
 *
 * **Closing rebuilds the list's URL rather than going back.** `navigate(-1)`
 * would depend on there being a history entry to return to, which a shared link
 * opened in a new tab does not have; dropping the `group` param keeps every
 * other one, so the list reopens with the filters and grouping it was read
 * under.
 *
 * **The token is forwarded verbatim, never rebuilt.** The modal has no group
 * row in hand — it may have been opened from a link — so the URL is the only
 * statement of which group this is, and re-encoding it from parsed parts would
 * be a second chance to get it wrong.
 */
export const GroupDetails = () => {
  const { groupHeading } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const group = searchParams.get(OLAP_DRILL_GROUP_PARAM) ?? '';

  const handleClose = () => {
    const next = new URLSearchParams(searchParams);

    next.delete(OLAP_DRILL_GROUP_PARAM);

    void navigate({
      pathname: ENTERPRISE_ORDERS_PATH,
      search: next.toString(),
    });
  };

  const handleFetchPage = (query: PaginatedQuery) =>
    fetchOrderGroupPage({ ...query, group });

  return (
    <Modal
      bodyStylex={styles.flushBody}
      customStylex={styles.dialog}
      isOpen
      onClose={handleClose}
      title={groupHeading ?? FALLBACK_TITLE}
    >
      <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
        fetchPage={handleFetchPage}
      />
    </Modal>
  );
};
