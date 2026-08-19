/**
 * Props for the "Expand All Groups" item of the grouping section.
 *
 * No `columnKey`, for `ClearGroupingButton`'s reason: expansion is one
 * whole-table state, so the column whose menu happens to be open takes no part
 * in the question.
 */
export type ExpandAllGroupsButtonProps = {
  readonly onClose: () => void;
};
