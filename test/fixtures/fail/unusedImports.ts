// Expected to trigger: unused-imports/no-unused-imports
// `readFile` is imported but never used.
import { readFile } from 'node:fs/promises';

export const value = 42;
