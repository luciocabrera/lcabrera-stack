import type { TableColumn } from '../Table.types';

export type TableBodySkeletonProps = {
  /** Column definitions to match skeleton structure */
  columns: TableColumn[];
  /** Number of skeleton rows to render */
  rowCount: number;
  /** Height of each row in pixels */
  rowHeight?: number;
};
