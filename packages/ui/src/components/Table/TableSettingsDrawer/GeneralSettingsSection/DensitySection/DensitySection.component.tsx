import { RadioOptionGroup } from '#ui/components/RadioOptionGroup';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useSetTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableDensity } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  TABLE_DENSITY_LABELS,
  TABLE_DENSITY_LEVELS,
  TABLE_DENSITY_ROW_HEIGHT,
} from '#ui/components/Table/Table.constants';

const SECTION_TITLE = 'Density';

const options = TABLE_DENSITY_LEVELS.map((value) => ({
  description: `${TABLE_DENSITY_ROW_HEIGHT[value]}px rows`,
  label: TABLE_DENSITY_LABELS[value],
  value,
}));

export const DensitySection = () => {
  const density = useGetTableDensity();
  const setDensity = useSetTableDensity();

  return (
    <SidePanelSection>
      <SidePanelSectionHeader title={SECTION_TITLE} />
      <div aria-label={SECTION_TITLE} role='radiogroup'>
        <RadioOptionGroup
          name='table-density'
          onChange={setDensity}
          options={options}
          value={density}
        />
      </div>
    </SidePanelSection>
  );
};
