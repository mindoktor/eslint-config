import fs from 'node:fs';

const PACKAGE_JSON_PATH = new URL('../package.json', import.meta.url).pathname;
const versionBump = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
};

type VersionBump = keyof typeof versionBump;

class Version {
  major: number;
  minor: number;
  patch: number;

  constructor(semver: string) {
    const [major, minor, patch] = semver.split('.').map(Number);
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  bump(type: VersionBump): void {
    switch (type) {
      case versionBump.major:
        this.major++;
        this.minor = 0;
        this.patch = 0;
        break;
      case versionBump.minor:
        this.minor++;
        this.patch = 0;
        break;
      case versionBump.patch:
        this.patch++;
        break;
    }
  }

  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
}

// const runCommand = (command: string) => {
//   console.log(`$ ${command}`);
//   execSync(command, { stdio: 'inherit' });
// };

const getBumpType = (): VersionBump => {
  if (process.argv.length < 3) {
    console.error(
      `No bump type specified. Please use one of: ${Object.keys(versionBump).join(', ')}`,
    );
    process.exit(1);
  }

  const bumpType = process.argv[2];
  if (!(bumpType in versionBump)) {
    console.error(
      `Invalid bump type. Please use one of: ${Object.keys(versionBump).join(', ')}`,
    );
    process.exit(1);
  }
  return bumpType as VersionBump;
};

interface PackageJson {
  name: string;
  version: string;
}

const getPackageJson = () => {
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    throw new Error(`Could not find package.json at ${PACKAGE_JSON_PATH}`);
  }

  const packageJson = JSON.parse(
    fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'),
  ) as PackageJson;

  if (!packageJson.version) {
    throw new Error(`Invalid package.json at ${PACKAGE_JSON_PATH}`);
  }

  return packageJson;
};

const savePackageJson = (packageJson: PackageJson) => {
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    throw new Error(`Could not find package.json at ${PACKAGE_JSON_PATH}`);
  }

  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
};

const main = () => {
  const bumpType = getBumpType();
  console.log(`Starting ${bumpType} release process...`);
  const packageJson = getPackageJson();
  console.log(`Current version: ${packageJson.version}`);
  const newVersion = new Version(packageJson.version);
  newVersion.bump(bumpType);
  console.log(`New version: ${newVersion.toString()}`);
  savePackageJson({
    ...packageJson,
    version: newVersion.toString(),
  });
};

// Only run the main function if this script is run directly
if (process.argv[1] === import.meta.filename) {
  main();
}
