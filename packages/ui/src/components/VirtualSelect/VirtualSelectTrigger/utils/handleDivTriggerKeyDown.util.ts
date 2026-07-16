import type { KeyboardEvent } from 'react';

type HandleDivTriggerKeyDownArgs = {
  readonly event: KeyboardEvent<HTMLDivElement>;
  readonly onToggle: () => void;
};

export const handleDivTriggerKeyDown = ({
  event,
  onToggle,
}: HandleDivTriggerKeyDownArgs) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  event.preventDefault();
  onToggle();
};
