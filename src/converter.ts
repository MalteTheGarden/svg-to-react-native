import path from 'path';
import fsp from 'fs/promises';
import chalk from 'chalk';
import convertSvgToComponent from './utils/convertSvgToComponent.js';
import addExportToFile from './utils/addExportToFile.js';
import changePropsInFile from './utils/changePropsInFile.js';
import type { ResolvedConfig } from './types.js';

const spinnerFrames = ['|', '/', '-', '\\'];

function createSpinner(initialText: string) {
    let frame = 0;
    let text = initialText;
    const interval = setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(spinnerFrames[frame])} ${text}`);
        frame = (frame + 1) % spinnerFrames.length;
    }, 80);

    return {
        setText(nextText: string) {
            text = nextText;
        },
        succeed(successText: string) {
            clearInterval(interval);
            process.stdout.write(`\r${chalk.green('✔')} ${successText}\n`);
        },
        fail(failureText: string) {
            clearInterval(interval);
            process.stdout.write(`\r${chalk.red('✖')} ${failureText}\n`);
        },
    };
}

/**
 * Recursively walks a directory and yields the absolute path of every `.svg` file found.
 */
export async function* walkSvgFiles(dir: string): AsyncGenerator<string> {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkSvgFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.svg')) {
            yield fullPath;
        }
    }
}

/**
 * Main conversion runner.
 *
 * For each SVG found under `config.svgDir` (recursively):
 *  1. Mirrors the directory structure under `config.outputDir`
 *  2. Converts the SVG to a React Native TSX component
 *  3. Deletes the original SVG file
 *  4. Optionally appends a re-export to `config.exportFile`
 */
export async function run(config: ResolvedConfig): Promise<void> {
    const { svgDir, outputDir, exportFile, exportPerDirectory } = config;

    await fsp.mkdir(outputDir, { recursive: true });

    if (exportFile) {
        await fsp.mkdir(path.dirname(exportFile), { recursive: true });
        // Always regenerate barrel exports from scratch.
        await fsp.writeFile(exportFile, '', 'utf8');
    }

    const svgFiles: string[] = [];
    for await (const file of walkSvgFiles(svgDir)) {
        svgFiles.push(file);
    }

    if (svgFiles.length === 0) {
        console.log(chalk.blue('No SVG files found for conversion.'));
        return;
    }

    const spinner = createSpinner(`Converting 0/${svgFiles.length} SVG file(s)...`);
    const truncatedDirectoryIndexes = new Set<string>();
    let convertedCount = 0;

    try {
        for (const svgFilePath of svgFiles) {
            // Preserve nested directory structure in the output
            const relativeDir = path.relative(svgDir, path.dirname(svgFilePath));
            const targetDir = path.join(outputDir, relativeDir);
            await fsp.mkdir(targetDir, { recursive: true });

            await convertSvgToComponent(svgFilePath, targetDir, config);

            // Remove the original SVG only after a successful conversion
            await fsp.unlink(svgFilePath);

            const baseName = path.basename(svgFilePath, '.svg');
            const componentFilePath = path.join(targetDir, `${baseName}.tsx`);
            await changePropsInFile(componentFilePath);

            if (exportPerDirectory) {
                const directoryExportFile = path.join(targetDir, 'index.ts');
                if (!truncatedDirectoryIndexes.has(directoryExportFile)) {
                    // Empty existing index.ts in this output directory before appending.
                    await fsp.writeFile(directoryExportFile, '', 'utf8');
                    truncatedDirectoryIndexes.add(directoryExportFile);
                }
                await addExportToFile(directoryExportFile, baseName, `./${baseName}`);
            } else if (exportFile) {
                // Path relative from the export file's directory to the component (no extension)
                const exportFileDir = path.dirname(exportFile);
                const relExportPath =
                    './' +
                    path
                        .relative(exportFileDir, componentFilePath.slice(0, -4))
                        .replace(/\\/g, '/');
                await addExportToFile(exportFile, baseName, relExportPath);
            }

            convertedCount += 1;
            spinner.setText(
                `Converting ${convertedCount}/${svgFiles.length} SVG file(s)...`,
            );
        }
    } catch (error) {
        spinner.fail('Conversion failed.');
        throw error;
    }

    spinner.succeed(`Done. Converted ${svgFiles.length} SVG file(s).`);
}
