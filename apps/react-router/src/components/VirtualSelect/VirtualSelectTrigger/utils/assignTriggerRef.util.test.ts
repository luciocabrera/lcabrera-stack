// @vitest-environment jsdom

import type { RefObject } from 'react';

import { describe, expect, it } from 'vitest';

import { assignTriggerRef } from './assignTriggerRef.util';

describe('assignTriggerRef', () => {
  it('assigns the provided node to the trigger ref', () => {
    const triggerRef = {
      current: null,
    } as RefObject<HTMLButtonElement | HTMLDivElement | null>;
    const node = document.createElement('button');

    assignTriggerRef({ node, triggerRef });

    expect(triggerRef.current).toBe(node);
  });
});
