import type { Config } from 'release-it';

const releaseItConfig: Config = {
  git: {
    commitMessage: 'chore: bump version to ${version}',
    tagName: '${version}',
    requireCleanWorkingDir: true,
    requireBranch: 'develop',
    push: true,
  },
  npm: {
    publish: false,
  },
  hooks: {
    'before:init': ['yarn lint', 'yarn typecheck'],
    'before:bump': ['yarn cleanbuild'],
    'after:bump': [
      'git checkout -b ${version} && git push --set-upstream origin ${version}',
    ],
    'after:release': [
      'git checkout develop && git merge ${version} && git push && git checkout main && git merge develop && git push',
    ],
  },
};

export default releaseItConfig;
