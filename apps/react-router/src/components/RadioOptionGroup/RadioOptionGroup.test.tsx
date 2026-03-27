// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RadioOptionGroup } from "./RadioOptionGroup.component.tsx";

afterEach(cleanup);

const options = [
  { label: "Option A", value: "a" },
  { label: "Option B", value: "b" },
  { description: "With description", label: "Option C", value: "c" },
] as const;

describe("RadioOptionGroup", () => {
  it("renders a radio for each option", () => {
    render(<RadioOptionGroup name="group" onChange={vi.fn()} options={[...options]} value="a" />);

    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks the matching option as checked", () => {
    render(<RadioOptionGroup name="group" onChange={vi.fn()} options={[...options]} value="b" />);

    expect(screen.getByRole<HTMLInputElement>("radio", { name: /Option B/i }).checked).toBe(true);
  });

  it("calls onChange with the selected value when a radio is clicked", () => {
    const handleChange = vi.fn();

    render(
      <RadioOptionGroup name="group" onChange={handleChange} options={[...options]} value="a" />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Option B/i }));

    expect(handleChange).toHaveBeenCalledWith("b");
  });

  it("renders description text when provided", () => {
    render(<RadioOptionGroup name="group" onChange={vi.fn()} options={[...options]} value="a" />);

    expect(screen.getByText("With description").textContent).toBe("With description");
  });
});
