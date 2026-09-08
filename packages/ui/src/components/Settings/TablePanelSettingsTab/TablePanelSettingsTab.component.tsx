import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { SectionCard } from '#ui/components/SectionCard';
import { TABLE_SETTINGS_TAB_ROLE_LABELS } from '#ui/components/Table/Table.constants';
import { resolveSettingsTabOrder } from '#ui/components/Table/utils/resolveSettingsTabOrder.util';

import { styles } from '../Settings.stylex';
import { useSetSettingsDraftField } from '../SettingsDraftContext/actions';
import { useGetSettingsDraft } from '../SettingsDraftContext/selectors';

export const TablePanelSettingsTab = () => {
  const draft = useGetSettingsDraft();
  const setSettingsDraftField = useSetSettingsDraftField();

  const handleOrderChange = (reorderedItems: DraggableItem[]) => {
    setSettingsDraftField({
      key: 'settingsTabOrder',
      value: resolveSettingsTabOrder(reorderedItems.map((item) => item.id)),
    });
  };

  const items: DraggableItem[] = draft.settingsTabOrder.map((role) => ({
    content: TABLE_SETTINGS_TAB_ROLE_LABELS[role],
    id: role,
  }));

  return (
    <div {...stylex.props(styles.tabSections)}>
      <SectionCard
        description='The order every table settings panel opens its tabs in. A table keeps its own order once someone drags one there.'
        title='Settings Tabs Order'
      >
        <div data-testid='table-panel-tabs-order'>
          <DraggableList items={items} onOrderChange={handleOrderChange} />
        </div>
      </SectionCard>
    </div>
  );
};
