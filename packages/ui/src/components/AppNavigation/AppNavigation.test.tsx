// @vitest-environment jsdom

import type { NavbarItemConfig } from '@lcabrera/ui/components/Navbar/Navbar.types';
import type { GlobalSettingsState } from '@lcabrera/ui/types/globalSettings.types';

import { GlobalSettingsProvider } from '@lcabrera/ui/contexts/GlobalSettingsContext';
// import { useSetGlobalNavigationPreferences } from '@lcabrera/ui/contexts/GlobalSettingsContext/actions';
import { mockDialogElement } from '@lcabrera/ui/utils/tests/mockDialogElement.util';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { AppNavigation } from './AppNavigation.component';

const { toggleThemeMock, useThemeMock } = vi.hoisted(() => ({
  toggleThemeMock: vi.fn(),
  useThemeMock: vi.fn(),
}));

vi.mock('@lcabrera/ui/hooks/useTheme.hook', () => ({
  useTheme: () => useThemeMock(),
}));

// Fixture only — real route items are supplied by each consuming app (see
// AppNavigationProps.getNavigationItems' own doc), not owned by this package.
const getFixtureNavigationItems = (): readonly NavbarItemConfig[] => [
  { end: true, label: 'Home', to: '/', type: 'link' },
  { label: 'Enterprise Orders', to: '/enterprise-orders', type: 'link' },
];

// const ExternalPinTrigger = ({
//   pinned,
// }: {
//   readonly pinned: 'pinned' | 'unpinned';
// }) => {
//   const setPreferences = useSetGlobalNavigationPreferences();
//   return (
//     <button
//       data-testid='external-pin-trigger'
//       onClick={() => setPreferences({ pinned })}
//       type='button'
//     >
//       Set {pinned}
//     </button>
//   );
// };

type RenderWithGlobalSettingsArgs = {
  readonly initialSettings: GlobalSettingsState;
};

const renderWithGlobalSettings = ({
  initialSettings,
}: RenderWithGlobalSettingsArgs) => {
  const router = createMemoryRouter(
    [
      {
        element: (
          <GlobalSettingsProvider initialSettings={initialSettings}>
            <AppNavigation getNavigationItems={getFixtureNavigationItems} />
          </GlobalSettingsProvider>
        ),
        path: '/',
      },
      {
        action: async () => {
          return;
        },
        path: '/_action/persist-cookie',
      },
    ],
    {
      initialEntries: ['/'],
    },
  );

  return render(<RouterProvider router={router} />);
};

const restoreMockDialogRef: { current: () => void } = {
  current: () => {
    // no-op default restore before setup
  },
};

afterEach(() => {
  restoreMockDialogRef.current();
  cleanup();
});

beforeEach(() => {
  restoreMockDialogRef.current = mockDialogElement().restore;
  toggleThemeMock.mockReset();
  useThemeMock.mockReset();
  useThemeMock.mockReturnValue({
    isDarkMode: false,
    setTheme: vi.fn(),
    theme: 'light',
    toggleTheme: toggleThemeMock,
  });
});

describe('AppNavigation', () => {
  it('renders the configured route links and theme toggle', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Dark Mode/i }));

    expect(screen.getByTestId('main-navigation')).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
    expect(
      screen.getByRole('link', { name: /Enterprise Orders/i }),
    ).toBeDefined();
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

  it('shows the launcher after unpinning the sidebar', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'medium',
        },
        pinning: {},
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Unpin navigation/i }));

    expect(
      screen.getByRole('button', { name: /Open navigation/i }),
    ).toBeDefined();
  });

  it('uses compact density from global settings preference', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          size: 'compact',
        },
        pinning: {},
      },
    });

    expect(
      screen.getByRole('button', { name: /Unpin navigation/i }),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Dark Mode/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();
  });

  it('starts collapsed when global collapsed preference is selected', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          collapsed: 'collapsed',
          size: 'medium',
        },
        pinning: {},
      },
    });

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();
  });

  it('starts unpinned with the panel open when global pinned preference is unpinned', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
    });

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('starts unpinned and collapsed when both global preferences are selected', () => {
    renderWithGlobalSettings({
      initialSettings: {
        navigation: {
          collapsed: 'collapsed',
          pinned: 'unpinned',
          size: 'medium',
        },
        pinning: {},
      },
    });

    const panel = screen.getByTestId('side-panel') as HTMLDialogElement;

    expect(panel.open).toBe(true);
    expect(screen.getByLabelText(/Expand navigation/i)).toBeDefined();
    expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  });

  it('collapses and expands the navigation panel independently of pinning', () => {
    renderWithGlobalSettings({
      initialSettings: { navigation: { size: 'medium' }, pinning: {} },
    });

    expect(screen.getByRole('link', { name: /Home/i })).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    );

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Expand navigation/i }));

    expect(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    ).toBeDefined();
  });

  // it('opens the nav panel when pin preference changes to unpinned externally', () => {
  //   const router = createMemoryRouter(
  //     [
  //       {
  //         element: (
  //           <GlobalSettingsProvider
  //             initialSettings={{
  //               navigation: { pinned: 'pinned', size: 'medium' },
  //               pinning: {},
  //             }}
  //           >
  //             <ExternalPinTrigger pinned='unpinned' />
  //             <AppNavigation isDarkMode={false} onToggleTheme={vi.fn()} />
  //           </GlobalSettingsProvider>
  //         ),
  //         path: '/',
  //       },
  //       { action: async () => {}, path: '/_action/persist-cookie' },
  //     ],
  //     { initialEntries: ['/'] },
  //   );

  //   render(<RouterProvider router={router} />);

  //   // Pinned: nav renders as aside, drawer not open
  //   expect(
  //     screen.queryByRole('button', { name: /Open navigation/i }),
  //   ).toBeNull();

  //   // Simulate Settings saving 'unpinned' preference
  //   fireEvent.click(screen.getByTestId('external-pin-trigger'));

  //   // Drawer should now be open
  //   const panel = screen.getByTestId('side-panel') as HTMLDialogElement;
  //   expect(panel.open).toBe(true);
  //   expect(screen.getByLabelText(/Close navigation/i)).toBeDefined();
  // });
});
