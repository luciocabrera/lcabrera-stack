// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnGroupingCapability } from '#ui/components/Table/Table.types';

const { capabilityRef, mockSetGroupKeyPeriod, periodsRef } = vi.hoisted(() => ({
  capabilityRef: { current: undefined as unknown },
  mockSetGroupKeyPeriod: vi.fn(),
  periodsRef: { current: {} as Record<string, string> },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnGroupingCapability: () => capabilityRef.current,
}));

vi.mock('../../../TableDrawerContext/actions', () => ({
  useSetGroupKeyPeriod: () => mockSetGroupKeyPeriod,
}));

vi.mock('../../../TableDrawerContext/selectors', () => ({
  useGetGroupingPeriods: () => periodsRef.current,
}));

import { GroupKeyPeriodSelect } from './GroupKeyPeriodSelect.component';

/** `order_date` as the catalogue reports it: refused raw, legal above a day. */
const dateCapability: TableColumnGroupingCapability = {
  aggregates: ['count', 'countDistinct', 'max', 'min'],
  canGroup: false,
  column: 'order_date',
  distinctEstimate: 1800,
  periods: ['month', 'quarter', 'year'],
  refusal: 'too-many-distinct',
  role: 'dimension',
  typeName: 'date',
};

const renderSelect = () =>
  render(
    <GroupKeyPeriodSelect
      columnKey='order_date'
      isBusy={false}
      label='Order Date'
    />,
  );

const getSelect = () =>
  screen.queryByLabelText('Order Date grouping granularity');

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  capabilityRef.current = undefined;
  periodsRef.current = {};
});

describe('GroupKeyPeriodSelect', () => {
  it('offers exactly the granularities the route reports, plus the raw column', () => {
    // The capability's list rather than the whole vocabulary: `day` is missing
    // here because the guard refuses one group per calendar day, and offering
    // it would produce a refused read from a control that looked available.
    capabilityRef.current = dateCapability;

    renderSelect();

    expect(
      [...screen.getAllByRole('option')].map((option) => option.textContent),
    ).toStrictEqual(['Raw', 'Month', 'Quarter', 'Year']);
  });

  it('renders nothing at all for a column with no granularities', () => {
    // Every non-temporal column, and any date whose range is too wide for even
    // a year. A disabled control would suggest a choice the route lacks.
    capabilityRef.current = { ...dateCapability, periods: [] };

    renderSelect();

    expect(getSelect()).toBeNull();
  });

  it('renders nothing when the route declared no capability for the column', () => {
    renderSelect();

    expect(getSelect()).toBeNull();
  });

  it('shows the staged granularity, and stages a change', () => {
    capabilityRef.current = dateCapability;
    periodsRef.current = { order_date: 'quarter' };

    renderSelect();

    const select = getSelect() as HTMLSelectElement;

    expect(select.value).toBe('quarter');

    fireEvent.change(select, { target: { value: 'year' } });

    expect(mockSetGroupKeyPeriod).toHaveBeenCalledWith({
      columnKey: 'order_date',
      period: 'year',
    });
  });

  it('clears the granularity when the raw option is chosen', () => {
    // `<select>` cannot hold `undefined`, so the empty value is the one thing
    // that has to be translated back rather than passed through.
    capabilityRef.current = dateCapability;
    periodsRef.current = { order_date: 'month' };

    renderSelect();

    fireEvent.change(getSelect() as HTMLSelectElement, {
      target: { value: '' },
    });

    expect(mockSetGroupKeyPeriod).toHaveBeenCalledWith({
      columnKey: 'order_date',
      period: undefined,
    });
  });

  it('shows the raw option when nothing is staged for this key', () => {
    capabilityRef.current = dateCapability;
    periodsRef.current = { some_other_column: 'year' };

    renderSelect();

    expect((getSelect() as HTMLSelectElement).value).toBe('');
  });
});
