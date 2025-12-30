import * as stylex from '@stylexjs/stylex';

export const tableBodySkeletonStyles = stylex.create({
  body: {
    display: 'block',
  },
  cell: (minWidth?: number) => ({
    padding: '8px 12px',
    alignItems: 'center',
    display: 'flex',
    minWidth: minWidth ?? 100,
  }),
  row: (height: number) => ({
    display: 'flex',
    height,
  }),
});
