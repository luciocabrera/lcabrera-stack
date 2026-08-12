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

const { mockAcceptPinSide, mockCancelPinSide, pinSideModalRef } = vi.hoisted(
  () => ({
    mockAcceptPinSide: vi.fn(),
    mockCancelPinSide: vi.fn(),
    pinSideModalRef: {
      current: {
        columnKey: 'status',
        columnLabel: 'Status',
        isOpen: false,
      },
    },
  }),
);

vi.mock('#ui/components/PinSideModal', () => ({
  PinSideModal: ({
    columnLabel,
    isOpen,
    onAccept,
    onCancel,
  }: {
    readonly columnLabel: string;
    readonly isOpen: boolean;
    readonly onAccept: (side: 'closest-edge' | 'left' | 'right') => void;
    readonly onCancel: () => void;
  }) => (
    <div data-testid='pin-side-modal'>
      {columnLabel}:{String(isOpen)}
      <button
        onClick={() => {
          onAccept('left');
        }}
        type='button'
      >
        PinSide Accept
      </button>
      <button onClick={onCancel} type='button'>
        PinSide Cancel
      </button>
    </div>
  ),
}));

vi.mock('../ColumnOrderSectionContext/actions', () => ({
  useAcceptPinSide: () => mockAcceptPinSide,
  useCancelPinSide: () => mockCancelPinSide,
}));

vi.mock('../ColumnOrderSectionContext/selectors', () => ({
  useGetPinSideModal: () => pinSideModalRef.current,
}));

import { ColumnOrderPinSideModal } from './ColumnOrderPinSideModal.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  pinSideModalRef.current = {
    columnKey: 'status',
    columnLabel: 'Status',
    isOpen: false,
  };
  mockAcceptPinSide.mockReset();
  mockCancelPinSide.mockReset();
});

describe('ColumnOrderPinSideModal', () => {
  it('wires the pin side modal state from the store', () => {
    pinSideModalRef.current = {
      columnKey: 'status',
      columnLabel: 'Status',
      isOpen: true,
    };

    render(<ColumnOrderPinSideModal />);

    expect(screen.getByTestId('pin-side-modal').textContent).toContain(
      'Status:true',
    );
  });

  it('dispatches the pin side accept and cancel actions', () => {
    render(<ColumnOrderPinSideModal />);

    fireEvent.click(screen.getByRole('button', { name: 'PinSide Accept' }));
    fireEvent.click(screen.getByRole('button', { name: 'PinSide Cancel' }));

    expect(mockAcceptPinSide).toHaveBeenCalledWith('left');
    expect(mockCancelPinSide).toHaveBeenCalledTimes(1);
  });
});
