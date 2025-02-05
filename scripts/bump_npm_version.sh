#!/bin/bash

# Get the latest version from npm
latest_version=$(npm view <your-package-name> version)

# Parse the version to bump it (for example, bumping the patch version)
IFS='.' read -r major minor patch <<< "$latest_version"
new_version="$major.$minor.$((patch + 1))"

# Update the version in package.json
pnpm version "$new_version"
