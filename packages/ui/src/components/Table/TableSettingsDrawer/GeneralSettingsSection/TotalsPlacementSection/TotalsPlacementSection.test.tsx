// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { TotalsPlacementSection } from './TotalsPlacementSection.component';

const {
  setTotalsPlacementMock,
  useGetGroupingModeMock,
  useGetTotalsPlacementMock,
} = vi.hoisted(() => ({
  setTotalsPlacementMock: vi.fn(),
  useGetGroupingModeMock: vi.fn(() => 'rollup'),
  useGetTotalsPlacementMock: vi.fn(() => 'last'),
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetTotalsPlacement: () => setTotalsPlacementMock,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingMode: useGetGroupingModeMock,
  useGetTotalsPlacement: useGetTotalsPlacementMock,
}));

describe('TotalsPlacementSection', () => {
  afterEach(() => {
    cleanup();
    setTotalsPlacementMock.mockClear();
    useGetGroupingModeMock.mockReturnValue('rollup');
    useGetTotalsPlacementMock.mockReturnValue('last');
  });

  it('names the radio group for assistive technology', () => {
    render(<TotalsPlacementSection />);

    expect(screen.getByRole('group', { name: 'Totals position' })).toBeTruthy();
  });

  it('offers both placements, described by where the row lands', () => {
    render(<TotalsPlacementSection />);

    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('name')),
    ).toStrictEqual(['table-totals-placement', 'table-totals-placement']);
    expect(
      screen.getByRole('radio', { name: /Below their rows/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: /Above their rows/ }),
    ).toBeTruthy();
  });

  it('renders nothing under flat, where there is no total to place', () => {
    useGetGroupingModeMock.mockReturnValue('flat');

    render(<TotalsPlacementSection />);

    expect(screen.queryByRole('group')).toBeNull();
  });

  it('checks the staged placement rather than an internal one', () => {
    useGetTotalsPlacementMock.mockReturnValue('first');

    render(<TotalsPlacementSection />);

    expect(
      screen
        .getByRole('radio', { name: /Above their rows/ })
        .getAttribute('checked'),
    ).not.toBeNull();
  });

  it('stages the placement a click selects', () => {
    render(<TotalsPlacementSection />);

    fireEvent.click(screen.getByRole('radio', { name: /Above their rows/ }));

    expect(setTotalsPlacementMock).toHaveBeenCalledWith('first');
  });

  it('disables every control while the drawer is busy', () => {
    render(<TotalsPlacementSection isBusy />);

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.matches(':disabled')).toBe(true);
    }
  });
});
