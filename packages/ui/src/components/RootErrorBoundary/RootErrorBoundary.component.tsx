import type { RootErrorBoundaryProps } from './RootErrorBoundary.types';

/**
 * Deliberately dependency-light top-level fallback shared by every app's root
 * `ErrorBoundary` route export.
 */
export const RootErrorBoundary = ({ error }: RootErrorBoundaryProps) => {
  const message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main>
      <h1>{message}</h1>
      <p>{details}</p>
      {Boolean(stack) && (
        <pre>
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
};
