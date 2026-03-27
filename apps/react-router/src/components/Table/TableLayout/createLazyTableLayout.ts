import { type ComponentType, lazy } from "react";

import type { TableLayoutProps } from "./TableLayout.types.ts";

/**
 * Creates a lazily-loaded, type-safe TableLayout component.
 *
 * The returned component defers loading the 168 KB Table bundle from the
 * critical hydration path. With SSR, the server still renders the full HTML
 * synchronously; on the client, React 19 selective hydration keeps the
 * server HTML visible while the chunk loads asynchronously.
 *
 * Call this **once at module scope** per route to avoid recreating the
 * lazy wrapper on every render.
 *
 * @example
 * ```ts
 * const TableLayout = createLazyTableLayout<Order, OrdersResponse>();
 * ```
 */
export const createLazyTableLayout = <
  TData extends Record<string, unknown>,
  TResponse = Record<string, unknown>,
>() =>
  lazy(() =>
    import("./TableLayout.component.tsx").then((m) => ({
      default: m.TableLayout as unknown as ComponentType<TableLayoutProps<TData, TResponse>>,
    })),
  );
