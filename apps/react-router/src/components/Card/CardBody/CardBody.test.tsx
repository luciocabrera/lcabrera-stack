// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardBody } from "./CardBody.component.tsx";

describe("CardBody", () => {
  it("renders children inside a div with data-testid='card-body'", () => {
    render(
      <CardBody>
        <p>Body content</p>
      </CardBody>,
    );

    expect(screen.getByTestId("card-body").textContent).toContain("Body content");
  });
});
