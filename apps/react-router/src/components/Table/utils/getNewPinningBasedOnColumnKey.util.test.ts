import { describe, expect, it } from 'vitest';

import { getNewPinningBasedOnColumnKey } from './getNewPinningBasedOnColumnKey.util';

type Row = { id: string; name: string; age: number; actions: string };

describe('getNewPinningBasedOnColumnKey', () => {
  describe('pinning a column', () => {
    it('pins a column to the left', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: 'left',
        existingPinning: { left: [], right: [] },
      });

      expect(result.left).toContain('name');
      expect(result.right).not.toContain('name');
    });

    it('pins a column to the right', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'actions',
        columnPinning: 'right',
        existingPinning: { left: [], right: [] },
      });

      expect(result.right).toContain('actions');
      expect(result.left).not.toContain('actions');
    });

    it('moves a column from right to left when re-pinned', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: 'left',
        existingPinning: { left: [], right: ['name'] },
      });

      expect(result.left).toContain('name');
      expect(result.right).not.toContain('name');
    });

    it('moves a column from left to right when re-pinned', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: 'right',
        existingPinning: { left: ['name'], right: [] },
      });

      expect(result.right).toContain('name');
      expect(result.left).not.toContain('name');
    });

    it('inserts after static columns when pinning left with staticKeys', () => {
      const staticKeys = new Set(['id']);
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: 'left',
        existingPinning: { left: ['id'], right: [] },
        staticKeys,
      });

      expect(result.left).toStrictEqual(['id', 'name']);
    });

    it('inserts before static columns when pinning right with staticKeys', () => {
      const staticKeys = new Set(['actions']);
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'age',
        columnPinning: 'right',
        existingPinning: { left: [], right: ['actions'] },
        staticKeys,
      });

      expect(result.right).toStrictEqual(['age', 'actions']);
    });
  });

  describe('unpinning a column', () => {
    it('removes column from left when columnPinning is undefined', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: undefined,
        existingPinning: { left: ['id', 'name'], right: [] },
      });

      expect(result.left).not.toContain('name');
      expect(result.left).toContain('id');
    });

    it('removes column from right when columnPinning is undefined', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'actions',
        columnPinning: undefined,
        existingPinning: { left: [], right: ['actions', 'age'] },
      });

      expect(result.right).not.toContain('actions');
      expect(result.right).toContain('age');
    });

    it('is a no-op when column is not pinned and columnPinning is undefined', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: undefined,
        existingPinning: { left: ['id'], right: ['actions'] },
      });

      expect(result).toStrictEqual({ left: ['id'], right: ['actions'] });
    });
  });

  describe('defaults', () => {
    it('defaults existingPinning to empty left/right when not provided', () => {
      const result = getNewPinningBasedOnColumnKey<Row>({
        columnKey: 'name',
        columnPinning: 'left',
      });

      expect(result.left).toContain('name');
      expect(result.right).toStrictEqual([]);
    });
  });
});
