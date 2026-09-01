import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { TabsHeaderProps } from './TabsHeader.types';
import type { SetTabRefArgs } from './TabsHeaderButton/TabsHeaderButton.types';

import { styles } from './TabsHeader.stylex';
import { TabsHeaderButton } from './TabsHeaderButton/TabsHeaderButton.component';
import { TabsHeaderScrollButton } from './TabsHeaderScrollButton/TabsHeaderScrollButton.component';
import { useTabsHeaderScroll } from './useTabsHeaderScroll.hook';
import { getNewIndex } from './utils/getNewIndex.util';
import { scrollTabIntoView } from './utils/scrollTabIntoView.util';

export const TabsHeader = ({
  activeTab,
  isBusy,
  onSelectTab,
  tabs,
}: TabsHeaderProps) => {
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);
  const {
    hasEndOverflow,
    hasStartOverflow,
    listRef,
    scrollByDirection,
    viewportRef,
  } = useTabsHeaderScroll({ tabCount: tabs.length });

  const setTabRef = ({ element, tabKey }: SetTabRefArgs) => {
    tabRefs.current.set(tabKey, element);
  };

  useEffect(() => {
    scrollTabIntoView({
      tab: tabRefs.current.get(activeTab),
      viewport: viewportRef.current,
    });
  }, [activeTab, viewportRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isBusy || tabs.length === 0) return;

    const newIndexResult = getNewIndex({
      activeIndex,
      key: event.key,
      tabsLength: tabs.length,
    });

    if (!newIndexResult) {
      return;
    }

    const { currentIndex, newIndex } = newIndexResult;

    const newTab = tabs[newIndex];

    if (newIndex !== currentIndex && newTab) {
      onSelectTab(newTab.key);
      tabRefs.current.get(newTab.key)?.focus();
      event.preventDefault();
    }
  };

  return (
    <div {...stylex.props(styles.header)}>
      {Boolean(hasStartOverflow) && (
        <TabsHeaderScrollButton
          direction='start'
          onScroll={scrollByDirection}
        />
      )}
      <div ref={viewportRef} {...stylex.props(styles.viewport)}>
        <div
          ref={listRef}
          {...stylex.props(styles.tabList)}
          aria-label='Settings tabs'
          role='tablist'
        >
          {tabs.map((tab) => (
            <TabsHeaderButton
              activeTab={activeTab}
              isBusy={isBusy}
              key={tab.key}
              onKeyDown={handleKeyDown}
              onSelectTab={onSelectTab}
              setTabRef={setTabRef}
              tab={tab}
            />
          ))}
        </div>
      </div>
      {Boolean(hasEndOverflow) && (
        <TabsHeaderScrollButton direction='end' onScroll={scrollByDirection} />
      )}
    </div>
  );
};
