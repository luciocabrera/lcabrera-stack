import type { TrendMark } from './EvalsSubjectTrend.types';
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
  const changes = points.flatMap((point, index): TrendMark[] => {
    const previous = points[index - 1];

    if (previous === undefined) {
      return [];
    }

    return [
      ...(previous.contentHashes.join(',') === point.contentHashes.join(',')
        ? []
        : [
            {
              href: point.href,
              key: `content-${point.key}`,
              kind: 'content' as const,
              label: `Content hash changed to ${point.contentHashes.map((hash) => hash.slice(0, 12)).join(' and ')}`,
              pointLabel: point.label,
              startedAt: point.startedAt,
            },
          ]),
      ...(previous.modelId === point.modelId
        ? []
        : [
            {
              href: point.href,
              key: `model-${point.key}`,
              kind: 'model' as const,
              label: `Model changed from ${previous.modelId ?? 'none'} to ${point.modelId ?? 'none'}`,
              pointLabel: point.label,
              startedAt: point.startedAt,
            },
          ]),
    ];
  });
  const notes = annotations.flatMap((annotation): TrendMark[] => {
    const point = points.find(({ startedAt }) => startedAt >= annotation.at);

    return point === undefined
      ? []
      : [
          {
            href: point.href,
            key: `annotation-${annotation.annotationId}`,
            kind: 'annotation',
            label: `${annotation.kind} annotation, ${annotation.at.slice(0, 10)}`,
            pointLabel: point.label,
            startedAt: point.startedAt,
          },
        ];
  });

  return [...changes, ...notes];
};
