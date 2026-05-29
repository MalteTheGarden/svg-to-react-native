import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import convertSvgToComponent from '../src/utils/convertSvgToComponent.js';
import changePropsInFile from '../src/utils/changePropsInFile.js';
import { defaultConfig } from '../src/constants/defaults.js';
import type { ResolvedConfig } from '../src/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

let tmpDir: string;

const testConfig: ResolvedConfig = {
    ...defaultConfig,
};

beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'svgrn-conv-'));
});

afterEach(async () => {
    await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('convertSvgToComponent', () => {
    it('produces a .tsx file from a valid SVG', async () => {
        const svgPath = path.join(fixturesDir, 'circle-icon.svg');
        await convertSvgToComponent(svgPath, tmpDir, testConfig);
        await changePropsInFile(path.join(tmpDir, 'circle-icon.tsx'));
        const outFile = path.join(tmpDir, 'circle-icon.tsx');
        const exists = await fsp
            .access(outFile)
            .then(() => true)
            .catch(() => false);
        expect(exists).toBe(true);
    });

    it('generated file contains a React component', async () => {
        const svgPath = path.join(fixturesDir, 'circle-icon.svg');
        await convertSvgToComponent(svgPath, tmpDir, testConfig);
        await changePropsInFile(path.join(tmpDir, 'circle-icon.tsx'));
        const content = await fsp.readFile(
            path.join(tmpDir, 'circle-icon.tsx'),
            'utf8',
        );
        expect(content).toContain('CircleIcon');
        expect(content).toContain('SvgProps');
        expect(content).toContain('({ ...rest }: SvgProps)');
    });

    it('applies replaceAttrValues substitution', async () => {
        const svgPath = path.join(fixturesDir, 'layers.svg');
        const config: ResolvedConfig = {
            ...testConfig,
            replaceAttrValues: { '#2E2313': '{fill}' },
        };
        await convertSvgToComponent(svgPath, tmpDir, config);
        await changePropsInFile(path.join(tmpDir, 'layers.tsx'));
        const content = await fsp.readFile(
            path.join(tmpDir, 'layers.tsx'),
            'utf8',
        );
        // The hardcoded colour should be replaced
        expect(content).not.toContain('#2E2313');
        expect(content).toContain('fill={fill}');
        expect(content).toContain('({ fill, ...rest }: SvgProps & { fill?: string })');
    });

    it('applies replacement for hex case/length variants and supports color prop', async () => {
        const svgPath = path.join(tmpDir, 'variant-colors.svg');
        await fsp.writeFile(
            svgPath,
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="#2e2313" stroke="#000000"/></svg>',
            'utf8',
        );

        const config: ResolvedConfig = {
            ...testConfig,
            replaceAttrValues: { '#2E2313': '{fill}', '#000': '{color}' },
        };

        await convertSvgToComponent(svgPath, tmpDir, config);
        await changePropsInFile(path.join(tmpDir, 'variant-colors.tsx'));

        const content = await fsp.readFile(
            path.join(tmpDir, 'variant-colors.tsx'),
            'utf8',
        );

        expect(content).toContain('fill={fill}');
        expect(content).toContain('stroke={color}');
        expect(content).toContain(
            '({ fill, color, ...rest }: SvgProps & { fill?: string; color?: string })',
        );
    });

    it('writes import type before Svg import', async () => {
        const svgPath = path.join(fixturesDir, 'circle-icon.svg');
        await convertSvgToComponent(svgPath, tmpDir, testConfig);
        await changePropsInFile(path.join(tmpDir, 'circle-icon.tsx'));
        const content = await fsp.readFile(
            path.join(tmpDir, 'circle-icon.tsx'),
            'utf8',
        );

        const typeImportMatch = content.match(
            /import type \{ SvgProps \} from ['"]react-native-svg['"];/,
        );
        const valueImportMatch = content.match(
            /import Svg, \{[^}]+\} from ['"]react-native-svg['"];/,
        );
        const typeImportIndex = typeImportMatch ? content.indexOf(typeImportMatch[0]) : -1;
        const valueImportIndex = valueImportMatch
            ? content.indexOf(valueImportMatch[0])
            : -1;
        expect(typeImportIndex).toBeGreaterThanOrEqual(0);
        expect(valueImportIndex).toBeGreaterThanOrEqual(0);
        expect(typeImportIndex).toBeLessThan(valueImportIndex);
    });

    it('throws on an invalid (non-SVG) input file', async () => {
        const badPath = path.join(tmpDir, 'bad.svg');
        await fsp.writeFile(badPath, 'this is not svg', 'utf8');
        await expect(
            convertSvgToComponent(badPath, tmpDir, testConfig),
        ).rejects.toThrow();
    });

    it('generates a valid identifier for digit-leading filenames', async () => {
        const source = path.join(fixturesDir, 'circle-icon.svg');
        const digitNameSvg = path.join(tmpDir, '0kr.svg');

        await fsp.copyFile(source, digitNameSvg);
        await convertSvgToComponent(digitNameSvg, tmpDir, testConfig);
        await changePropsInFile(path.join(tmpDir, '0kr.tsx'));

        const content = await fsp.readFile(path.join(tmpDir, '0kr.tsx'), 'utf8');
        expect(content).toContain('const Icon0kr =');
    });
});
