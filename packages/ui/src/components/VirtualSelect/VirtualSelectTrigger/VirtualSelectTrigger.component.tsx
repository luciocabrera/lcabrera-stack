import { useVirtualSelectTrigger } from './hooks/useVirtualSelectTrigger.hook';
import { assignTriggerRef, getTriggerStyleProps } from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

/**
 * Combobox trigger: placeholder, single-value label, or tag chips with the "+N more"
 * overflow badge.
 * Owns the trigger ref + the ResizeObserver-driven tag-overflow measurement.
 */
export const VirtualSelectTrigger = () => {
  const {
    chevron,
    content,
    isInert,
    isOpen,
    listboxId,
    mode,
    shouldUseDivTrigger,
    toggleDropdown,
    triggerRef,
  } = useVirtualSelectTrigger();

  // VirtualSelectDivTrigger owns both div variants (static isAlwaysOpen and
  // interactive tag mode). The <button> branch stays separate for native
  // semantics.
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
      aria-disabled={isInert}
      aria-expanded={isOpen}
      aria-haspopup='listbox'
      disabled={isInert}
      onClick={isInert ? undefined : toggleDropdown}
      ref={(node) => {
        assignTriggerRef({ node, triggerRef });
      }}
      type='button'
      {...getTriggerStyleProps({ isInert, isOpen, mode })}
    >
      {content}
      {chevron}
    </button>
  );
};
