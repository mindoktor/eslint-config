import type { Config } from 'release-it';

const releaseItConfig: Config = {
  git: {
    commit: true,
    commitMessage: 'chore: bump version to ${version}',
    tag: false,
    requireCleanWorkingDir: true,
    requireBranch: 'develop',
    push: true,
  },
  npm: {
    publish: false,
  },
  hooks: {
    'before:init': ['yarn lint', 'yarn typecheck'],
    // the "release" step only does the bump-commit on 'develop' and pushes to origin
    'after:release': [
      // the actual "release" happens here, by creating a new branch and pushing it with the built artifacts
      'git switch -C ${version}',
      'yarn cleanbuild',
      'git add dist -f',
      'git commit -m "chore: release ${version}"',
      'git push --set-upstream origin ${version}',
    ],
  },
};

export default releaseItConfig;
