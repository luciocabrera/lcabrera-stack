// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../ColumnOrderPinSideModal/ColumnOrderPinSideModal.component', () => ({
  ColumnOrderPinSideModal: () => <div data-testid='pin-side-modal' />,
}));

vi.mock('../OrderConflictModal/OrderConflictModal.component', () => ({
  OrderConflictModal: () => <div data-testid='order-conflict-modal' />,
}));

vi.mock('../PinConflictModal/PinConflictModal.component', () => ({
  PinConflictModal: () => <div data-testid='pin-conflict-modal' />,
}));

vi.mock('../UnpinConflictModal/UnpinConflictModal.component', () => ({
  UnpinConflictModal: () => <div data-testid='unpin-conflict-modal' />,
}));

import { ColumnOrderSectionModals } from './ColumnOrderSectionModals.component';

afterEach(() => {
  cleanup();
});

describe('ColumnOrderSectionModals', () => {
  it('renders all four conflict-resolution modals', () => {
    render(<ColumnOrderSectionModals />);

    expect(screen.getByTestId('pin-side-modal')).not.toBeNull();
    expect(screen.getByTestId('pin-conflict-modal')).not.toBeNull();
    expect(screen.getByTestId('unpin-conflict-modal')).not.toBeNull();
    expect(screen.getByTestId('order-conflict-modal')).not.toBeNull();
  });
});
