import type { KeyboardEvent } from 'react';

export const handleDivTriggerKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  onToggle: () => void,
) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  onToggle();
};
