// @vitest-environment jsdom

import type { ReactNode } from 'react';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { use, useState } from 'react';
import { createMemoryRouter, redirect, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TablePersistence } from '#ui/components/Table/contexts/TableConfig/TableConfigContext.types';

import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import {
  PERSIST_COOKIE_ACTION,
  PERSIST_TABLE_STATE_FETCHER_KEY,
} from '#ui/constants/globalSettings.constants';
import { usePersistCookieAction } from '#ui/hooks/usePersistCookieAction.hook';

import { useTablePersistence } from './useTablePersistence.hook';

afterEach(cleanup);

const ENTRY = {
  key: 'slice',
  searchParamKey: 'sorting',
  searchParamValue: 'applied',
  value: 'stored',
};

type ApplyButtonProps = {
  readonly onDone: () => void;
  readonly persist: Persist | undefined;
};

type Persist = (entries: readonly (typeof ENTRY)[]) => void;

const ApplyButton = ({ onDone, persist }: ApplyButtonProps) => (
  <button
    onClick={() => {
      persist?.([ENTRY]);
      onDone();
    }}
    type='button'
  >
    Apply
  </button>
);

type HeldMenuItemProps = {
  readonly onDone: () => void;
  readonly slice: keyof TablePersistence;
};

const HeldMenuItem = ({ onDone, slice }: HeldMenuItemProps) => {
  const persistence = use(TablePersistenceContext);

  return <ApplyButton onDone={onDone} persist={persistence?.[slice]} />;
};

type UnheldMenuItemProps = {
  readonly onDone: () => void;
};

const UnheldMenuItem = ({ onDone }: UnheldMenuItemProps) => {
  const persist = usePersistCookieAction({
    fetcherKey: PERSIST_TABLE_STATE_FETCHER_KEY,
  });

  return <ApplyButton onDone={onDone} persist={persist} />;
};

type MenuProps = {
  readonly renderItem: (onDone: () => void) => ReactNode;
};

const Menu = ({ renderItem }: MenuProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return isOpen && renderItem(() => setIsOpen(false));
};

type HoldingTableProps = {
  readonly slice: keyof TablePersistence;
};

const HoldingTable = ({ slice }: HoldingTableProps) => (
  <TablePersistenceContext value={useTablePersistence()}>
    <Menu
      renderItem={(onDone) => <HeldMenuItem onDone={onDone} slice={slice} />}
    />
  </TablePersistenceContext>
);

const renderRoute = (element: ReactNode) => {
  const answered = { count: 0 };
  const router = createMemoryRouter([
    { element, path: '/' },
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

const SLICES = ['columnSizing', 'tableState', 'uiFlags'] as const;

describe('useTablePersistence', () => {
  it.each(SLICES)(
    'lets a %s submission reach the URL after the menu that made it closes',
    async (slice) => {
      const { router } = renderRoute(<HoldingTable slice={slice} />);

      fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

      await waitFor(() => {
        expect(router.state.location.search).toBe('?sorting=applied');
      });
    },
  );

  it('is what keeps it: a fetcher held only by the menu loses the redirect', async () => {
    const { answered, router } = renderRoute(
      <Menu renderItem={(onDone) => <UnheldMenuItem onDone={onDone} />} />,
    );

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
