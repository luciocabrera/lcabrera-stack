import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useSetTableSettingsTabOrder } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsTabOrder } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { TABLE_SETTINGS_TAB_ROLE_LABELS } from '#ui/components/Table/Table.constants';
import { resolveSettingsTabOrder } from '#ui/components/Table/utils/resolveSettingsTabOrder.util';

import type { TabsOrderSectionProps } from './TabsOrderSection.types';

import { styles } from './TabsOrderSection.stylex';

export const TabsOrderSection = ({ isBusy = false }: TabsOrderSectionProps) => {
  const storedOrder = useGetTableSettingsTabOrder();
  const setTabOrder = useSetTableSettingsTabOrder();

  const handleOrderChange = (reorderedItems: DraggableItem[]) => {
    setTabOrder(resolveSettingsTabOrder(reorderedItems.map((item) => item.id)));
  };

  const items: DraggableItem[] = resolveSettingsTabOrder(storedOrder).map(
    (role) => ({
      content: TABLE_SETTINGS_TAB_ROLE_LABELS[role],
      id: role,
    }),
  );

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title='Tabs order' />
      <div {...stylex.props(styles.tabList)} data-testid='tabs-order-section'>
        <DraggableList
          isBusy={isBusy}
          items={items}
          onOrderChange={handleOrderChange}
        />
      </div>
    </SidePanelSection>
  );
};
