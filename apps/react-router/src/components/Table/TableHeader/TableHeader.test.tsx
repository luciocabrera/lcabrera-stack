// @vitest-environment jsdom

import type { ReactNode } from "react";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const {
  MockTableHeaderCell,
  MockTableRow,
  useGetColumnGroupsMock,
  useGetPinnedColumnOffsetsMock,
  useGetTableIsLoadingMock,
  useGetTableIsLoadingMoreMock,
  useRenderTrackerMock,
} = vi.hoisted(() => ({
  MockTableHeaderCell: vi.fn(({ columnKey }: { readonly columnKey: string }) => (
    <th>Col:{columnKey}</th>
  )),
  MockTableRow: vi.fn(({ children }: { readonly children: ReactNode }) => <tr>{children}</tr>),
  useGetColumnGroupsMock: vi.fn(),
  useGetPinnedColumnOffsetsMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsLoadingMoreMock: vi.fn(),
  useRenderTrackerMock: vi.fn(),
}));

vi.mock("@/components/Table/contexts/TableConfig/columns/selectors", () => ({
  useGetColumnGroups: useGetColumnGroupsMock,
  useGetPinnedColumnOffsets: useGetPinnedColumnOffsetsMock,
}));

vi.mock("@/components/Table/contexts/TableData/data/selectors", () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableIsLoadingMore: useGetTableIsLoadingMoreMock,
}));

vi.mock("@/utils/performance", () => ({
  useRenderTracker: useRenderTrackerMock,
}));

vi.mock("../TableHeaderCell", () => ({
  TableHeaderCell: MockTableHeaderCell,
}));

vi.mock("../TableRow", () => ({
  TableRow: MockTableRow,
}));

import { TableHeader } from "./TableHeader.component.tsx";

afterEach(cleanup);

describe("TableHeader", () => {
  it("renders a thead element with data-testid", () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    const columns = [
      { key: "name", label: "Name" },
      { key: "age", label: "Age" },
    ];
    useGetColumnGroupsMock.mockReturnValue({
      centerCols: columns,
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetPinnedColumnOffsetsMock.mockReturnValue({});

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByTestId("table-header").tagName).toBe("THEAD");
    expect(screen.getByText("Col:name").textContent).toBe("Col:name");
    expect(screen.getByText("Col:age").textContent).toBe("Col:age");
  });

  it("renders all center columns", () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    const columns = [{ key: "name", label: "Name" }];
    useGetColumnGroupsMock.mockReturnValue({
      centerCols: columns,
      leftPinnedCols: [],
      rightPinnedCols: [],
    });
    useGetPinnedColumnOffsetsMock.mockReturnValue({});

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByText("Col:name").textContent).toBe("Col:name");
  });

  it("renders pinned columns", () => {
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableIsLoadingMoreMock.mockReturnValue(false);
    const leftCol = { key: "id", label: "ID" };
    const centerCols = [{ key: "name", label: "Name" }];
    useGetColumnGroupsMock.mockReturnValue({
      centerCols,
      leftPinnedCols: [leftCol],
      rightPinnedCols: [],
    });
    useGetPinnedColumnOffsetsMock.mockReturnValue({});

    render(
      <table>
        <TableHeader />
      </table>,
    );

    expect(screen.getByText("Col:id").textContent).toBe("Col:id");
    expect(screen.getAllByText("Col:name")[0]?.textContent).toBe("Col:name");
  });
});
