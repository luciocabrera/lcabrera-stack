import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';

/**
 * The client hydration entry every app needs identically — no per-app
 * variation exists in the stock React Router framework-mode scaffold.
 */
export const hydrateApp = (): void => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
};
