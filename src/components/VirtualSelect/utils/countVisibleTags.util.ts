import { TRIGGER_MAX_HEIGHT } from '../VirtualSelectTrigger';

export type CountVisibleTagsArgs = {
  totalCount: number;
  trigger: HTMLDivElement;
};
/**
 * Counts how many tag children fit within height limit.
 * Reserves 1 slot for the overflow indicator when not all tags fit.
 * Always shows at least 1 tag when items are selected.
 */
export const countVisibleTags = ({
  totalCount,
  trigger,
}: CountVisibleTagsArgs) => {
  const children = [...trigger.children] as HTMLElement[];
  const tagElements = children.filter(
    (child) => !child.dataset.chevron && !child.dataset.overflow,
  );

  let fittingCount = 0;
  for (const tag of tagElements) {
    if (tag.offsetTop + tag.offsetHeight <= TRIGGER_MAX_HEIGHT) {
      fittingCount++;
    } else {
      break;
    }
  }

  const overflow = totalCount - fittingCount;

  if (overflow > 0) {
    // Reserve 1 slot for the "+N more" tag, but always show at least 1
    return Math.max(1, fittingCount - 1);
  }

  return fittingCount;
};
