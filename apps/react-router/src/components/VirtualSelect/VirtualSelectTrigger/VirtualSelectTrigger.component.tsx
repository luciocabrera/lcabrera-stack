import * as stylex from "@stylexjs/stylex";

import { Tag } from "@/components/Tag";

import type { VirtualSelectTriggerProps } from "./VirtualSelectTrigger.types.ts";

import { styles } from "./VirtualSelectTrigger.stylex.ts";

export const VirtualSelectTrigger = ({
  isAlwaysOpen,
  isOpen,
  mode,
  onRemoveTag,
  onToggle,
  overflowCount,
  placeholder,
  selected,
  triggerRef,
  visibleTags,
}: VirtualSelectTriggerProps) => {
  const hasSelection = selected.length > 0;

  return (
    <div
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      onClick={isAlwaysOpen ? undefined : onToggle}
      ref={triggerRef}
      role="combobox"
      tabIndex={isAlwaysOpen ? undefined : 0}
      {...stylex.props(
        styles.trigger,
        isOpen && styles.triggerOpen,
        mode === "multi" && styles.triggerClamped,
        isAlwaysOpen && styles.triggerStatic,
      )}
    >
      {hasSelection ? (
        mode === "single" ? (
          <span {...stylex.props(styles.triggerLabel)}>{selected[0]}</span>
        ) : (
          <>
            {visibleTags.map((value) => (
              <Tag
                key={value}
                label={value}
                onRemove={() => {
                  onRemoveTag(value);
                }}
              />
            ))}
            {overflowCount > 0 && (
              <span data-overflow {...stylex.props(styles.overflowTag)}>
                +{overflowCount} more
              </span>
            )}
          </>
        )
      ) : (
        <span {...stylex.props(styles.triggerPlaceholder)}>{placeholder}</span>
      )}
      {!isAlwaysOpen && <span data-chevron {...stylex.props(styles.chevron(isOpen))} />}
    </div>
  );
};
