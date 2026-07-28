// Interactive confirmation shared by human-only remote scripts.
// Aborts when stdin is not a TTY so agents/scripts cannot drive the prompt.

import readline from "node:readline";

/**
 * Require a real TTY and that the user type `expected` exactly.
 * @param {{ label: string, expected: string, warnLines?: string[] }} opts
 */
export async function requireHumanConfirm({ label, expected, warnLines = [] }) {
  for (const line of warnLines) console.error(line);
  console.error("");

  if (!process.stdin.isTTY) {
    console.error(
      `${label}: stdin is not a TTY; refusing. This command is interactive-only ` +
        "(agents and scripts cannot confirm).",
    );
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await new Promise((resolve) => {
    rl.question(`Type "${expected}" to continue: `, resolve);
  });
  rl.close();

  if (answer.trim() !== expected) {
    console.error(`${label}: confirmation mismatch; aborting.`);
    process.exit(1);
  }
}
