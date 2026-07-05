export type StatusBadgeTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';

export type StatusBadgeProps = {
  readonly label: string;
  readonly tone: StatusBadgeTone;
};
