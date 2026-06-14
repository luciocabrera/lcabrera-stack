import type { KeyboardEvent } from 'react';

import * as stylex from '@stylexjs/stylex';
import { Activity, useRef, useState } from 'react';

import type { TabsProps } from './Tabs.types';

import { styles } from './Tabs.stylex';

export const Tabs = ({
  defaultSelectedTab,
  onSelectTab,
  selectedTab,
  tabs,
  ...props
}: TabsProps) => {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(
    defaultSelectedTab ?? tabs[0]?.key ?? '',
  );
  const isControlled = selectedTab !== undefined;
  const activeTab = isControlled ? selectedTab : uncontrolledActiveTab;
  const tabRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const activeIndex = tabs.findIndex((tab) => tab.key === activeTab);

  const setActiveTab = (nextActiveTab: string) => {
    if (!isControlled) {
      setUncontrolledActiveTab(nextActiveTab);
    }
    onSelectTab?.(nextActiveTab);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (tabs.length === 0) return;

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
      setActiveTab(newTab.key);
      tabRefs.current.get(newTab.key)?.focus();
      event.preventDefault();
    }
  };

  return (
    <div {...stylex.props(styles.container)} {...props}>
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
              id={`tab-${tab.key}`}
              onClick={() => {
                setActiveTab(tab.key);
              }}
              role='tab'
              tabIndex={activeTab === tab.key ? 0 : -1}
              type='button'
            >
              {tab.header}
            </button>
          ))}
        </div>
      </div>
      <div {...stylex.props(styles.tabContent)}>
        {tabs.map((tab) => (
          <Activity
            key={tab.key}
            mode={activeTab === tab.key ? 'visible' : 'hidden'}
          >
            <div
              {...stylex.props(styles.tabPanel)}
              aria-labelledby={`tab-${tab.key}`}
              id={`tabpanel-${tab.key}`}
              role='tabpanel'
              tabIndex={0}
            >
              {tab.children}
            </div>
          </Activity>
        ))}
      </div>
    </div>
  );
};
