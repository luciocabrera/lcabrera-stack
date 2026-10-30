import type { StyleXStyles } from '@stylexjs/stylex';

import { describe, expect, it, vi } from 'vite-plus/test';

const {
  baseMock,
  pinnedLeftMock,
  pinnedRightMock,
  propsMock,
  staticLayoutMock,
} = vi.hoisted(() => ({
  baseMock: vi.fn((...args: readonly [unknown, unknown]) => ({
    minWidth: args[0],
    type: 'base',
    width: args[1],
  })),
  pinnedLeftMock: vi.fn((offset: number) => ({ offset, type: 'left' })),
  pinnedRightMock: vi.fn((offset: number) => ({ offset, type: 'right' })),
  propsMock: vi.fn((...args: unknown[]) => ({ args })),
  staticLayoutMock: vi.fn((widths: unknown) => ({ type: 'static', widths })),
}));

vi.mock('@stylexjs/stylex', () => ({
  props: propsMock,
}));

vi.mock('../TableBodyCell.stylex', () => ({
  tableBodyCellStyles: {
    alignCenter: 'alignCenter',
    alignRight: 'alignRight',
    alignStart: 'alignStart',
    base: baseMock,
    fill: 'fill',
    pinnedLeft: pinnedLeftMock,
    pinnedRight: pinnedRightMock,
    pinnedShadowLeft: 'shadowLeft',
    pinnedShadowRight: 'shadowRight',
    staticLayout: staticLayoutMock,
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

  it('replaces the dataType alignment with the column’s own, before customStylex', () => {
    const result = getCellStyleProps({
      align: 'start',
      customStylex: undefined,
      dataType: 'number',
      isAlignedByDataType: true,
      minWidth: 80,
      pinInfo: undefined,
      width: 160,
    });

    expect(result).toEqual({
      args: [
        { minWidth: 80, type: 'base', width: 160 },
        false,
        false,
        false,
        false,
        undefined,
        undefined,
        'alignStart',
        undefined,
      ],
    });
  });

  it.each([
    { align: 'center', style: 'alignCenter' },
    { align: 'end', style: 'alignRight' },
  ] as const)(
    'maps an explicit $align alignment to its style',
    ({ align, style }) => {
      const result = getCellStyleProps({
        align,
        customStylex: undefined,
        dataType: 'string',
        isAlignedByDataType: false,
        minWidth: 80,
        pinInfo: undefined,
        width: 160,
      });

      expect(result).toEqual({ args: expect.arrayContaining([style]) });
    },
  );

  it('adds the fill growth and the static cell layout when asked', () => {
    const widths = { maxWidth: undefined, minWidth: 40, width: '100%' };
    const result = getCellStyleProps({
      customStylex: undefined,
      dataType: 'string',
      isAlignedByDataType: true,
      isFill: true,
      minWidth: 80,
      pinInfo: undefined,
      staticWidths: widths,
      width: 160,
    });

    expect(result).toEqual({
      args: expect.arrayContaining(['fill', { type: 'static', widths }]),
    });
  });
});
