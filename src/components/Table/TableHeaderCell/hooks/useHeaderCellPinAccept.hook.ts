import type { DataKey } from '@/components/Table/Table.types';
import type { PinSide } from '@/types/ui.types';

import { useSetColumnPinning } from '@/components/Table/contexts/TableConfig/columns/actions';
import {
  useGetColumnOrder,
  useGetColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  buildAllOrderedColumns,
  resolveClosestEdgeSide,
} from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type UseHeaderCellPinAcceptArgs<TData> = {
  columnKey: DataKey<TData>;
};

export const useHeaderCellPinAccept = <TData>({
  columnKey,
}: UseHeaderCellPinAcceptArgs<TData>) => {
  const columns = useGetColumns<TData>();
  const columnsOrder = useGetColumnOrder<TData>();
  const setColumnPinning = useSetColumnPinning<TData>();

  return (pinSide: PinSide) => {
    const allOrderedColumns = buildAllOrderedColumns({
      columns,
      columnsOrder,
    });

    const side = resolveClosestEdgeSide({
      allOrderedColumns,
      columnKey,
      pinSide,
    });

    setColumnPinning({ columnKey, side });
  };
};
