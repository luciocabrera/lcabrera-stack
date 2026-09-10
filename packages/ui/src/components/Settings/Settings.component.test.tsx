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
  setGlobalGroupingPreferencesMock,
  setGlobalNavigationPreferencesMock,
  setGlobalPinningPreferencesMock,
  setGlobalTablePanelPreferencesMock,
  useGetGlobalGroupingPreferencesMock,
  useGetGlobalNavigationPreferencesMock,
  useGetGlobalPinningPreferencesMock,
  useGetGlobalTablePanelPreferencesMock,
} = vi.hoisted(() => {
  return {
    setGlobalGroupingPreferencesMock: vi.fn(),
    setGlobalNavigationPreferencesMock: vi.fn(),
    setGlobalPinningPreferencesMock: vi.fn(),
    setGlobalTablePanelPreferencesMock: vi.fn(),
    useGetGlobalGroupingPreferencesMock: vi.fn(),
    useGetGlobalNavigationPreferencesMock: vi.fn(),
    useGetGlobalPinningPreferencesMock: vi.fn(),
    useGetGlobalTablePanelPreferencesMock: vi.fn(),
  };
});

vi.mock('#ui/contexts/GlobalSettingsContext/actions', () => ({
  useSetGlobalGroupingPreferences: () => setGlobalGroupingPreferencesMock,
  useSetGlobalNavigationPreferences: () => setGlobalNavigationPreferencesMock,
  useSetGlobalPinningPreferences: () => setGlobalPinningPreferencesMock,
  useSetGlobalTablePanelPreferences: () => setGlobalTablePanelPreferencesMock,
}));

vi.mock('#ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalGroupingPreferences: useGetGlobalGroupingPreferencesMock,
  useGetGlobalNavigationPreferences: useGetGlobalNavigationPreferencesMock,
  useGetGlobalPinningPreferences: useGetGlobalPinningPreferencesMock,
  useGetGlobalTablePanelPreferences: useGetGlobalTablePanelPreferencesMock,
}));

import { Settings } from './Settings.component';

afterEach(cleanup);

describe('Settings', () => {
  beforeEach(() => {
    setGlobalGroupingPreferencesMock.mockReset();
    setGlobalNavigationPreferencesMock.mockReset();
    setGlobalPinningPreferencesMock.mockReset();
    setGlobalTablePanelPreferencesMock.mockReset();
    useGetGlobalGroupingPreferencesMock.mockReset();
    useGetGlobalNavigationPreferencesMock.mockReset();
    useGetGlobalPinningPreferencesMock.mockReset();
    useGetGlobalTablePanelPreferencesMock.mockReset();
    useGetGlobalTablePanelPreferencesMock.mockReturnValue({
      settingsTabOrder: undefined,
    });

    useGetGlobalNavigationPreferencesMock.mockReturnValue({
      size: undefined,
    });
    useGetGlobalGroupingPreferencesMock.mockReturnValue({
      defaultFold: undefined,
      mode: undefined,
      totalsPlacement: undefined,
    });
  });

  it('stages changes locally and persists only after clicking Accept', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    const acceptButton = screen.getByRole('button', { name: 'Accept' });

    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Accept' })
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Pin to the right' }));

    expect(setGlobalPinningPreferencesMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole<HTMLButtonElement>('button', { name: 'Accept' })
        .disabled,
    ).toBe(false);

    fireEvent.click(acceptButton);

    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledTimes(1);
    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledWith({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: 'right',
      unpinConflictResolution: undefined,
    });
    expect(setGlobalNavigationPreferencesMock).not.toHaveBeenCalled();
  });

  it('resets staged values to persisted preferences on Cancel', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: 'reset-all-pins',
      pinConflictResolution: 'pin-only',
      pinSide: 'left',
      unpinConflictResolution: 'reorder-to-fill',
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('radio', { name: 'Pin to the right' }));

    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Pin to the right' })
        .checked,
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Pin to the left' })
        .checked,
    ).toBe(true);
    expect(setGlobalPinningPreferencesMock).not.toHaveBeenCalled();
    expect(setGlobalNavigationPreferencesMock).not.toHaveBeenCalled();
  });

  it('persists navbar size from Navigation tab after clicking Accept', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Navigation' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Large' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledTimes(1);
    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      size: 'large',
    });
  });

  it('persists order conflict preference from the Pinning tab', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(
      screen.getByRole('radio', { name: 'Apply order & keep all pins' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledTimes(1);
    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledWith({
      orderConflictResolution: 'pin-to-match-order',
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });
  });

  it('persists the settings tab order from the Table Panel tab', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Table Panel' }));

    const roles = screen.getAllByRole('listitem');
    const [general, , filters] = roles;

    if (!general || !filters) throw new Error('Expected the tab role list');

    fireEvent.dragStart(general);
    fireEvent.dragEnter(filters);
    fireEvent.dragEnd(general);

    expect(setGlobalTablePanelPreferencesMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalTablePanelPreferencesMock).toHaveBeenCalledExactlyOnceWith({
      settingsTabOrder: [
        'columns',
        'filters',
        'general',
        'sorting',
        'grouping',
        'details',
      ],
    });
  });

  it('persists a grouping preference from the Grouping tab', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Grouping' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Start collapsed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalGroupingPreferencesMock).toHaveBeenCalledExactlyOnceWith({
      defaultFold: 'collapsed',
      mode: undefined,
      totalsPlacement: undefined,
    });
    expect(setGlobalNavigationPreferencesMock).not.toHaveBeenCalled();
    expect(setGlobalPinningPreferencesMock).not.toHaveBeenCalled();
  });

  it('writes a preference back to undefined when it returns to the default', () => {
    useGetGlobalGroupingPreferencesMock.mockReturnValue({
      defaultFold: 'collapsed',
      mode: undefined,
      totalsPlacement: undefined,
    });
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Grouping' }));

    expect(
      screen.getByRole<HTMLInputElement>('radio', { name: 'Start collapsed' })
        .checked,
    ).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Start expanded' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalGroupingPreferencesMock).toHaveBeenCalledExactlyOnceWith({
      defaultFold: undefined,
      mode: undefined,
      totalsPlacement: undefined,
    });
  });

  it('does nothing when Accept is clicked without changes', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalGroupingPreferencesMock).not.toHaveBeenCalled();
    expect(setGlobalNavigationPreferencesMock).not.toHaveBeenCalled();
    expect(setGlobalPinningPreferencesMock).not.toHaveBeenCalled();
  });

  it('persists both navigation and pinning updates in one Accept flow', () => {
    useGetGlobalNavigationPreferencesMock.mockReturnValue({
      collapsed: 'expanded',
      size: 'small',
    });
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('tab', { name: 'Navigation' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Start Collapsed' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Pinning' }));
    fireEvent.click(
      screen.getByRole('radio', { name: 'Apply order & keep all pins' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledTimes(1);
    expect(setGlobalNavigationPreferencesMock).toHaveBeenCalledWith({
      collapsed: 'collapsed',
    });
    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledTimes(1);
    expect(setGlobalPinningPreferencesMock).toHaveBeenCalledWith({
      orderConflictResolution: 'pin-to-match-order',
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });
  });
});
