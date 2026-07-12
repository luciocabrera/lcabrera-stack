import type { KeyboardEvent, MouseEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { useRef } from 'react';

import type { TabsHeaderProps } from './TabsHeader.types';

import { busyStyles, styles } from './TabsHeader.stylex';

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (tabs.length === 0 || isBusy) return;

    let newIndex: number;
    const currentIndex = activeIndex === -1 ? 0 : activeIndex;

    switch (event.key) {
      case 'ArrowLeft': {
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      }
      case 'ArrowRight': {
        newIndex = (currentIndex + 1) % tabs.length;
        break;
      }
      case 'End': {
        newIndex = tabs.length - 1;
        break;
      }
      case 'Home': {
        newIndex = 0;
        break;
      }
      default: {
        return;
      }
    }

    const newTab = tabs[newIndex];

    if (newIndex !== currentIndex && newTab) {
      onSelectTab(newTab.key);
      tabRefs.current.get(newTab.key)?.focus();
      event.preventDefault();
    }
  };

  const handleTabSelect = (event: MouseEvent<HTMLButtonElement>) => {
    const key = event.currentTarget.dataset['tabKey'];
    if (key !== undefined) onSelectTab(key);
  };

  return (
    <div aria-label='Settings tabs' onKeyDown={handleKeyDown} role='tablist'>
      <div {...stylex.props(styles.tabList)}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => {
              tabRefs.current.set(tab.key, el);
            }}
            {...stylex.props(
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive,
            )}
            aria-controls={`tabpanel-${tab.key}`}
            aria-selected={activeTab === tab.key}
            data-tab-key={tab.key}
            disabled={isBusy}
            id={`tab-${tab.key}`}
            onClick={handleTabSelect}
            role='tab'
            tabIndex={activeTab === tab.key ? 0 : -1}
            type='button'
          >
            {tab.header}
            {isBusy && (
              <span {...stylex.props(busyStyles.overlay)}>
                <span {...stylex.props(busyStyles.wave)} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
