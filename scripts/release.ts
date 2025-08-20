import { input, logErrorAndExit, runCommand } from './utils/cli.ts';
import { getPackageJson, savePackageJson } from './utils/packageJson.ts';
import type { VersionBump } from './utils/version.ts';
import {
  bumpVersion,
  createVersion,
  versionBump,
  versionToString,
} from './utils/version.ts';

interface Args {
  bumpType: VersionBump;
  dryRun: boolean;
}

const parseArgs = (): Args => {
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

  const dryRun = process.argv.includes('--dry-run');

  return {
    bumpType: bumpType as VersionBump,
    dryRun,
  };
};

const main = async () => {
  try {
    const { bumpType, dryRun } = parseArgs();
    console.log(
      `This will perform a ${bumpType} release of the given version and then update develop and main`,
    );
    if (dryRun) {
      console.log(`Dry run enabled. Not making any changes.`);
    }
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
    const output = runCommand('git status --porcelain', {
      captureOutput: true,
    });
    if (output != null && output !== '') {
      throw new Error(
        `Unstaged changes found:\n${output}\nYou need to commit or stash them before releasing.`,
      );
    }

    console.log(`Ensure all branches are up to date...`);
    runCommand('git fetch', { dryRun });
    runCommand('git checkout main', { dryRun });
    runCommand('git pull', { dryRun });
    runCommand('git checkout develop', { dryRun });
    runCommand('git pull', { dryRun });

    console.log(`Bumping version...`);
    const newVersion = bumpVersion(currentVersion, bumpType);
    const newVersionString = versionToString(newVersion);
    console.log(`New version: ${newVersionString}`);
    if (dryRun) {
      console.log(`Dry run enabled. Not saving package.json.`);
    } else {
      savePackageJson({
        ...packageJson,
        version: newVersionString,
      });
    }
    runCommand('git add package.json', { dryRun });
    runCommand(`git checkout -b ${newVersionString}`, { dryRun });
    runCommand(`git commit -m "chore: bump version - ${newVersionString}"`, {
      dryRun,
    });
    runCommand(`git push --set-upstream origin ${newVersionString}`, {
      dryRun,
    });

    console.log(`Merging version on develop...`);
    runCommand('git checkout develop', { dryRun });
    runCommand(`git merge ${newVersionString}`, { dryRun });
    runCommand('git push', { dryRun });

    console.log(`Merging develop on main...`);
    runCommand('git checkout main', { dryRun });
    runCommand(`git merge develop`, { dryRun });
    runCommand('git push', { dryRun });

    console.log(`Release process completed successfully.`);
    runCommand('git checkout develop', { dryRun });
  } catch (error) {
    logErrorAndExit(error);
  }
};

// Only run the main function if this script is run directly
if (process.argv[1] === import.meta.filename) {
  void main();
}
