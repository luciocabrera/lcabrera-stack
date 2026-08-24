import * as stylex from '@stylexjs/stylex';
import { Activity } from 'react';

import type { TabsContentProps } from './TabsContent.types';

import { styles } from './TabsContent.stylex';

export const TabsContent = ({ activeTab, tabs }: TabsContentProps) => {
  return (
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
  );
};
