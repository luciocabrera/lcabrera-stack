/**
 * Props for the "Clear Grouping" item of the grouping section.
 *
 * Deliberately no `columnKey`: clearing is a whole-table action, so it must not
 * depend on the column whose menu is open. Its sibling `GroupByColumnButton`
 * takes one because it groups *by* that column.
 */
export type ClearGroupingButtonProps = {
  readonly onClose: () => void;
};
