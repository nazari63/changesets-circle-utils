#!/bin/bash

# Get the latest version from npm
latest_version=$(npm view changesets-circle-utils version)

# Parse the version to bump it (for example, bumping the patch version)
IFS='.' read -r major minor patch <<< "$latest_version"
new_version="$major.$minor.$((patch + 1))"

# Update the version in package.json
pnpm version "$new_version"

echo "Bumped version to $new_version"
