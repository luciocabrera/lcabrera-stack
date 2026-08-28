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

import { mockDialogElement } from '#ui/utils/tests/mockDialogElement.util';

const {
  acceptColumnGroupingPrompt,
  cancelColumnGroupingPrompt,
  getColumns,
  getPrompt,
  setColumns,
  setPrompt,
} = vi.hoisted(() => {
  let columns: readonly unknown[] = [];
  let prompt = { columnKey: '', isOpen: false };

  return {
    acceptColumnGroupingPrompt: vi.fn(),
    cancelColumnGroupingPrompt: vi.fn(),
    getColumns: () => columns,
    getPrompt: () => prompt,
    setColumns: (next: readonly unknown[]) => {
      columns = next;
    },
    setPrompt: (next: { columnKey: string; isOpen: boolean }) => {
      prompt = next;
    },
  };
});

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({ useGetColumns: () => getColumns() }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => ({}),
}));

vi.mock(
  '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors',
  () => ({
    useGetGroupingAggregates: () => [],
    useGetGroupingKeys: () => ['region'],
  }),
);

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useAcceptColumnGroupingPrompt: () => acceptColumnGroupingPrompt,
  useCancelColumnGroupingPrompt: () => cancelColumnGroupingPrompt,
}));

vi.mock('../ColumnOrderSectionContext/selectors', () => ({
  useGetColumnGroupingPrompt: () => getPrompt(),
}));

import { ColumnGroupingPromptModal } from './ColumnGroupingPromptModal.component';

const restoreRef: { current: () => void } = {
  current: () => {
    // no-op before setup
  },
};

afterEach(() => {
  restoreRef.current();
  cleanup();
});

beforeEach(() => {
  restoreRef.current = mockDialogElement(false).restore;
  setColumns([{ key: 'amount', label: 'Amount' }]);
  setPrompt({ columnKey: 'amount', isOpen: true });
  acceptColumnGroupingPrompt.mockClear();
  cancelColumnGroupingPrompt.mockClear();
});

describe('ColumnGroupingPromptModal', () => {
  it('offers the column as a group key and applies the choice', () => {
    render(<ColumnGroupingPromptModal />);

    expect(
      screen.getByRole('radio', {
        hidden: true,
        name: /Group by this column/,
      }),
    ).toBeDefined();

    fireEvent.click(
      screen.getByRole('button', { hidden: true, name: 'Accept' }),
    );

    expect(acceptColumnGroupingPrompt).toHaveBeenCalledWith('group-key');
  });

  it('names the column the prompt is about', () => {
    render(<ColumnGroupingPromptModal />);

    expect(screen.getByText('Amount')).toBeDefined();
  });

  it('renders nothing while the prompt is closed', () => {
    setPrompt({ columnKey: '', isOpen: false });

    render(<ColumnGroupingPromptModal />);

    expect(
      screen.queryByRole('button', { hidden: true, name: 'Accept' }),
    ).toBeNull();
  });
});
