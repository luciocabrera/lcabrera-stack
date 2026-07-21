import type { DistinctValuesResponse } from './api.types';

/**
 * Type guard for the distinct-values endpoint response shape
 * (`{ hasMore: boolean; values: string[] }`).
 */
export const isDistinctValuesResponse = (
  value: unknown,
): value is DistinctValuesResponse =>
  value instanceof Object &&
  'hasMore' in value &&
  'values' in value &&
  typeof value.hasMore === 'boolean' &&
  Array.isArray(value.values) &&
  value.values.every((entry) => typeof entry === 'string');
