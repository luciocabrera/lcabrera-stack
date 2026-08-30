// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockColumns, mockRenderedColumnKeys } = vi.hoisted(() => ({
  mockColumns: [
    { key: 'id', label: 'ID' },
    { isStatic: true, key: 'name', label: 'Name' },
    { key: 'skip', label: 'Skip', render: () => 'cell' },
  ],
  mockRenderedColumnKeys: ['id'],
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSectionHeader: ({
    title,
    toolbar,
  }: {
    readonly title: string;
    readonly toolbar: ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {toolbar}
    </div>
  ),
}));

vi.mock(
  '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => mockColumns,
  }),
);

vi.mock('../hooks', () => ({
  useGetRenderedColumnKeys: () => mockRenderedColumnKeys,
}));

vi.mock('../ColumnOrderSectionToolbar', () => ({
  ColumnOrderSectionToolbar: ({
    isBusy,
    variant,
  }: {
    readonly isBusy?: boolean;
    readonly variant?: 'footer' | 'toolbar';
  }) => (
    <div data-testid='section-toolbar'>
      {variant ?? 'footer'}:{String(isBusy ?? false)}
    </div>
  ),
}));

import { ColumnOrderSectionHeader } from './ColumnOrderSectionHeader.component';

afterEach(() => {
  cleanup();
});

describe('ColumnOrderSectionHeader', () => {
  it('renders the visible/total settings column count in the title', () => {
    render(<ColumnOrderSectionHeader />);

    expect(screen.getByText('Column Order & Visibility (1/2)')).toBeDefined();
  });

  it('renders the compact toolbar variant', () => {
    render(<ColumnOrderSectionHeader />);

    expect(screen.getByTestId('section-toolbar').textContent).toBe(
      'toolbar:false',
    );
  });

  it('forwards the busy state to the toolbar', () => {
    render(<ColumnOrderSectionHeader isBusy={true} />);

    expect(screen.getByTestId('section-toolbar').textContent).toBe(
      'toolbar:true',
    );
  });
});
