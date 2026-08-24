import { useRevalidator } from 'react-router';

import { Button } from '#ui/components/Button';

export const TableEmptyStateRetryButton = () => {
  const { revalidate } = useRevalidator();

  return (
    <Button onClick={revalidate} variant='primary'>
      Retry
    </Button>
  );
};
