import type { ColumnPinningState } from '@lcabrera/ui/components/Table/Table.types';

export type PinnedEntry = {
  readonly key: string;
  readonly originalSide: PinSide;
};

export type PinSide = 'left' | 'right';

export const getPinnedEntries = ({
  columnPinning,
}: {
  readonly columnPinning: ColumnPinningState;
}): readonly PinnedEntry[] => [
  ...columnPinning.left.map((key) => ({ key, originalSide: 'left' as const })),
  ...columnPinning.right.map((key) => ({
    key,
    originalSide: 'right' as const,
  })),
];
