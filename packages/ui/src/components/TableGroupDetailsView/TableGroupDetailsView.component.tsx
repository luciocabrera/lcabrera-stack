import { OLAP_DRILL_GROUP_PARAM } from '@lcabrera/api/olap/olap.constants';
import { useLoaderData, useNavigate, useSearchParams } from 'react-router';

import type { TableRouteLoaderData } from '#ui/routing/loaders/createTableRouteLoader.util';
import type { TablePageResponse } from '#ui/types/ui.types';

import { Modal } from '#ui/components/Modal';
import { TABLE_NESTED_URL_STATE_PREFIX } from '#ui/components/Table/Table.constants';
import { toLockedFiltersHeading } from '#ui/components/Table/utils';
import { TableRouteView } from '#ui/components/TableRouteView/TableRouteView.component';

import type { TableGroupDetailsViewProps } from './TableGroupDetailsView.types';

import { styles } from './TableGroupDetailsView.stylex';

const DEFAULT_TITLE = 'Group';

export const TableGroupDetailsView = <
  TData extends Record<string, unknown>,
  TResponse extends TablePageResponse<TData>,
>({
  closePath,
  fallbackTitle = DEFAULT_TITLE,
  fetchPage,
}: TableGroupDetailsViewProps<TData, TResponse>) => {
  const { metaState } = useLoaderData<TableRouteLoaderData<TData, TResponse>>();
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

    void navigate({ pathname: closePath, search: next.toString() });
  };

  return (
    <Modal
      bodyStylex={styles.flushBody}
      customStylex={styles.dialog}
      isOpen
      onClose={handleClose}
      title={toLockedFiltersHeading(metaState.lockedFilters) ?? fallbackTitle}
    >
      <TableRouteView<TData, TResponse>
        fetchPage={(query) => fetchPage({ ...query, group })}
      />
    </Modal>
  );
};
