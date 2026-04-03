import ora, { type Ora } from "ora";

let current: Ora | null = null;

export function startSpinner(text: string): Ora {
  current = ora({ text, stream: process.stderr }).start();
  return current;
}

export function stopSpinner(success?: boolean, text?: string): void {
  if (!current) return;
  if (success === false) {
    current.fail(text);
  } else {
    current.succeed(text);
  }
  current = null;
}
