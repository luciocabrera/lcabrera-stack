import type { ColumnPinningState, DataKey } from '../Table.types';
import { applyPin } from '../TableSettingsDrawer/ColumnOrderSection/utils';

type GetNewPinningBasedOnColumnKeyArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly columnPinning?: 'left' | 'right';
  readonly existingPinning?: ColumnPinningState<TData>;
  readonly staticKeys?: Set<string>;
};
export const getNewPinningBasedOnColumnKey = <TData>({
  columnKey,
  columnPinning,
  existingPinning,
  staticKeys,
}: GetNewPinningBasedOnColumnKeyArgs<TData>) => {
  // Pinning: remove from both sides, then re-add respecting static column positions
  const currentPinning = existingPinning ?? {
    left: [],
    right: [],
  };

  const newPinning: ColumnPinningState<TData> = columnPinning
    ? applyPin<TData>({
        columnKey,
        columnPinning: currentPinning,
        side: columnPinning,
        staticKeys,
      })
    : {
        left: currentPinning.left.filter((k) => k !== columnKey),
        right: currentPinning.right.filter((k) => k !== columnKey),
      };

  return newPinning;
};
