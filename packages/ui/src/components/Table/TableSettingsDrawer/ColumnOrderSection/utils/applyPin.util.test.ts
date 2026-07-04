import { describe, expect, it } from 'vitest';

import { applyPin } from './applyPin.util';

describe('applyPin', () => {
  it('adds column to left side', () => {
    const result = applyPin({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      side: 'left',
    });
    expect(result.left).toContain('name');
    expect(result.right).not.toContain('name');
  });

  it('adds column to right side', () => {
    const result = applyPin({
      columnKey: 'actions',
      columnPinning: { left: [], right: ['status'] },
      side: 'right',
    });
    expect(result.right).toContain('actions');
    expect(result.left).not.toContain('actions');
  });

  it('removes column from opposite side when switching', () => {
    const result = applyPin({
      columnKey: 'name',
      columnPinning: { left: ['name'], right: [] },
      side: 'right',
    });
    expect(result.left).not.toContain('name');
    expect(result.right).toContain('name');
  });

  it('inserts after static columns on left when staticKeys provided', () => {
    const result = applyPin({
      columnKey: 'name',
      columnPinning: { left: ['id'], right: [] },
      side: 'left',
      staticKeys: new Set(['id']),
    });
    expect(result.left).toEqual(['id', 'name']);
  });

  it('inserts before static columns on right when staticKeys provided', () => {
    const result = applyPin({
      columnKey: 'age',
      columnPinning: { left: [], right: ['actions'] },
      side: 'right',
      staticKeys: new Set(['actions']),
    });
    expect(result.right).toEqual(['age', 'actions']);
  });

  it('appends to right when no static columns on right side', () => {
    const result = applyPin({
      columnKey: 'age',
      columnPinning: { left: [], right: ['status'] },
      side: 'right',
      staticKeys: new Set(),
    });
    expect(result.right).toEqual(['status', 'age']);
  });
});
