import { describe, expect, it, vi } from 'vite-plus/test';

import { applyToggleColumnPinResolution } from './applyToggleColumnPinResolution.util';

const createMocks = () => {
  return {
    acceptPinSide: vi.fn(),
    acceptUnpinConflict: vi.fn(),
    setColumnPinning: vi.fn(),
    setPinSideModal: vi.fn(),
    setUnpinConflictModal: vi.fn(),
  };
};

describe('applyToggleColumnPinResolution', () => {
  it('does nothing for ignored-static', () => {
    const mocks = createMocks();

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: { kind: 'ignored-static' },
    });

    expect(mocks.acceptPinSide).not.toHaveBeenCalled();
    expect(mocks.acceptUnpinConflict).not.toHaveBeenCalled();
    expect(mocks.setColumnPinning).not.toHaveBeenCalled();
    expect(mocks.setPinSideModal).not.toHaveBeenCalled();
    expect(mocks.setUnpinConflictModal).not.toHaveBeenCalled();
  });

  it('sets pinning directly for apply-pinning-direct', () => {
    const mocks = createMocks();
    const nextPinning = { left: ['id'], right: [] };

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: {
        kind: 'apply-pinning-direct',
        nextPinning,
      },
    });

    expect(mocks.setColumnPinning).toHaveBeenCalledWith(nextPinning);
    expect(mocks.setPinSideModal).not.toHaveBeenCalled();
    expect(mocks.setUnpinConflictModal).not.toHaveBeenCalled();
  });

  it('opens pin-side modal for open-pin-side-modal', () => {
    const mocks = createMocks();
    const modal = {
      columnKey: 'id',
      columnLabel: 'ID',
      isOpen: true,
    };

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: {
        kind: 'open-pin-side-modal',
        modal,
      },
    });

    expect(mocks.setPinSideModal).toHaveBeenCalledWith(modal);
    expect(mocks.acceptPinSide).not.toHaveBeenCalled();
  });

  it('opens pin-side modal and accepts side for auto-accept-pin-side', () => {
    const mocks = createMocks();
    const modal = {
      columnKey: 'id',
      columnLabel: 'ID',
      isOpen: true,
    };

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: {
        kind: 'auto-accept-pin-side',
        modal,
        pinSide: 'left',
      },
    });

    expect(mocks.setPinSideModal).toHaveBeenCalledWith(modal);
    expect(mocks.acceptPinSide).toHaveBeenCalledWith('left');
  });

  it('opens unpin-conflict modal for open-unpin-conflict-modal', () => {
    const mocks = createMocks();
    const modal = {
      columnKey: 'id',
      columnLabel: 'ID',
      isOpen: true,
      side: 'left' as const,
    };

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: {
        kind: 'open-unpin-conflict-modal',
        modal,
      },
    });

    expect(mocks.setUnpinConflictModal).toHaveBeenCalledWith(modal);
    expect(mocks.acceptUnpinConflict).not.toHaveBeenCalled();
  });

  it('opens unpin-conflict modal and accepts resolution for auto-accept-unpin-conflict', () => {
    const mocks = createMocks();
    const modal = {
      columnKey: 'id',
      columnLabel: 'ID',
      isOpen: true,
      side: 'right' as const,
    };

    applyToggleColumnPinResolution({
      ...mocks,
      resolution: {
        kind: 'auto-accept-unpin-conflict',
        modal,
        resolution: 'reorder-to-fill',
      },
    });

    expect(mocks.setUnpinConflictModal).toHaveBeenCalledWith(modal);
    expect(mocks.acceptUnpinConflict).toHaveBeenCalledWith('reorder-to-fill');
  });
});
