import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { run, walkSvgFiles } from '../src/converter.js';
import { defaultConfig } from '../src/constants/defaults.js';
import type { ResolvedConfig } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

let tmpInput: string;
let tmpOutput: string;

const baseConfig = (): ResolvedConfig => ({
    ...defaultConfig,
    svgDir: tmpInput,
    outputDir: tmpOutput,
});

beforeEach(async () => {
    tmpInput = await fsp.mkdtemp(path.join(os.tmpdir(), 'svgrn-in-'));
    tmpOutput = await fsp.mkdtemp(path.join(os.tmpdir(), 'svgrn-out-'));
});

afterEach(async () => {
    await Promise.all([
        fsp.rm(tmpInput, { recursive: true, force: true }),
        fsp.rm(tmpOutput, { recursive: true, force: true }),
    ]);
});

// Helper: copy a fixture SVG into a directory
async function copyFixture(
    name: string,
    destDir: string,
    destName?: string,
): Promise<void> {
    const src = path.join(fixturesDir, name);
    await fsp.mkdir(destDir, { recursive: true });
    await fsp.copyFile(src, path.join(destDir, destName ?? name));
}

describe('walkSvgFiles', () => {
    it('yields SVG files in a flat directory', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        const files: string[] = [];
        for await (const f of walkSvgFiles(tmpInput)) {
            files.push(f);
        }
        expect(files).toHaveLength(1);
        expect(files[0]).toMatch(/circle-icon\.svg$/);
    });

    it('yields SVG files in nested directories', async () => {
        const subDir = path.join(tmpInput, 'sub');
        await copyFixture('circle-icon.svg', tmpInput);
        await copyFixture('layers.svg', subDir);
        const files: string[] = [];
        for await (const f of walkSvgFiles(tmpInput)) {
            files.push(f);
        }
        expect(files).toHaveLength(2);
    });

    it('returns nothing for an empty directory', async () => {
        const files: string[] = [];
        for await (const f of walkSvgFiles(tmpInput)) {
            files.push(f);
        }
        expect(files).toHaveLength(0);
    });

    it('ignores non-SVG files', async () => {
        await fsp.writeFile(path.join(tmpInput, 'readme.txt'), 'hello');
        const files: string[] = [];
        for await (const f of walkSvgFiles(tmpInput)) {
            files.push(f);
        }
        expect(files).toHaveLength(0);
    });
});

describe('run', () => {
    it('converts a flat SVG and writes a TSX file to outputDir', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        await run(baseConfig());
        const outFile = path.join(tmpOutput, 'circle-icon.tsx');
        const exists = await fsp
            .access(outFile)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(true);
    });

    it('deletes the original SVG after conversion', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        await run(baseConfig());
        const original = path.join(tmpInput, 'circle-icon.svg');
        const exists = await fsp
            .access(original)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(false);
    });

    it('mirrors nested directory structure in the output', async () => {
        const subDir = path.join(tmpInput, 'social');
        await copyFixture('circle-icon.svg', subDir);
        await run(baseConfig());
        const outFile = path.join(tmpOutput, 'social', 'circle-icon.tsx');
        const exists = await fsp
            .access(outFile)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(true);
    });

    it('converts multiple SVGs including from nested dirs', async () => {
        const subDir = path.join(tmpInput, 'nav');
        await copyFixture('circle-icon.svg', tmpInput);
        await copyFixture('layers.svg', subDir);
        await run(baseConfig());
        const flat = await fsp
            .access(path.join(tmpOutput, 'circle-icon.tsx'))
            .then(() => true)
            .catch(() => false);
        const nested = await fsp
            .access(path.join(tmpOutput, 'nav', 'layers.tsx'))
            .then(() => true)
            .catch(() => false);
        expect(flat).toBe(true);
        expect(nested).toBe(true);
    });

    it('writes a barrel export file when exportFile is set', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        const exportFile = path.join(tmpOutput, 'index.ts');
        await run({ ...baseConfig(), exportFile });
        const content = await fsp.readFile(exportFile, 'utf8');
        expect(content).toContain('CircleIcon');
    });

    it('empties an existing single export index file before conversion', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        const exportFile = path.join(tmpOutput, 'index.ts');
        await fsp.writeFile(
            exportFile,
            "export { default as OldIcon } from './old-icon';\n",
            'utf8',
        );

        await run({ ...baseConfig(), exportFile });
        const content = await fsp.readFile(exportFile, 'utf8');

        expect(content).toContain("export { default as CircleIcon } from './circle-icon';");
        expect(content).not.toContain('OldIcon');
    });

    it('does not write an export file when exportFile is undefined', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        await run({ ...baseConfig(), exportFile: undefined });
        const exportFile = path.join(tmpOutput, 'index.ts');
        const exists = await fsp
            .access(exportFile)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(false);
    });

    it('writes index.ts inside each output directory when exportPerDirectory is enabled', async () => {
        await copyFixture('circle-icon.svg', tmpInput);
        await copyFixture('layers.svg', path.join(tmpInput, 'social'));

        await run({ ...baseConfig(), exportPerDirectory: true, exportFile: undefined });

        const rootIndex = path.join(tmpOutput, 'index.ts');
        const nestedIndex = path.join(tmpOutput, 'social', 'index.ts');

        const rootContent = await fsp.readFile(rootIndex, 'utf8');
        const nestedContent = await fsp.readFile(nestedIndex, 'utf8');

        expect(rootContent).toContain("export { default as CircleIcon } from './circle-icon';");
        expect(nestedContent).toContain("export { default as Layers } from './layers';");
    });

    it('empties existing per-directory index files before conversion', async () => {
        await copyFixture('layers.svg', path.join(tmpInput, 'social'));
        await fsp.mkdir(path.join(tmpOutput, 'social'), { recursive: true });
        await fsp.writeFile(
            path.join(tmpOutput, 'social', 'index.ts'),
            "export { default as OldIcon } from './old-icon';\n",
            'utf8',
        );

        await run({ ...baseConfig(), exportPerDirectory: true, exportFile: undefined });

        const nestedContent = await fsp.readFile(
            path.join(tmpOutput, 'social', 'index.ts'),
            'utf8',
        );
        expect(nestedContent).toContain("export { default as Layers } from './layers';");
        expect(nestedContent).not.toContain('OldIcon');
    });

    it('writes index.ts in nested directory when only nested files are converted', async () => {
        await copyFixture('layers.svg', path.join(tmpInput, 'social'));

        await run({ ...baseConfig(), exportPerDirectory: true, exportFile: undefined });

        const nestedIndex = path.join(tmpOutput, 'social', 'index.ts');
        const nestedExists = await fsp
            .access(nestedIndex)
            .then(() => true)
            .catch(() => false);
        const rootIndex = path.join(tmpOutput, 'index.ts');
        const rootExists = await fsp
            .access(rootIndex)
            .then(() => true)
            .catch(() => false);

        expect(nestedExists).toBe(true);
        expect(rootExists).toBe(false);
    });

    it('does nothing when svgDir contains no SVG files', async () => {
        await fsp.writeFile(path.join(tmpInput, 'notes.txt'), 'hello');
        // Should resolve without error
        await expect(run(baseConfig())).resolves.toBeUndefined();
    });
});
