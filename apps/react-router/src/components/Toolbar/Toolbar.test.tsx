// @vitest-environment jsdom

import type { ReactNode } from "react";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toolbar } from "./Toolbar.component.tsx";

afterEach(() => {
  cleanup();
});

type MockButtonProps = {
  readonly children?: ReactNode;
  readonly onClick?: () => void;
};

type MockNavLinkProps = {
  readonly children?: ReactNode;
  readonly to?: string;
};

function MockButton({ children, onClick }: MockButtonProps) {
  return (
    <button onClick={onClick} type="button">
      {children}
    </button>
  );
}

function MockNavLink({ children, to }: MockNavLinkProps) {
  return <a href={to}>{children}</a>;
}

vi.mock("@/components/Button", () => ({
  Button: MockButton,
}));

vi.mock("@/components/NavLink", () => ({
  NavLink: MockNavLink,
}));

describe("Toolbar", () => {
  it("renders a navigation element", () => {
    render(<Toolbar items={[]} />);
    expect(screen.getByRole("navigation")).not.toBeNull();
  });

  it("renders button items", () => {
    const onClick = vi.fn();
    render(<Toolbar items={[{ label: "Refresh", onClick, type: "button" }]} />);
    const button = screen.getByRole("button", { name: "Refresh" });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders link items", () => {
    render(<Toolbar items={[{ label: "Home", to: "/home", type: "link" }]} />);
    expect(screen.getByText("Home").textContent).toBe("Home");
  });
});
