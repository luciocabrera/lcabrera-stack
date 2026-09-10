// @vitest-environment jsdom

import { usePersistCookieAction } from '@lcabrera/ui/hooks';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import routes from '@/routes';

import { action } from './root';

afterEach(cleanup);

const MODULE = 'routes/api/persist-cookie/root.ts';

const TRIGGER_LABEL = 'Persist';

const ENTRY = {
  key: 'demo-slice',
  searchParamKey: 'demo',
  searchParamValue: 'applied',
  value: 'stored',
};

const actionPath = () => {
  const declared = routes.find((entry) => entry.file === MODULE);
  if (declared?.path === undefined) {
    throw new Error(`routes.ts declares no route for ${MODULE}`);
  }
  return `/${declared.path}`;
};

const Trigger = () => {
  const persist = usePersistCookieAction({ fetcherKey: 'persist-cookie-test' });

  return (
    <button onClick={() => persist([ENTRY])} type='button'>
      {TRIGGER_LABEL}
    </button>
  );
};

const renderTrigger = () => {
  const router = createMemoryRouter([
    { Component: Trigger, path: '/' },
    { action, path: actionPath() },
  ]);

  render(<RouterProvider router={router} />);

  return router;
};

describe('the route that answers the cookie action', () => {
  it('answers the submission the library makes, rather than leaving it unmatched', async () => {
    const router = renderTrigger();

    fireEvent.click(await screen.findByRole('button', { name: TRIGGER_LABEL }));

    await waitFor(() => {
      expect(router.state.location.search).toBe(
        `?${ENTRY.searchParamKey}=${ENTRY.searchParamValue}`,
      );
    });
    expect(router.state.errors).toBeNull();
  });
});
