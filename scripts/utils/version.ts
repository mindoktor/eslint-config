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
  const [major, minor, patch] = semver.split('.').map(Number);
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
