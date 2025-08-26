import type { Config } from 'release-it';

const releaseItConfig: Config = {
  git: {
    commit: true,
    commitMessage: 'chore: release ${version}',
    tag: false,
    requireCleanWorkingDir: true,
    requireBranch: 'develop',
    push: true,
  },
  npm: {
    publish: false,
  },
  hooks: {
    'before:init': ['git pull', 'yarn lint', 'yarn typecheck'],
    // Update develop with the new version
    'after:bump': [
      'git add .',
      'git commit -m "chore: bump version to ${version}"',
      'git push',
    ],
    // Create a new branch for the release
    'before:release': [
      'git switch -C ${version}',
      'yarn cleanbuild',
      'git add dist -f',
    ],
    // The release is done, we return to develop
    'after:release': ['git switch develop'],
  },
};

export default releaseItConfig;
