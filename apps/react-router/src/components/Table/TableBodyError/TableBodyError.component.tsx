import * as stylex from '@stylexjs/stylex';

import type { TableBodyErrorProps } from './TableBodyError.types';

import { styles } from './TableBodyError.stylex';

const DEFAULT_ERROR_MESSAGE =
  'We could not load this table right now, but your filters and column setup are still safe.';

export const TableBodyError = ({ error, onRetry }: TableBodyErrorProps) => {
  let details: string | undefined;
  if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
  }

  return (
    <div data-testid='table-body-error' {...stylex.props(styles.panel)}>
      <div {...stylex.props(styles.content)}>
        <svg
          aria-hidden
          viewBox='0 0 320 160'
          {...stylex.props(styles.illustration)}
        >
          <defs>
            <linearGradient id='tableErrorGradient' x1='0' x2='1' y1='0' y2='1'>
              <stop offset='0%' stopColor='var(--error-background)' />
              <stop offset='100%' stopColor='var(--surface-elevated)' />
            </linearGradient>
          </defs>

          <rect
            fill='url(#tableErrorGradient)'
            height='120'
            rx='16'
            width='260'
            x='30'
            y='20'
          />
          <rect
            fill='var(--border-primary)'
            height='18'
            opacity='0.5'
            rx='5'
            width='58'
            x='46'
            y='35'
          />
          <rect
            fill='var(--border-primary)'
            height='18'
            opacity='0.5'
            rx='5'
            width='58'
            x='114'
            y='35'
          />
          <rect
            fill='var(--border-primary)'
            height='18'
            opacity='0.5'
            rx='5'
            width='58'
            x='182'
            y='35'
          />

          <rect
            fill='var(--surface-primary)'
            height='22'
            opacity='0.9'
            rx='6'
            width='228'
            x='46'
            y='66'
          />
          <rect
            fill='var(--surface-primary)'
            height='22'
            opacity='0.7'
            rx='6'
            width='228'
            x='46'
            y='95'
          />

          <circle cx='160' cy='78' fill='var(--error)' r='22' />
          <path
            d='M160 66v15'
            stroke='var(--text-inverse)'
            strokeLinecap='round'
            strokeWidth='4'
          />
          <circle cx='160' cy='87' fill='var(--text-inverse)' r='2.5' />
        </svg>

        <p {...stylex.props(styles.eyebrow)}>Temporary Data Issue</p>
        <p {...stylex.props(styles.message)}>{DEFAULT_ERROR_MESSAGE}</p>
      </div>
      <p {...stylex.props(styles.title)}>Error Loading Data</p>
      {details !== undefined && (
        <p {...stylex.props(styles.details)}>{details}</p>
      )}
      <button
        onClick={onRetry}
        type='button'
        {...stylex.props(styles.retryButton)}
      >
        Retry
      </button>
    </div>
  );
};
