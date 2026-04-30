// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { setGlobalPinningPreferencesMock, useGetGlobalPinningPreferencesMock } =
  vi.hoisted(() => {
    return {
      setGlobalPinningPreferencesMock: vi.fn(),
      useGetGlobalPinningPreferencesMock: vi.fn(),
    };
  });

vi.mock('@/contexts/GlobalSettingsContext/actions', () => ({
  useSetGlobalPinningPreferences: () => setGlobalPinningPreferencesMock,
}));

vi.mock('@/contexts/GlobalSettingsContext/selectors', () => ({
  useGetGlobalPinningPreferences: useGetGlobalPinningPreferencesMock,
}));

import { Settings } from './Settings.component';

afterEach(cleanup);

describe('Settings', () => {
  beforeEach(() => {
    setGlobalPinningPreferencesMock.mockReset();
    useGetGlobalPinningPreferencesMock.mockReset();
  });

  it('stages changes locally and persists only after clicking Accept', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
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
      pinConflictResolution: undefined,
      pinSide: 'right',
      unpinConflictResolution: undefined,
    });
  });

  it('resets staged values to persisted preferences on Cancel', () => {
    useGetGlobalPinningPreferencesMock.mockReturnValue({
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
  });
});
