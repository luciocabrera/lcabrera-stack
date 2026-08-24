export const resolveExpandButtonLabel = (isExpanded: boolean) => {
  if (isExpanded) {
    return 'Collapse navigation';
  }

  return 'Expand navigation';
};
