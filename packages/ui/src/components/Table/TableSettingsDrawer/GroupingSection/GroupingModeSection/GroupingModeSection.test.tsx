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
    // A `<fieldset>` takes its accessible name from its `<legend>` and nowhere
    // else, so a section header rendered beside it leaves the group unnamed.
    // The query is by role *and name* — it fails on a group whose legend is
    // missing, which a `getByRole('group')` alone would not.
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
      // `:disabled` rather than the `disabled` IDL property: the attribute
      // sits on the `<fieldset>` and its descendants are *actually* disabled
      // by inheritance, which the property on each input does not reflect.
      // Inheriting it is the whole reason this section is a fieldset.
      expect(radio.matches(':disabled')).toBe(true);
    }
  });

  it('renders nothing at all under a locked preset', () => {
    // Which grouping sets the read emits is part of the curated shape, so the
    // lock covers the mode as much as it covers the keys (#578).
    useGetTableIsGroupingLockedMock.mockReturnValue(true);

    render(<GroupingModeSection />);

    expect(screen.queryByRole('group')).toBeNull();
    expect(screen.queryAllByRole('radio')).toStrictEqual([]);
  });
});
