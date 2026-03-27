// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SidePanelTitle } from "./SidePanelTitle.component.tsx";

afterEach(cleanup);

describe("SidePanelTitle", () => {
  it("renders children inside an h2", () => {
    render(<SidePanelTitle>Panel Title</SidePanelTitle>);

    const title = screen.getByTestId("side-panel-title");
    expect(title.tagName).toBe("H2");
    expect(title.textContent).toContain("Panel Title");
  });

  it("renders icon slot when provided", () => {
    render(
      <SidePanelTitle icon={<span data-testid="title-icon">🔔</span>}>Panel Title</SidePanelTitle>,
    );

    expect(screen.getByTestId("title-icon")).not.toBeNull();
  });
});
