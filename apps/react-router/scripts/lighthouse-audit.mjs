#!/usr/bin/env node

/**
 * Lighthouse Audit Script
 * Builds, serves, and audits the production site
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const PORT = 3000;
const AUDIT_URL = `http://localhost:${PORT}`;
const CHROME_DEBUG_PORT = 9222;
const REPORT_DIR = './lighthouse-reports';
const SERVER_ENTRY_PATH = 'build/server/index.js';
const TIMESTAMP = new Date()
  .toISOString()
  .replaceAll(':', '-')
  .replaceAll('.', '-')
  .slice(0, -5);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n📋 ${step}`, colors.blue);
}

function getErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function getLocalBinaryPath(binaryName) {
  const executableName =
    process.platform === 'win32' ? `${binaryName}.cmd` : binaryName;

  return resolve(process.cwd(), 'node_modules', '.bin', executableName);
}

function getScoreColor(score) {
  if (score >= 90) {
    return colors.green;
  }

  if (score >= 50) {
    return colors.yellow;
  }

  return colors.red;
}

async function runProcess(command, args = [], stdio = 'inherit') {
  return new Promise((resolvePromise, rejectPromise) => {
    const processHandle = spawn(command, args, {
      stdio,
    });

    processHandle.on('error', (error) => {
      rejectPromise(error);
    });

    processHandle.on('close', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Command failed with code ${code}`));
    });
  });
}

async function runBuild() {
  logStep('Building for production...');
  await runProcess(getLocalBinaryPath('react-router'), ['build']);
}

async function waitForServer(url, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        log('✓ Server is ready', colors.green);
        return;
      }
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000));
  }

  throw new Error('Server failed to start');
}

async function startProductionServer() {
  logStep('Starting production server...');

  const serverProcess = spawn(
    getLocalBinaryPath('react-router-serve'),
    [SERVER_ENTRY_PATH],
    {
      stdio: 'pipe',
    },
  );

  serverProcess.stdout?.on('data', (data) => {
    console.log(`[server] ${data}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    console.error(`[server] ${data}`);
  });

  serverProcess.on('error', (error) => {
    log(`\n❌ Server process error: ${getErrorMessage(error)}`, colors.red);
  });

  try {
    await waitForServer(AUDIT_URL, 60);
  } catch (error) {
    // The caller owns the child only once this returns, and a live child with
    // piped stdio keeps the event loop alive — so exitCode alone would hang.
    serverProcess.kill();
    throw error;
  }

  return serverProcess;
}

async function runLighthouse(url) {
  logStep('Running Lighthouse audit...');

  const browser = await chromium.launch({
    args: [`--remote-debugging-port=${CHROME_DEBUG_PORT}`],
    headless: true,
  });

  try {
    const options = {
      logLevel: 'info',
      output: ['json', 'html'],
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: CHROME_DEBUG_PORT,
    };

    const runnerResult = await lighthouse(url, options);

    if (!runnerResult) {
      throw new Error('Lighthouse audit failed');
    }

    if (!existsSync(REPORT_DIR)) {
      mkdirSync(REPORT_DIR, { recursive: true });
    }

    const jsonReportPath = `${REPORT_DIR}/lighthouse-${TIMESTAMP}.json`;
    const htmlReportPath = `${REPORT_DIR}/lighthouse-${TIMESTAMP}.html`;

    writeFileSync(jsonReportPath, runnerResult.report[0]);
    writeFileSync(htmlReportPath, runnerResult.report[1]);

    log(`✓ JSON report saved: ${jsonReportPath}`, colors.green);
    log(`✓ HTML report saved: ${htmlReportPath}`, colors.green);

    const scores = JSON.parse(runnerResult.report[0]);
    const { categories } = scores;

    logStep('Lighthouse Scores:');
    Object.entries(categories).forEach(([name, data]) => {
      const score = Math.round(data.score * 100);
      log(`  ${name}: ${score}/100`, getScoreColor(score));
    });

    return scores;
  } finally {
    await browser.close();
  }
}

async function runAudit() {
  log('\n🚀 Lighthouse Audit Pipeline', colors.blue);
  log('=====================================\n');

  await runBuild();
  const serverProcess = await startProductionServer();

  try {
    const scores = await runLighthouse(AUDIT_URL);

    logStep('Audit Complete!');
    log(
      `\nFull HTML report: ${REPORT_DIR}/lighthouse-${TIMESTAMP}.html\n`,
      colors.blue,
    );

    log('Summary:', colors.blue);
    const average =
      Object.values(scores.categories).reduce((sum, category) => {
        return sum + category.score;
      }, 0) / Object.keys(scores.categories).length;

    log(`  Average score: ${Math.round(average * 100)}/100\n`);
  } finally {
    logStep('Stopping server...');
    serverProcess.kill();
  }
}

try {
  await runAudit();
} catch (error) {
  log(`\n❌ Error: ${getErrorMessage(error)}`, colors.red);
  process.exitCode = 1;
}
