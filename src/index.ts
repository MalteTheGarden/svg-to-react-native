#!/usr/bin/env node
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig } from './config.js';
import { run } from './converter.js';
import { defaultConfig } from './constants/defaults.js';

const program = new Command();

const resolveFromCwd = (p: string): string =>
    path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);

const parseBool = (v: string): boolean => v !== 'false';

program
    .name('svg-to-react-native')
    .version('1.0.0')
    .description('Convert SVG files to React Native TSX components')
    .option('-s, --svg-dir <path>', 'Input directory containing SVG files')
    .option('-o, --output-dir <path>', 'Output directory for converted components')
    .option(
        '-e, --export-file [path]',
        'Generate index export files (no path: per output directory, with path: single barrel file)',
    )
    .option(
        '-r, --replace-attr <pair...>',
        'Attribute value replacements — format: "<value>=<prop>" e.g. "#fff=fill"',
    )
    .option(
        '-c, --filename-case <case>',
        'Output filename casing: pascal | kebab | camel',
    )
    .option(
        '-i, --icon [boolean]',
        'Treat SVGs as icons (removes width/height from root)',
        parseBool,
    )
    .option(
        '-n, --native [boolean]',
        'Output React Native-compatible components (default: true)',
        parseBool,
    )
    .option(
        '-d, --dimensions [boolean]',
        'Preserve width/height dimensions in output',
        parseBool,
    )
    .option('-j, --jsx-runtime <runtime>', 'JSX runtime: automatic | classic')
    .action(async () => {
        try {
            const cliOpts = program.opts<{
                svgDir?: string;
                outputDir?: string;
                exportFile?: string | boolean;
                replaceAttr?: string[];
                filenameCase?: string;
                icon?: boolean;
                native?: boolean;
                dimensions?: boolean;
                jsxRuntime?: string;
            }>();

            // Load config file (cosmiconfig — searches up from cwd)
            const fileConfig = await loadConfig();

            // Resolve svg-dir and output-dir first so we can derive defaults
            const svgDir = resolveFromCwd(
                cliOpts.svgDir ?? fileConfig.svgDir ?? defaultConfig.svgDir,
            );
            const outputDir = resolveFromCwd(
                cliOpts.outputDir ?? fileConfig.outputDir ?? defaultConfig.outputDir,
            );

            // --export-file: flag present without value → use <outputDir>/index.ts
            let exportFile: string | undefined;
            let exportPerDirectory =
                fileConfig.exportPerDirectory ?? defaultConfig.exportPerDirectory;
            if (cliOpts.exportFile !== undefined) {
                if (typeof cliOpts.exportFile === 'string') {
                    exportFile = resolveFromCwd(cliOpts.exportFile);
                    exportPerDirectory = false;
                } else {
                    exportPerDirectory = true;
                }
            } else if (fileConfig.exportFile) {
                exportFile = resolveFromCwd(fileConfig.exportFile);
                exportPerDirectory = false;
            }

            // Parse --replace-attr pairs: "#fff=fill" → { "#fff": "{fill}" }
            const replaceAttrValues: Record<string, string> =
                fileConfig.replaceAttrValues ?? defaultConfig.replaceAttrValues;
            if (cliOpts.replaceAttr?.length) {
                for (const pair of cliOpts.replaceAttr) {
                    const eqIdx = pair.indexOf('=');
                    if (eqIdx === -1) {
                        console.warn(
                            chalk.yellow(
                                `⚠️  Ignoring malformed --replace-attr value: "${pair}" (expected "from=to")`,
                            ),
                        );
                        continue;
                    }
                    const from = pair.slice(0, eqIdx);
                    const to = pair.slice(eqIdx + 1);
                    replaceAttrValues[from] = to;
                }
            }

            await run({
                svgDir,
                outputDir,
                exportFile,
                exportPerDirectory,
                replaceAttrValues,
                filenameCase:
                    (cliOpts.filenameCase as 'pascal' | 'kebab' | 'camel') ??
                    fileConfig.filenameCase ??
                    defaultConfig.filenameCase,
                icon: cliOpts.icon ?? fileConfig.icon ?? defaultConfig.icon,
                native: cliOpts.native ?? fileConfig.native ?? defaultConfig.native,
                dimensions:
                    cliOpts.dimensions ??
                    fileConfig.dimensions ??
                    defaultConfig.dimensions,
                jsxRuntime:
                    (cliOpts.jsxRuntime as 'automatic' | 'classic') ??
                    fileConfig.jsxRuntime ??
                    defaultConfig.jsxRuntime,
            });
        } catch (err) {
            console.error(chalk.red('❌ Conversion failed:'), (err as Error).message);
            process.exit(1);
        }
    });

program.parse(process.argv);
