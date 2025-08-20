export const versionBump = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
};

export type VersionBump = keyof typeof versionBump;

export interface Version {
  major: number;
  minor: number;
  patch: number;
}

export const createVersion = (semver: string): Version => {
  // Validate semver: must be "x.y.z" where x, y, z are non-negative integers
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/;
  const match = semverRegex.exec(semver);
  if (!match) {
    throw new Error(`Invalid semver string: "${semver}"`);
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return { major, minor, patch };
};

export const bumpVersion = (version: Version, type: VersionBump): Version => {
  switch (type) {
    case versionBump.major:
      return { major: version.major + 1, minor: 0, patch: 0 };
    case versionBump.minor:
      return { ...version, minor: version.minor + 1, patch: 0 };
    case versionBump.patch:
      return { ...version, patch: version.patch + 1 };
    default:
      throw new Error(`Invalid version bump type: ${type}`);
  }
};

export const versionToString = (version: Version): string => {
  return `${version.major}.${version.minor}.${version.patch}`;
};
