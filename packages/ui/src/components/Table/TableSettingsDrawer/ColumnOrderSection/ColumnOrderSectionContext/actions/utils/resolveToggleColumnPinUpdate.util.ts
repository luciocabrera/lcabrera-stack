import type {
  ColumnOrderState,
  ColumnPinningState,
  DataKey,
  TableColumn,
} from '@lcabrera/ui/components/Table/Table.types';
import type { UnpinConflictResolution } from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import type { PinSide } from '@lcabrera/ui/types/ui.types';

import {
  buildAllOrderedColumns,
  resolveToggleColumnPinIntent,
} from '@lcabrera/ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

export type ResolveToggleColumnPinUpdateResult =
  | {
      readonly kind: 'apply-pinning-direct';
      readonly nextPinning: ColumnPinningState<Record<string, unknown>>;
    }
  | {
      readonly kind: 'auto-accept-pin-side';
      readonly modal: PinSideModalResult;
      readonly pinSide: PinSide;
    }
  | {
      readonly kind: 'auto-accept-unpin-conflict';
      readonly modal: UnpinConflictModalResult;
      readonly resolution: UnpinConflictResolution;
    }
  | {
      readonly kind: 'ignored-static';
    }
  | {
      readonly kind: 'open-pin-side-modal';
      readonly modal: PinSideModalResult;
    }
  | {
      readonly kind: 'open-unpin-conflict-modal';
      readonly modal: UnpinConflictModalResult;
    };

type PinSideModalResult = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
};

type ResolveToggleColumnPinUpdateArgs = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnPinning: ColumnPinningState<Record<string, unknown>>;
  readonly columns: readonly TableColumn<Record<string, unknown>>[];
  readonly columnsOrder: ColumnOrderState<Record<string, unknown>>;
  readonly globalPinSidePreference?: PinSide;
  readonly globalUnpinConflictResolutionPreference?: UnpinConflictResolution;
  readonly isColumnStatic: boolean;
  readonly isPinning: boolean;
  readonly staticKeys?: Set<string>;
};

type UnpinConflictModalResult = {
  readonly columnKey: DataKey<Record<string, unknown>>;
  readonly columnLabel: string;
  readonly isOpen: boolean;
  readonly side: 'left' | 'right';
};

export const resolveToggleColumnPinUpdate = ({
  columnKey,
  columnPinning,
  columns,
  columnsOrder,
  globalPinSidePreference,
  globalUnpinConflictResolutionPreference,
  isColumnStatic,
  isPinning,
  staticKeys,
}: ResolveToggleColumnPinUpdateArgs): ResolveToggleColumnPinUpdateResult => {
  if (isColumnStatic) {
    return {
      kind: 'ignored-static',
    };
  }

  const allOrderedColumns = buildAllOrderedColumns({
    columns,
    columnsOrder,
  });

  return resolveToggleColumnPinIntent({
    allOrderedColumns,
    columnKey,
    columnPinning,
    globalPinSidePreference,
    globalUnpinConflictResolutionPreference,
    isPinning,
    staticKeys,
  });
};
