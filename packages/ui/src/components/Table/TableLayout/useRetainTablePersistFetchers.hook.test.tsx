// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import { createMemoryRouter, redirect, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  PERSIST_COOKIE_ACTION,
  PERSIST_TABLE_STATE_FETCHER_KEY,
  PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
} from '#ui/constants/globalSettings.constants';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

import { useRetainTablePersistFetchers } from './useRetainTablePersistFetchers.hook';

afterEach(cleanup);

const ENTRY = {
  key: 'slice',
  searchParamKey: 'sorting',
  searchParamValue: 'applied',
  value: 'stored',
};

type MenuItemProps = {
  readonly fetcherKey: string;
  readonly onDone: () => void;
};

const MenuItem = ({ fetcherKey, onDone }: MenuItemProps) => {
  const persist = usePersistCookieAction({ fetcherKey });

  return (
    <button
      onClick={() => {
        persist([ENTRY]);
        onDone();
      }}
      type='button'
    >
      Apply
    </button>
  );
};

type MenuProps = {
  readonly fetcherKey: string;
};

const Menu = ({ fetcherKey }: MenuProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    isOpen && (
      <MenuItem fetcherKey={fetcherKey} onDone={() => setIsOpen(false)} />
    )
  );
};

const RetainingTable = ({ fetcherKey }: MenuProps) => {
  useRetainTablePersistFetchers();

  return <Menu fetcherKey={fetcherKey} />;
};

type RenderArgs = {
  readonly fetcherKey: string;
  readonly isRetained: boolean;
};

const renderMenu = ({ fetcherKey, isRetained }: RenderArgs) => {
  const answered = { count: 0 };
  const router = createMemoryRouter([
    {
      element: isRetained ? (
        <RetainingTable fetcherKey={fetcherKey} />
      ) : (
        <Menu fetcherKey={fetcherKey} />
      ),
      path: '/',
    },
    {
      action: () => {
        answered.count += 1;
        return redirect(`/?${ENTRY.searchParamKey}=${ENTRY.searchParamValue}`);
      },
      path: PERSIST_COOKIE_ACTION,
    },
  ]);

  render(<RouterProvider router={router} />);

  return { answered, router };
};

const KEYS = [
  PERSIST_TABLE_STATE_FETCHER_KEY,
  PERSIST_TABLE_UI_FLAGS_FETCHER_KEY,
];

describe('useRetainTablePersistFetchers', () => {
  it.each(KEYS)(
    'lets a %s submission reach the URL after the menu that made it closes',
    async (fetcherKey) => {
      const { router } = renderMenu({ fetcherKey, isRetained: true });

      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(router.state.location.search).toBe('?sorting=applied');
      });
    },
  );

  it('is what keeps it: without it the router drops the redirect', async () => {
    const { answered, router } = renderMenu({
      fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY,
      isRetained: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(answered.count).toBe(1);
    });
    await waitFor(() => {
      expect(router.state.fetchers.size).toBe(0);
    });
    expect(router.state.navigation.state).toBe('idle');
    expect(router.state.location.search).toBe('');
  });
});
