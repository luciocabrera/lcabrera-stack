import type { IconProps } from '../Icons.types';

/**
 * The chevron a tree node is opened and closed by.
 *
 * It points **right** at rest and is rotated to point down by the call site
 * rather than being drawn twice, so the two states are one shape at two angles
 * — which is what lets the rotation be animated, and what stops the open and
 * closed icons drifting apart.
 */
export const DisclosureIcon = ({ size = 24, ...props }: IconProps) => (
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
  >
    <polyline points='9 6 15 12 9 18' />
  </svg>
);
