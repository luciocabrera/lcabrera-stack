import { describe, expect, it } from 'vite-plus/test';

import { scaleLinear } from './scale-linear.util';

describe('scaleLinear', () => {
  it('maps the domain onto the range', () => {
    const scale = scaleLinear({ domain: [10, 20], range: [100, 200] });

    expect([scale(10), scale(15), scale(20)]).toEqual([100, 150, 200]);
  });

  it('maps onto an inverted range, as an SVG y axis needs', () => {
    const scale = scaleLinear({ domain: [0, 10], range: [50, 0] });

    expect([scale(0), scale(2), scale(10)]).toEqual([50, 40, 0]);
  });

  it('maps negative values', () => {
    const scale = scaleLinear({ domain: [-10, 10], range: [0, 100] });

    expect([scale(-10), scale(-5), scale(0)]).toEqual([0, 25, 50]);
  });

  it('extrapolates past an explicit domain unless it is clamped', () => {
    const scale = scaleLinear({ domain: [10, 20], range: [100, 200] });

    expect([scale(0), scale(30)]).toEqual([0, 300]);
  });

  it('holds a clamped value inside the range', () => {
    const scale = scaleLinear({
      domain: [10, 20],
      isClamped: true,
      range: [100, 200],
    });

    expect([scale(0), scale(15), scale(30)]).toEqual([100, 150, 200]);
  });

  it('places every value at the middle of the range when the domain is a single value', () => {
    const scale = scaleLinear({ domain: [5, 5], range: [10, 30] });

    expect([scale(5), scale(-1), scale(9)]).toEqual([20, 20, 20]);
  });
});
