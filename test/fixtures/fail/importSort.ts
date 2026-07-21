// Expected to trigger: simple-import-sort/imports
// Imports are deliberately out of sorted order (path before os before fs).
import { basename } from 'node:path';
import { EOL } from 'node:os';
import { readFile } from 'node:fs/promises';

export const combined = `${basename('/a/b')}${EOL}${typeof readFile}`;
