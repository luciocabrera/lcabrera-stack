/** Returns the accessible label for the pin / unpin button. */
export const resolvePinButtonLabel = (isPinned: boolean) => {
  if (isPinned) {
    return 'Unpin navigation';
  }

  return 'Pin navigation';
};
