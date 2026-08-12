import type { TableGroupRow } from './Table.types';

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

/**
 * How long a filter-options page request may hang before it is abandoned.
 *
 * This is a recovery bound, not a latency target. The filter fetchers guard
 * against concurrent requests with an `isLoading`/`isLoadingMore` flag that is
 * only cleared when the request settles — so a request that never settles
 * leaves the flag set and every later page request returns early, wedging that
 * dropdown until the table remounts. A rejection is not the problem; the
 * existing catch clears the flag and reports. Silence is.
 *
 * Generous on purpose: it must not fire for a merely slow endpoint, only for
 * one that has stopped answering.
 */
export const FILTER_OPTIONS_TIMEOUT_MS = 30_000;

export const DEFAULT_OVERSCAN = 20;

export const IS_PREFETCH_ENABLED = true;

/**
 * Delimiter joining multiple primary-key column values into a single row id
 * segment for CRUD links/actions. Each value is URL-encoded before joining, so
 * a single-column primary key yields the raw (encoded) value unchanged.
 */
export const PRIMARY_KEY_ID_DELIMITER = '_';

export const ACTIONS_COLUMN_KEY = 'actions';

/**
 * The row field a grouped read attaches its `TableGroupRowSummary` to.
 *
 * Deliberately not a column key and not derived from one: a grouped row carries
 * its summary beside the group key's own value, so the renderer asks the row
 * what it is instead of asking the grouping configuration what every row must
 * be. It is exported because the route's server-side read is what writes it.
 *
 * Typed `keyof TableGroupRow` rather than left to infer, so renaming the field
 * in one place and not the other is a compile error rather than a group header
 * that silently stops rendering.
 */
export const TABLE_GROUP_ROW_FIELD: keyof TableGroupRow = 'tableGroup';
