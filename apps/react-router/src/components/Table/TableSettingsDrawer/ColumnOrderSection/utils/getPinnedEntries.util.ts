import type { ColumnPinningState } from '@/components/Table/Table.types';

export type PinSide = 'left' | 'right';

export type PinnedEntry = {
  readonly key: string;
  readonly originalSide: PinSide;
};

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
