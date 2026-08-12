import type {
  BooleanFilter,
  ColumnFilter,
  DateFilter,
  NumberFilter,
  SelectFilter,
  TextFilter,
} from '@lcabrera/server/filters/filters.types';

/**
 * The variant key sets are what make the contract below a drift guard rather
 * than a sample: each is the filter variant's own operator union, so adding an
 * operator to `@lcabrera/server`'s contract (or removing one) stops this file
 * compiling until a case is written for it — and the case then fails the
 * api-server suites until both request schemas accept it too.
 *
 * `drafting` has no such anchor, and there is no honest one to give it: "a
 * value the mappers drop" spans an absent key, an empty string and an empty
 * array, which share no closed vocabulary in the type system. Its keys are
 * therefore free-form and a case deleted from it is a case silently no longer
 * checked — so each API server also carries the drafting states of #567 as a
 * named regression of its own, independent of this set.
 */
type EnterpriseOrderFilterContract = Readonly<
  Record<'drafting' | ColumnFilter['type'], FilterCases<string, ColumnFilter>>
> & {
  readonly boolean: FilterCases<'false' | 'true', BooleanFilter>;
  readonly date: FilterCases<DateFilter['operator'], DateFilter>;
  readonly multiSelect: FilterCases<
    NonNullable<SelectFilter['operator']>,
    SelectFilter
  >;
  readonly number: FilterCases<NumberFilter['operator'], NumberFilter>;
  readonly select: FilterCases<
    'omitted' | NonNullable<SelectFilter['operator']>,
    SelectFilter
  >;
  readonly text: FilterCases<TextFilter['operator'], TextFilter>;
};

/** A `filter` query payload — column key → the filter applied to that column. */
type FilterCases<TKey extends string, TFilter extends ColumnFilter> = Readonly<
  Record<TKey, Readonly<Record<string, TFilter>>>
>;

const CONTRACT = {
  boolean: {
    false: { is_vip_customer: { type: 'boolean', value: false } },
    true: { is_vip_customer: { type: 'boolean', value: true } },
  },
  date: {
    after: {
      order_date: { operator: 'after', type: 'date', value: '2026-01-01' },
    },
    before: {
      order_date: { operator: 'before', type: 'date', value: '2026-12-31' },
    },
    between: {
      order_date: {
        operator: 'between',
        type: 'date',
        value: '2026-01-01',
        value2: '2026-12-31',
      },
    },
    equals: {
      order_date: { operator: 'equals', type: 'date', value: '2026-06-15' },
    },
  },
  drafting: {
    dateBetweenWithoutSecondBound: {
      order_date: {
        operator: 'between',
        type: 'date',
        value: '2026-01-01',
        value2: '',
      },
    },
    dateWithoutValue: {
      order_date: { operator: 'after', type: 'date', value: '' },
    },
    multiSelectWithBlankValue: {
      order_status: { operator: 'equals', type: 'multiSelect', values: [''] },
    },
    multiSelectWithoutValues: {
      order_status: { operator: 'equals', type: 'multiSelect', values: [] },
    },
    numberBetweenWithoutSecondBound: {
      total_amount: { operator: 'between', type: 'number', value: 10 },
    },
    numberWithoutValue: {
      total_amount: { operator: 'equals', type: 'number', value: undefined },
    },
    selectWithoutValue: {
      payment_status: { operator: 'equals', type: 'select', value: '' },
    },
    textWithoutValue: {
      customer_name: { operator: 'contains', type: 'text', value: '' },
    },
  },
  multiSelect: {
    equals: {
      order_status: {
        operator: 'equals',
        type: 'multiSelect',
        values: ['Pending', 'Shipped'],
      },
    },
    notEquals: {
      order_status: {
        operator: 'notEquals',
        type: 'multiSelect',
        values: ['Cancelled'],
      },
    },
  },
  number: {
    between: {
      total_amount: {
        operator: 'between',
        type: 'number',
        value: 10,
        value2: 20,
      },
    },
    equals: {
      total_amount: { operator: 'equals', type: 'number', value: 42 },
    },
    greaterThan: {
      total_amount: { operator: 'greaterThan', type: 'number', value: 10 },
    },
    greaterThanOrEqual: {
      total_amount: {
        operator: 'greaterThanOrEqual',
        type: 'number',
        value: 10,
      },
    },
    lessThan: {
      total_amount: { operator: 'lessThan', type: 'number', value: 20 },
    },
    lessThanOrEqual: {
      total_amount: { operator: 'lessThanOrEqual', type: 'number', value: 20 },
    },
    notEquals: {
      total_amount: { operator: 'notEquals', type: 'number', value: 42 },
    },
  },
  select: {
    equals: {
      payment_status: { operator: 'equals', type: 'select', value: 'Paid' },
    },
    notEquals: {
      payment_status: { operator: 'notEquals', type: 'select', value: 'Paid' },
    },
    omitted: { payment_status: { type: 'select', value: 'Paid' } },
  },
  text: {
    contains: {
      customer_name: { operator: 'contains', type: 'text', value: 'ac' },
    },
    endsWith: {
      customer_name: { operator: 'endsWith', type: 'text', value: 'ce' },
    },
    equals: {
      customer_name: { operator: 'equals', type: 'text', value: 'Ada' },
    },
    notContains: {
      customer_name: { operator: 'notContains', type: 'text', value: 'zz' },
    },
    notEquals: {
      customer_name: { operator: 'notEquals', type: 'text', value: 'Ada' },
    },
    startsWith: {
      customer_name: { operator: 'startsWith', type: 'text', value: 'Ad' },
    },
  },
} as const satisfies EnterpriseOrderFilterContract;

/**
 * Every column-filter state the enterprise-order endpoints must accept, as the
 * `filter` query payloads a client actually sends.
 *
 * Reached through the `api-shared/filter-contract` subpath and deliberately not
 * the package barrel: both API servers import that barrel from `server.ts` and
 * run `node dist/server.js` with no bundler between them, so a barrel export
 * would build this object at every server start for the benefit of two test
 * suites.
 *
 * The filter shape is declared once as a type (`@lcabrera/ui` and
 * `@lcabrera/server`, held in step by ADR-039's conformance test, and aliased
 * by `enterpriseOrders.types.ts`) and twice as a request validator no type can
 * check: a Zod schema in `apps/api-server`, a JSON Schema in
 * `apps/api-server-fast`. Those two are guarded behaviourally instead — each
 * app asserts that every case here is accepted and maps to the query the React
 * Router route would have built from the same payload.
 *
 * The `drafting/*` cases are the ones that were broken (#567). A filter the
 * user is still editing has no value yet; `@lcabrera/server`'s mappers drop it
 * rather than reject it, but both request validators required a value, so a
 * table mid-keystroke got a 400 from the API servers and a page of rows from
 * the React Router route.
 */
export const ENTERPRISE_ORDER_FILTER_CONTRACT_CASES = Object.entries(
  CONTRACT,
).flatMap(([variant, cases]) =>
  Object.entries(cases).map(([caseName, filters]) => ({
    filters,
    name: `${variant}/${caseName}`,
  })),
);
