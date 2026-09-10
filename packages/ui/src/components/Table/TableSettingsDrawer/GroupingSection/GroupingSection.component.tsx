import type { TabItem } from '#ui/components/Tabs';

import { SidePanelSectionMain } from '#ui/components/SidePanel';
import { Tabs } from '#ui/components/Tabs';

import type { GroupingSectionProps } from './GroupingSection.types';

import {
  AdvancedSettingsSection,
  useHasAdvancedSettings,
} from './AdvancedSettingsSection';
import { AggregatesSubsection } from './AggregatesSubsection';
import {
  GROUPING_SUBTAB_KEYS,
  GROUPING_SUBTAB_LABEL,
} from './GroupingSection.constants';
import { GroupingSectionToolbar } from './GroupingSectionToolbar';
import { GroupKeysSubsection } from './GroupKeysSubsection';

export const GroupingSection = ({ isBusy = false }: GroupingSectionProps) => {
  const hasAdvancedSettings = useHasAdvancedSettings();

  const advancedTabs: TabItem[] = hasAdvancedSettings
    ? [
        {
          children: <AdvancedSettingsSection isBusy={isBusy} />,
          hasPadding: false,
          header: 'Advanced',
          key: GROUPING_SUBTAB_KEYS.advanced,
        },
      ]
    : [];

  const tabs: TabItem[] = [
    {
      children: <GroupKeysSubsection isBusy={isBusy} />,
      hasPadding: false,
      header: 'Group Keys',
      key: GROUPING_SUBTAB_KEYS.keys,
    },
    {
      children: <AggregatesSubsection isBusy={isBusy} />,
      hasPadding: false,
      header: 'Aggregates',
      key: GROUPING_SUBTAB_KEYS.aggregates,
    },
    ...advancedTabs,
  ];

  return (
    <SidePanelSectionMain>
      <Tabs
        defaultSelectedTab={GROUPING_SUBTAB_KEYS.keys}
        isBusy={isBusy}
        label={GROUPING_SUBTAB_LABEL}
        tabs={tabs}
      />
      <GroupingSectionToolbar isBusy={isBusy} />
    </SidePanelSectionMain>
  );
};
