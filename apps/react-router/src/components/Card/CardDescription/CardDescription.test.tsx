// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardDescription } from "./CardDescription.component.tsx";

describe("CardDescription", () => {
  it("renders children inside a p element with data-testid='card-description'", () => {
    render(<CardDescription>Some description text</CardDescription>);

    const description = screen.getByTestId("card-description");
    expect(description.tagName).toBe("P");
    expect(description.textContent).toContain("Some description text");
  });
});
