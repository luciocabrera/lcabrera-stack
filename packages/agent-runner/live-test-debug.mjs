// Throwaway diagnostic script — deleted after verification.
import { mkdirSync } from 'node:fs';

const { query } = await import('@anthropic-ai/claude-agent-sdk');
const { loadSkillFrontmatter } = await import('./src/skillFrontmatter.util.ts');
const { deriveAllowedTools } = await import('./src/deriveAllowedTools.util.ts');

const outputDirectory = '/tmp/agent-runner-live-test-output';
mkdirSync(outputDirectory, { recursive: true });

const { body, frontmatter } = loadSkillFrontmatter({
  skillPath: '.github/skills/code-smell-checker',
});
const allowedTools = deriveAllowedTools({ frontmatter });
console.log('allowedTools:', allowedTools);

const prompt = `You are running fully autonomously and non-interactively — there is no user to ask follow-up questions, and no further turn after this one. You must actually execute every action this skill describes, including all file-writing and shell steps (e.g. "Saving the Report") — do not just describe or summarize what you would do. Treat every imperative instruction in the skill below ("always save", "tell the user", etc.) as something you must literally do via tool calls before finishing.

${body}`;

for await (const message of query({
  options: {
    allowedTools: [...allowedTools],
    cwd: '/tmp/agent-runner-live-test',
    env: { ...process.env, OUTPUT_DIR: outputDirectory },
    permissionMode: 'dontAsk',
  },
  prompt,
})) {
  if (message.type === 'assistant') {
    const content = message.message?.content ?? [];
    for (const block of content) {
      if (block.type === 'text')
        console.log('[assistant text]', block.text.slice(0, 500));
      if (block.type === 'tool_use')
        console.log(
          '[tool_use]',
          block.name,
          JSON.stringify(block.input).slice(0, 300),
        );
    }
  }
  if (message.type === 'user') {
    const content = message.message?.content ?? [];
    for (const block of content) {
      if (block.type === 'tool_result') {
        const text =
          typeof block.content === 'string'
            ? block.content
            : JSON.stringify(block.content);
        console.log(
          '[tool_result]',
          block.is_error ? 'ERROR' : 'ok',
          text.slice(0, 300),
        );
      }
    }
  }
  if (message.type === 'result') {
    console.log(
      '[result]',
      message.subtype,
      'turns:',
      message.num_turns,
      'cost:',
      message.total_cost_usd,
    );
    console.log(
      '[permission_denials]',
      JSON.stringify(message.permission_denials),
    );
    console.log('[result text]', message.result?.slice(0, 2000));
  }
}
