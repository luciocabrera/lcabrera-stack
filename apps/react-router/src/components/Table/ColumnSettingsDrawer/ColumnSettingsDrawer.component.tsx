import { useState } from "react";

import type { TabItem } from "@/components/Tabs";

import { Button } from "@/components/Button";
import { SettingsIcon } from "@/components/Icons";
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from "@/components/SidePanel";
import { useGetNormalizedColumn } from "@/components/Table/contexts/TableConfig/columns/selectors";
import { useTableWrapperRef } from "@/components/Table/contexts/TableWrapper";
import { Tabs } from "@/components/Tabs";
import { ICON_SIZE_LG } from "@/design-system/constants";
import { useRenderTracker } from "@/utils/performance";

import type { ColumnSettingsDrawerProps } from "./ColumnSettingsDrawer.types.ts";

import {
  useBatchSetColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
} from "./ColumnDrawerContext/actions/index.ts";
import { DetailsSection } from "./DetailsSection/index.ts";
import { FilterSection } from "./FilterSection/index.ts";
import { GeneralSection } from "./GeneralSection/index.ts";
import { PinningSection } from "./PinningSection/index.ts";
import { SortingSection } from "./SortingSection/index.ts";

export const ColumnSettingsDrawer = <TData extends Record<string, unknown>>({
  columnKey,
}: ColumnSettingsDrawerProps<TData>) => {
  useRenderTracker({ componentName: `ColumnSettingsDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const wrapperRef = useTableWrapperRef();

  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const resetAllColumnDrawerSettings = useResetAllColumnDrawerSettings();

  const [isPinned, setIsPinned] = useState(false);

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;
  const isStatic = column.isStatic === true;

  const tabs: TabItem[] = [
    {
      children: <GeneralSection columnKey={columnKey} />,
      header: "General",
      key: "general",
    },
    ...(isFilterable && column.dataType
      ? [
          {
            children: <FilterSection columnKey={columnKey} />,
            header: "Filter",
            key: "filter",
          },
        ]
      : []),
    ...(isSortable
      ? [
          {
            children: <SortingSection />,
            header: "Sorting",
            key: "sorting",
          },
        ]
      : []),
    ...(isStatic
      ? []
      : [
          {
            children: <PinningSection columnKey={columnKey} />,
            header: "Pinning",
            key: "pinning",
          },
        ]),
    {
      children: <DetailsSection columnKey={columnKey} />,
      header: "Details",
      key: "details",
    },
  ];

  const handleAccept = () => {
    batchSetColumnDrawerSettings();

    if (isPinned) setIsPinned(false);
  };

  const handleCancel = () => {
    resetAllColumnDrawerSettings(true);

    if (isPinned) setIsPinned(false);
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      onClose={handleCancel}
      portalContainer={wrapperRef}
      position="right"
      size="md"
    >
      <SidePanelHeader
        actions={
          <SidePanelHeaderToolbar
            isPinned={isPinned}
            onClose={handleCancel}
            onTogglePin={handleTogglePin}
          />
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>{column.label}</SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button color="primary" onClick={handleAccept} size="sm">
          Accept
        </Button>
        <Button color="outline" onClick={handleCancel} size="sm">
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
