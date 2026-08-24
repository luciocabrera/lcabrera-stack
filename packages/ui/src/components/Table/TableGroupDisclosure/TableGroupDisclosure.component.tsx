import * as stylex from '@stylexjs/stylex';

import { DisclosureIcon } from '#ui/components/Icons';
import { useToggleTableGroupExpansion } from '#ui/components/Table/contexts/TableConfig/expansion/actions';

import type { TableGroupDisclosureProps } from './TableGroupDisclosure.types';

import { tableGroupDisclosureStyles } from './TableGroupDisclosure.stylex';

/**
 * The chevron a group row is opened and closed by, and the space it reserves on
 * rows that have nothing to open.
 *
 * **It is not a button, and that is the whole design.** ADR-062 gives the grid
 * a roving tab stop addressed by row key plus column key: exactly one element in
 * the entire grid is tabbable at a time. A `<button>` here would insert a second
 * tab stop inside a cell that already owns one, so tabbing through a grouped
 * body would alternate between cell and chevron and the roving model would stop
 * describing the grid. The treegrid pattern already answers this — expansion
 * state belongs to the **row**, as the `aria-expanded` `resolveTreeRowAriaProps`
 * puts there, and the chevron is a pointer affordance rather than a second
 * focus target.
 *
 * So it is `aria-hidden` and outside the tab order, and the keyboard path stays
 * the `ArrowRight`/`ArrowLeft` handling in `useMoveTableGridFocus`. A control
 * announced once as a row state and again as a button is the failure this
 * avoids, not an accessibility gap it accepts.
 *
 * `aria-hidden` carries that on its own — it removes this element **and its
 * subtree** from the accessibility tree, which a `role='presentation'` beside
 * it would not add to: that only strips an element's own semantics, and a
 * `span` has none to strip.
 *
 * **A row with nothing under it still renders the box, empty.** Without it the
 * labels of sibling rows would not line up, and indentation — the only thing
 * stating depth in this column — would read as noise.
 *
 * It wires its own toggle rather than taking a callback: the store is reachable
 * from here, and a parent that drilled one down would have to know which group
 * this row is, which is exactly what `path` already says.
 */
export const TableGroupDisclosure = ({
  disclosure,
  path,
}: TableGroupDisclosureProps) => {
  const toggleGroupExpansion = useToggleTableGroupExpansion();

  // A leaf group owns no loaded children, so it draws no chevron: its rows open
  // in their own route rather than under it (#870).
  if (disclosure?.hasChildren !== true) {
    return <span {...stylex.props(tableGroupDisclosureStyles.spacer)} />;
  }

  return (
    <span
      {...stylex.props(
        tableGroupDisclosureStyles.control,
        disclosure?.isExpanded === true && tableGroupDisclosureStyles.expanded,
      )}
      aria-hidden='true'
      data-expanded={disclosure?.isExpanded ?? false}
      data-testid='table-group-disclosure'
      onClick={() => toggleGroupExpansion(path)}
    >
      <DisclosureIcon size={12} />
    </span>
  );
};
