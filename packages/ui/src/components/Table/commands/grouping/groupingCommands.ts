import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import {
  BarChartIcon,
  CollapseAllIcon,
  EraserIcon,
  ExpandAllIcon,
  GroupRowsIcon,
  UngroupRowsIcon,
} from '#ui/components/Icons';
import { TABLE_AGGREGATE_LABELS } from '#ui/components/Table/Table.constants';

import type { CommandDescriptor, CommandId } from '../commands.types';

/**
 * The grouping capability's commands (ADR-011), the same shape as the pinning
 * and sorting sets. Grouping is a whole-table state expressed per column, so
 * both commands are still column commands: one names a key, the other removes
 * every key applied.
 */
export const GROUP_BY_COLUMN_COMMAND = {
  icon: GroupRowsIcon,
  id: 'column.group.by' as CommandId,
  label: 'Group by This',
} satisfies CommandDescriptor;

export const CLEAR_GROUPING_COMMAND = {
  icon: UngroupRowsIcon,
  id: 'column.group.clear' as CommandId,
  label: 'Clear Grouping',
} satisfies CommandDescriptor;

/**
 * Whole-table commands like `CLEAR_GROUPING_COMMAND`, and named for the state they produce
 * rather than the act — "Expand All Groups" says where the grid ends up, which is what a
 * menu item has to say when the same item is offered from every column.
 * They carry no `column.` prefix in their ids for the same reason: the two above are
 * column commands whose *effect* is table-wide, while these are asked of the grouped body
 * itself and no column takes part in the question.
 */
export const EXPAND_ALL_GROUPS_COMMAND = {
  icon: ExpandAllIcon,
  id: 'group.expand.all' as CommandId,
  label: 'Expand All Groups',
} satisfies CommandDescriptor;

export const COLLAPSE_ALL_GROUPS_COMMAND = {
  icon: CollapseAllIcon,
  id: 'group.collapse.all' as CommandId,
  label: 'Collapse All Groups',
} satisfies CommandDescriptor;

/**
 * A `Record` closed over `TableAggregateFn` rather than a list, so a member added to the
 * vocabulary is a compile error here instead of a function the catalogue offers and the
 * menu cannot render.
 */
export const AGGREGATE_COMMANDS: Record<TableAggregateFn, CommandDescriptor> = {
  avg: {
    icon: BarChartIcon,
    id: 'column.aggregate.avg' as CommandId,
    label: TABLE_AGGREGATE_LABELS.avg,
  },
  boolAnd: {
    icon: BarChartIcon,
    id: 'column.aggregate.boolAnd' as CommandId,
    label: TABLE_AGGREGATE_LABELS.boolAnd,
  },
  boolOr: {
    icon: BarChartIcon,
    id: 'column.aggregate.boolOr' as CommandId,
    label: TABLE_AGGREGATE_LABELS.boolOr,
  },
  count: {
    icon: BarChartIcon,
    id: 'column.aggregate.count' as CommandId,
    label: TABLE_AGGREGATE_LABELS.count,
  },
  countDistinct: {
    icon: BarChartIcon,
    id: 'column.aggregate.countDistinct' as CommandId,
    label: TABLE_AGGREGATE_LABELS.countDistinct,
  },
  max: {
    icon: BarChartIcon,
    id: 'column.aggregate.max' as CommandId,
    label: TABLE_AGGREGATE_LABELS.max,
  },
  min: {
    icon: BarChartIcon,
    id: 'column.aggregate.min' as CommandId,
    label: TABLE_AGGREGATE_LABELS.min,
  },
  sum: {
    icon: BarChartIcon,
    id: 'column.aggregate.sum' as CommandId,
    label: TABLE_AGGREGATE_LABELS.sum,
  },
};

/**
 * The clear half of the aggregation-mode set — `deriveToggleCommandState`'s `target:
 * undefined`, exactly as `CLEAR_SORTING_COMMAND` is for directions.
 * Unlike `CLEAR_GROUPING_COMMAND` this **is** a column command: an aggregate belongs to
 * one column, so clearing it asks about that column and no other.
 */
export const CLEAR_COLUMN_AGGREGATE_COMMAND = {
  icon: EraserIcon,
  id: 'column.aggregate.clear' as CommandId,
  label: 'No Aggregate',
} satisfies CommandDescriptor;
