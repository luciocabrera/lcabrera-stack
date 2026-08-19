import { describe, expect, it } from 'vite-plus/test';

import type {
  ColumnFiltersState,
  TableColumn,
  TableGroupKeyValue,
} from '#ui/components/Table/Table.types';

import { resolveDrillHandoffSearch } from './resolveDrillHandoffSearch.util';

type Row = Record<string, unknown>;

const COLUMNS = [
  { dataType: 'text', key: 'region', label: 'Region' },
  { dataType: 'number', key: 'year', label: 'Year' },
  { dataType: 'text', key: 'notes', label: 'Notes' },
] as unknown as readonly TableColumn<Row>[];

const PATH: readonly TableGroupKeyValue[] = [
  { columnKey: 'region', label: 'Iberia', value: 'Iberia' },
];

type ResolveArgs = {
  readonly columnFilters?: ColumnFiltersState<Row>;
  readonly path?: readonly TableGroupKeyValue[];
  readonly search?: string;
};

const resolve = ({
  columnFilters = {} as ColumnFiltersState<Row>,
  path = PATH,
  search = '?grouping=region&density=compact',
}: ResolveArgs = {}) =>
  resolveDrillHandoffSearch({ columnFilters, columns: COLUMNS, path, search });

const paramsOf = (result: string | undefined) =>
  new URLSearchParams(result ?? '');

describe('resolveDrillHandoffSearch', () => {
  it('drops the grouping, because the hand-off is the ungrouped view', () => {
    expect(paramsOf(resolve()).has('grouping')).toBe(false);
  });

  it('keeps every other param, so the rest of the page is unchanged', () => {
    expect(paramsOf(resolve()).get('density')).toBe('compact');
  });

  it('turns each group key into a filter', () => {
    expect(paramsOf(resolve()).get('filters')).toContain('region');
  });

  it('keeps the view filters the group was computed under', () => {
    // The group row's count was produced under these, so a hand-off that
    // dropped them would open on a larger set than the number it was offered
    // beside.
    const result = resolve({
      columnFilters: {
        notes: { operator: 'contains', type: 'text', value: 'urgent' },
      } as unknown as ColumnFiltersState<Row>,
    });

    expect(paramsOf(result).get('filters')).toContain('notes');
    expect(paramsOf(result).get('filters')).toContain('region');
  });

  it('refuses entirely when a key cannot be expressed as a filter', () => {
    // A NULL key has no filter that selects it — the vocabulary has no "is
    // null" member — so a link built past it would open a table showing the
    // wrong rows under the right heading. Parsed from JSON because that is how
    // a NULL key arrives.
    const nullKey = JSON.parse(
      '[{"columnKey":"region","label":"(empty)","value":null}]',
    ) as readonly TableGroupKeyValue[];

    expect(resolve({ path: nullKey })).toBeUndefined();
  });

  it('refuses the whole hand-off when only one of several keys fails', () => {
    // Partial filters select a larger set than the group, which is the failure
    // that looks like it worked.
    const path = JSON.parse(
      '[{"columnKey":"region","label":"Iberia","value":"Iberia"},{"columnKey":"year","label":"(empty)","value":null}]',
    ) as readonly TableGroupKeyValue[];

    expect(resolve({ path })).toBeUndefined();
  });
});
