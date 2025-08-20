import { logErrorAndExit } from './utils/errors.ts';
import { getPackageJson, savePackageJson } from './utils/packageJson.ts';
import type { VersionBump } from './utils/version.ts';
import {
  bumpVersion,
  createVersion,
  versionBump,
  versionToString,
} from './utils/version.ts';

// const runCommand = (command: string) => {
//   console.log(`$ ${command}`);
//   execSync(command, { stdio: 'inherit' });
// };

const parseBumpTypeArg = (): VersionBump => {
  if (process.argv.length < 3) {
    throw new Error(
      `No bump type specified. Please use one of: ${Object.keys(versionBump).join(', ')}`,
    );
  }

  const bumpType = process.argv[2];
  if (!(bumpType in versionBump)) {
    throw new Error(
      `Invalid bump type. Please use one of: ${Object.keys(versionBump).join(', ')}`,
    );
  }
  return bumpType as VersionBump;
};

const main = () => {
  try {
    const bumpType = parseBumpTypeArg();
    console.log(`Starting ${bumpType} release process...`);

    const packageJson = getPackageJson();
    const currentVersion = createVersion(packageJson.version);
    console.log(`Current version: ${packageJson.version}`);

    const newVersion = bumpVersion(currentVersion, bumpType);
    const newVersionString = versionToString(newVersion);
    console.log(`New version: ${newVersionString}`);
    savePackageJson({
      ...packageJson,
      version: newVersionString,
    });
  } catch (error) {
    logErrorAndExit(error);
  }
};

// Only run the main function if this script is run directly
if (process.argv[1] === import.meta.filename) {
  main();
}
