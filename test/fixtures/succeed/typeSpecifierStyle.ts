// SUCCEED mirror of fail/typeSpecifierStyle.ts — must fire NOTHING.
// The type import is hoisted to a top-level `import type` (not inline), which
// is the form import/consistent-type-specifier-style's `prefer-top-level`
// option requires.
import type { PathLike } from 'node:fs';
import { readFileSync } from 'node:fs';

export const read = (path: PathLike) => readFileSync(path);
