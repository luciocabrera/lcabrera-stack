// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSetColumnFilters, mockSetExpandedFilters } = vi.hoisted(() => ({
  mockSetColumnFilters: vi.fn(),
  mockSetExpandedFilters: vi.fn(),
}));

vi.mock('../../../TableDrawerContext/actions', () => ({
  useSetColumnFilters: () => mockSetColumnFilters,
}));

vi.mock('../../../TableDrawerContext/selectors', () => ({
  useGetColumnFilters: () => ({
    price: { operator: 'equals', type: 'number', value: 1 },
    status: { operator: 'equals', type: 'text', value: 'cancelled' },
  }),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/actions',
  () => ({
    useSetTableSettingsExpandedFilters: () => mockSetExpandedFilters,
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/meta/selectors',
  () => ({
    useGetTableSettingsExpandedFilters: () => ['price', 'status'],
  }),
);

import { useRemoveFilterItem } from './useRemoveFilterItem.hook';

beforeEach(() => {
  mockSetColumnFilters.mockReset();
  mockSetExpandedFilters.mockReset();
});

describe('useRemoveFilterItem', () => {
  it('drops the column filter and collapses its expansion entry', () => {
    const { result } = renderHook(() => useRemoveFilterItem());

    result.current('status');

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      price: { operator: 'equals', type: 'number', value: 1 },
    });
    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['price']);
  });

  it('leaves other rows untouched when the key has no filter', () => {
    const { result } = renderHook(() => useRemoveFilterItem());

    result.current('unknown');

    expect(mockSetColumnFilters).toHaveBeenCalledWith({
      price: { operator: 'equals', type: 'number', value: 1 },
      status: { operator: 'equals', type: 'text', value: 'cancelled' },
    });
    expect(mockSetExpandedFilters).toHaveBeenCalledWith(['price', 'status']);
  });
});
