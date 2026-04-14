import type { QueryValue } from 'api-shared';

const formatQueryValue = (value: QueryValue): string => {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  return `'${value.replaceAll("'", "''")}'`;
};

/**
 * Replace `$n` placeholders with formatted values for pgAdmin-friendly logging.
 */
export const formatPgAdminQuery = (
  query: string,
  params: readonly QueryValue[] = [],
): string => {
  let formattedQuery = query;

  for (let index = params.length - 1; index >= 0; index -= 1) {
    const parameterValue = params[index];

    if (parameterValue === undefined) {
      continue;
    }

    const placeholder = new RegExp(`\\$${index + 1}(?!\\d)`, 'g');
    formattedQuery = formattedQuery.replace(
      placeholder,
      formatQueryValue(parameterValue),
    );
  }

  return formattedQuery;
};
