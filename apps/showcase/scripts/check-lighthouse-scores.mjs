#!/usr/bin/env node

/**
 * Lighthouse Score Checker
 * Validates scores against thresholds and compares against baseline
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE_FILE = resolve(process.cwd(), 'lighthouse-baseline.json');
const colors = {
  blue: '\u{1B}[34m',
  dim: '\u{1B}[2m',
  green: '\u{1B}[32m',
  red: '\u{1B}[31m',
  reset: '\u{1B}[0m',
  yellow: '\u{1B}[33m',
};

const scoreRow = ({ baselineScores, category, data, thresholds }) => {
  const current = Math.round(data.score * 100);
  const threshold = thresholds[category] || 0;
  return {
    baseline: baselineScores[category] || 0,
    category,
    current,
    passed: current >= threshold,
    threshold,
  };
};

const scoreLine = ({ baseline, category, current, threshold }) => {
  const diff = current - baseline;
  const diffStr = diff >= 0 ? `+${diff}` : String(diff);
  const diffColor = diff >= 0 ? colors.green : colors.red;
  return [
    `${getScoreEmoji(current, threshold)} ${category.padEnd(18)} ${String(current).padStart(3)}/100 (threshold: ${threshold}) ${diffColor}[${diffStr}]${colors.reset}`,
    getScoreColor(current, threshold),
  ];
};

async function checkLighthouseScores(reportPath) {
  if (!existsSync(reportPath)) {
    log(`\n❌ Report not found: ${reportPath}`, colors.red);
    process.exitCode = 1;
    return false;
  }

  if (!existsSync(BASELINE_FILE)) {
    log(`\n❌ Baseline file not found: ${BASELINE_FILE}`, colors.red);
    process.exitCode = 1;
    return false;
  }

  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));

  log('\n📊 Lighthouse Score Report', colors.blue);
  log('=====================================\n');

  const { categories } = report;
  const thresholds = baseline.thresholds;
  const baselineScores = baseline.scores;

  const results = Object.entries(categories).map(([category, data]) =>
    scoreRow({ baselineScores, category, data, thresholds }),
  );
  for (const row of results) log(...scoreLine(row));
  const isAllPassed = results.every((row) => row.passed);

  log('\n📈 Comparison to Baseline:', colors.blue);
  for (const { baseline: base, category, current } of results) {
    const diff = current - base;
    const { color, symbol } = getTrendPresentation(diff);
    log(`  ${symbol} ${category.padEnd(18)} ${base} → ${current}`, color);
  }

  log('\n=====================================');

  if (isAllPassed) {
    log('\n✅ All scores meet thresholds!', colors.green);
    return true;
  }

  log('\n❌ Some scores are below thresholds', colors.red);
  log('\nFailed categories:', colors.red);
  for (const { category, current, passed, threshold } of results) {
    if (passed) continue;
    const gap = threshold - current;
    log(
      `  • ${category}: ${current}/100 (need +${gap} to reach ${threshold})`,
      colors.red,
    );
  }
  return false;
}

function getScoreColor(score, threshold) {
  if (score >= threshold) return colors.green;
  if (score >= threshold - 10) return colors.yellow;
  return colors.red;
}

function getScoreEmoji(score, threshold) {
  if (score >= threshold) return '✅';
  if (score >= threshold - 10) return '⚠️ ';
  return '❌';
}

function getTrendPresentation(diff) {
  if (diff > 0) {
    return {
      color: colors.green,
      symbol: '📈',
    };
  }

  if (diff < 0) {
    return {
      color: colors.red,
      symbol: '📉',
    };
  }

  return {
    color: colors.dim,
    symbol: '➡️ ',
  };
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

const args = process.argv.slice(2);
if (args[0]) {
  const reportPath = args[0];
  const passed = await checkLighthouseScores(reportPath);
  process.exitCode = passed ? 0 : 1;
} else {
  log('Usage:', colors.blue);
  log('  node scripts/check-lighthouse-scores.mjs <report.json>', colors.dim);
}
