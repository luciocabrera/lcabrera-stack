import type { TableColumn } from '@repo/ui/components/Table';
import type {
  BooleanFilter,
  DateFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from '@repo/ui/types/filterOperators.types';

import { describe, expect, it } from 'vitest';

import { isFilterCompatibleWithColumn } from './isFilterCompatibleWithColumn.util';

type Row = Record<string, unknown>;

const col = (dataType: TableColumn<Row>['dataType']): TableColumn<Row> => ({
  dataType,
  key: 'x',
  label: 'X',
});

const booleanFilter: BooleanFilter = { type: 'boolean', value: true };
const numberFilter: NumberFilter = {
  operator: 'equals',
  type: 'number',
  value: 42,
};
const dateFilter: DateFilter = {
  operator: 'equals',
  type: 'date',
  value: '2024-01-01',
};
const selectFilter: SelectFilter = { type: 'select', value: 'a' };
const multiSelectFilter: SelectFilter = { type: 'multiSelect', values: ['a'] };
const textFilter: TextFilter = {
  operator: 'contains',
  type: 'text',
  value: 'foo',
};

describe('isFilterCompatibleWithColumn', () => {
  describe('boolean column', () => {
    it('accepts boolean filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('boolean'),
          filter: booleanFilter,
        }),
      ).toBe(true);
    });

    it('rejects number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('boolean'),
          filter: numberFilter,
        }),
      ).toBe(false);
    });

    it('rejects text filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('boolean'),
          filter: textFilter,
        }),
      ).toBe(false);
    });
  });

  describe('number column', () => {
    it('accepts number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('number'),
          filter: numberFilter,
        }),
      ).toBe(true);
    });

    it('rejects boolean filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('number'),
          filter: booleanFilter,
        }),
      ).toBe(false);
    });

    it('rejects text filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('number'),
          filter: textFilter,
        }),
      ).toBe(false);
    });
  });

  describe('currency column', () => {
    it('accepts number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('currency'),
          filter: numberFilter,
        }),
      ).toBe(true);
    });

    it('rejects date filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('currency'),
          filter: dateFilter,
        }),
      ).toBe(false);
    });
  });

  describe('date column', () => {
    it('accepts date filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('date'),
          filter: dateFilter,
        }),
      ).toBe(true);
    });

    it('rejects number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('date'),
          filter: numberFilter,
        }),
      ).toBe(false);
    });

    it('rejects text filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('date'),
          filter: textFilter,
        }),
      ).toBe(false);
    });
  });

  describe('string column', () => {
    it('accepts select filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('string'),
          filter: selectFilter,
        }),
      ).toBe(true);
    });

    it('accepts multiSelect filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('string'),
          filter: multiSelectFilter,
        }),
      ).toBe(true);
    });

    it('accepts text filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('string'),
          filter: textFilter,
        }),
      ).toBe(true);
    });

    it('rejects number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('string'),
          filter: numberFilter,
        }),
      ).toBe(false);
    });

    it('rejects boolean filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col('string'),
          filter: booleanFilter,
        }),
      ).toBe(false);
    });
  });

  describe('undefined dataType column (treated as string)', () => {
    it('accepts text filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col(undefined),
          filter: textFilter,
        }),
      ).toBe(true);
    });

    it('rejects number filter', () => {
      expect(
        isFilterCompatibleWithColumn({
          column: col(undefined),
          filter: numberFilter,
        }),
      ).toBe(false);
    });
  });
});
