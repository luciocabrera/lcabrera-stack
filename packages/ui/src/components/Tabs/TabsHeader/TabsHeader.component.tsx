import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { TabsHeaderProps } from './TabsHeader.types';
import type { SetTabRefArgs } from './TabsHeaderButton/TabsHeaderButton.types';

import { styles } from './TabsHeader.stylex';
import { TabsHeaderButton } from './TabsHeaderButton/TabsHeaderButton.component';
import { getNewIndex } from './utils/getNewIndex.util';

/**
 * Tab strip with roving-tabindex keyboard navigation (ArrowLeft/ArrowRight/Home/End).
 * Owns the tab button refs so keyboard navigation can move focus imperatively.
 */
export const TabsHeader = ({
  activeTab,
  isBusy,
  onSelectTab,
  tabs,
}: TabsHeaderProps) => {
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);

  const setTabRef = ({ element, tabKey }: SetTabRefArgs) => {
    tabRefs.current.set(tabKey, element);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
    <div aria-label='Settings tabs' onKeyDown={handleKeyDown} role='tablist'>
      <div {...stylex.props(styles.tabList)}>
        {tabs.map((tab) => (
          <TabsHeaderButton
            activeTab={activeTab}
            isBusy={isBusy}
            key={tab.key}
            onSelectTab={onSelectTab}
            setTabRef={setTabRef}
            tab={tab}
          />
        ))}
      </div>
    </div>
  );
};
