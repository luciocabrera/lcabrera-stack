import type { TableAggregateFn } from '#ui/components/Table/Table.types';

import {
  BarChartIcon,
  EraserIcon,
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
 * One aggregation-mode command per aggregate, keyed by the function it applies.
 *
 * A `Record` closed over `TableAggregateFn` rather than a list, so a member
 * added to the vocabulary is a compile error here instead of a function the
 * catalogue offers and the menu cannot render. Which of them a given column is
 * *offered* is a different question, answered per column from the capability
 * the loader shipped — this map is only what each command is.
 *
 * They share one icon on purpose: the label is what tells an average from a
 * sum, and eight near-identical glyphs would tell nothing.
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
 * The clear half of the aggregation-mode set — `deriveToggleCommandState`'s
 * `target: undefined`, exactly as `CLEAR_SORTING_COMMAND` is for directions.
 *
 * Unlike `CLEAR_GROUPING_COMMAND` this **is** a column command: an aggregate
 * belongs to one column, so clearing it asks about that column and no other.
 */
export const CLEAR_COLUMN_AGGREGATE_COMMAND = {
  icon: EraserIcon,
  id: 'column.aggregate.clear' as CommandId,
  label: 'No Aggregate',
} satisfies CommandDescriptor;
