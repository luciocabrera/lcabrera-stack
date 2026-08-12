import {
  COLUMN_RESIZE_KEYBOARD_COARSE_STEP,
  COLUMN_RESIZE_KEYBOARD_STEP,
} from '#ui/components/Table/Table.constants';

/**
 * What a keypress on the resize handle should do: nothing at all, restore the
 * column's default width, or move it to a concrete clamped width. Annotated as
 * the return type on purpose — inference would widen each `type` to `string`
 * and collapse the discriminated union at the call site.
 */
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

/**
 * Maps a keypress on the resize handle to a resize action, following the ARIA
 * window-splitter pattern: arrows step the width (shift for a coarse step),
 * Home/End jump to the bounds, and Enter restores the default. Any other key
 * resolves to `ignore` so the handler leaves the event alone.
 *
 * Returned widths are already clamped to `[minWidth, maxWidth]`, matching what
 * a pointer drag produces for the same column.
 */
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
