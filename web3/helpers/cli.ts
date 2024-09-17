export function getArgFromCLI(arg: string): string | undefined {
    const index = process.argv.indexOf(arg);
    if (index !== -1 && index < process.argv.length - 1) {
        return process.argv[index + 1];
    }
    return undefined;
}