import { TRIGGER_MAX_HEIGHT } from '../VirtualSelect.stylex';

export type CountVisibleTagsArgs = {
  totalCount: number;
  trigger: HTMLDivElement;
};
/**
 * Counts how many tag children fit within height limit.
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

  return Math.max(fittingCount, Math.min(1, totalCount));
};
