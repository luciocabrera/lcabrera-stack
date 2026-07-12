/** Returns the accessible label for the expand / collapse button. */
export const resolveExpandButtonLabel = (isExpanded: boolean) => {
  if (isExpanded) {
    return 'Collapse navigation';
  }

  return 'Expand navigation';
};
