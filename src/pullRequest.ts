import type { PreState } from '@changesets/types';

export type GetVersionPrBodyParams = {
    preState: PreState | undefined;
    changedPackagesInfo: {
        highestLevel: Number,
        private: Boolean,
        content: String,
        header: String,
    }[];
    prBodyMaxCharacters: number;
    branch: string;
}

export async function getVersionPrBody({
    preState,
    changedPackagesInfo,
    prBodyMaxCharacters,
    branch,
  }: GetVersionPrBodyParams) {
    let messageHeader = `This PR was opened by the [Changesets release](https://github.com/changesets/action) GitHub action.
        When you're ready to do a release, you can merge this and the packages will be published to npm automatically.
        If you're not ready to do a release yet, that's fine, whenever you add more changesets to ${branch}, this PR will be updated.
    `;
    let messagePrestate = !!preState
      ? `⚠️⚠️⚠️⚠️⚠️⚠️
  
  \`${branch}\` is currently in **pre mode** so this branch has prereleases rather than normal releases. If you want to exit prereleases, run \`changeset pre exit\` on \`${branch}\`.
  
  ⚠️⚠️⚠️⚠️⚠️⚠️
  `
      : "";
    let messageReleasesHeading = `# Releases`;
  
    let fullMessage = [
      messageHeader,
      messagePrestate,
      messageReleasesHeading,
      ...changedPackagesInfo.map((info) => `${info.header}\n\n${info.content}`),
    ].join("\n");
  
    // Check that the message does not exceed the size limit.
    // If not, omit the changelog entries of each package.
    if (fullMessage.length > prBodyMaxCharacters) {
      fullMessage = [
        messageHeader,
        messagePrestate,
        messageReleasesHeading,
        `\n> The changelog information of each package has been omitted from this message, as the content exceeds the size limit.\n`,
        ...changedPackagesInfo.map((info) => `${info.header}\n\n`),
      ].join("\n");
    }
  
    // Check (again) that the message is within the size limit.
    // If not, omit all release content this time.
    if (fullMessage.length > prBodyMaxCharacters) {
      fullMessage = [
        messageHeader,
        messagePrestate,
        messageReleasesHeading,
        `\n> All release information have been omitted from this message, as the content exceeds the size limit.`,
      ].join("\n");
    }
  
    return fullMessage;
  }
