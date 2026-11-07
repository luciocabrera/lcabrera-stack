/**
 * Hydrates a tree over markup the server rendered for it, and records any recoverable hydration error so a test can assert there was none.
 */

import type { ReactElement } from 'react';

import { act } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { vi } from 'vite-plus/test';

type HydrateServerMarkupArgs = {
  readonly container: HTMLElement;
  readonly tree: ReactElement;
};

export const hydrateServerMarkup = async ({
  container,
  tree,
}: HydrateServerMarkupArgs) => {
  const onRecoverableError = vi.fn();
  const root = await act(async () =>
    hydrateRoot(container, tree, { onRecoverableError }),
  );

  const unmount = () => {
    act(() => {
      root.unmount();
    });
    container.remove();
  };

  return { onRecoverableError, unmount };
};
