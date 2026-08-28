/**
 * Props for the "Collapse This Level" item of the grouping section.
 * A `columnKey`, unlike its whole-table neighbour: the level it folds away is the one this
 * column states, so the item means something different in every column's menu.
 */
export type CollapseGroupLevelButtonProps = {
  readonly columnKey: string;
  readonly onClose: () => void;
};
