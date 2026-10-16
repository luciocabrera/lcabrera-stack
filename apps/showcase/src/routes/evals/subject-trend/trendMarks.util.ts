import type { TrendChartMark } from '../TrendChart';
import type { trendPoints } from './trendPoints.util';

type TrendMarksArgs = {
  readonly annotations: readonly {
    readonly annotationId: string;
    readonly at: string;
    readonly kind: string;
  }[];
  readonly points: readonly (Omit<
    ReturnType<typeof trendPoints>[number],
    'contentHashes'
  > & { readonly contentHashes: readonly string[] })[];
};

export const trendMarks = ({ annotations, points }: TrendMarksArgs) => {
  const changes = points.flatMap((point, index): TrendChartMark[] => {
    const previous = points[index - 1];

    if (previous === undefined) {
      return [];
    }

    return [
      ...(previous.contentHashes.join(',') === point.contentHashes.join(',')
        ? []
        : [
            {
              index,
              key: `content-${point.key}`,
              kind: 'content' as const,
              label: `Content hash changed to ${point.contentHashes.map((hash) => hash.slice(0, 12)).join(' and ')}`,
            },
          ]),
      ...(previous.modelId === point.modelId
        ? []
        : [
            {
              index,
              key: `model-${point.key}`,
              kind: 'model' as const,
              label: `Model changed from ${previous.modelId ?? 'none'} to ${point.modelId ?? 'none'}`,
            },
          ]),
    ];
  });
  const notes = annotations
    .map((annotation) => ({
      index: points.findIndex(({ startedAt }) => startedAt >= annotation.at),
      key: `annotation-${annotation.annotationId}`,
      kind: 'annotation' as const,
      label: `${annotation.kind} annotation, ${annotation.at.slice(0, 10)}`,
    }))
    .filter(({ index }) => index >= 0);

  return [...changes, ...notes];
};
