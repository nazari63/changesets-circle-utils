import { execCommand } from '../gitUtils.js';
import * as gitUtils from '../gitUtils.js';

/**
 * Publish production package releases to npm
 * 
 * $NPM_TOKEN must be set in the environment in order to publish to npm
 * 
 * Steps:
 * 1. Run @changesets/cli publish
 * 2. Push the tags to the remote repository
 */
export async function publishRelease() {
    const changesetPublishOutput = await execCommand('pnpm changeset', ['publish']);
    if (changesetPublishOutput.error) {
        console.error(changesetPublishOutput.error);
        process.exit(1);
    }
    await gitUtils.pushTags();
    console.info(changesetPublishOutput.stdout);
}
