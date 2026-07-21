// Expected to trigger: @typescript-eslint/consistent-type-imports
// PathLike is used only as a type but imported as a plain value specifier with
// no `type` modifier, so the rule flags it.
import { PathLike } from 'node:fs';

export const describe = (path: PathLike) => `path: ${String(path)}`;
