import fsp from 'fs/promises';
import chalk from 'chalk';
import toPascalCase from './toPascalCase.js';

/**
 * Appends a named re-export to the barrel export file if it does not already exist.
 *
 * @param exportFilePath  Absolute path to the barrel file (e.g. `src/icons/index.ts`)
 * @param componentName   Raw filename without extension (e.g. `my-icon`)
 * @param relativePath    Import path relative to the export file (e.g. `./social/my-icon`)
 */
const addExportToFile = async (
    exportFilePath: string,
    componentName: string,
    relativePath: string,
): Promise<void> => {
    try {
        let content = await fsp.readFile(exportFilePath, 'utf8');
        const pascalName = toPascalCase(componentName);
        const exportLine = `export { default as ${pascalName} } from '${relativePath}';\n`;

        if (!content.includes(exportLine)) {
            content += exportLine;
            await fsp.writeFile(exportFilePath, content, 'utf8');
        } else {
            console.warn(chalk.yellow(`➡️  Export already exists: ${pascalName}`));
        }
    } catch (error) {
        console.error(
            chalk.red(`❌ Error updating export file:`),
            (error as Error).message,
        );
        throw error;
    }
};

export default addExportToFile;
