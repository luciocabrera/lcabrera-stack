import type { TableProps } from '../Table.types';

export type TableTitleProps = Pick<
  TableProps<Record<string, unknown>, unknown>,
  'actions' | 'customStylex' | 'icon'
>;
