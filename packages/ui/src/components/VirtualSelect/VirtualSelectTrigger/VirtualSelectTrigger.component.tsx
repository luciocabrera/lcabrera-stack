import { useTriggerStyleProps } from './hooks/useTriggerStyleProps.hook';
import { useVirtualSelectTrigger } from './hooks/useVirtualSelectTrigger.hook';
import { assignTriggerRef } from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

export const VirtualSelectTrigger = () => {
  const {
    chevron,
    content,
    isInert,
    isOpen,
    labelProps,
    listboxId,
    shouldUseDivTrigger,
    shouldUseTagButtons,
    toggleDropdown,
    triggerRef,
  } = useVirtualSelectTrigger();
  const buttonStyleProps = useTriggerStyleProps({
    hasTags: false,
    isStatic: false,
  });

  if (shouldUseDivTrigger) {
    return (
      <VirtualSelectDivTrigger
        hasTags={shouldUseTagButtons}
        triggerRef={triggerRef}
      >
        {content}
        {chevron}
      </VirtualSelectDivTrigger>
    );
  }

  return (
    <button
      aria-controls={listboxId}
      aria-disabled={isInert}
      aria-expanded={isOpen}
      aria-haspopup='listbox'
      disabled={isInert}
      onClick={isInert ? undefined : toggleDropdown}
      ref={(node) => {
        assignTriggerRef({ node, triggerRef });
      }}
      type='button'
      {...labelProps}
      {...buttonStyleProps}
    >
      {content}
      {chevron}
    </button>
  );
};
