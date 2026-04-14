import type { QueryValue } from '../../types/api.types.js';

import type {
  EnterpriseOrdersFilter,
  EnterpriseOrdersFilters,
} from './enterpriseOrders.types.js';

type BuildWhereClauseResult = {
  readonly queryParams: readonly QueryValue[];
  readonly whereClause: string;
};

type FilterConditionResult = {
  readonly condition?: string;
  readonly queryParams: readonly QueryValue[];
};

type AppendBooleanFilterArgs = {
  readonly columnName: string;
  readonly filter: Extract<
    EnterpriseOrdersFilter,
    { readonly type: 'boolean' }
  >;
  readonly nextParameterIndex: number;
};

type AppendDateFilterArgs = {
  readonly columnName: string;
  readonly filter: Extract<EnterpriseOrdersFilter, { readonly type: 'date' }>;
  readonly nextParameterIndex: number;
};

type AppendNumberFilterArgs = {
  readonly columnName: string;
  readonly filter: Extract<EnterpriseOrdersFilter, { readonly type: 'number' }>;
  readonly nextParameterIndex: number;
};

type AppendSelectFilterArgs = {
  readonly columnName: string;
  readonly filter: Extract<
    EnterpriseOrdersFilter,
    { readonly type: 'multiSelect' | 'select' }
  >;
  readonly nextParameterIndex: number;
};

type AppendTextFilterArgs = {
  readonly columnName: string;
  readonly filter: Extract<EnterpriseOrdersFilter, { readonly type: 'text' }>;
  readonly nextParameterIndex: number;
};

const appendTextFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: AppendTextFilterArgs): FilterConditionResult => {
  if (!filter.value) {
    return { queryParams: [] };
  }

  switch (filter.operator) {
    case 'contains': {
      return {
        condition: `${columnName} ILIKE $${nextParameterIndex}`,
        queryParams: [`%${filter.value}%`],
      };
    }
    case 'endsWith': {
      return {
        condition: `${columnName} ILIKE $${nextParameterIndex}`,
        queryParams: [`%${filter.value}`],
      };
    }
    case 'equals': {
      return {
        condition: `${columnName} = $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'notContains': {
      return {
        condition: `${columnName} NOT ILIKE $${nextParameterIndex}`,
        queryParams: [`%${filter.value}%`],
      };
    }
    case 'notEquals': {
      return {
        condition: `${columnName} != $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    default: {
      return {
        condition: `${columnName} ILIKE $${nextParameterIndex}`,
        queryParams: [`${filter.value}%`],
      };
    }
  }
};

const appendNumberFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: AppendNumberFilterArgs): FilterConditionResult => {
  if (filter.operator === 'between' && filter.value2 !== undefined) {
    return {
      condition: `${columnName} BETWEEN $${nextParameterIndex} AND $${nextParameterIndex + 1}`,
      queryParams: [filter.value, filter.value2],
    };
  }

  switch (filter.operator) {
    case 'equals': {
      return {
        condition: `${columnName} = $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'greaterThan': {
      return {
        condition: `${columnName} > $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'greaterThanOrEqual': {
      return {
        condition: `${columnName} >= $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'lessThan': {
      return {
        condition: `${columnName} < $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'lessThanOrEqual': {
      return {
        condition: `${columnName} <= $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    case 'notEquals': {
      return {
        condition: `${columnName} != $${nextParameterIndex}`,
        queryParams: [filter.value],
      };
    }
    default: {
      return {
        queryParams: [filter.value],
      };
    }
  }
};

const appendDateFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: AppendDateFilterArgs): FilterConditionResult => {
  switch (filter.operator) {
    case 'after': {
      return {
        condition: `${columnName} > $${nextParameterIndex}::date`,
        queryParams: [filter.value],
      };
    }
    case 'before': {
      return {
        condition: `${columnName} < $${nextParameterIndex}::date`,
        queryParams: [filter.value],
      };
    }
    case 'between': {
      if (filter.value2) {
        return {
          condition: `${columnName} BETWEEN $${nextParameterIndex}::date AND $${nextParameterIndex + 1}::date`,
          queryParams: [filter.value, filter.value2],
        };
      }

      return {
        condition: `${columnName} = $${nextParameterIndex}::date`,
        queryParams: [filter.value],
      };
    }
    default: {
      return {
        condition: `${columnName} = $${nextParameterIndex}::date`,
        queryParams: [filter.value],
      };
    }
  }
};

const appendBooleanFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: AppendBooleanFilterArgs): FilterConditionResult => {
  return {
    condition: `${columnName} = $${nextParameterIndex}`,
    queryParams: [filter.value],
  };
};

const appendSelectFilter = ({
  columnName,
  filter,
  nextParameterIndex,
}: AppendSelectFilterArgs): FilterConditionResult => {
  if (filter.values && filter.values.length > 0) {
    const placeholders = filter.values
      .map((_value, index) => `$${nextParameterIndex + index}`)
      .join(', ');
    const operator = filter.operator === 'notEquals' ? 'NOT IN' : 'IN';

    return {
      condition: `${columnName} ${operator} (${placeholders})`,
      queryParams: [...filter.values],
    };
  }

  if (filter.value) {
    const operator = filter.operator === 'notEquals' ? '!=' : '=';

    return {
      condition: `${columnName} ${operator} $${nextParameterIndex}`,
      queryParams: [filter.value],
    };
  }

  return {
    queryParams: [],
  };
};

const applyFilterConditionResult = ({
  filterResult,
  queryParams,
  whereConditions,
}: {
  readonly filterResult: FilterConditionResult;
  readonly queryParams: QueryValue[];
  readonly whereConditions: string[];
}): void => {
  if (filterResult.condition) {
    whereConditions.push(filterResult.condition);
  }

  queryParams.push(...filterResult.queryParams);
};

const buildFilterCondition = ({
  columnName,
  filter,
  nextParameterIndex,
}: {
  readonly columnName: string;
  readonly filter: EnterpriseOrdersFilter;
  readonly nextParameterIndex: number;
}): FilterConditionResult => {
  switch (filter.type) {
    case 'boolean': {
      return appendBooleanFilter({
        columnName,
        filter,
        nextParameterIndex,
      });
    }
    case 'date': {
      return appendDateFilter({
        columnName,
        filter,
        nextParameterIndex,
      });
    }
    case 'number': {
      return appendNumberFilter({
        columnName,
        filter,
        nextParameterIndex,
      });
    }
    case 'multiSelect':
    case 'select': {
      return appendSelectFilter({
        columnName,
        filter,
        nextParameterIndex,
      });
    }
    case 'text': {
      return appendTextFilter({
        columnName,
        filter,
        nextParameterIndex,
      });
    }
  }
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
    const filterResult = buildFilterCondition({
      columnName,
      filter,
      nextParameterIndex,
    });

    applyFilterConditionResult({
      filterResult,
      queryParams,
      whereConditions,
    });
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
