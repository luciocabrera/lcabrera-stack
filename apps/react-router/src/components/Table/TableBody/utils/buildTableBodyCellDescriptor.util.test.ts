import { describe, expect, it } from "vitest";

import type {
  ColumnSizingState,
  DataKey,
  PinnedColumnInfo,
  TableColumn,
} from "@/components/Table/Table.types";

import { DEFAULT_MIN_COLUMN_WIDTH } from "@/components/Table/Table.constants";

import { buildTableBodyCellDescriptor } from "./buildTableBodyCellDescriptor.util.ts";

type Row = {
  readonly amount?: number;
  readonly name?: string;
};

type RowKey = DataKey<Row>;

describe("buildTableBodyCellDescriptor", () => {
  it("builds a default descriptor with column value", () => {
    const col: TableColumn<Row> = {
      dataType: "number",
      key: "amount",
      label: "Amount",
      minWidth: 120,
    };
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing: {} as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
      rowData: { amount: 42 },
    });

    expect(descriptor).toEqual({
      dataType: "number",
      format: undefined,
      key: "amount",
      kind: "default",
      label: "Amount",
      minWidth: 120,
      pinInfo: undefined,
      value: 42,
      width: 120,
    });
  });

  it("builds a custom descriptor with empty label", () => {
    const col: TableColumn<Row> = {
      key: "name",
      label: "Name",
      render: () => "custom",
    };
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing: { name: 180 } as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {} as Record<RowKey, PinnedColumnInfo>,
      rowData: { name: "A" },
    });

    expect(descriptor).toEqual({
      children: "custom",
      key: "name",
      kind: "custom",
      label: "",
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
      pinInfo: undefined,
      width: 180,
    });
  });

  it("uses pinned offsets and empty string when row value is missing", () => {
    const col: TableColumn<Row> = {
      key: "name",
      label: "Name",
      minWidth: 90,
    };
    const pinInfo: PinnedColumnInfo = {
      isFirstPinnedRight: false,
      isLastPinnedLeft: true,
      offset: 24,
      side: "left",
    };
    const descriptor = buildTableBodyCellDescriptor({
      col,
      columnSizing: {} as ColumnSizingState<Row>,
      isLoadingState: false,
      pinnedOffsets: {
        name: pinInfo,
      } as Record<RowKey, PinnedColumnInfo>,
      rowData: {},
    });

    expect(descriptor).toEqual({
      dataType: undefined,
      format: undefined,
      key: "name",
      kind: "default",
      label: "Name",
      minWidth: 90,
      pinInfo,
      value: "",
      width: 90,
    });
  });
});
