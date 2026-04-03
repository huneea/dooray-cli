export class DoorayCliError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number,
  ) {
    super(message);
    this.name = "DoorayCliError";
  }
}
