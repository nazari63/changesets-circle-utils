import { readChangesetState, sortChangelogEntries, getChangelogEntry } from '@changesets/release-utils';
import { Octokit } from 'octokit'; 
import fs from 'fs';
import path from 'path';

import { github } from "../githubContext.js";
import { getVersionPrBody } from '../pullRequest.js';
import * as gitUtils from '../gitUtils.js';
import { getChangedPackages, getVersionsByDirectory } from '../packageUtils.js';
import { execCommand } from '../gitUtils.js';

// GitHub Issues/PRs messages have a max size limit on the
// message body payload.
// `body is too long (maximum is 65536 characters)`.
// To avoid that, we ensure to cap the message to 60k chars.
const MAX_CHARACTERS_PER_MESSAGE = 60000;

const DEFAULT_COMMIT_MESSAGE = "Version Packages";
const DEFAULT_PR_TITLE = "Version Packages";

/**
 * Release and version packages
 * 
 * Steps:
 * 1. Get the changesets
 * 2. Validate changesets exist and are not empty
 * 3. Create changeset branch if it doesn't exist changeset-release/$CIRCLE_BRANCH
 * 4. Set changeset branch to $CIRCLE_SHA1, this makes sure we have all the changesets from $CIRCLE_BRANCH
 * 5. Run @changesets/cli version, this will bump the package.json versions and generate the CHANGELOG.md entries
 * 6. Get the changed packages
 * 7. Generate the high level changelog entries that will be used in the PR body
 * 8. Commit and push the changes
 * 9. Generate the PR body
 * 10. Create/Update the changeset PR
 */
export async function releaseAndVersionPR(octokit: Octokit) {
    const { changesets, preState } = await readChangesetState();
    const hasChangesets = changesets.length > 0;

    const hasNonEmptyChangesets = changesets.some(
        (changeset) => changeset.releases.length > 0
    );

    if (!hasChangesets) {
        console.log('No changesets found');
        return;
    }

    if (hasChangesets && !hasNonEmptyChangesets) {
        console.log('All changesets are empty; not creating PR');
        return;
    }

    const versionBranch = `changeset-release/${github.context.branch}`;
    await gitUtils.switchToMaybeExistingBranch(versionBranch);
    await gitUtils.reset(github.context.sha);

    const cwd = process.cwd();
    const versionsByDirectory = await getVersionsByDirectory(cwd);
    await execCommand('pnpm changeset', ['version']);

    const changedPackages = await getChangedPackages(cwd, versionsByDirectory);
    const changedPackagesInfo = changedPackages.map((pkg) => {
        let changelogContents = fs.readFileSync(
            path.join(pkg.dir, "CHANGELOG.md"),
            "utf8"
        );

        let entry = getChangelogEntry(changelogContents, pkg.packageJson.version);
        return {
            highestLevel: entry.highestLevel,
            private: !!pkg.packageJson.private,
            content: entry.content,
            header: `## ${pkg.packageJson.name}@${pkg.packageJson.version}`,
        };
    })
    .filter(info => info)
    .sort(sortChangelogEntries);

    console.log('changedPackagesInfo', changedPackagesInfo);

    const prBody = await getVersionPrBody({
        preState,
        branch: github.context.branch,
        changedPackagesInfo,
        prBodyMaxCharacters: MAX_CHARACTERS_PER_MESSAGE,
    });
        
    const finalPrTitle = `${DEFAULT_PR_TITLE}${preState ? ` (${preState.tag})` : ""}`;

    if (!(await gitUtils.checkIfClean())) {
        const finalCommitMessage = `${DEFAULT_COMMIT_MESSAGE}${
        preState ? ` (${preState.tag})` : ""
        }`;
        await gitUtils.commitAll(finalCommitMessage);
    }

    await gitUtils.push(versionBranch, { force: true });

    const existingPullRequests = await octokit.rest.pulls.list({
        owner: github.context.repo.owner,
        repo: github.context.repo.name,
        state: 'open',
        head: `${github.context.repo.owner}:${versionBranch}`,
        base: github.context.branch,
    });

    const isVersionsPROpen = existingPullRequests.data.length > 0;
    if (isVersionsPROpen) {
        const [existingPr] = existingPullRequests.data;

        console.info(`updating found pull request #${existingPr.number}`)
        await octokit.rest.pulls.update({
            pull_number: existingPr.number,
            title: finalPrTitle,
            body: prBody,
            owner: github.context.repo.owner,
            repo: github.context.repo.name,
            state: "open",
        });
    } else {
        console.info(`creating new pull request`)
        const { data: newPullRequest } = await octokit.rest.pulls.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.name,
            title: finalPrTitle,
            body: prBody,
            head: versionBranch,
            base: github.context.branch as string,
        });

        console.info(`Pull request created: ${newPullRequest.number}`);
    }
}
