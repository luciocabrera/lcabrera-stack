/**
 * Mounts a grouped Table harness under a memory router with the cookie action.
 */

import type { ReactNode } from 'react';

import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

export const renderGroupedTableRoute = (element: ReactNode) =>
  render(
    <RouterProvider
      router={createMemoryRouter([
        { element, path: '/' },
        { action: () => ({ ok: true }), path: '/_action/persist-cookie' },
      ])}
    />,
  );
