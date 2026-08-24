import type { IconProps } from '../Icons.types';

/**
 * Icons are decorative by default (`aria-hidden`): every call site pairs one with an
 * accessible name of its own (a `Button` with `aria-label`, or visible adjacent text), so
 * announcing the icon too would duplicate that name.
 * The `{...props}` spread lands after, so a caller rendering an icon as meaningful
 * standalone content can override with `aria-hidden={false}` + `role='img'` + a label.
 */
export const IconBase = ({ size = 24, ...props }: IconProps) => (
  <svg
    aria-hidden='true'
    fill='none'
    height={size}
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width={size}
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  />
);
