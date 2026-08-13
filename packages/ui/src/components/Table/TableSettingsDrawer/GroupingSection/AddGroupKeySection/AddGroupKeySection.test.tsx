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

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';

type MockVirtualSelectProps = {
  readonly onChange: (values: readonly string[]) => void;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
};

const { columnsRef, groupingKeysRef, mockToggleGroupKey } = vi.hoisted(() => ({
  columnsRef: { current: [] as readonly Record<string, unknown>[] },
  groupingKeysRef: { current: [] as readonly string[] },
  mockToggleGroupKey: vi.fn(),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => columnsRef.current,
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/actions', () => ({
  useToggleTableGroupKey: () => mockToggleGroupKey,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/grouping/selectors', () => ({
  useGetTableGroupingKeys: () => groupingKeysRef.current,
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

  it('drops a column that is already a group key', () => {
    groupingKeysRef.current = ['status'];

    render(<AddGroupKeySection />);

    expect(listedOptions()).toEqual(['ID']);
  });

  it('appends the chosen column as the innermost level', () => {
    render(<AddGroupKeySection />);

    fireEvent.click(screen.getByRole('button', { name: 'Status' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(mockToggleGroupKey).toHaveBeenCalledWith('status');
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
});
