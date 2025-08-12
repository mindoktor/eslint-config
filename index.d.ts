import type { ConfigArray } from 'typescript-eslint';

declare module '@mindoktor/eslint-config/index.mjs' {
  const configArray: ConfigArray;
  export default configArray;
}

// We need to export something due to our modules settings in typescript
export {};
