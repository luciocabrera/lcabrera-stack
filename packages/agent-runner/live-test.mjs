// Throwaway live-test script — deleted after verification, not part of the package.
import { mkdirSync } from 'node:fs';

process.env.PATH = `${process.env.PATH}`;

const { runSkillAgent } = await import('./src/runSkillAgent.ts');

const outputDirectory = '/tmp/agent-runner-live-test-output';
mkdirSync(outputDirectory, { recursive: true });

const result = await runSkillAgent({
  onProgress: (message) => console.log(`[progress] ${message}`),
  outputDirectory,
  scannerId: 'code-smell-checker',
  skillPath: '.github/skills/code-smell-checker',
  targetProjectPath: '/tmp/agent-runner-live-test',
});

console.log(JSON.stringify(result, null, 2));
