type GetShouldApplyCellFocusArgs = {
  readonly activeElement: Element | null | undefined;
  readonly cell: Element;
};

export const getShouldApplyCellFocus = ({
  activeElement,
  cell,
}: GetShouldApplyCellFocusArgs) => {
  if (!activeElement || activeElement === cell.ownerDocument.body) {
    return true;
  }

  return (
    cell.closest('[role="grid"],[role="treegrid"]')?.contains(activeElement) ??
    false
  );
};
