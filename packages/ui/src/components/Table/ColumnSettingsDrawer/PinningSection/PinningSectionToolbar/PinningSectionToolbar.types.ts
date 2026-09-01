import type { TableColumnLayoutLock } from '#ui/components/Table/Table.types';

export type PinningSectionToolbarProps = {
  readonly isBusy?: boolean;
  readonly layoutLock?: TableColumnLayoutLock;
  readonly variant?: 'footer' | 'toolbar';
};
