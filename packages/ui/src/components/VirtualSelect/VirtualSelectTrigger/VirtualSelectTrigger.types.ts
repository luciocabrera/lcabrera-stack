import type { RefObject } from 'react';

/**
 * Mutable ref to the rendered trigger element (button or div) — created by
 * the trigger, assigned by `assignTriggerRef`, and measured by the
 * tag-overflow hook.
 */
export type VirtualSelectTriggerRef = RefObject<
  HTMLButtonElement | HTMLDivElement | null | undefined
>;
