// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { ColumnAxisSection } from './ColumnAxisSection.component';

const {
  setColumnAxisMock,
  useGetGroupingColumnAxisMock,
  useGetGroupingKeysMock,
  useGetTableIsGroupingLockedMock,
} = vi.hoisted(() => ({
  setColumnAxisMock: vi.fn(),
  useGetGroupingColumnAxisMock: vi.fn(() => undefined as string | undefined),
  useGetGroupingKeysMock: vi.fn(() => ['region']),
  useGetTableIsGroupingLockedMock: vi.fn(() => false),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => [
      { key: 'region', label: 'Region' },
      { key: 'order_status', label: 'Status' },
    ],
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableGroupingCapabilities: () => ({}),
  useGetTableIsGroupingLocked: useGetTableIsGroupingLockedMock,
}));

vi.mock('../../../TableDrawerContext/actions', () => ({
  useSetGroupingColumnAxis: () => setColumnAxisMock,
}));

vi.mock('../../../TableDrawerContext/selectors', () => ({
  useGetGroupingColumnAxis: useGetGroupingColumnAxisMock,
  useGetGroupingKeys: useGetGroupingKeysMock,
}));

vi.mock('../../utils', () => ({
  toGroupKeyColumnOptions: () => [{ label: 'Status', value: 'order_status' }],
}));

describe('ColumnAxisSection', () => {
  afterEach(() => {
    cleanup();
    setColumnAxisMock.mockClear();
    useGetGroupingColumnAxisMock.mockReturnValue(undefined);
    useGetGroupingKeysMock.mockReturnValue(['region']);
    useGetTableIsGroupingLockedMock.mockReturnValue(false);
  });

  it('names the section', () => {
    render(<ColumnAxisSection />);

    expect(screen.getByText('Column axis')).not.toBeNull();
  });

  it('renders nothing under a locked preset', () => {
    useGetTableIsGroupingLockedMock.mockReturnValue(true);

    render(<ColumnAxisSection />);

    expect(screen.queryByTestId('column-axis-section')).toBeNull();
  });
});
