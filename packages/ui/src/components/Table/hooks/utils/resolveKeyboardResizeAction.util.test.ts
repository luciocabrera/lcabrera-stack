import { describe, expect, it } from 'vite-plus/test';

import {
  COLUMN_RESIZE_KEYBOARD_COARSE_STEP,
  COLUMN_RESIZE_KEYBOARD_STEP,
} from '#ui/components/Table/Table.constants';

import { resolveKeyboardResizeAction } from './resolveKeyboardResizeAction.util';

const baseArgs = {
  currentWidth: 200,
  isShiftPressed: false,
  maxWidth: 400,
  minWidth: 80,
} as const;

describe('resolveKeyboardResizeAction', () => {
  it('steps the width down on ArrowLeft and up on ArrowRight', () => {
    expect(
      resolveKeyboardResizeAction({ ...baseArgs, key: 'ArrowLeft' }),
    ).toEqual({ type: 'resize', width: 200 - COLUMN_RESIZE_KEYBOARD_STEP });

    expect(
      resolveKeyboardResizeAction({ ...baseArgs, key: 'ArrowRight' }),
    ).toEqual({ type: 'resize', width: 200 + COLUMN_RESIZE_KEYBOARD_STEP });
  });

  it('uses the coarse step while shift is held', () => {
    expect(
      resolveKeyboardResizeAction({
        ...baseArgs,
        isShiftPressed: true,
        key: 'ArrowRight',
      }),
    ).toEqual({
      type: 'resize',
      width: 200 + COLUMN_RESIZE_KEYBOARD_COARSE_STEP,
    });
  });

  it('clamps a step to the bounds instead of overshooting', () => {
    expect(
      resolveKeyboardResizeAction({
        ...baseArgs,
        currentWidth: 82,
        key: 'ArrowLeft',
      }),
    ).toEqual({ type: 'resize', width: 80 });

    expect(
      resolveKeyboardResizeAction({
        ...baseArgs,
        currentWidth: 398,
        key: 'ArrowRight',
      }),
    ).toEqual({ type: 'resize', width: 400 });
  });

  it('holds at a bound once the width is already there', () => {
    expect(
      resolveKeyboardResizeAction({
        ...baseArgs,
        currentWidth: 80,
        key: 'ArrowLeft',
      }),
    ).toEqual({ type: 'resize', width: 80 });

    expect(
      resolveKeyboardResizeAction({
        ...baseArgs,
        currentWidth: 400,
        key: 'ArrowRight',
      }),
    ).toEqual({ type: 'resize', width: 400 });
  });

  it('jumps to the bounds on Home and End', () => {
    expect(resolveKeyboardResizeAction({ ...baseArgs, key: 'Home' })).toEqual({
      type: 'resize',
      width: 80,
    });

    expect(resolveKeyboardResizeAction({ ...baseArgs, key: 'End' })).toEqual({
      type: 'resize',
      width: 400,
    });
  });

  it('resets the width on Enter', () => {
    expect(resolveKeyboardResizeAction({ ...baseArgs, key: 'Enter' })).toEqual({
      type: 'reset',
    });
  });

  it('ignores keys the splitter does not own', () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'Tab', ' ', 'a', 'Escape']) {
      expect(resolveKeyboardResizeAction({ ...baseArgs, key })).toEqual({
        type: 'ignore',
      });
    }
  });
});
