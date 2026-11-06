import { describe, expect, it } from 'vite-plus/test';

import { getTimeTicks } from './getTimeTicks.util';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const at = (iso: string) => Date.parse(iso);
type IsoTicksArgs = {
  readonly end: string;
  readonly start: string;
};

const isoTicks = ({ end, start }: IsoTicksArgs) =>
  getTimeTicks({ end: at(end), start: at(start) }).map((tick) =>
    tick.toISOString(),
  );

describe('getTimeTicks', () => {
  it('places hours across a few hours of one day', () => {
    expect(
      isoTicks({ end: '2026-11-02T15:00:00Z', start: '2026-11-02T09:00:00Z' }),
    ).toEqual(
      ['09', '10', '11', '12', '13', '14', '15'].map(
        (hour) => `2026-11-02T${hour}:00:00.000Z`,
      ),
    );
  });

  it('takes the finer step when it gives exactly the most ticks allowed', () => {
    expect(getTimeTicks({ end: 7 * HOUR, start: 0 })).toHaveLength(8);
  });

  it.each([
    1,
    10,
    100,
    1000,
    5000,
    15_000,
    30_000,
    60_000,
    300_000,
    900_000,
    1_800_000,
    HOUR,
    3 * HOUR,
    6 * HOUR,
    12 * HOUR,
    DAY,
    2 * DAY,
    7 * DAY,
    14 * DAY,
  ])('steps by %i ms across seven of its steps', (step) => {
    const ticks = getTimeTicks({ end: 7 * step, start: 0 }).map(Number);

    expect(ticks).toEqual(
      Array.from({ length: 8 }, (_, index) => index * step),
    );
  });

  it('takes the coarser step when the finer one gives one tick too many', () => {
    expect(getTimeTicks({ end: 8 * HOUR, start: 0 }).map(Number)).toEqual([
      0,
      3 * HOUR,
      6 * HOUR,
    ]);
  });

  it('places quarter days across a day and a half', () => {
    expect(getTimeTicks({ end: 1.5 * DAY, start: 0 }).map(Number)).toEqual(
      [0, 6, 12, 18, 24, 30, 36].map((hours) => hours * HOUR),
    );
  });

  it('places days across four days', () => {
    expect(getTimeTicks({ end: 4 * DAY, start: 0 }).map(Number)).toEqual(
      [0, 1, 2, 3, 4].map((days) => days * DAY),
    );
  });

  it('places one tick on a single instant', () => {
    expect(getTimeTicks({ end: 7, start: 7 })).toEqual([new Date(7)]);
  });

  it('places month starts across a year', () => {
    expect(
      isoTicks({
        end: '2026-12-31T00:00:00Z',
        start: '2026-01-01T00:00:00Z',
      }).map((iso) => iso.slice(0, 10)),
    ).toEqual([
      '2026-01-01',
      '2026-03-01',
      '2026-05-01',
      '2026-07-01',
      '2026-09-01',
      '2026-11-01',
    ]);
  });

  it('places years across two decades', () => {
    expect(
      isoTicks({
        end: '2020-01-01T00:00:00Z',
        start: '2000-01-01T00:00:00Z',
      }).map((iso) => iso.slice(0, 4)),
    ).toEqual(['2000', '2005', '2010', '2015', '2020']);
  });
});
