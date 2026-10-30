import type {
  TrendPoint,
  TrendSparklineTone,
} from '#ui/components/TrendSparkline/TrendSparkline.types';

export type TrendSparklineDotProps = TrendPoint & {
  readonly cx: number;
  readonly cy: number;
  readonly tone: TrendSparklineTone;
};
