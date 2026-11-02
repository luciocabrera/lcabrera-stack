export type ColorChannel = {
  readonly isPercent: boolean;
  readonly number: number;
};

export type ColorMatrix = readonly [Rgb, Rgb, Rgb];

export type CompiledStylexRule = {
  readonly className: string;
  readonly property: string;
  readonly pseudo: string;
  readonly value: string;
};

export type Rgb = readonly [number, number, number];

export type Rgba = {
  readonly alpha: number;
  readonly rgb: Rgb;
};

export type ThemeName = 'dark' | 'light';
