export type NavigationHeaderActionsProps = {
  readonly controlButtonSize: 'md' | 'mini' | 'sm';
  readonly controlIconSize: number;
  readonly controlTooltipPlacement: 'right' | undefined;
  readonly isCollapsed: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
};
