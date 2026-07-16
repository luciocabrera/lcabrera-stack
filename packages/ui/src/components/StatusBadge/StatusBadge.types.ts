export type StatusBadgeProps = {
  readonly label: string;
  readonly tone: StatusBadgeTone;
};

export type StatusBadgeTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';
