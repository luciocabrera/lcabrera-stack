import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';
import { Link } from 'react-router';

import type { HeatmapGridProps } from './HeatmapGrid.types';

import { HEATMAP_SIZE } from './HeatmapGrid.constants';
import { styles } from './HeatmapGrid.stylex';

const STEP = HEATMAP_SIZE.cell + HEATMAP_SIZE.gap;

export const HeatmapGrid = ({ grid }: HeatmapGridProps) => {
  const hatchId = `hatch${useId().replaceAll(/[^\w-]/gu, '')}`;
  const width = HEATMAP_SIZE.label + grid.runs.length * STEP;
  const height = HEATMAP_SIZE.header + grid.subjects.length * STEP;
  const label = `${grid.suite}: ${String(grid.subjects.length)} subjects over ${String(grid.runs.length)} runs`;

  return (
    <figure aria-label={label} {...stylex.props(styles.figure)}>
      <svg
        viewBox={`0 0 ${String(width)} ${String(height)}`}
        width={width}
        {...stylex.props(styles.chart)}
      >
        <title>{label}</title>
        <defs>
          <pattern
            height={4}
            id={hatchId}
            patternTransform='rotate(45)'
            patternUnits='userSpaceOnUse'
            width={4}
          >
            <line x1={0} x2={0} y1={0} y2={4} {...stylex.props(styles.hatch)} />
          </pattern>
        </defs>
        {grid.runs.map((run, column) => (
          <Link aria-label={run.label} key={run.runId} to={run.href}>
            <title>{run.label}</title>
            <rect
              height={HEATMAP_SIZE.header - HEATMAP_SIZE.gap * 2}
              width={HEATMAP_SIZE.cell}
              x={HEATMAP_SIZE.label + column * STEP}
              y={0}
              {...stylex.props(styles.run)}
            />
          </Link>
        ))}
        {grid.subjects.map((subject, row) => {
          const y = HEATMAP_SIZE.header + row * STEP;

          return (
            <g key={subject.key}>
              <Link to={subject.href}>
                <text
                  x={0}
                  y={y + HEATMAP_SIZE.cell - 4}
                  {...stylex.props(styles.label)}
                >
                  {subject.label}
                </text>
              </Link>
              {subject.cells.map(
                (cell, column) =>
                  cell !== undefined && (
                    <Link aria-label={cell.label} key={cell.key} to={cell.href}>
                      <title>{cell.label}</title>
                      <rect
                        height={HEATMAP_SIZE.cell}
                        width={HEATMAP_SIZE.cell}
                        x={HEATMAP_SIZE.label + column * STEP}
                        y={y}
                        {...stylex.props(styles.cell, styles[cell.tone])}
                      />
                      {Boolean(cell.isFlaky) && (
                        <rect
                          data-flaky='true'
                          fill={`url(#${hatchId})`}
                          height={HEATMAP_SIZE.cell}
                          width={HEATMAP_SIZE.cell}
                          x={HEATMAP_SIZE.label + column * STEP}
                          y={y}
                          {...stylex.props(styles.overlay)}
                        />
                      )}
                    </Link>
                  ),
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
};
