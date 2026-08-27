/**
 * Props for the fold-one-level block of the grouping section.
 * It takes a `columnKey` where the whole-table fold pair does not: this block folds the
 * level *this* column states, so the column whose menu is open decides both what the items
 * do and whether they appear at all.
 */
export type GroupLevelActionsProps = {
  readonly columnKey: string;
  readonly onClose: () => void;
};
