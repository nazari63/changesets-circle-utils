import { exec } from "child_process"

type ExecCommandResult = {
  error: Error | null;
  stdout: string;
  stderr: string;
}

export const execCommand = (command: string, params: string[]): Promise<ExecCommandResult> => {
  return new Promise((resolve, reject) => {
    exec(`${command} ${params.join(" ")}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${error.message}`);
          reject({ error, stdout, stderr });
        }
        resolve({ error: null, stdout, stderr });
      })
  });
}

export const setupUser = async () => {
  await execCommand("git", [
    "config",
    "user.name",
    `"github-actions[bot]"`,
  ]);
  await execCommand("git", [
    "config",
    "user.email",
    `"github-actions[bot]@users.noreply.github.com"`,
  ]);
};

export const pullBranch = async (branch: string) => {
  await execCommand("git", ["pull", "origin", branch]);
};

export const push = async (
  branch: string,
  { force }: { force?: boolean } = {}
) => {
  await execCommand(
    "git",
    ["push", "origin", `HEAD:${branch}`, force && "--force"].filter<string>(
      Boolean as any
    )
  );
};

export const pushTags = async () => {
  await execCommand("git", ["push", "origin", "--tags"]);
};

export const switchToMaybeExistingBranch = async (branch: string) => {
  let { stderr } = await execCommand("git", ["checkout", branch]);
  let isCreatingBranch = !stderr
    .toString()
    .includes(`Switched to a new branch '${branch}'`);
  if (isCreatingBranch) {
    await execCommand("git", ["checkout", "-b", branch]);
  }
};

export const reset = async (
  pathSpec: string,
  mode: "hard" | "soft" | "mixed" = "hard"
) => {
  await execCommand("git", ["reset", `--${mode}`, pathSpec]);
};

export const commitAll = async (message: string) => {
  await execCommand("git", ["add", "."]);
  await execCommand("git", ["commit", "-m", message]);
};

export const checkIfClean = async (): Promise<boolean> => {
  const { stdout } = await execCommand("git", ["status", "--porcelain"]);
  return !stdout.length;
};