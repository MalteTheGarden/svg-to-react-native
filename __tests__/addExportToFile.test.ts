import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import addExportToFile from '../src/utils/addExportToFile.js';

let tmpDir: string;
let exportFilePath: string;

beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'svgrn-test-'));
    exportFilePath = path.join(tmpDir, 'index.ts');
    await fsp.writeFile(exportFilePath, '', 'utf8');
});

afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('addExportToFile', () => {
    it('appends an export line to an empty file', async () => {
        await addExportToFile(exportFilePath, 'my-icon', './my-icon');
        const content = await fsp.readFile(exportFilePath, 'utf8');
        expect(content).toContain(
            "export { default as MyIcon } from './my-icon';",
        );
    });

    it('does not duplicate an existing export', async () => {
        await addExportToFile(exportFilePath, 'my-icon', './my-icon');
        await addExportToFile(exportFilePath, 'my-icon', './my-icon');
        const content = await fsp.readFile(exportFilePath, 'utf8');
        const occurrences = content.split('MyIcon').length - 1;
        expect(occurrences).toBe(1);
    });

    it('appends multiple distinct exports', async () => {
        await addExportToFile(exportFilePath, 'icon-a', './icon-a');
        await addExportToFile(exportFilePath, 'icon-b', './icon-b');
        const content = await fsp.readFile(exportFilePath, 'utf8');
        expect(content).toContain('IconA');
        expect(content).toContain('IconB');
    });

    it('converts the component name to PascalCase in the export', async () => {
        await addExportToFile(exportFilePath, 'social-media', './social-media');
        const content = await fsp.readFile(exportFilePath, 'utf8');
        expect(content).toContain('SocialMedia');
    });

    it('creates a valid export identifier for digit-leading filenames', async () => {
        await addExportToFile(exportFilePath, '0kr', './0kr');
        const content = await fsp.readFile(exportFilePath, 'utf8');
        expect(content).toContain("export { default as Icon0kr } from './0kr';");
    });
});
