import { getPackages, Package } from '@manypkg/get-packages';
import { ExecCommandResult } from './gitUtils';

export async function getVersionsByDirectory(cwd: string) {
    const { packages } = await getPackages(cwd);
    return new Map(packages.map((x) => [x.dir, x.packageJson.version]));
}
export async function getChangedPackages(
    cwd: string,
    previousVersions: Map<string, string>
) {
    const { packages } = await getPackages(cwd);
    let changedPackages = new Set<Package>();

    for (let pkg of packages) {
        const previousVersion = previousVersions.get(pkg.dir);
        if (previousVersion !== pkg.packageJson.version) {
        changedPackages.add(pkg);
        }
    }

    return [...changedPackages];
}

export type PublishOptions = {
    changesetPublishOutput: ExecCommandResult;
    cwd?: string;
}

export type PublishResult = {
    published: boolean;
    publishedPackages: {
        name: string;
        version: string;
    }[];
}

export async function getReleasedPackages({
    changesetPublishOutput,
    cwd = process.cwd(),
  }: PublishOptions): Promise<PublishResult> {    
    const { packages, tool } = await getPackages(cwd);
    const releasedPackages: Package[] = [];
  
    if (tool.type !== "root") {
      const newTagRegex = /New tag:\s+(@[^/]+\/[^@]+|[^/]+)@([^\s]+)/;
      const packagesByName = new Map(packages.map((x) => [x.packageJson.name, x]));
  
      for (let line of changesetPublishOutput.stdout.split("\n")) {
        const match = line.match(newTagRegex);
        if (match === null) {
          continue;
        }
        const pkgName = match[1];
        const pkg = packagesByName.get(pkgName);
        if (pkg === undefined) {
          throw new Error(
            `Package "${pkgName}" not found.` +
              "This is probably a bug in the action, please open an issue"
          );
        }
        releasedPackages.push(pkg);
      }
    } else {
      if (packages.length === 0) {
        throw new Error(
          `No package found.` +
            "This is probably a bug in the action, please open an issue"
        );
      }
      const pkg = packages[0];
      const newTagRegex = /New tag:/;
  
      for (let line of changesetPublishOutput.stdout.split("\n")) {
        const match = line.match(newTagRegex);
  
        if (match) {
          releasedPackages.push(pkg);
          break;
        }
      }
    }
  
    if (releasedPackages.length) {
      return {
        published: true,
        publishedPackages: releasedPackages.map((pkg) => ({
          name: pkg.packageJson.name,
          version: pkg.packageJson.version,
        })),
      };
    }
  
    return { published: false, publishedPackages: [] };
  }
