import * as stylex from "@stylexjs/stylex";

import { Button } from "@/components/Button";
import { SortAscIcon, SortDescIcon } from "@/components/Icons";
import {
  SidePanelSection,
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from "@/components/SidePanel";
import { ICON_SIZE_MD } from "@/design-system/constants";

import type { SortingSectionProps } from "./SortingSection.types.ts";

import { useSetColumnSorting } from "../ColumnDrawerContext/actions/index.ts";
import { useGetColumnSorting } from "../ColumnDrawerContext/selectors/index.ts";
import { styles } from "./SortingSection.stylex.ts";
import { SortingSectionToolbar } from "./SortingSectionToolbar/index.ts";

export const SortingSection = (_props: SortingSectionProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();

  const handleAsc = () => {
    setColumnSorting(sortDirection === "asc" ? undefined : "asc");
  };

  const handleDesc = () => {
    setColumnSorting(sortDirection === "desc" ? undefined : "desc");
  };

  return (
    <SidePanelSectionMain>
      <SidePanelSection>
        <SidePanelSectionHeader
          title="Column Sorting"
          toolbar={<SortingSectionToolbar variant="toolbar" />}
        />
        <div {...stylex.props(styles.list)}>
          <Button
            color={sortDirection === "asc" ? "primary" : "outline"}
            icon={<SortAscIcon size={ICON_SIZE_MD} />}
            onClick={handleAsc}
            size="sm"
            width="full"
          >
            Ascending
          </Button>
          <Button
            color={sortDirection === "desc" ? "primary" : "outline"}
            icon={<SortDescIcon size={ICON_SIZE_MD} />}
            onClick={handleDesc}
            size="sm"
            width="full"
          >
            Descending
          </Button>
        </div>
      </SidePanelSection>
      <SortingSectionToolbar />
    </SidePanelSectionMain>
  );
};
