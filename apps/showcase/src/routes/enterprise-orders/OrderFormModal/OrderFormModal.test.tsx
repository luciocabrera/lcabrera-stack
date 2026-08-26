// @vitest-environment jsdom

import { ThemeProvider } from '@lcabrera/ui/contexts/ThemeContext';
import { mockDialogElement } from '@lcabrera/ui/utils/tests/mockDialogElement.util';
import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vite-plus/test';

import type { EnterpriseOrderValues } from '../config';

import { OrderFormModal } from './OrderFormModal.component';

const dialogRef: { current: { readonly restore: () => void } } = {
  current: { restore: () => {} },
};

beforeEach(() => {
  dialogRef.current = mockDialogElement();
});

afterEach(() => {
  cleanup();
  dialogRef.current.restore();
});

const renderModal = (node: React.ReactNode) => {
  const Stub = createRoutesStub([
    {
      action: vi.fn(),
      Component: () => <ThemeProvider appId='test'>{node}</ThemeProvider>,
      path: '/enterprise-orders/new',
    },
    { Component: () => <p>List</p>, path: '/enterprise-orders' },
  ]);

  return render(<Stub initialEntries={['/enterprise-orders/new']} />);
};

it('renders the create Form inside the modal with its tabs and submit action', () => {
  renderModal(
    <OrderFormModal
      mode='create'
      submitLabel='Create Order'
      title='New Order'
    />,
  );

  expect(screen.getByText('New Order')).toBeDefined();
  expect(screen.getByText('Customer')).toBeDefined();
  expect(screen.getByText('Order Date')).toBeDefined();
  expect(
    screen.getByRole('button', { hidden: true, name: 'Create Order' }),
  ).toBeDefined();
});

it('renders read-only values and no submit action in view mode', () => {
  const initialValues: Partial<EnterpriseOrderValues> = {
    order_number: 'ORD-00000007',
    priority: 'High',
  };

  renderModal(
    <OrderFormModal
      initialValues={initialValues}
      mode='view'
      title='ORD-00000007'
    />,
  );

  expect(screen.getAllByText('ORD-00000007').length).toBeGreaterThan(0);
  expect(
    screen.queryByRole('button', { hidden: true, name: 'Create Order' }),
  ).toBeNull();
  expect(screen.queryAllByRole('textbox', { hidden: true })).toHaveLength(0);
});
