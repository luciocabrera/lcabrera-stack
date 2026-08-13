import * as stylex from '@stylexjs/stylex';

import { GroupRowsIcon } from '#ui/components/Icons';
import { TABLE_GROUP_HIERARCHY_INDENT_PX } from '#ui/components/Table/Table.constants';

import type { TableGroupLabelProps } from './TableGroupLabel.types';

import { tableGroupLabelStyles } from './TableGroupLabel.stylex';
import { toGroupHierarchyLabel } from './utils/toGroupHierarchyLabel.util';

/**
 * A group row's cell content in the hierarchy column: its level, its label and
 * how many rows it covers.
 *
 * Everything about it is on **one line**, and that is a constraint rather than
 * a style choice: `TableRow` clamps `minHeight`/`maxHeight` to the store's
 * `rowHeight`, so a label allowed to wrap is not a taller row — it is a
 * silently clipped one, and `<tbody>`'s declared height stops matching what is
 * painted (ADR-065). The label ellipsizes instead, which is a truncation the
 * reader can see, and indentation narrows the text rather than the row.
 *
 * The row count stays here rather than aligning under a column, because
 * `count(*)` over the group is a property of the group and no column heads it.
 * A per-column `count` aggregate is a different thing and renders in its own
 * cell like every other aggregate.
 */
export const TableGroupLabel = ({ summary }: TableGroupLabelProps) => {
  const { depth, isSubtotal, text } = toGroupHierarchyLabel({ summary });

  return (
    <span
      {...stylex.props(
        tableGroupLabelStyles.container,
        tableGroupLabelStyles.indent(depth * TABLE_GROUP_HIERARCHY_INDENT_PX),
      )}
      data-testid='table-group-label'
    >
      <span {...stylex.props(tableGroupLabelStyles.icon)}>
        <GroupRowsIcon size={14} />
      </span>
      <span
        {...stylex.props(
          tableGroupLabelStyles.text,
          isSubtotal && tableGroupLabelStyles.subtotalText,
        )}
        title={text}
      >
        {text}
      </span>
      <span {...stylex.props(tableGroupLabelStyles.count)}>
        {`(${summary.count})`}
      </span>
    </span>
  );
};
