import { RootErrorBoundary } from '@lcabrera/ui';
import { useRouteError } from 'react-router';

export const ErrorBoundary = () => {
  const error = useRouteError();

  return <RootErrorBoundary error={error} />;
};
