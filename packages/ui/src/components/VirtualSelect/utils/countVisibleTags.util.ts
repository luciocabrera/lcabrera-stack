import { isTrailingTriggerChild } from './isTrailingTriggerChild.util';

export type CountVisibleTagsArgs = {
  readonly totalCount: number;
  readonly trigger: HTMLElement;
};

export const countVisibleTags = ({
  totalCount,
  trigger,
}: CountVisibleTagsArgs) => {
  const children = [...trigger.children] as HTMLElement[];
  const trailingElements = children.filter((child) =>
    isTrailingTriggerChild(child),
  );
  const tagElements = children.filter(
    (child) => !isTrailingTriggerChild(child),
  );
  const [firstTag] = tagElements;
  const firstRowTop = firstTag?.offsetTop;
  const firstRowBottom = firstTag
    ? firstTag.offsetTop + firstTag.offsetHeight
    : 0;

  let fittingCount = 0;
  for (const tag of tagElements) {
    if (tag.offsetTop !== firstRowTop) break;
    fittingCount++;
  }

  if (fittingCount >= totalCount) return totalCount;

  const isSettled =
    fittingCount === tagElements.length &&
    trailingElements.every((child) => child.offsetTop < firstRowBottom);

  return isSettled ? fittingCount : Math.max(1, fittingCount - 1);
};
