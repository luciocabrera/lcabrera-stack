/**
 * The markup every icon rendered before it moved onto IconBase, captured with
 * its default props and with the overrides the test passes. Attributes are
 * sorted by name, so the comparison ignores the order they were written in.
 */
export const capturedIconMarkup = {
  BarChartIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line></svg>',
  },
  CheckIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="10" viewBox="0 0 10 10" width="10" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 5.5L4 8L8.5 2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 10 10" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 5.5L4 8L8.5 2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  CollapseAllIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M11 6h10"></path><path d="M11 12h10"></path><path d="M11 18h10"></path><path d="M3 5l3 3 3-3"></path><path d="M3 12h6"></path><path d="M3 19l3-3 3 3"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M11 6h10"></path><path d="M11 12h10"></path><path d="M11 18h10"></path><path d="M3 5l3 3 3-3"></path><path d="M3 12h6"></path><path d="M3 19l3-3 3 3"></path></svg>',
  },
  ColumnsOrderIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><rect fill="currentColor" height="6" rx="1" width="3" x="1.5" y="8"></rect><rect fill="currentColor" height="9" rx="1" width="3" x="6.5" y="5"></rect><rect fill="currentColor" height="12" rx="1" width="3" x="11.5" y="2"></rect><path d="M2 3L14 3" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path><path d="M11.5 1L14 3L11.5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><rect fill="currentColor" height="6" rx="1" width="3" x="1.5" y="8"></rect><rect fill="currentColor" height="9" rx="1" width="3" x="6.5" y="5"></rect><rect fill="currentColor" height="12" rx="1" width="3" x="11.5" y="2"></rect><path d="M2 3L14 3" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path><path d="M11.5 1L14 3L11.5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  CopyIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><rect height="13" rx="2" width="13" x="9" y="9"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><rect height="13" rx="2" width="13" x="9" y="9"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  },
  DisclosureIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><polyline points="9 6 15 12 9 18"></polyline></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><polyline points="9 6 15 12 9 18"></polyline></svg>',
  },
  EraserIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 3.5L12.5 2.5C13.05 1.95 13.95 1.95 14.5 2.5V2.5C15.05 3.05 15.05 3.95 14.5 4.5L13.5 5.5M11.5 3.5L5.5 9.5L3 12L1.5 14.5H6L7.5 12L13.5 5.5M11.5 3.5L13.5 5.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M5.5 9.5L7.5 11.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 3.5L12.5 2.5C13.05 1.95 13.95 1.95 14.5 2.5V2.5C15.05 3.05 15.05 3.95 14.5 4.5L13.5 5.5M11.5 3.5L5.5 9.5L3 12L1.5 14.5H6L7.5 12L13.5 5.5M11.5 3.5L13.5 5.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M5.5 9.5L7.5 11.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  ErrorIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>',
  },
  ExpandAllIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M11 6h10"></path><path d="M11 12h10"></path><path d="M11 18h10"></path><path d="M3 4l3 3 3-3"></path><path d="M3 10l3 3 3-3"></path><path d="M3 16l3 3 3-3"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M11 6h10"></path><path d="M11 12h10"></path><path d="M11 18h10"></path><path d="M3 4l3 3 3-3"></path><path d="M3 10l3 3 3-3"></path><path d="M3 16l3 3 3-3"></path></svg>',
  },
  EyeIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  },
  EyeOffIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M2 2l20 20"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 7 11 7a9.74 9.74 0 0 0 5.39-1.61"></path><path d="M2 2l20 20"></path></svg>',
  },
  FileTextIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
  },
  FilterIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M2 4H14M4 8H12M6 12H10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  GroupRowsIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18"></path><path d="M7 10h14"></path><path d="M7 14h14"></path><path d="M3 19h18"></path><path d="M3 5v14"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18"></path><path d="M7 10h14"></path><path d="M7 14h14"></path><path d="M3 19h18"></path><path d="M3 5v14"></path></svg>',
  },
  HomeIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
  },
  InfoIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>',
  },
  ListAllIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path></svg>',
  },
  ListCheckedIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M10 6h11"></path><path d="M10 12h11"></path><path d="M10 18h11"></path><path d="M3 6l2 2 4-4"></path><path d="M3 12l2 2 4-4"></path><path d="M3 18l2 2 4-4"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M10 6h11"></path><path d="M10 12h11"></path><path d="M10 18h11"></path><path d="M3 6l2 2 4-4"></path><path d="M3 12l2 2 4-4"></path><path d="M3 18l2 2 4-4"></path></svg>',
  },
  ListOrderedIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M6 3.5H14M6 8H14M6 12.5H14" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="5.5">1</text><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="10">2</text><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="14.5">3</text></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 3.5H14M6 8H14M6 12.5H14" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"></path><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="5.5">1</text><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="10">2</text><text fill="currentColor" font-size="5" font-weight="bold" text-anchor="middle" x="3" y="14.5">3</text></svg>',
  },
  ListUncheckedIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M10 6h11"></path><path d="M10 12h11"></path><path d="M10 18h11"></path><rect height="5" rx="1" width="5" x="3" y="3.5"></rect><rect height="5" rx="1" width="5" x="3" y="9.5"></rect><rect height="5" rx="1" width="5" x="3" y="15.5"></rect></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M10 6h11"></path><path d="M10 12h11"></path><path d="M10 18h11"></path><rect height="5" rx="1" width="5" x="3" y="3.5"></rect><rect height="5" rx="1" width="5" x="3" y="9.5"></rect><rect height="5" rx="1" width="5" x="3" y="15.5"></rect></svg>',
  },
  LockIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><rect height="11" rx="2" ry="2" width="18" x="3" y="11"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
  },
  MaximizeIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L2 6M2 6H6M2 6V2M10 14L14 10M14 10H10M14 10V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L2 6M2 6H6M2 6V2M10 14L14 10M14 10H10M14 10V14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  MenuCloseIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
  },
  MenuIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><line x1="4" x2="20" y1="12" y2="12"></line><line x1="4" x2="20" y1="6" y2="6"></line><line x1="4" x2="20" y1="18" y2="18"></line></svg>',
  },
  MinimizeIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L14 2M14 2H10M14 2V6M6 10L2 14M2 14H6M2 14L2 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M10 6L14 2M14 2H10M14 2V6M6 10L2 14M2 14H6M2 14L2 10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  MoreVerticalIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="2" fill="currentColor" r="1"></circle><circle cx="6" cy="6" fill="currentColor" r="1"></circle><circle cx="6" cy="10" fill="currentColor" r="1"></circle></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 12 12" width="32" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="2" fill="currentColor" r="1"></circle><circle cx="6" cy="6" fill="currentColor" r="1"></circle><circle cx="6" cy="10" fill="currentColor" r="1"></circle></svg>',
  },
  PinIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></svg>',
  },
  PinLeftIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(20 12 12)"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></g></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(20 12 12)"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></g></svg>',
  },
  PinOffIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l20 20"></path><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7"></path><path d="M15 6a1 1 0 0 0 1-1 2 2 0 0 0-4-2"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l20 20"></path><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7"></path><path d="M15 6a1 1 0 0 0 1-1 2 2 0 0 0-4-2"></path></svg>',
  },
  PinRightIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-20 12 12)"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></g></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><g transform="rotate(-20 12 12)"><path d="M12 17v5"></path><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"></path></g></svg>',
  },
  PlusIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><line x1="12" x2="12" y1="5" y2="19"></line><line x1="5" x2="19" y1="12" y2="12"></line></svg>',
  },
  RefreshIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M2 8C2 4.69 4.69 2 8 2C10.21 2 12.1 3.26 13.08 5.08M14 8C14 11.31 11.31 14 8 14C5.79 14 3.9 12.74 2.92 10.92" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M13 2V5.08H9.92" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M3 14V10.92H6.08" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 16 16" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M2 8C2 4.69 4.69 2 8 2C10.21 2 12.1 3.26 13.08 5.08M14 8C14 11.31 11.31 14 8 14C5.79 14 3.9 12.74 2.92 10.92" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M13 2V5.08H9.92" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path><path d="M3 14V10.92H6.08" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></path></svg>',
  },
  SettingsIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  },
  SortAscIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L10 8H2L6 3Z" fill="currentColor"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 12 12" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L10 8H2L6 3Z" fill="currentColor"></path></svg>',
  },
  SortClearIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.3"></path><path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.3"></path><line stroke="currentColor" stroke-linecap="round" stroke-width="1.5" x1="2.5" x2="9.5" y1="9.5" y2="2.5"></line></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 12 12" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.3"></path><path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.3"></path><line stroke="currentColor" stroke-linecap="round" stroke-width="1.5" x1="2.5" x2="9.5" y1="9.5" y2="2.5"></line></svg>',
  },
  SortDescIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L2 4H10L6 9Z" fill="currentColor"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 12 12" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L2 4H10L6 9Z" fill="currentColor"></path></svg>',
  },
  SortNeutralIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.5"></path><path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.5"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-width="3" viewBox="0 0 12 12" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M6 2L9 5H3L6 2Z" fill="currentColor" opacity="0.5"></path><path d="M6 10L3 7H9L6 10Z" fill="currentColor" opacity="0.5"></path></svg>',
  },
  SuccessIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>',
  },
  UngroupRowsIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18"></path><path d="M7 10h14"></path><path d="M7 14h14"></path><path d="M3 19h18"></path><path d="M3 5v14"></path><path d="M20 4L4 20"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M3 5h18"></path><path d="M7 10h14"></path><path d="M7 14h14"></path><path d="M3 19h18"></path><path d="M3 5v14"></path><path d="M20 4L4 20"></path></svg>',
  },
  UserIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
  },
  WarningIcon: {
    default:
      '<svg aria-hidden="true" fill="none" height="24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>',
    overridden:
      '<svg aria-hidden="true" class="icon-probe" fill="none" height="32" stroke="red" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>',
  },
};
