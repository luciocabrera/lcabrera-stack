import { useVirtualSelectTrigger } from './hooks/useVirtualSelectTrigger.hook';
import { assignTriggerRef, getTriggerStyleProps } from './utils';
import { VirtualSelectDivTrigger } from './VirtualSelectDivTrigger/VirtualSelectDivTrigger.component';

/**
 * Combobox trigger: placeholder, single-value label, or tag chips with the
 * "+N more" overflow badge. Fully self-connected (zero props) — display
 * metadata comes from the select meta selectors, the selected labels from
 * the list data store, and interactions dispatch through the
 * toggle-dropdown/toggle-option actions. Owns the trigger ref + the
 * ResizeObserver-driven tag-overflow measurement.
 */
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
