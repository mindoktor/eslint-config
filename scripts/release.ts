import { input, logErrorAndExit, runCommand } from './utils/cli.ts';
import { getPackageJson, savePackageJson } from './utils/packageJson.ts';
import type { VersionBump } from './utils/version.ts';
import {
  bumpVersion,
  createVersion,
  versionBump,
  versionToString,
} from './utils/version.ts';

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

const main = async () => {
  try {
    const bumpType = parseBumpTypeArg();
    console.log(
      `This will perform a ${bumpType} release of the given version and then update develop and main`,
    );
    const confirmation = await input('Type "y/yes" to continue: ');
    if (!['y', 'yes'].includes(confirmation.toLowerCase())) {
      console.log('Aborting release process.');
      return;
    }

    console.log(`Starting ${bumpType} release process...`);
    const packageJson = getPackageJson();
    const currentVersion = createVersion(packageJson.version);
    console.log(`Current version: ${packageJson.version}`);

    console.log(`Asserting git stage is clean...`);
    const output = runCommand('git status --porcelain');
    if (output !== '') {
      throw new Error(
        `Unstaged changes found:\n${output}\nYou need to commit or stash them before releasing.`,
      );
    }

    console.log(`Ensure all branches are up to date...`);
    runCommand('git fetch');
    runCommand('git checkout main');
    runCommand('git pull');
    runCommand('git checkout develop');
    runCommand('git pull');

    console.log(`Bumping version...`);
    const newVersion = bumpVersion(currentVersion, bumpType);
    const newVersionString = versionToString(newVersion);
    console.log(`New version: ${newVersionString}`);
    savePackageJson({
      ...packageJson,
      version: newVersionString,
    });
    runCommand('git add package.json');
    runCommand(`git checkout -b ${newVersionString}`);
    runCommand(`git commit -m "chore: bump version - ${newVersionString}"`);
    runCommand(`git push --set-upstream origin ${newVersionString}`);

    console.log(`Merging version on develop...`);
    runCommand('git checkout develop');
    runCommand(`git merge ${newVersionString}`);
    runCommand('git push');

    console.log(`Merging develop on main...`);
    runCommand('git checkout main');
    runCommand(`git merge develop`);
    runCommand('git push');

    console.log(`Release process completed successfully.`);
    runCommand('git checkout develop');
  } catch (error) {
    logErrorAndExit(error);
  }
};

// Only run the main function if this script is run directly
if (process.argv[1] === import.meta.filename) {
  void main();
}
