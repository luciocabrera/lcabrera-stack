type GetNewIndexArgs = {
  readonly activeIndex: number;
  readonly key: string;
  readonly tabsLength: number;
};

/**
 * Resolves the next focused tab index for roving-tabindex keyboard navigation.
 */
export const getNewIndex = ({
  activeIndex,
  key,
  tabsLength,
}: GetNewIndexArgs) => {
  if (tabsLength === 0) {
    return;
  }

  const currentIndex = activeIndex === -1 ? 0 : activeIndex;

  switch (key) {
    case 'ArrowLeft': {
      return {
        currentIndex,
        newIndex: (currentIndex - 1 + tabsLength) % tabsLength,
      };
    }
    case 'ArrowRight': {
      return { currentIndex, newIndex: (currentIndex + 1) % tabsLength };
    }
    case 'End': {
      return { currentIndex, newIndex: tabsLength - 1 };
    }
    case 'Home': {
      return { currentIndex, newIndex: 0 };
    }
    default: {
      return;
    }
  }
};
