// SUCCEED mirror of fail/importSort.ts — must fire NOTHING.
// Imports are in the order simple-import-sort/imports expects (alphabetical by
// module path).
import { readFile } from 'node:fs/promises';
import { EOL } from 'node:os';
import { basename } from 'node:path';

export const combined = `${basename('/a/b')}${EOL}${typeof readFile}`;
