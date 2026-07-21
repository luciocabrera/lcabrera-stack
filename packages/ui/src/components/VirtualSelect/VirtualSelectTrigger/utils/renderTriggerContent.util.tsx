import type { ReactNode } from 'react';

import { Tag } from '@lcabrera/ui/components/Tag';
import * as stylex from '@stylexjs/stylex';

import type { VirtualSelectMode } from '../../VirtualSelect.types';

import { styles } from '../VirtualSelectTrigger.stylex';

type RenderTriggerContentArgs = {
  readonly hasSelection: boolean;
  readonly mode: VirtualSelectMode;
  readonly onRemoveTag: (option: string) => void;
  readonly overflowCount: number;
  readonly placeholder: string;
  readonly selected: readonly string[];
  readonly visibleTags: readonly string[];
};

export const renderTriggerContent = ({
  hasSelection,
  mode,
  onRemoveTag,
  overflowCount,
  placeholder,
  selected,
  visibleTags,
}: RenderTriggerContentArgs): ReactNode => {
  if (!hasSelection) {
    return (
      <span {...stylex.props(styles.triggerPlaceholder)}>{placeholder}</span>
    );
  }

  if (mode === 'single') {
    return (
      <span {...stylex.props(styles.triggerLabel)}>
        {visibleTags[0] ?? selected[0]}
      </span>
    );
  }

  return (
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
  );
};
