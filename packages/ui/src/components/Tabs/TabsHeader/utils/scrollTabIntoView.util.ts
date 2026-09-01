type ScrollTabIntoViewArgs = {
  readonly tab: HTMLElement | null | undefined;
  readonly viewport: HTMLElement | null | undefined;
};

export const scrollTabIntoView = ({ tab, viewport }: ScrollTabIntoViewArgs) => {
  if (!tab || !viewport) return;

  if (tab.offsetLeft < viewport.scrollLeft) {
    viewport.scrollLeft = tab.offsetLeft;
    return;
  }

  const end = tab.offsetLeft + tab.offsetWidth;

  if (end > viewport.scrollLeft + viewport.clientWidth) {
    viewport.scrollLeft = end - viewport.clientWidth;
  }
};
