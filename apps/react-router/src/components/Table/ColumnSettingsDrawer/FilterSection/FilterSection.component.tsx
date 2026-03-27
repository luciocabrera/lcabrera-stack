import * as stylex from "@stylexjs/stylex";

import { SidePanelSectionHeader, SidePanelSectionMain } from "@/components/SidePanel";

import type { FilterSectionProps } from "./FilterSection.types.ts";

import { FilterInputs } from "../../filters/FilterInputs/index.ts";
import { useSetColumnFilter } from "../ColumnDrawerContext/actions/index.ts";
import { useGetColumnFilter } from "../ColumnDrawerContext/selectors/index.ts";
import { styles } from "./FilterSection.stylex.ts";
import { FilterSectionToolbar } from "./FilterSectionToolbar/index.ts";

export const FilterSection = <TData,>({ columnKey }: FilterSectionProps<TData>) => {
  const columnFilter = useGetColumnFilter();
  const setColumnFilter = useSetColumnFilter();

  return (
    <SidePanelSectionMain>
      <div {...stylex.props(styles.section)}>
        <SidePanelSectionHeader
          title="Column Filter"
          toolbar={<FilterSectionToolbar variant="toolbar" />}
        />
        <FilterInputs
          columnKey={columnKey}
          filter={columnFilter}
          onChange={setColumnFilter}
          shouldFillHeight
        />
      </div>
      <FilterSectionToolbar />
    </SidePanelSectionMain>
  );
};
