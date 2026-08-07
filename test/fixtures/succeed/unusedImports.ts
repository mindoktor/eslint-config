// SUCCEED mirror of fail/unusedImports.ts — must fire NOTHING.
// The imported binding is used, so unused-imports/no-unused-imports stays quiet.
import { readFile } from 'node:fs/promises';

export const read = (path: string) => readFile(path);
