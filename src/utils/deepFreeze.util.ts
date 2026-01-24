/**
 * Recursively freezes an object and all nested objects.
 * Only active in development mode - returns the object unchanged in production.
 *
 * Use this to detect accidental mutations of state objects that should be immutable.
 * When frozen, any attempt to modify the object will throw a TypeError.
 *
 * @example
 * ```ts
 * const filters = deepFreeze({ priority: { type: 'select', values: ['Low'] } });
 * filters.priority.values.push('High'); // TypeError in dev mode
 * ```
 */
export const deepFreeze = <T>(obj: T): T => {
  // Only freeze in development mode to avoid production overhead
  if (!import.meta.env.DEV) {
    return obj;
  }

  return recursiveFreeze(obj);
};

/**
 * Internal recursive freeze implementation
 */
const recursiveFreeze = <T>(obj: T): T => {
  // Handle null, undefined, and primitives
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    for (const item of obj) {
      recursiveFreeze(item);
    }
    return Object.freeze(obj) as T;
  }

  // Handle objects
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = (obj as Record<string, unknown>)[name];
    if (value && typeof value === 'object') {
      recursiveFreeze(value);
    }
  }

  return Object.freeze(obj) as T;
};
