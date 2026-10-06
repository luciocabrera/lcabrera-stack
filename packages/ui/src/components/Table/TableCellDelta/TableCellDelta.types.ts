export type TableCellDeltaDirection = 'decrease' | 'increase' | 'unchanged';

export type TableCellDeltaParams = {
  readonly decrease: string;
  readonly increase: string;
  readonly precision?: number;
  readonly unchanged: string;
};
