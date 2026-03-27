// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableTitle } from "./TableTitle.component.tsx";

const { useGetTableTitleMock } = vi.hoisted(() => ({
  useGetTableTitleMock: vi.fn(),
}));

vi.mock("../contexts/TableConfig/meta/selectors", () => ({
  useGetTableTitle: useGetTableTitleMock,
}));

describe("TableTitle", () => {
  it("renders nothing when title, icon, and actions are all missing", () => {
    useGetTableTitleMock.mockReturnValue("");

    const { container } = render(<TableTitle />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the title from selector", () => {
    useGetTableTitleMock.mockReturnValue("Enterprise Orders");

    render(<TableTitle />);

    const heading = screen.getByRole("heading", { name: "Enterprise Orders" });
    expect(heading.tagName).toBe("H2");
  });

  it("renders icon and actions slots when provided", () => {
    useGetTableTitleMock.mockReturnValue("");

    render(
      <TableTitle actions={<button type="button">Refresh</button>} icon={<span>Icon</span>} />,
    );

    expect(screen.getByText("Icon").textContent).toBe("Icon");
    expect(screen.getByRole("button", { name: "Refresh" }).tagName).toBe("BUTTON");
  });
});
