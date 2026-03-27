// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useToogleTableIsColumnSettingsOpen } from "./useToogleTableIsColumnSettingsOpen.hook.ts";
import { useToogleTableIsTableSettingsOpen } from "./useToogleTableIsTableSettingsOpen.hook.ts";

const { getMetaState, mockUseTableConfigContextValue, setMetaState } = vi.hoisted(() => {
  let metaState = {
    isColumnSettingsOpen: false,
    isTableSettingsOpen: false,
  };

  const mockMetaStore = {
    get: vi.fn(() => metaState),
    set: vi.fn((value: Record<string, unknown>) => {
      metaState = { ...metaState, ...value };
    }),
  };

  return {
    getMetaState: () => metaState,
    mockUseTableConfigContextValue: () => ({
      metaStore: mockMetaStore,
    }),
    setMetaState: (nextState: typeof metaState) => {
      metaState = nextState;
    },
  };
});

vi.mock("../../useTableConfigContextValue.hook", () => ({
  useTableConfigContextValue: mockUseTableConfigContextValue,
}));

describe("table settings toggle hooks", () => {
  beforeEach(() => {
    setMetaState({
      isColumnSettingsOpen: false,
      isTableSettingsOpen: false,
    });
  });

  it("toggles table settings using the latest store snapshot", () => {
    const { result } = renderHook(() => useToogleTableIsTableSettingsOpen());

    act(() => {
      result.current();
      expect(getMetaState().isTableSettingsOpen).toBe(true);
      result.current();
    });

    expect(getMetaState().isTableSettingsOpen).toBe(false);
  });

  it("toggles column settings using the latest store snapshot", () => {
    const { result } = renderHook(() => useToogleTableIsColumnSettingsOpen());

    act(() => {
      result.current();
      expect(getMetaState().isColumnSettingsOpen).toBe(true);
      result.current();
    });

    expect(getMetaState().isColumnSettingsOpen).toBe(false);
  });
});
