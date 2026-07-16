/**
 * Default minimum column width when not specified
 */
export const DEFAULT_MIN_COLUMN_WIDTH = 60;

/**
 * Default maximum column width when not specified
 */
export const DEFAULT_MAX_COLUMN_WIDTH = 600;

/**
 * Pixels a column grows/shrinks per arrow key on the resize handle.
 */
export const COLUMN_RESIZE_KEYBOARD_STEP = 8;

/**
 * Pixels a column grows/shrinks per shift+arrow key on the resize handle, so
 * keyboard users can cross a wide column without dozens of keystrokes.
 */
export const COLUMN_RESIZE_KEYBOARD_COARSE_STEP = 40;

export const DEFAULT_PLACEHOLDER_ROW_COUNT = 50;

export const DEFAULT_ROW_HEIGHT = 32;

export const INITIAL_PAGE_SIZE = 50;
export const LOAD_MORE_PAGE_SIZE = 150;
export const DEFAULT_FILTER_PAGE_SIZE = 50;
export const INFINITE_SCROLL_THRESHOLD = 200;

export const DEFAULT_OVERSCAN = 20;

export const DEFAULT_COLUMN_OVERSCAN = 2;

export const IS_PREFETCH_ENABLED = true;

/**
 * Delimiter joining multiple primary-key column values into a single row id
 * segment for CRUD links/actions. Each value is URL-encoded before joining, so
 * a single-column primary key yields the raw (encoded) value unchanged.
 */
export const PRIMARY_KEY_ID_DELIMITER = '_';

export const ACTIONS_COLUMN_KEY = 'actions';
