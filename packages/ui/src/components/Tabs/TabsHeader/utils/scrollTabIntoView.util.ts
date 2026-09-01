type ScrollTabIntoViewArgs = {
  readonly tab: HTMLElement | null | undefined;
  readonly viewport: HTMLElement | null | undefined;
};

export const scrollTabIntoView = ({ tab, viewport }: ScrollTabIntoViewArgs) => {
  if (!tab || !viewport) return;

  const tabBox = tab.getBoundingClientRect();
  const viewportBox = viewport.getBoundingClientRect();

  if (tabBox.left < viewportBox.left) {
    viewport.scrollLeft += tabBox.left - viewportBox.left;
    return;
  }

  if (tabBox.right > viewportBox.right) {
    viewport.scrollLeft += tabBox.right - viewportBox.right;
  }
};
