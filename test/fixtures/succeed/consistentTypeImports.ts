// SUCCEED mirror of fail/consistentTypeImports.ts — must fire NOTHING.
// The type-only import correctly uses `import type`, satisfying
// @typescript-eslint/consistent-type-imports.
import type { PathLike } from 'node:fs';

export const describe = (path: PathLike) => `path: ${String(path)}`;
