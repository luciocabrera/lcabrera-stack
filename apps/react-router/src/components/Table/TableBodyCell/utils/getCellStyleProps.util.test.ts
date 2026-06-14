import type { StyleXStyles } from '@stylexjs/stylex';

import { describe, expect, it, vi } from 'vitest';

const { baseMock, pinnedLeftMock, pinnedRightMock, propsMock } = vi.hoisted(
  () => ({
    baseMock: vi.fn((minWidth: unknown, width: unknown) => ({
      minWidth,
      type: 'base',
      width,
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
      hasCustomContent: false,
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

  it('skips alignment styles for custom content and supports right pinning', () => {
    const result = getCellStyleProps({
      customStylex: undefined,
      dataType: 'boolean',
      hasCustomContent: true,
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
});
