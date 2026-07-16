import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { TabsProps } from './Tabs.types';

import { styles } from './Tabs.stylex';
import { TabsContent } from './TabsContent/TabsContent.component';
import { TabsHeader } from './TabsHeader/TabsHeader.component';

export const Tabs = ({
  defaultSelectedTab,
  isBusy = false,
  onSelectTab,
  selectedTab,
  tabs,
  ...props
}: TabsProps) => {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState(
    defaultSelectedTab ?? tabs[0]?.key ?? '',
  );
  const isControlled = selectedTab !== undefined;
  const requestedActiveTab = isControlled ? selectedTab : uncontrolledActiveTab;
  const hasRequestedTab = tabs.some((tab) => tab.key === requestedActiveTab);
  const activeTab = hasRequestedTab ? requestedActiveTab : (tabs[0]?.key ?? '');

  const handleSelectTab = (nextActiveTab: string) => {
    if (isBusy) {
      return;
    }

    if (!isControlled) {
      setUncontrolledActiveTab(nextActiveTab);
    }
    onSelectTab?.(nextActiveTab);
  };

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <TabsHeader
        activeTab={activeTab}
        isBusy={isBusy}
        onSelectTab={handleSelectTab}
        tabs={tabs}
      />
      <TabsContent activeTab={activeTab} tabs={tabs} />
    </div>
  );
};
