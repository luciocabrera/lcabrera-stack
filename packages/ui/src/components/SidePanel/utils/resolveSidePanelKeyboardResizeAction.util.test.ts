import { describe, expect, it } from 'vite-plus/test';

import {
  SIDE_PANEL_RESIZE_KEYBOARD_COARSE_STEP,
  SIDE_PANEL_RESIZE_KEYBOARD_STEP,
} from '../SidePanel.constants';
import { resolveSidePanelKeyboardResizeAction } from './resolveSidePanelKeyboardResizeAction.util';

const args = {
  currentWidth: 400,
  isShiftPressed: false,
  maxWidth: 800,
  minWidth: 320,
  position: 'right',
} as const;

describe('resolveSidePanelKeyboardResizeAction', () => {
  it('grows a right-hand panel towards the start of the line', () => {
    expect(
      resolveSidePanelKeyboardResizeAction({ ...args, key: 'ArrowLeft' }),
    ).toStrictEqual({
      type: 'resize',
      width: 400 + SIDE_PANEL_RESIZE_KEYBOARD_STEP,
    });
  });

  it('grows a left-hand panel the other way', () => {
    expect(
      resolveSidePanelKeyboardResizeAction({
        ...args,
        key: 'ArrowLeft',
        position: 'left',
      }),
    ).toStrictEqual({
      type: 'resize',
      width: 400 - SIDE_PANEL_RESIZE_KEYBOARD_STEP,
    });
  });

  it('takes a coarser step while shift is held', () => {
    expect(
      resolveSidePanelKeyboardResizeAction({
        ...args,
        isShiftPressed: true,
        key: 'ArrowRight',
      }),
    ).toStrictEqual({
      type: 'resize',
      width: 400 - SIDE_PANEL_RESIZE_KEYBOARD_COARSE_STEP,
    });
  });

  it('jumps to either end of the band', () => {
    expect({
      end: resolveSidePanelKeyboardResizeAction({ ...args, key: 'End' }),
      home: resolveSidePanelKeyboardResizeAction({ ...args, key: 'Home' }),
    }).toStrictEqual({
      end: { type: 'resize', width: 800 },
      home: { type: 'resize', width: 320 },
    });
  });

  it('holds the band at either end', () => {
    expect(
      resolveSidePanelKeyboardResizeAction({
        ...args,
        currentWidth: 800,
        key: 'ArrowLeft',
      }),
    ).toStrictEqual({ type: 'resize', width: 800 });
  });

  it('ignores a key that is not a resize', () => {
    expect(
      resolveSidePanelKeyboardResizeAction({ ...args, key: 'Enter' }),
    ).toStrictEqual({ type: 'ignore' });
  });
});
