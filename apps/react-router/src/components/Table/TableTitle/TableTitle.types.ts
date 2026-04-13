import type { TableProps } from '../Table.types.ts';

export type TableTitleProps = Pick<
  TableProps<Record<string, unknown>, unknown>,
  'actions' | 'customStylex' | 'icon'
>;
