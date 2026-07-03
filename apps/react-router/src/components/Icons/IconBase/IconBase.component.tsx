import type { IconProps } from '../Icons.types';

/**
 * Shared SVG wrapper for the 24×24 stroke icon family.
 * Renders the standard svg attributes and forwards children (paths/shapes).
 * @param props - Icon size and any svg element props (including children).
 */
export const IconBase = ({ size = 24, ...props }: IconProps) => (
  <svg
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
