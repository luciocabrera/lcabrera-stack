import type { StyleXStyles } from '@stylexjs/stylex';

import { describe, expect, it, vi } from 'vite-plus/test';

const { baseMock, pinnedLeftMock, pinnedRightMock, propsMock } = vi.hoisted(
  () => ({
    baseMock: vi.fn((...args: readonly [unknown, unknown]) => ({
      minWidth: args[0],
      type: 'base',
      width: args[1],
    })),
    pinnedLeftMock: vi.fn((offset: number) => ({ offset, type: 'left' })),
    pinnedRightMock: vi.fn((offset: number) => ({ offset, type: 'right' })),
    propsMock: vi.fn((...args: unknown[]) => ({ args })),
  }),
);

vi.mock('@stylexjs/stylex', () => ({
  props: propsMock,
}));

vi.mock('../TableBodyCell.stylex', () => ({
  tableBodyCellStyles: {
    alignCenter: 'alignCenter',
    alignRight: 'alignRight',
    base: baseMock,
    pinnedLeft: pinnedLeftMock,
    pinnedRight: pinnedRightMock,
    pinnedShadowLeft: 'shadowLeft',
    pinnedShadowRight: 'shadowRight',
  },
}));

import { getCellStyleProps } from './getCellStyleProps.util';

describe('getCellStyleProps', () => {
  it('applies alignment and pinning styles when content is rendered from data', () => {
    const result = getCellStyleProps({
      customStylex: {} as StyleXStyles,
      dataType: 'currency',
      isAlignedByDataType: true,
      minWidth: 120,
      pinInfo: {
        isFirstPinnedRight: false,
        isLastPinnedLeft: true,
        offset: 16,
        side: 'left',
      },
      width: 240,
    });

    expect(result).toEqual({
      args: [
        { minWidth: 120, type: 'base', width: 240 },
        'alignRight',
        false,
        { offset: 16, type: 'left' },
        false,
        'shadowLeft',
        false,
        expect.any(Object),
      ],
    });
  });

  it('skips alignment styles for consumer content and supports right pinning', () => {
    // A consumer's own `render()` output: the cell holds content nothing here chose the
    // layout of, so no alignment class is applied even though the column is a boolean.
    const result = getCellStyleProps({
      customStylex: undefined,
      dataType: 'boolean',
      isAlignedByDataType: false,
      minWidth: 80,
      pinInfo: {
        isFirstPinnedRight: true,
        isLastPinnedLeft: false,
        offset: 24,
        side: 'right',
      },
      width: 160,
    });

    expect(result).toEqual({
      args: [
        { minWidth: 80, type: 'base', width: 160 },
        false,
        false,
        false,
        { offset: 24, type: 'right' },
        false,
        'shadowRight',
        undefined,
      ],
    });
  });

  // The discriminating pair for #1018: identical arguments but for the flag, so the only
  // thing either case can be reporting is the flag. A group row's aggregate reaches here
  // as content that is already rendered — the old `hasCustomContent` — and must still take
  // the column's alignment.
  it('right-aligns a currency column whose content was supplied', () => {
    const result = getCellStyleProps({
      customStylex: undefined,
      dataType: 'currency',
      isAlignedByDataType: true,
      minWidth: 80,
      pinInfo: undefined,
      width: 160,
    });

    expect(result).toEqual({
      args: [
        { minWidth: 80, type: 'base', width: 160 },
        'alignRight',
        false,
        false,
        false,
        undefined,
        undefined,
        undefined,
      ],
    });
  });

  it('centres a date column whose content was supplied', () => {
    const result = getCellStyleProps({
      customStylex: undefined,
      dataType: 'date',
      isAlignedByDataType: true,
      minWidth: 80,
      pinInfo: undefined,
      width: 160,
    });

    expect(result).toEqual({
      args: [
        { minWidth: 80, type: 'base', width: 160 },
        false,
        'alignCenter',
        false,
        false,
        undefined,
        undefined,
        undefined,
      ],
    });
  });
});
