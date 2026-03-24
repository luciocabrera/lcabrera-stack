/**
 * Default fallback container height (px) for row virtualisation hooks
 * when the DOM element has not been measured yet.
 */
export const DEFAULT_CONTAINER_HEIGHT = 400;

/**
 * Default fallback container width (px) for column virtualisation hooks
 * when the DOM element has not been measured yet.
 * Uses a common desktop viewport width as a safe initial estimate.
 */
export const DEFAULT_CONTAINER_WIDTH = 1920;

/**
 * Default number of extra **rows** rendered beyond each visible edge
 * to prevent flicker during fast scrolling.
 */
export const DEFAULT_ROW_OVERSCAN = 10;

/**
 * Default number of extra **columns** rendered beyond each visible edge
 * to prevent flicker during fast horizontal scrolling.
 */
export const DEFAULT_COLUMN_OVERSCAN = 12;
