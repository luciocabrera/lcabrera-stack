// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSectionMain: ({
    children,
    ...rest
  }: {
    readonly children: ReactNode;
  }) => <section {...rest}>{children}</section>,
}));

vi.mock('./ColumnOrderSectionBody/ColumnOrderSectionBody.component', () => ({
  ColumnOrderSectionBody: ({
    isBusy = false,
  }: {
    readonly isBusy?: boolean;
  }) => <div data-testid='section-body'>{String(isBusy)}</div>,
}));

vi.mock(
  './ColumnOrderSectionHeader/ColumnOrderSectionHeader.component',
  () => ({
    ColumnOrderSectionHeader: ({
      isBusy = false,
    }: {
      readonly isBusy?: boolean;
    }) => <div data-testid='section-header'>{String(isBusy)}</div>,
  }),
);

vi.mock(
  './ColumnOrderSectionModals/ColumnOrderSectionModals.component',
  () => ({
    ColumnOrderSectionModals: () => <div data-testid='section-modals' />,
  }),
);

vi.mock('./ColumnOrderSectionToolbar', async () => {
  const { createMockVariantToolbar } =
    await import('#ui/utils/tests/createMockVariantToolbar.util');

  return {
    ColumnOrderSectionToolbar: createMockVariantToolbar('section-toolbar'),
  };
});

import { ColumnOrderSection } from './ColumnOrderSection.component';

afterEach(() => {
  cleanup();
});

describe('ColumnOrderSection', () => {
  it('composes header, body, footer toolbar, and modals', () => {
    render(<ColumnOrderSection />);

    expect(screen.getByTestId('section-header')).not.toBeNull();
    expect(screen.getByTestId('section-body')).not.toBeNull();
    expect(screen.getByTestId('section-toolbar').textContent).toBe(
      'footer:false',
    );
    expect(screen.getByTestId('section-modals')).not.toBeNull();
  });

  it('forwards the busy state to header, body, and toolbar', () => {
    render(<ColumnOrderSection isBusy={true} />);

    expect(screen.getByTestId('section-header').textContent).toBe('true');
    expect(screen.getByTestId('section-body').textContent).toBe('true');
    expect(screen.getByTestId('section-toolbar').textContent).toBe(
      'footer:true',
    );
  });

  it('forwards native props to the section container', () => {
    render(<ColumnOrderSection aria-label='Column settings' />);

    expect(
      screen.getByRole('region', { name: 'Column settings' }),
    ).not.toBeNull();
  });
});
