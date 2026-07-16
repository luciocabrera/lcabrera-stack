import type { MouseEvent } from 'react';

import * as stylex from '@stylexjs/stylex';

import type { TabsHeaderButtonProps } from './TabsHeaderButton.types';

import { busyStyles, styles } from './TabsHeaderButton.stylex';

/**
 * Single tab button delegate for TabsHeader.
 */
export const TabsHeaderButton = ({
  activeTab,
  isBusy,
  onSelectTab,
  setTabRef,
  tab,
}: TabsHeaderButtonProps) => {
  const handleTabSelect = (event: MouseEvent<HTMLButtonElement>) => {
    const key = event.currentTarget.dataset['tabKey'];
    if (key !== undefined) onSelectTab(key);
  };

  return (
    <button
      ref={(element) => {
        setTabRef({ element, tabKey: tab.key });
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
  );
};
