import { RouteErrorBoundary, useNotifyOnError } from '@lcabrera/ui';
import { useRouteError } from 'react-router';

export const ErrorBoundary = () => {
  const error = useRouteError();
  useNotifyOnError(error);

  return (
    <RouteErrorBoundary
      defaultMessage='The orders table could not be loaded.'
      error={error}
    />
  );
};
