import type {
  ColumnOrderState,
  ColumnPinningState,
} from '#ui/components/Table/Table.types';
import type { OrderConflictResolution } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';

import { getHasPinOrderConflict } from '#ui/components/Table/TableSettingsDrawer/ColumnOrderSection/utils';

type ResolveOrderConflictUpdateArgs = {
  readonly columnPinning: ColumnPinningState;
  readonly conflictDescription: string;
  readonly newOrder: ColumnOrderState;
  readonly orderConflictResolutionPreference?: OrderConflictResolution;
  readonly staticKeys: Set<string>;
};

type ResolveOrderConflictUpdateResult =
  | {
      readonly kind: 'apply-order';
      readonly newOrder: ColumnOrderState;
      readonly pendingPinning: ColumnPinningState;
    }
  | {
      readonly kind: 'auto-accept-conflict';
      readonly orderConflict: {
        readonly description: string;
        readonly isOpen: false;
        readonly pendingOrder: ColumnOrderState;
        readonly pendingPinning: ColumnPinningState;
      };
      readonly resolution: OrderConflictResolution;
    }
  | {
      readonly kind: 'open-conflict';
      readonly orderConflict: {
        readonly description: string;
        readonly isOpen: true;
        readonly pendingOrder: ColumnOrderState;
        readonly pendingPinning: ColumnPinningState;
      };
    };

export const resolveOrderConflictUpdate = ({
  columnPinning,
  conflictDescription,
  newOrder,
  orderConflictResolutionPreference,
  staticKeys,
}: ResolveOrderConflictUpdateArgs): ResolveOrderConflictUpdateResult => {
  if (!getHasPinOrderConflict({ columnPinning, newOrder, staticKeys })) {
    return {
      kind: 'apply-order',
      newOrder,
      pendingPinning: columnPinning,
    };
  }

  if (orderConflictResolutionPreference) {
    return {
      kind: 'auto-accept-conflict',
      orderConflict: {
        description: conflictDescription,
        isOpen: false,
        pendingOrder: newOrder,
        pendingPinning: columnPinning,
      },
      resolution: orderConflictResolutionPreference,
    };
  }

  return {
    kind: 'open-conflict',
    orderConflict: {
      description: conflictDescription,
      isOpen: true,
      pendingOrder: newOrder,
      pendingPinning: columnPinning,
    },
  };
};
