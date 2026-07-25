// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const {
  collapsedPreferenceMock,
  setGlobalNavigationPreferencesMock,
  sizePreferenceMock,
} = vi.hoisted(() => ({
  collapsedPreferenceMock: vi.fn<() => string | undefined>(() => {}),
  setGlobalNavigationPreferencesMock: vi.fn(),
  sizePreferenceMock: vi.fn<() => string | undefined>(() => {}),
}));

type MockHeaderActionsProps = {
  readonly isCollapsed: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
};

vi.mock('@lcabrera/ui/components/Icons', () => ({
  MenuIcon: () => <span>Menu icon</span>,
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/actions', () => ({
  useSetGlobalNavigationPreferences: () => setGlobalNavigationPreferencesMock,
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationCollapsedPreference: () => collapsedPreferenceMock(),
  useGetGlobalNavigationSizePreference: () => sizePreferenceMock(),
}));

vi.mock('../NavigationHeaderActions', () => ({
  NavigationHeaderActions: ({
    isCollapsed,
    isExpanded,
    onToggleExpanded,
  }: MockHeaderActionsProps) => (
    <div
      data-collapsed={String(isCollapsed)}
      data-expanded={String(isExpanded)}
      data-testid='header-actions'
    >
      <button onClick={onToggleExpanded} type='button'>
        Toggle expanded
      </button>
    </div>
  ),
}));

import { NavigationHeader } from './NavigationHeader.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  collapsedPreferenceMock.mockReset();
  collapsedPreferenceMock.mockReturnValue(undefined);
  setGlobalNavigationPreferencesMock.mockReset();
  sizePreferenceMock.mockReset();
  sizePreferenceMock.mockReturnValue(undefined);
});

describe('NavigationHeader', () => {
  it('renders the brand and the header actions', () => {
    render(<NavigationHeader />);

    expect(screen.getByText('Navigation')).not.toBeNull();
    expect(screen.getByTestId('header-actions').dataset.expanded).toBe('true');
  });

  it('collapses the navigation through the global preference action', () => {
    render(<NavigationHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle expanded' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      collapsed: 'collapsed',
    });
  });

  it('expands a collapsed navigation through the global preference action', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationHeader />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle expanded' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      collapsed: 'expanded',
    });
  });

  it('marks the actions collapsed when the collapsed preference is set', () => {
    collapsedPreferenceMock.mockReturnValue('collapsed');

    render(<NavigationHeader />);

    expect(screen.getByTestId('header-actions').dataset.collapsed).toBe('true');
  });
});
