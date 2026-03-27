// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InfoBox } from "./InfoBox.component.tsx";

describe("InfoBox", () => {
  it("renders children content", () => {
    render(
      <InfoBox>
        <p>Informational message</p>
      </InfoBox>,
    );

    expect(screen.getByText("Informational message").textContent).toBe("Informational message");
  });
});
