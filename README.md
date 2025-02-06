# changesets-circle-utils

CircleCI utils for @changesets

### Quick Start

```
pnpm add @eth-optimism/changesets-circle-utils
```

## Commands

### release
Create a release and version PR.

**Required Environment Variables**
- `GITHUB_TOKEN` - Github token used to create/update pull requests

**This command requires a deploy or user key to be set up in CircleCI with read/write access to the repository to push the changeset branch**

```
changesets-circle release
```

### publish-snapshots
Publish snapshot package releases to npm

**Required Environment Variables**
- `NPM_TOKEN` - NPM token used to publish packages

```
changesets-circle publish-snapshots
```

### publish-release
Publish production package releases to npm

**Required Environment Variables**
- `NPM_TOKEN` - NPM token used to publish packages

**This command requires a deploy or user key to be set up in CircleCI with read/write access to the repository to push tags**

```
changesets-circle publish-release
```

### CircleCI Example Usage

Below is an example of how to configure CircleCI to use this package.

* When new changesets are detected on main it will create a release and version PR for those changesets
* While changesets exists on main, snapshots will be published to npm for each changeset
* When the release and version PR is merged into main it will publish those new versions to npm

```

version: 2.1

orbs:
  node: circleci/node@6.3.0

commands:
  setup:
    description: "Setup"
    steps:
      - checkout
      - node/install-pnpm:
          version: '9'
      - run:
          name: Install pnpm dependencies
          command: pnpm install
      - nx/set-shas
      - run:
          name: Build
          command: pnpm build
  configure-npm:
    description: "Configure NPM"
    steps:
      - run:
          name: Set NPM Credentials
          command: pnpm config set //registry.npmjs.org/:_authToken $NPM_TOKEN

jobs:
  release-and-version-pr:
    executor:
      name: node/default
      tag: '22.10'
    steps:
      - checkout
      - setup
      - run: pnpm changesets-circle release

  publish-snapshots:
    executor:
      name: node/default
      tag: '22.10'
    steps:
      - checkout
      - setup
      - configure-npm
      - run: pnpm changesets-circle publish-snapshots
    
  publish-release:
    executor:
      name: node/default
      tag: '22.10'
    steps:
      - checkout
      - setup
      - configure-npm
      - run: pnpm changesets-circle publish-release

workflows:
  main:
    jobs:
      - release-and-version-pr:
          context: repo-ctx # contains enviroment variables
          filters:
            branches:
              only:
                - main
      - publish-snapshots:
          context: repo-ctx
          filters:
            branches:
              only:
                - main
      - publish-release:
          context: repo-ctx
          filters:
            branches:
              only:
                - main

```
