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

export const GROUP_BY_COLUMN_COMMAND = {
  icon: GroupRowsIcon,
  id: 'column.group.by' as CommandId,
  label: 'Group by This',
} satisfies CommandDescriptor;

export const REMOVE_GROUP_KEY_COMMAND = {
  icon: EraserIcon,
  id: 'column.group.remove' as CommandId,
  label: 'Remove from Grouping',
} satisfies CommandDescriptor;

export const CLEAR_GROUPING_COMMAND = {
  icon: UngroupRowsIcon,
  id: 'column.group.clear' as CommandId,
  label: 'Clear Grouping',
} satisfies CommandDescriptor;

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

export const EXPAND_GROUP_LEVEL_COMMAND = {
  icon: ExpandAllIcon,
  id: 'column.group.expand.level' as CommandId,
  label: 'Expand This Level',
} satisfies CommandDescriptor;

export const COLLAPSE_GROUP_LEVEL_COMMAND = {
  icon: CollapseAllIcon,
  id: 'column.group.collapse.level' as CommandId,
  label: 'Collapse This Level',
} satisfies CommandDescriptor;

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

export const CLEAR_COLUMN_AGGREGATE_COMMAND = {
  icon: EraserIcon,
  id: 'column.aggregate.clear' as CommandId,
  label: 'No Aggregate',
} satisfies CommandDescriptor;
