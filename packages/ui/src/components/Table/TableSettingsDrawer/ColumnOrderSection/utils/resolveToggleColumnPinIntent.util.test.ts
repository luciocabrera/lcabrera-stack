import { describe, expect, it } from 'vitest';

import { resolveToggleColumnPinIntent } from './resolveToggleColumnPinIntent.util';

type TestRow = {
  readonly age: number;
  readonly id: string;
  readonly name: string;
};

const orderedColumns = [
  { key: 'id', label: 'ID' },
  { key: 'age', label: 'Age' },
  { key: 'name', label: 'Name' },
] as const;

describe('resolveToggleColumnPinIntent', () => {
  it('opens pin-side modal when pinning and no global preference exists', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'name',
      columnPinning: { left: [], right: [] },
      isPinning: true,
    });

    expect(result).toEqual({
      kind: 'open-pin-side-modal',
      modal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: true,
      },
    });
  });

  it('returns auto-accept pin-side when a global preference exists', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'name',
      columnPinning: { left: [], right: [] },
      globalPinSidePreference: 'left',
      isPinning: true,
    });

    expect(result).toEqual({
      kind: 'auto-accept-pin-side',
      modal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: false,
      },
      pinSide: 'left',
    });
  });

  it('applies pinning directly when unpinning does not create a conflict', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'name',
      columnPinning: { left: ['id'], right: ['name'] },
      isPinning: false,
    });

    expect(result).toEqual({
      kind: 'apply-pinning-direct',
      nextPinning: { left: ['id'], right: [] },
    });
  });

  it('opens unpin-conflict modal when unpinning creates a gap without preference', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'id',
      columnPinning: { left: ['id', 'name'], right: [] },
      isPinning: false,
    });

    expect(result).toEqual({
      kind: 'open-unpin-conflict-modal',
      modal: {
        columnKey: 'id',
        columnLabel: 'ID',
        isOpen: true,
        side: 'left',
      },
    });
  });

  it('returns auto-accept unpin-conflict when a global preference exists', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'id',
      columnPinning: { left: ['id', 'name'], right: [] },
      globalUnpinConflictResolutionPreference: 'reorder-to-fill',
      isPinning: false,
    });

    expect(result).toEqual({
      kind: 'auto-accept-unpin-conflict',
      modal: {
        columnKey: 'id',
        columnLabel: 'ID',
        isOpen: false,
        side: 'left',
      },
      resolution: 'reorder-to-fill',
    });
  });

  it('uses right side when the column is not in left-pinned group', () => {
    const result = resolveToggleColumnPinIntent<TestRow>({
      allOrderedColumns: orderedColumns,
      columnKey: 'name',
      columnPinning: { left: ['id'], right: ['age', 'name'] },
      globalUnpinConflictResolutionPreference: 'unpin-beyond',
      isPinning: false,
    });

    expect(result).toEqual({
      kind: 'auto-accept-unpin-conflict',
      modal: {
        columnKey: 'name',
        columnLabel: 'Name',
        isOpen: false,
        side: 'right',
      },
      resolution: 'unpin-beyond',
    });
  });
});
