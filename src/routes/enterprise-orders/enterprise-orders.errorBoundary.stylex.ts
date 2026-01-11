import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    padding: '2rem',
    gap: '1rem',
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  title: {
    color: '#dc2626',
    fontSize: '1.5rem',
    fontWeight: 'bold',
  },
  retryButton: {
    ':hover': {
      backgroundColor: '#2563eb',
    },
    padding: '0.5rem 1rem',
    borderColor: 'transparent',
    borderRadius: '0.375rem',
    borderStyle: 'none',
    borderWidth: 0,
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
  },
});
