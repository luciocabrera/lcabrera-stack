import type { ReactNode } from 'react';

import * as stylex from '@stylexjs/stylex';

import { Tag } from '@repo/ui/components/Tag';

import type { VirtualSelectTriggerProps } from '../VirtualSelectTrigger.types';

import { styles } from '../VirtualSelectTrigger.stylex';

type RenderTriggerContentArgs = Pick<
  VirtualSelectTriggerProps,
  | 'mode'
  | 'onRemoveTag'
  | 'overflowCount'
  | 'placeholder'
  | 'selected'
  | 'visibleTags'
> & {
  readonly hasSelection: boolean;
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
