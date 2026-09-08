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

import type { DraggableItem } from '#ui/components/DraggableList';

const { setTabOrderMock, storedOrderRef } = vi.hoisted(() => ({
  setTabOrderMock: vi.fn(),
  storedOrderRef: { current: undefined as readonly string[] | undefined },
}));

type MockDraggableListProps = {
  readonly isBusy?: boolean;
  readonly items: readonly DraggableItem[];
  readonly onOrderChange?: (items: DraggableItem[]) => void;
};

vi.mock('#ui/components/DraggableList', () => ({
  DraggableList: ({ isBusy, items, onOrderChange }: MockDraggableListProps) => (
    <ul data-busy={String(isBusy)}>
      {items.map((entry) => (
        <li key={entry.id}>{entry.content}</li>
      ))}
      <button
        onClick={() => {
          onOrderChange?.(items.toReversed());
        }}
        type='button'
      >
        Reverse
      </button>
    </ul>
  ),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableSettingsTabOrder: () => setTabOrderMock,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableSettingsTabOrder: () => storedOrderRef.current,
}));

import { TabsOrderSection } from './TabsOrderSection.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  setTabOrderMock.mockReset();
  storedOrderRef.current = undefined;
});

describe('TabsOrderSection', () => {
  it('lists every tab, in the order the drawers paint them', () => {
    render(<TabsOrderSection />);

    expect(
      screen.getAllByRole('listitem').map((entry) => entry.textContent),
    ).toStrictEqual([
      'General',
      'Columns',
      'Filters',
      'Sorting',
      'Grouping',
      'Details',
      'Advanced',
    ]);
  });

  it('lists the stored order first', () => {
    storedOrderRef.current = ['details'];

    render(<TabsOrderSection />);

    expect(screen.getAllByRole('listitem')[0]?.textContent).toBe('Details');
  });

  it('states a drop as the whole order, not the moved tab alone', () => {
    render(<TabsOrderSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Reverse' }));

    expect(setTabOrderMock).toHaveBeenCalledWith([
      'advanced',
      'details',
      'grouping',
      'sorting',
      'filters',
      'columns',
      'general',
    ]);
  });

  it('forwards the busy flag to the list', () => {
    render(<TabsOrderSection isBusy />);

    expect(screen.getByRole('list').dataset.busy).toBe('true');
  });
});
