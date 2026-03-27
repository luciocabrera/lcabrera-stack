// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DetailsSection } from "./DetailsSection.component.tsx";

const { useGetNormalizedColumnMock } = vi.hoisted(() => ({
  useGetNormalizedColumnMock: vi.fn(),
}));

vi.mock("@/components/Table/contexts/TableConfig/columns/selectors", () => ({
  useGetNormalizedColumn: useGetNormalizedColumnMock,
}));

afterEach(() => {
  cleanup();
});

describe("DetailsSection", () => {
  it("renders column metadata values", () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: "number",
      isFilterable: true,
      isSortable: false,
      key: "revenue",
      label: "Revenue",
      maxWidth: 400,
      minWidth: 120,
      sortDirection: "desc",
    });

    render(<DetailsSection columnKey="revenue" />);

    expect(screen.getByText("Label").textContent).toBe("Label");
    expect(screen.getByText("Revenue").textContent).toBe("Revenue");
    expect(screen.getByText("Key").textContent).toBe("Key");
    expect(screen.getByText("revenue").textContent).toBe("revenue");
    expect(screen.getByText("Data Type").textContent).toBe("Data Type");
    expect(screen.getByText("number").textContent).toBe("number");
    expect(screen.getByText("Sortable").textContent).toBe("Sortable");
    expect(screen.getByText("No").textContent).toBe("No");
    expect(screen.getByText("Filterable").textContent).toBe("Filterable");
    expect(screen.getByText("Yes").textContent).toBe("Yes");
    expect(screen.getByText("Sort Direction").textContent).toBe("Sort Direction");
    expect(screen.getByText("desc").textContent).toBe("desc");
    expect(screen.getByText("Min Width").textContent).toBe("Min Width");
    expect(screen.getByText("120px").textContent).toBe("120px");
    expect(screen.getByText("Max Width").textContent).toBe("Max Width");
    expect(screen.getByText("400px").textContent).toBe("400px");
  });

  it("renders fallbacks for optional fields", () => {
    useGetNormalizedColumnMock.mockReturnValue({
      dataType: undefined,
      isFilterable: undefined,
      isSortable: undefined,
      key: "status",
      label: "Status",
      maxWidth: undefined,
      minWidth: undefined,
      sortDirection: undefined,
    });

    render(<DetailsSection columnKey="status" />);

    expect(screen.getAllByText("—")).toHaveLength(3);
    expect(screen.getByText("None").textContent).toBe("None");
  });
});
