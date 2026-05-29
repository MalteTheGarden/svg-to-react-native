import type { Config } from '../types.js';

export const defaultConfig: Required<Omit<Config, 'exportFile' | 'exportPerDirectory'>> & {
    exportPerDirectory: boolean;
} = {
    svgDir: './',
    outputDir: './',
    exportPerDirectory: false,
    filenameCase: 'pascal',
    replaceAttrValues: {},
    icon: false,
    native: true,
    dimensions: false,
    jsxRuntime: 'automatic',
};
