// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SidePanelFooter } from "./SidePanelFooter.component.tsx";

describe("SidePanelFooter", () => {
  it("renders children inside a div with data-testid='side-panel-footer'", () => {
    render(
      <SidePanelFooter>
        <button>Save</button>
      </SidePanelFooter>,
    );

    expect(screen.getByTestId("side-panel-footer").textContent).toContain("Save");
  });
});
