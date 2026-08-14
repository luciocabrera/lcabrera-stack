import { toHexString } from './toHexString.util';

/**
 * Render one driver value the way this route's JSON endpoint rendered it.
 *
 * The table shows 20 Postgres types in one grid, and three of them do not reach
 * a cell as anything printable: `bytea` arrives as bytes, and `jsonb`,
 * `interval` and `point` arrive as objects. Each becomes the string the grid has
 * always displayed — hex for the bytes, JSON text for the objects.
 *
 * A `Date` is an object too, so it also goes through `JSON.stringify` and keeps
 * the surrounding quotes it has always had here. That is deliberately preserved
 * rather than corrected: the columns are labelled by their Postgres type and
 * this is what every page of this table has rendered. Changing it is a change to
 * what the route displays, which belongs in its own issue.
 *
 * An array is left alone — `integer[]` is the one composite the grid renders as
 * a real array.
 */
export const serializeDatabaseValue = (value: unknown): unknown => {
  if (value instanceof Uint8Array) {
    return toHexString(value);
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return value;
};
