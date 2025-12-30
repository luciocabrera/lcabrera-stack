import * as stylex from '@stylexjs/stylex';

export const tableBodySkeletonStyles = stylex.create({
  body: {
    display: 'block',
  },
  cell: (minWidth?: number) => ({
    flex: '1 1 0%',
    paddingBlock: 'var(--table-padding-block)',
    paddingInline: 'var(--table-padding-inline)',
    alignItems: 'center',
    display: 'flex',
    minWidth: minWidth ?? 100,
  }),
  row: (height?: number) => ({
    height: height ?? null,
  }),
});
