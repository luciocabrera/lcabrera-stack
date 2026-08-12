import type {
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '#ui/components/Table/Table.types';
import type { UnpinConflictResolution } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import type { PinSide } from '#ui/types/ui.types';

import { getHasPinOrderConflict } from './getHasPinOrderConflict.util';

type PinSideModalResult<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
};

type ResolveToggleColumnPinIntentArgs<TData> = {
  readonly allOrderedColumns: readonly TableColumn<TData>[];
  readonly columnKey: DataKey<TData>;
  readonly columnPinning: ColumnPinningState<TData>;
  readonly globalPinSidePreference?: PinSide;
  readonly globalUnpinConflictResolutionPreference?: UnpinConflictResolution;
  readonly isPinning: boolean;
  readonly staticKeys?: Set<string>;
};

type ResolveToggleColumnPinIntentResult<TData> =
  | {
      readonly kind: 'apply-pinning-direct';
      readonly nextPinning: ColumnPinningState<TData>;
    }
  | {
      readonly kind: 'auto-accept-pin-side';
      readonly modal: PinSideModalResult<TData>;
      readonly pinSide: PinSide;
    }
  | {
      readonly kind: 'auto-accept-unpin-conflict';
      readonly modal: UnpinConflictModalResult<TData>;
      readonly resolution: UnpinConflictResolution;
    }
  | {
      readonly kind: 'open-pin-side-modal';
      readonly modal: PinSideModalResult<TData>;
    }
  | {
      readonly kind: 'open-unpin-conflict-modal';
      readonly modal: UnpinConflictModalResult<TData>;
    };

type UnpinConflictModalResult<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly side: 'left' | 'right';
};

export const resolveToggleColumnPinIntent = <TData>({
  allOrderedColumns,
  columnKey,
  columnPinning,
  globalPinSidePreference,
  globalUnpinConflictResolutionPreference,
  isPinning,
  staticKeys,
}: ResolveToggleColumnPinIntentArgs<TData>): ResolveToggleColumnPinIntentResult<TData> => {
  const selectedColumn = allOrderedColumns.find(
    (column) => column.key === columnKey,
  );
  const columnLabel = selectedColumn?.label ?? columnKey;

  if (isPinning) {
    const pinSideModal: PinSideModalResult<TData> = {
      columnKey,
      columnLabel,
      isOpen: globalPinSidePreference === undefined,
    };

    if (globalPinSidePreference) {
      return {
        kind: 'auto-accept-pin-side',
        modal: pinSideModal,
        pinSide: globalPinSidePreference,
      };
    }

    return {
      kind: 'open-pin-side-modal',
      modal: pinSideModal,
    };
  }

  const nextPinning: ColumnPinningState<TData> = {
    left: columnPinning.left.filter((key) => key !== columnKey),
    right: columnPinning.right.filter((key) => key !== columnKey),
  };

  const currentOrder = allOrderedColumns.map((column) => column.key);
  const hasPinOrderConflict = getHasPinOrderConflict({
    columnPinning: nextPinning,
    newOrder: currentOrder,
    staticKeys,
  });

  if (!hasPinOrderConflict) {
    return {
      kind: 'apply-pinning-direct',
      nextPinning,
    };
  }

  const side = columnPinning.left.includes(columnKey) ? 'left' : 'right';
  const unpinConflictModal: UnpinConflictModalResult<TData> = {
    columnKey,
    columnLabel,
    isOpen: globalUnpinConflictResolutionPreference === undefined,
    side,
  };

  if (globalUnpinConflictResolutionPreference) {
    return {
      kind: 'auto-accept-unpin-conflict',
      modal: unpinConflictModal,
      resolution: globalUnpinConflictResolutionPreference,
    };
  }

  return {
    kind: 'open-unpin-conflict-modal',
    modal: unpinConflictModal,
  };
};
