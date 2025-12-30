import * as stylex from '@stylexjs/stylex';

/**
 * CarSales Component Styles
 * Full-height flex layout for responsive table
 */

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '1rem',
    gap: '1rem',
    boxSizing: 'border-box',
  },
  header: {
    flexShrink: 0,
  },
  tableWrapper: {
    flex: 1,
    minHeight: 0,
  },
});
