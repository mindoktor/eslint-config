// Expected to trigger: import/consistent-type-specifier-style
// The type is correctly marked, but inline (`type PathLike`) rather than
// hoisted to a top-level `import type`, which the rule's `prefer-top-level`
// option flags.
import { type PathLike, readFileSync } from 'node:fs';

export const read = (path: PathLike) => readFileSync(path);
