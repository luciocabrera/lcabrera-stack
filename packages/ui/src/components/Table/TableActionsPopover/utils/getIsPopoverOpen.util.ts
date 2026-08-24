type PopoverCandidate = {
  readonly matches: (selectors: string) => boolean;
};

export const getIsPopoverOpen = (element: PopoverCandidate) =>
  element.matches(':popover-open');
