import { HttpError } from 'api-shared';

import { readQueryValue } from './readQueryValue.util';

/**
 * Parse a JSON query param into an unknown value.
 */
export const parseJsonQueryParam = (value: unknown): unknown => {
  const normalizedValue = readQueryValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  try {
    return JSON.parse(normalizedValue) as unknown;
  } catch {
    throw new HttpError({
      message: 'Invalid JSON query parameter.',
      statusCode: 400,
    });
  }
};
