// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SidePanelSection } from "./SidePanelSection.component.tsx";

describe("SidePanelSection", () => {
  it("renders children inside a div with data-testid='side-panel-section'", () => {
    render(
      <SidePanelSection>
        <p>Section content</p>
      </SidePanelSection>,
    );

    expect(screen.getByTestId("side-panel-section").textContent).toContain("Section content");
  });
});
