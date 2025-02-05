import { Command } from "commander";
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { Octokit } from "octokit";

import { releaseAndVersionPR } from "./commands/releaseAndVersion.js";
import { fileURLToPath } from "url";

if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not set');
}

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const program = new Command();

const __dirname = dirname(fileURLToPath(import.meta.url));

const packageJsonPath = join(__dirname, '../package.json');
const { version } = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

program.version(version).description('CircleCI utils for @changesets');

program
    .command('release')
    .action(async () => {
        await releaseAndVersionPR(octokit);
    })

program.parse(process.argv);
