import * as stylex from "@stylexjs/stylex";

import { Button } from "@/components/Button";
import { ColumnsOrderIcon, EraserIcon, RefreshIcon } from "@/components/Icons";
import {
  useClearColumnOrderSection,
  useResetColumnOrderAndVisibility,
} from "@/components/Table/TableSettingsDrawer/TableDrawerContext/actions";
import {
  useGetColumnPinning,
  useGetColumnsSorting,
  useGetColumnVisibility,
} from "@/components/Table/TableSettingsDrawer/TableDrawerContext/selectors";
import { ICON_SIZE_MD, ICON_SIZE_SM } from "@/design-system/constants";

import type { ColumnOrderSectionToolbarProps } from "./ColumnOrderSectionToolbar.types.ts";

import { useOrderBySorting } from "../ColumnOrderSectionContext/actions/index.ts";
import { styles } from "./ColumnOrderSectionToolbar.stylex.ts";

export const ColumnOrderSectionToolbar = ({
  variant = "footer",
}: ColumnOrderSectionToolbarProps) => {
  const sorting = useGetColumnsSorting();
  const pinning = useGetColumnPinning();
  const visibility = useGetColumnVisibility();

  const orderBySorting = useOrderBySorting();
  const clearColumnOrderSection = useClearColumnOrderSection();
  const resetColumnOrderAndVisibility = useResetColumnOrderAndVisibility();

  const hasSorting = sorting.length > 0;
  const hasPinning = pinning.left.length > 0 || pinning.right.length > 0;
  const hasHiddenColumns = visibility instanceof Set && visibility.size > 0;
  const hasClearableState = hasPinning || hasHiddenColumns;

  const isToolbar = variant === "toolbar";
  const buttonColor = isToolbar ? "ghost" : "outline";
  const buttonSize = isToolbar ? "mini" : "sm";
  const buttonWidth = isToolbar ? "auto" : "full";
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label="Order by Sorting"
        color={buttonColor}
        icon={<ColumnsOrderIcon size={iconSize} />}
        isDisabled={!hasSorting}
        onClick={orderBySorting}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && "Order by Sorting"}
      </Button>
      <Button
        aria-label="Clear Visibility & Pinning"
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasClearableState}
        onClick={clearColumnOrderSection}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && "Clear Visibility & Pinning"}
      </Button>
      <Button
        aria-label="Reset Order & Visibility"
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnOrderAndVisibility}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && "Reset Order & Visibility"}
      </Button>
    </div>
  );
};
