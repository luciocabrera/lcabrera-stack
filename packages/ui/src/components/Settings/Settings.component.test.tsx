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
  setGlobalNavigationPreferencesMock,
  setGlobalPinningPreferencesMock,
  useGetGlobalNavigationPreferencesMock,
  useGetGlobalPinningPreferencesMock,
} = vi.hoisted(() => {
  return {
    setGlobalNavigationPreferencesMock: vi.fn(),
    setGlobalPinningPreferencesMock: vi.fn(),
    useGetGlobalNavigationPreferencesMock: vi.fn(),
    useGetGlobalPinningPreferencesMock: vi.fn(),
  };
});

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/actions', () => ({
  useSetGlobalNavigationPreferences: () => setGlobalNavigationPreferencesMock,
  useSetGlobalPinningPreferences: () => setGlobalPinningPreferencesMock,
}));

vi.mock('@lcabrera/ui/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalNavigationPreferences: useGetGlobalNavigationPreferencesMock,
  useGetGlobalPinningPreferences: useGetGlobalPinningPreferencesMock,
}));

import { Settings } from './Settings.component';

afterEach(cleanup);

describe('Settings', () => {
  beforeEach(() => {
    setGlobalNavigationPreferencesMock.mockReset();
    setGlobalPinningPreferencesMock.mockReset();
    useGetGlobalNavigationPreferencesMock.mockReset();
    useGetGlobalPinningPreferencesMock.mockReset();

    useGetGlobalNavigationPreferencesMock.mockReturnValue({
      size: undefined,
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

  it('does nothing when Accept is clicked without changes', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
      orderConflictResolution: undefined,
      pinConflictResolution: undefined,
      pinSide: undefined,
      unpinConflictResolution: undefined,
    });

    render(<Settings />);

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(setGlobalNavigationPreferencesMock).not.toHaveBeenCalled();
    expect(setGlobalPinningPreferencesMock).not.toHaveBeenCalled();
  });

  it('persists both navigation and pinning updates in one Accept flow', () => {
    useGetGlobalNavigationPreferencesMock.mockReturnValue({
      collapsed: 'expanded',
      pinned: 'pinned',
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
