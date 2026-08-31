// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GroupingModeSection } from './GroupingModeSection.component';

const {
  setGroupingModeMock,
  useGetGroupingModeMock,
  useGetTableIsGroupingLockedMock,
} = vi.hoisted(() => ({
  setGroupingModeMock: vi.fn(),
  useGetGroupingModeMock: vi.fn(() => 'flat'),
  useGetTableIsGroupingLockedMock: vi.fn(() => false),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableIsGroupingLocked: useGetTableIsGroupingLockedMock,
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetGroupingMode: () => setGroupingModeMock,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingMode: useGetGroupingModeMock,
}));

describe('GroupingModeSection', () => {
  afterEach(() => {
    cleanup();
    setGroupingModeMock.mockClear();
    useGetGroupingModeMock.mockReturnValue('flat');
    useGetTableIsGroupingLockedMock.mockReturnValue(false);
  });

  it('names the radio group for assistive technology', () => {
    render(<GroupingModeSection />);

    expect(screen.getByRole('group', { name: 'Totals' })).toBeTruthy();
  });

  it('offers both modes, described by what the grid shows', () => {
    render(<GroupingModeSection />);

    expect(
      screen.getAllByRole('radio').map((radio) => radio.getAttribute('name')),
    ).toStrictEqual(['table-grouping-mode', 'table-grouping-mode']);
    expect(screen.getByRole('radio', { name: /Groups only/ })).toBeTruthy();
    expect(
      screen.getByRole('radio', { name: /Groups with subtotals/ }),
    ).toBeTruthy();
  });

  it('checks the staged mode rather than an internal one', () => {
    useGetGroupingModeMock.mockReturnValue('rollup');

    render(<GroupingModeSection />);

    expect(
      screen
        .getByRole('radio', { name: /Groups with subtotals/ })
        .getAttribute('checked'),
    ).not.toBeNull();
  });

  it('stages the mode a click selects', () => {
    render(<GroupingModeSection />);

    fireEvent.click(
      screen.getByRole('radio', { name: /Groups with subtotals/ }),
    );

    expect(setGroupingModeMock).toHaveBeenCalledWith('rollup');
  });

  it('disables every control while the drawer is busy', () => {
    render(<GroupingModeSection isBusy />);

    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.matches(':disabled')).toBe(true);
    }
  });

  it('renders nothing at all under a locked preset', () => {
    useGetTableIsGroupingLockedMock.mockReturnValue(true);

    render(<GroupingModeSection />);

    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryAllByRole('radio')).toStrictEqual([]);
  });
});
