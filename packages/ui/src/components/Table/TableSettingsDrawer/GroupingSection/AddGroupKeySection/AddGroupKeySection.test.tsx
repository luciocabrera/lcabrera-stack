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

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

const {
  capabilitiesRef,
  columnsRef,
  groupingKeysRef,
  isGroupingLockedRef,
  mockToggleGroupKey,
} = vi.hoisted(() => ({
  capabilitiesRef: { current: {} as Readonly<Record<string, unknown>> },
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  groupingKeysRef: { current: [] as readonly string[] },
  isGroupingLockedRef: { current: false },
  mockToggleGroupKey: vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => capabilitiesRef.current,
  useGetTableIsGroupingLocked: () => isGroupingLockedRef.current,
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useToggleGroupKey: () => mockToggleGroupKey,
}));

vi.mock('../../TableDrawerContext/selectors', () => ({
  useGetGroupingKeys: () => groupingKeysRef.current,
}));

vi.mock('#ui/components/VirtualSelect', () => ({
  VirtualSelect: ({ onChange, options }: MockVirtualSelectProps) => (
    <ul data-testid='column-options'>
      {options.map((option) => (
        <li key={option.value}>
          <button
            onClick={() => {
              onChange([option.value]);
            }}
            type='button'
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  ),
}));

import { AddGroupKeySection } from './AddGroupKeySection.component';

const listedOptions = () =>
  [...screen.getByTestId('column-options').children].map(
    (node) => node.textContent,
  );

beforeEach(() => {
  capabilitiesRef.current = {};
  isGroupingLockedRef.current = false;
  columnsRef.current = [
    { key: 'id', label: 'ID' },
    { isGroupable: false, key: 'notes', label: 'Notes' },
    { key: 'status', label: 'Status' },
  ];
  groupingKeysRef.current = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AddGroupKeySection', () => {
  it('offers only groupable columns', () => {
    render(<AddGroupKeySection />);

    expect(listedOptions()).toEqual(['ID', 'Status']);
  });

  it('drops a column the catalogue refuses as a group key', () => {
    // The declared flag says yes and the endpoint says no — the case a menu
    // built from the declaration alone offers and the query then empties (#642).
    const refused: TableColumnGroupingCapability = {
      aggregates: ['count'],
      canGroup: false,
      column: 'id',
      distinctEstimate: 500_000,
      periods: [],
      refusal: 'unique-ish',
      role: 'dimension',
      typeName: 'int4',
    };
    capabilitiesRef.current = { id: refused };

    render(<AddGroupKeySection />);

    expect(listedOptions()).toEqual(['Status']);
  });

  it('drops a column that is already a group key', () => {
    groupingKeysRef.current = ['status'];

    render(<AddGroupKeySection />);

    expect(listedOptions()).toEqual(['ID']);
  });

  it('appends the chosen column as the innermost level', () => {
    render(<AddGroupKeySection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockToggleGroupKey).toHaveBeenCalledWith({
      columnKey: 'status',
      period: undefined,
    });
    expect(mockToggleGroupKey).toHaveBeenCalledTimes(1);
  });

  it('will not add before a column is chosen', () => {
    render(<AddGroupKeySection />);

    expect(
      screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled'),
    ).toBe(true);
  });

  it('replaces the control with a message at the configured depth', () => {
    // An affordance that is refused on every use reads as a bug, so the cap is
    // stated rather than left to be discovered.
    groupingKeysRef.current = Array.from(
      { length: MAX_TABLE_GROUP_KEYS },
      (_unused, index) => `key_${index}`,
    );

    render(<AddGroupKeySection />);

    expect(screen.queryByTestId('column-options')).toBeNull();
    expect(
      screen.getByText((text) =>
        text.includes(`limited to ${MAX_TABLE_GROUP_KEYS} keys`),
      ),
    ).not.toBeNull();
  });

  it('offers no way to add a key under a locked preset', () => {
    // Hidden rather than disabled: the lock is not a state the user can clear,
    // so an inert Add would only ask them to keep trying (#578).
    columnsRef.current = [
      { isGroupable: true, key: 'region', label: 'Region' },
    ];
    isGroupingLockedRef.current = true;

    render(<AddGroupKeySection />);

    expect(screen.queryByTestId('column-options')).toBeNull();
    expect(screen.queryByRole('button', { name: /add/i })).toBeNull();
  });
});
