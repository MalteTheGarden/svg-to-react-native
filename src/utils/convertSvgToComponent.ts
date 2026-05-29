import fsp from 'fs/promises';
import path from 'path';
import { transform } from '@svgr/core';
import { buildSvgrOptions } from '../constants/svgr-config.js';
import chalk from 'chalk';
import type { ResolvedConfig } from '../types.js';

/**
 * Converts a single SVG file to a React Native TSX component.
 * Writes the component file to `outputDir` with a `.tsx` extension.
 */
const convertSvgToComponent = async (
    svgFilePath: string,
    outputDir: string,
    config: ResolvedConfig,
): Promise<void> => {
    try {
        const svgContent = await fsp.readFile(svgFilePath, 'utf8');
        const componentName = path.basename(svgFilePath, '.svg');
        const outputFilePath = path.join(outputDir, `${componentName}.tsx`);

        const svgrOptions = buildSvgrOptions(config);
        const componentCode = await transform(svgContent, svgrOptions, {
            componentName,
        });

        await fsp.writeFile(outputFilePath, componentCode, 'utf8');
    } catch (error) {
        console.error(
            chalk.red(`❌ Error converting ${svgFilePath}:`),
            (error as Error).message,
        );
        throw error;
    }
};

export default convertSvgToComponent;
