import { useRevalidator } from 'react-router';

import { Button } from '#ui/components/Button';

/**
 * Re-runs the route loader through React Router's `useRevalidator()` — because
 * filters and sorting live in the URL, revalidation re-fetches with the query
 * state already on screen.
 */
export const TableEmptyStateRetryButton = () => {
  const { revalidate } = useRevalidator();

  return (
    <Button onClick={revalidate} variant='primary'>
      Retry
    </Button>
  );
};
