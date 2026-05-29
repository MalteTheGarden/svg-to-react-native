import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { loadConfig } from '../src/config.js';

let tmpDir: string;

beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'svgrn-cfg-'));
});

afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
    it('returns an empty object when no config file exists', async () => {
        const config = await loadConfig(tmpDir);
        expect(config).toEqual({});
    });

    it('loads a .svgrnrc.json file', async () => {
        const cfg = { svgDir: './icons', outputDir: './components' };
        await fsp.writeFile(
            path.join(tmpDir, '.svgrnrc.json'),
            JSON.stringify(cfg),
            'utf8',
        );
        const config = await loadConfig(tmpDir);
        expect(config.svgDir).toBe('./icons');
        expect(config.outputDir).toBe('./components');
    });

    it('loads a svgrn key from package.json', async () => {
        const pkg = {
            name: 'test-pkg',
            svgrn: { native: false, icon: true },
        };
        await fsp.writeFile(
            path.join(tmpDir, 'package.json'),
            JSON.stringify(pkg),
            'utf8',
        );
        const config = await loadConfig(tmpDir);
        expect(config.native).toBe(false);
        expect(config.icon).toBe(true);
    });

    it('returns an empty object for an empty config file', async () => {
        await fsp.writeFile(path.join(tmpDir, '.svgrnrc.json'), '{}', 'utf8');
        const config = await loadConfig(tmpDir);
        expect(config).toEqual({});
    });
});
