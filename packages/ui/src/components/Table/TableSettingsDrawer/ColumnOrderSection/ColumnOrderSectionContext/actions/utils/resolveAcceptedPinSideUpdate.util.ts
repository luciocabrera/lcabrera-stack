import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@repo/ui/components/Table/Table.types';
import type {
  PinConflictResolution,
  PinSide,
} from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import {
  buildAllOrderedColumns,
  derivePinSideResolutionState,
} from '@repo/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveAcceptedPinSideUpdateArgs = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnPinning: ColumnPinningState<Record<string, unknown>>;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly columnsOrder: ColumnOrderState<Record<string, unknown>>;
  readonly pinConflictResolutionPreference?: PinConflictResolution;
  readonly pinSide: PinSide;
  readonly staticKeys?: Set<string>;
};

type ResolveAcceptedPinSideUpdateResult =
  | {
      readonly columnOrder: ColumnOrderState<Record<string, unknown>>;
      readonly columnPinning: ColumnPinningState<Record<string, unknown>>;
      readonly kind: 'apply-resolved';
    }
  | {
      readonly conflictModal: {
        readonly columnKey: DataKey<Record<string, unknown>>;
        readonly columnLabel: string;
        readonly isOpen: false;
        readonly side: 'left' | 'right';
      };
      readonly kind: 'auto-accept-conflict';
      readonly resolution: PinConflictResolution;
    }
  | {
      readonly conflictModal: {
        readonly columnKey: DataKey<Record<string, unknown>>;
        readonly columnLabel: string;
        readonly isOpen: true;
        readonly side: 'left' | 'right';
      };
      readonly kind: 'open-conflict-modal';
    };

export const resolveAcceptedPinSideUpdate = ({
  columnKey,
  columnPinning,
  columns,
  columnsOrder,
  pinConflictResolutionPreference,
  pinSide,
  staticKeys,
}: ResolveAcceptedPinSideUpdateArgs): ResolveAcceptedPinSideUpdateResult => {
  const allOrderedColumns = buildAllOrderedColumns({
    columns,
    columnsOrder,
  });

  const resolution = derivePinSideResolutionState({
    allOrderedColumns,
    columnKey,
    columnPinning,
    columns,
    currentOrder: columnsOrder,
    pinSide,
    staticKeys,
  });

  if (resolution.kind === 'resolved') {
    return {
      columnOrder: resolution.columnOrder,
      columnPinning: resolution.columnPinning,
      kind: 'apply-resolved',
    };
  }

  const selectedColumn = allOrderedColumns.find(
    (column) => column.key === columnKey,
  );
  const columnLabel = selectedColumn?.label ?? columnKey;

  if (pinConflictResolutionPreference) {
    return {
      conflictModal: {
        columnKey,
        columnLabel,
        isOpen: false,
        side: resolution.side,
      },
      kind: 'auto-accept-conflict',
      resolution: pinConflictResolutionPreference,
    };
  }

  return {
    conflictModal: {
      columnKey,
      columnLabel,
      isOpen: true,
      side: resolution.side,
    },
    kind: 'open-conflict-modal',
  };
};
