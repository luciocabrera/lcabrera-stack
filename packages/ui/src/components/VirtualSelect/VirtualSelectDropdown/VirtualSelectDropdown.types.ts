export type AnchorRect = {
  readonly bottom: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
};

export type DropdownPlacement = {
  readonly left: number;
  readonly maxHeight: number;
  readonly side: 'above' | 'below';
  readonly top: number;
  readonly width: number;
};
