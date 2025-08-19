# Publishing AssetForge to NPM

This document describes the process for publishing AssetForge to the npm registry.

## Prerequisites

1. You need an npm account. Create one at https://www.npmjs.com/signup if you don't have one.
2. You need to be logged in to npm on your local machine:

```bash
npm login
```

3. Make sure all changes are committed to git.

## Publishing Process

### 1. Update version

Update the version number in package.json following semantic versioning:

- MAJOR version for incompatible API changes
- MINOR version for added functionality in a backwards compatible manner
- PATCH version for backwards compatible bug fixes

You can use npm to update the version:

```bash
npm version patch  # For bug fixes
npm version minor  # For new features
npm version major  # For breaking changes
```

### 2. Check package contents

Verify what will be included in the published package:

```bash
npm pack
```

This creates a tarball (.tgz file) with the exact contents that would be published. Extract and check it if needed.

### 3. Publish to npm

When you're ready to publish:

```bash
npm publish
```

### 4. Tag the release in git

```bash
git tag v$(node -e "console.log(require('./package.json').version)")
git push origin --tags
```

## Publishing a beta version

For testing before an official release:

```bash
# Update version with a pre-release tag
npm version prerelease --preid=beta

# Publish with the beta tag
npm publish --tag beta
```

Users can then install the beta with:

```bash
npm install assetforge@beta
```

## Updating documentation after publish

After publishing, update any version references in the documentation:

1. Update installation instructions in README.md
2. Update any version-specific code examples
3. Ensure the documentation reflects the latest published version

## Unpublishing

In case of critical issues, you can unpublish within the first 72 hours:

```bash
npm unpublish assetforge@x.y.z
```

For older versions, deprecate instead:

```bash
npm deprecate assetforge@"< 1.0.0" "Critical security issue, please update to 1.0.0 or later"
```
