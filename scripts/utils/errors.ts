const red = (text: string) => {
  return `\x1b[31m${text}\x1b[0m`;
};

export const logErrorAndExit = (error: unknown) => {
  console.error(red(String(error)));
  process.exit(1);
};
