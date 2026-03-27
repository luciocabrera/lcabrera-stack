// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidePanel } from "./SidePanel.component.tsx";

// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedClose = HTMLDialogElement.prototype.close;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShow = HTMLDialogElement.prototype.show;
// eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
const savedShowModal = HTMLDialogElement.prototype.showModal;

afterEach(() => {
  HTMLDialogElement.prototype.close = savedClose;
  HTMLDialogElement.prototype.show = savedShow;
  HTMLDialogElement.prototype.showModal = savedShowModal;
  cleanup();
});

beforeEach(() => {
  HTMLDialogElement.prototype.close = vi.fn();
  HTMLDialogElement.prototype.show = vi.fn();
  HTMLDialogElement.prototype.showModal = vi.fn();
});

describe("SidePanel", () => {
  it("renders children content", () => {
    render(
      <SidePanel isOpen={false}>
        <span>Panel content</span>
      </SidePanel>,
    );
    expect(screen.getByText("Panel content").textContent).toBe("Panel content");
  });

  it("renders as aside element when isPinned is true", () => {
    render(
      <SidePanel isOpen isPinned>
        <span>Pinned content</span>
      </SidePanel>,
    );
    const panel = screen.getByTestId("side-panel");
    expect(panel.tagName).toBe("ASIDE");
    expect(panel.getAttribute("aria-label")).toBe("Settings panel");
  });

  it("renders as dialog element when not pinned", () => {
    render(
      <SidePanel isOpen={false}>
        <span>Dialog content</span>
      </SidePanel>,
    );
    const panel = screen.getByTestId("side-panel");
    expect(panel.tagName).toBe("DIALOG");
  });
});
