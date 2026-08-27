/**
 * Props for the "Expand This Level" item of the grouping section.
 * A `columnKey`, unlike its whole-table neighbour: the level it opens is the one this
 * column states, so the item means something different in every column's menu.
 */
export type ExpandGroupLevelButtonProps = {
  readonly columnKey: string;
  readonly onClose: () => void;
};
