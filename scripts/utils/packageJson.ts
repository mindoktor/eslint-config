import fs from 'node:fs';

const PACKAGE_JSON_PATH = new URL('../../package.json', import.meta.url)
  .pathname;

interface PackageJson {
  name: string;
  version: string;
}

export const getPackageJson = () => {
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

export const savePackageJson = (packageJson: PackageJson) => {
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    throw new Error(`Could not find package.json at ${PACKAGE_JSON_PATH}`);
  }

  fs.writeFileSync(
    PACKAGE_JSON_PATH,
    JSON.stringify(packageJson, null, 2) + '\n',
  );
};
