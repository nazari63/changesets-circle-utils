import { getPackages, Package } from '@manypkg/get-packages';

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
