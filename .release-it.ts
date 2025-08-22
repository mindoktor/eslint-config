import type { Config } from 'release-it';

const releaseItConfig: Config = {
  git: {
    commit: true,
    commitMessage: 'chore: bump version to ${version}',
    tagName: '${version}',
    requireCleanWorkingDir: true,
    requireBranch: 'develop',
    push: true,
    pushArgs: '--set-upstream origin ${version}',
  },
  npm: {
    publish: false,
  },
  hooks: {
    'before:init': ['yarn lint', 'yarn typecheck'],
    'before:release': [
      'git switch -C ${version}',
      'yarn cleanbuild',
      'git add dist -f',
    ],
    'after:release': [
      'git checkout develop',
      'git merge ${version}',
      'git push',
      'git checkout main',
      'git merge develop',
      'git push',
    ],
  },
};

export default releaseItConfig;
