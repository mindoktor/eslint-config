import { execSync } from 'node:child_process';
import readline from 'node:readline/promises';

export const input = async (question: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(question);
  rl.close();
  return answer;
};

export const runCommand = (
  command: string,
  options?: { dryRun?: boolean; captureOutput?: boolean },
) => {
  console.log(`$ ${command}`);
  if (options?.dryRun === true) {
    return '';
  }
  if (options?.captureOutput === true) {
    return execSync(command, { stdio: 'pipe' }).toString().trim();
  }
  execSync(command, { stdio: 'inherit' });
};

const red = (text: string) => {
  return `\x1b[31m${text}\x1b[0m`;
};

export const logErrorAndExit = (error: unknown) => {
  console.error(red(String(error)));
  process.exit(1);
};
