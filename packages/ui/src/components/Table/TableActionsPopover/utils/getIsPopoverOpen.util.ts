type PopoverCandidate = {
  readonly matches: (selectors: string) => boolean;
};

/**
 * Checks whether an element is currently shown as a popover — `:popover-open`
 * matches only while the Popover API has the element open.
 */
export const getIsPopoverOpen = (element: PopoverCandidate) =>
  element.matches(':popover-open');
