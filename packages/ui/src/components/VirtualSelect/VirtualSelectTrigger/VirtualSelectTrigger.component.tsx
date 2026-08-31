import { useVirtualSelectTrigger } from './hooks/useVirtualSelectTrigger.hook';
import { assignTriggerRef, getTriggerStyleProps } from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

export const VirtualSelectTrigger = () => {
  const {
    chevron,
    content,
    isBusy,
    isOpen,
    listboxId,
    mode,
    shouldUseDivTrigger,
    toggleDropdown,
    triggerRef,
  } = useVirtualSelectTrigger();

  if (shouldUseDivTrigger) {
    return (
      <VirtualSelectDivTrigger triggerRef={triggerRef}>
        {content}
        {chevron}
      </VirtualSelectDivTrigger>
    );
  }

  return (
    <button
      aria-controls={listboxId}
      aria-disabled={isBusy}
      aria-expanded={isOpen}
      aria-haspopup='listbox'
      disabled={isBusy}
      onClick={isBusy ? undefined : toggleDropdown}
      ref={(node) => {
        assignTriggerRef({ node, triggerRef });
      }}
      type='button'
      {...getTriggerStyleProps({ isBusy, isOpen, mode })}
    >
      {content}
      {chevron}
    </button>
  );
};
