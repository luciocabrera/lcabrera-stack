import * as stylex from '@stylexjs/stylex';

import { ErrorDescriptive } from '@/components/Icons';

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
      <div
        data-testid='table-body-error-overlay'
        {...stylex.props(styles.overlay)}
      ></div>
      <div {...stylex.props(styles.content)}>
        <ErrorDescriptive />

        <p {...stylex.props(styles.eyebrow)}>Temporary Data Issue</p>
        <p {...stylex.props(styles.message)}>{DEFAULT_ERROR_MESSAGE}</p>
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
    </div>
  );
};
