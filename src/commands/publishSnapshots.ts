import { readChangesetState } from "@changesets/release-utils";
import { github } from "../githubContext.js";
import { execCommand } from "../gitUtils.js";
import { getReleasedPackages } from "../packageUtils.js";

/**
 * Publishes snapshots on $CIRCLE_BRANCH
 * 
 * $NPM_TOKEN must be set in the environment in order to publish to npm
 * 
 * Steps:
 * 1. Get the changesets
 * 2. Validate changesets exist and are not empty
 * 3. Clean the branch name so it can be used as part of the npm version.
 * 4. Run @changesets/cli version --snapshot $CIRCLE_BRANCH using the cleaned branch name
 * 5. Run @changesets/cli publish --no-git-tag --tag $CIRCLE_BRANCH using the cleaned branch name to publsih to npm
 * 6. Output the published packages to stdout
 */
export async function publishSnapshots() {
    const { changesets } = await readChangesetState();
    const hasChangesets = changesets.length > 0;

    const hasNonEmptyChangesets = changesets.some(
        (changeset) => changeset.releases.length > 0
    );

    if (!hasChangesets) {
        console.log('No changesets found, skipping publishSnapshots');
        return;
    }

    if (hasChangesets && !hasNonEmptyChangesets) {
        console.log('All changesets are empty; skipping publishSnapshots');
        return;
    }

    const sanitizedBranchName = github.context.branch.replace(/\//g, '-');
    
    // Versions are published as {version}-{$CIRCLE_BRANCH}-${timestamp}
    const versionResult = await execCommand('pnpm changesets', ['version', '--snapshot', `${sanitizedBranchName}`]);
    if (versionResult.stderr.includes('No unreleased changesets found')) {
        console.log(
            '\nNo changesets found. In order to publish a snapshot version, you must have at least one changeset committed.\n',
        );
        return;
    }

    const changesetPublishOutput = await execCommand('pnpm changesets', [
        'publish',
        '--no-git-tag',
        '--tag',
        `${sanitizedBranchName}`,
    ]);

    const { published, publishedPackages } = await getReleasedPackages({
        changesetPublishOutput,
    });

    console.info('published', published);
    console.info('publishedPackages', JSON.stringify(publishedPackages, null, 2));
}
