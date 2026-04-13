import type { QueryValue } from '../../types/api.types';

import type {
  EnterpriseOrdersFilter,
  EnterpriseOrdersFilters,
} from './enterpriseOrders.types';

type BuildWhereClauseResult = {
  readonly queryParams: readonly QueryValue[];
  readonly whereClause: string;
};

const appendTextFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: {
  readonly columnName: string;
  readonly filter: Extract<EnterpriseOrdersFilter, { readonly type: 'text' }>;
  readonly nextParameterIndex: number;
}): {
  readonly condition?: string;
  readonly value?: QueryValue;
} => {
  if (!filter.value) {
    return {};
  }

  if (filter.operator === 'contains') {
    return {
      condition: `${columnName} ILIKE $${nextParameterIndex}`,
      value: `%${filter.value}%`,
    };
  }

  if (filter.operator === 'endsWith') {
    return {
      condition: `${columnName} ILIKE $${nextParameterIndex}`,
      value: `%${filter.value}`,
    };
  }

  if (filter.operator === 'equals') {
    return {
      condition: `${columnName} = $${nextParameterIndex}`,
      value: filter.value,
    };
  }

  if (filter.operator === 'notContains') {
    return {
      condition: `${columnName} NOT ILIKE $${nextParameterIndex}`,
      value: `%${filter.value}%`,
    };
  }

  if (filter.operator === 'notEquals') {
    return {
      condition: `${columnName} != $${nextParameterIndex}`,
      value: filter.value,
    };
  }

  return {
    condition: `${columnName} ILIKE $${nextParameterIndex}`,
    value: `${filter.value}%`,
  };
};

/**
 * Build a WHERE clause for enterprise-order filters.
 */
export const buildEnterpriseOrdersWhereClause = (
  filters: EnterpriseOrdersFilters,
): BuildWhereClauseResult => {
  const whereConditions: string[] = [];
  const queryParams: QueryValue[] = [];

  for (const [columnName, filter] of Object.entries(filters)) {
    const nextParameterIndex = queryParams.length + 1;

    if (filter.type === 'text') {
      const textFilter = appendTextFilter({
        columnName,
        filter,
        nextParameterIndex,
      });

      if (textFilter.condition && textFilter.value !== undefined) {
        whereConditions.push(textFilter.condition);
        queryParams.push(textFilter.value);
      }

      continue;
    }

    if (filter.type === 'number') {
      if (filter.operator === 'between' && filter.value2 !== undefined) {
        whereConditions.push(
          `${columnName} BETWEEN $${nextParameterIndex} AND $${nextParameterIndex + 1}`,
        );
        queryParams.push(filter.value, filter.value2);
        continue;
      }

      if (filter.operator === 'equals') {
        whereConditions.push(`${columnName} = $${nextParameterIndex}`);
      }

      if (filter.operator === 'greaterThan') {
        whereConditions.push(`${columnName} > $${nextParameterIndex}`);
      }

      if (filter.operator === 'greaterThanOrEqual') {
        whereConditions.push(`${columnName} >= $${nextParameterIndex}`);
      }

      if (filter.operator === 'lessThan') {
        whereConditions.push(`${columnName} < $${nextParameterIndex}`);
      }

      if (filter.operator === 'lessThanOrEqual') {
        whereConditions.push(`${columnName} <= $${nextParameterIndex}`);
      }

      if (filter.operator === 'notEquals') {
        whereConditions.push(`${columnName} != $${nextParameterIndex}`);
      }

      queryParams.push(filter.value);
      continue;
    }

    if (filter.type === 'date') {
      if (filter.operator === 'after') {
        whereConditions.push(`${columnName} > $${nextParameterIndex}::date`);
        queryParams.push(filter.value);
        continue;
      }

      if (filter.operator === 'before') {
        whereConditions.push(`${columnName} < $${nextParameterIndex}::date`);
        queryParams.push(filter.value);
        continue;
      }

      if (filter.operator === 'between' && filter.value2) {
        whereConditions.push(
          `${columnName} BETWEEN $${nextParameterIndex}::date AND $${nextParameterIndex + 1}::date`,
        );
        queryParams.push(filter.value, filter.value2);
        continue;
      }

      whereConditions.push(`${columnName} = $${nextParameterIndex}::date`);
      queryParams.push(filter.value);
      continue;
    }

    if (filter.type === 'boolean') {
      whereConditions.push(`${columnName} = $${nextParameterIndex}`);
      queryParams.push(filter.value);
      continue;
    }

    if (filter.values && filter.values.length > 0) {
      const placeholders = filter.values
        .map((_value, index) => `$${nextParameterIndex + index}`)
        .join(', ');
      const operator = filter.operator === 'notEquals' ? 'NOT IN' : 'IN';
      whereConditions.push(`${columnName} ${operator} (${placeholders})`);
      queryParams.push(...filter.values);
      continue;
    }

    if (filter.value) {
      const operator = filter.operator === 'notEquals' ? '!=' : '=';
      whereConditions.push(`${columnName} ${operator} $${nextParameterIndex}`);
      queryParams.push(filter.value);
    }
  }

  if (whereConditions.length === 0) {
    return {
      queryParams,
      whereClause: '',
    };
  }

  return {
    queryParams,
    whereClause: `WHERE ${whereConditions.join(' AND ')}`,
  };
};
