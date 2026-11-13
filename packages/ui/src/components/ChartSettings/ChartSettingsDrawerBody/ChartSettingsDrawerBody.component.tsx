import { useId } from 'react';

import {
  SidePanelBody,
  SidePanelSection,
  SidePanelSectionMain,
} from '#ui/components/SidePanel';

import { ChartChoiceSection } from '../ChartChoiceSection/ChartChoiceSection.component';
import { ChartToggleSection } from '../ChartToggleSection/ChartToggleSection.component';
import { useStageChartSettings } from '../contexts/actions';
import { useGetChartSettingsDraft } from '../contexts/selectors';
import { toChartChoicePatch } from '../utils/toChartChoicePatch.util';
import { toChartChoiceSections } from '../utils/toChartChoiceSections.util';
import { toChartToggles } from '../utils/toChartToggles.util';

export const ChartSettingsDrawerBody = () => {
  const draft = useGetChartSettingsDraft();
  const stageChartSettings = useStageChartSettings();
  const name = useId();

  return (
    <SidePanelBody>
      <SidePanelSection>
        <SidePanelSectionMain>
          {toChartChoiceSections(draft).map(
            ({ key, options, title, value }) => (
              <ChartChoiceSection
                key={key}
                name={`${name}-${key}`}
                onChange={(next) => {
                  stageChartSettings(toChartChoicePatch({ key, value: next }));
                }}
                options={options}
                title={title}
                value={value}
              />
            ),
          )}
          <ChartToggleSection
            title='Show'
            toggles={toChartToggles(draft).map((toggle) => ({
              ...toggle,
              onChange: (isChecked: boolean) => {
                stageChartSettings({ [toggle.key]: isChecked });
              },
            }))}
          />
        </SidePanelSectionMain>
      </SidePanelSection>
    </SidePanelBody>
  );
};
