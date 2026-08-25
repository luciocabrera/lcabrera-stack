#!/usr/bin/env node

/**
 * Lighthouse Score Checker
 * Validates scores against thresholds and compares against baseline
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASELINE_FILE = resolve(process.cwd(), 'lighthouse-baseline.json');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
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

export async function checkLighthouseScores(reportPath) {
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

  const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
  const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'));

  log('\n📊 Lighthouse Score Report', colors.blue);
  log('=====================================\n');

  const { categories } = report;
  const thresholds = baseline.thresholds;
  const baselineScores = baseline.scores;

  let allPassed = true;
  const results = [];

  Object.entries(categories).forEach(([category, data]) => {
    const currentScore = Math.round(data.score * 100);
    const threshold = thresholds[category] || 0;
    const baselineScore = baselineScores[category] || 0;
    const diff = currentScore - baselineScore;
    const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
    const diffColor = diff >= 0 ? colors.green : colors.red;

    const passed = currentScore >= threshold;
    if (!passed) allPassed = false;

    const emoji = getScoreEmoji(currentScore, threshold);
    const scoreColor = getScoreColor(currentScore, threshold);

    log(
      `${emoji} ${category.padEnd(18)} ${currentScore.toString().padStart(3)}/100 (threshold: ${threshold}) ${diffColor}[${diffStr}]${colors.reset}`,
      scoreColor,
    );

    results.push({
      category,
      current: currentScore,
      baseline: baselineScore,
      threshold,
      passed,
    });
  });

  log('\n📈 Comparison to Baseline:', colors.blue);
  results.forEach(({ category, current, baseline: base }) => {
    const diff = current - base;
    const { color, symbol } = getTrendPresentation(diff);
    log(`  ${symbol} ${category.padEnd(18)} ${base} → ${current}`, color);
  });

  log('\n' + '=====================================');

  if (allPassed) {
    log('\n✅ All scores meet thresholds!', colors.green);
    return true;
  }

  log('\n❌ Some scores are below thresholds', colors.red);
  log('\nFailed categories:', colors.red);
  results
    .filter((result) => !result.passed)
    .forEach(({ category, current, threshold }) => {
      const gap = threshold - current;
      log(
        `  • ${category}: ${current}/100 (need +${gap} to reach ${threshold})`,
        colors.red,
      );
    });
  return false;
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
