import type { PaginatedQuery } from '@lcabrera/api/http/http.types';

import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { TableRouteView } from '@lcabrera/ui';
import { Modal } from '@lcabrera/ui/components/Modal';
import { TABLE_NESTED_URL_STATE_PREFIX } from '@lcabrera/ui/components/Table/Table.constants';
import { toLockedFiltersHeading } from '@lcabrera/ui/components/Table/utils';
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

export const GroupDetails = () => {
  const { metaState } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const group = searchParams.get(OLAP_DRILL_GROUP_PARAM) ?? '';

  const handleClose = () => {
    const next = new URLSearchParams(
      [...searchParams].filter(
        ([key]) =>
          key !== OLAP_DRILL_GROUP_PARAM &&
          !key.startsWith(TABLE_NESTED_URL_STATE_PREFIX),
      ),
    );

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
      title={toLockedFiltersHeading(metaState.lockedFilters) ?? FALLBACK_TITLE}
    >
      <TableRouteView<EnterpriseOrderTableRow, EnterpriseOrdersResponse>
        fetchPage={handleFetchPage}
      />
    </Modal>
  );
};
