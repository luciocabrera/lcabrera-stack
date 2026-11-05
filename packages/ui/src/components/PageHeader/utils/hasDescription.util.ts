import type { ReactNode } from 'react';

export const hasDescription = (description: ReactNode) =>
  description !== undefined &&
  description !== null &&
  typeof description !== 'boolean' &&
  description !== '';
