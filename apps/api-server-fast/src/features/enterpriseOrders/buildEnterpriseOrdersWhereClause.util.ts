import type { QueryValue } from 'api-shared';

import type {
  EnterpriseOrdersFilter,
  EnterpriseOrdersFilters,
} from './enterpriseOrders.types';

type BuildWhereClauseResult = {
  readonly queryParams: readonly QueryValue[];
  readonly whereClause: string;
};

type FilterContext = {
  readonly columnName: string;
  readonly nextParameterIndex: number;
  readonly queryParams: QueryValue[];
  readonly whereConditions: string[];
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

const handleNumberFilter = (
  context: FilterContext,
  filter: Extract<EnterpriseOrdersFilter, { readonly type: 'number' }>,
): boolean => {
  const { columnName, nextParameterIndex, queryParams, whereConditions } =
    context;

  if (filter.operator === 'between' && filter.value2 !== undefined) {
    whereConditions.push(
      `${columnName} BETWEEN $${nextParameterIndex} AND $${nextParameterIndex + 1}`,
    );
    queryParams.push(filter.value, filter.value2);
    return true;
  }

  switch (filter.operator) {
    case 'equals':
      whereConditions.push(`${columnName} = $${nextParameterIndex}`);
      break;
    case 'greaterThan':
      whereConditions.push(`${columnName} > $${nextParameterIndex}`);
      break;
    case 'greaterThanOrEqual':
      whereConditions.push(`${columnName} >= $${nextParameterIndex}`);
      break;
    case 'lessThan':
      whereConditions.push(`${columnName} < $${nextParameterIndex}`);
      break;
    case 'lessThanOrEqual':
      whereConditions.push(`${columnName} <= $${nextParameterIndex}`);
      break;
    case 'notEquals':
      whereConditions.push(`${columnName} != $${nextParameterIndex}`);
      break;
  }

  queryParams.push(filter.value);
  return true;
};

const handleDateFilter = (
  context: FilterContext,
  filter: Extract<EnterpriseOrdersFilter, { readonly type: 'date' }>,
): boolean => {
  const { columnName, nextParameterIndex, queryParams, whereConditions } =
    context;

  if (filter.operator === 'after') {
    whereConditions.push(`${columnName} > $${nextParameterIndex}::date`);
    queryParams.push(filter.value);
    return true;
  }

  if (filter.operator === 'before') {
    whereConditions.push(`${columnName} < $${nextParameterIndex}::date`);
    queryParams.push(filter.value);
    return true;
  }

  if (filter.operator === 'between' && filter.value2) {
    whereConditions.push(
      `${columnName} BETWEEN $${nextParameterIndex}::date AND $${nextParameterIndex + 1}::date`,
    );
    queryParams.push(filter.value, filter.value2);
    return true;
  }

  whereConditions.push(`${columnName} = $${nextParameterIndex}::date`);
  queryParams.push(filter.value);
  return true;
};

const handleSelectFilter = (
  context: FilterContext,
  filter: Extract<
    EnterpriseOrdersFilter,
    { readonly values?: readonly unknown[] }
  >,
): boolean => {
  const { columnName, nextParameterIndex, queryParams, whereConditions } =
    context;

  if (!filter.values || filter.values.length === 0) {
    return false;
  }

  const placeholders = filter.values
    .map((_value, index) => `$${nextParameterIndex + index}`)
    .join(', ');
  const operator = filter.operator === 'notEquals' ? 'NOT IN' : 'IN';
  whereConditions.push(`${columnName} ${operator} (${placeholders})`);
  queryParams.push(...filter.values);
  return true;
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
    const context = {
      columnName,
      nextParameterIndex,
      queryParams,
      whereConditions,
    };

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

    if (
      filter.type === 'number' &&
      handleNumberFilter(
        context,
        filter as Extract<EnterpriseOrdersFilter, { readonly type: 'number' }>,
      )
    ) {
      continue;
    }

    if (
      filter.type === 'date' &&
      handleDateFilter(
        context,
        filter as Extract<EnterpriseOrdersFilter, { readonly type: 'date' }>,
      )
    ) {
      continue;
    }

    if (filter.type === 'boolean') {
      whereConditions.push(`${columnName} = $${nextParameterIndex}`);
      queryParams.push(
        (
          filter as Extract<
            EnterpriseOrdersFilter,
            { readonly type: 'boolean' }
          >
        ).value,
      );
      continue;
    }

    if (
      handleSelectFilter(
        context,
        filter as Extract<
          EnterpriseOrdersFilter,
          { readonly values?: readonly unknown[] }
        >,
      )
    ) {
      continue;
    }

    const hasOperator =
      'operator' in filter && typeof filter.operator === 'string';
    const hasValue = 'value' in filter && filter.value !== undefined;

    if (hasValue) {
      const op =
        hasOperator &&
        (filter as { readonly operator: string }).operator === 'notEquals'
          ? '!='
          : '=';
      whereConditions.push(`${columnName} ${op} $${nextParameterIndex}`);
      queryParams.push((filter as { readonly value: QueryValue }).value);
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
