import {
  COLUMN_RESIZE_KEYBOARD_COARSE_STEP,
  COLUMN_RESIZE_KEYBOARD_STEP,
} from '#ui/components/Table/Table.constants';

type KeyboardResizeAction =
  | { readonly type: 'ignore' }
  | { readonly type: 'reset' }
  | { readonly type: 'resize'; readonly width: number };

type ResolveKeyboardResizeActionArgs = {
  readonly currentWidth: number;
  readonly isShiftPressed: boolean;
  readonly key: string;
  readonly maxWidth: number;
  readonly minWidth: number;
};

export const resolveKeyboardResizeAction = ({
  currentWidth,
  isShiftPressed,
  key,
  maxWidth,
  minWidth,
}: ResolveKeyboardResizeActionArgs): KeyboardResizeAction => {
  if (key === 'Enter') {
    return { type: 'reset' };
  }

  if (key === 'Home') {
    return { type: 'resize', width: minWidth };
  }

  if (key === 'End') {
    return { type: 'resize', width: maxWidth };
  }

  const step = isShiftPressed
    ? COLUMN_RESIZE_KEYBOARD_COARSE_STEP
    : COLUMN_RESIZE_KEYBOARD_STEP;

  if (key === 'ArrowLeft') {
    return { type: 'resize', width: Math.max(minWidth, currentWidth - step) };
  }

  if (key === 'ArrowRight') {
    return { type: 'resize', width: Math.min(maxWidth, currentWidth + step) };
  }

  return { type: 'ignore' };
};
