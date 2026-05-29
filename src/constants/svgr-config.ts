import { type Config } from '@svgr/core';
import type { Config as SvgoConfig } from 'svgo';
import customTemplate from '../utils/customTemplate.js';
import type { ResolvedConfig } from '../types.js';

function expandHexVariants(hex: string): string[] {
    const normalized = hex.toLowerCase();
    const variants = new Set<string>([hex, normalized, normalized.toUpperCase()]);

    const hexBody = normalized.slice(1);
    if (hexBody.length === 3) {
        const expanded = `#${hexBody
            .split('')
            .map(ch => ch + ch)
            .join('')}`;
        variants.add(expanded);
        variants.add(expanded.toUpperCase());
    }

    if (hexBody.length === 6) {
        const isShrinkable =
            hexBody[0] === hexBody[1] &&
            hexBody[2] === hexBody[3] &&
            hexBody[4] === hexBody[5];
        if (isShrinkable) {
            const shrunk = `#${hexBody[0]}${hexBody[2]}${hexBody[4]}`;
            variants.add(shrunk);
            variants.add(shrunk.toUpperCase());
        }
    }

    return [...variants];
}

function normalizeReplaceAttrValues(
    replaceAttrValues: Record<string, string>,
): Record<string, string> {
    const normalized: Record<string, string> = { ...replaceAttrValues };

    for (const [from, to] of Object.entries(replaceAttrValues)) {
        if (/^#[0-9a-fA-F]{3}$/.test(from) || /^#[0-9a-fA-F]{6}$/.test(from)) {
            for (const variant of expandHexVariants(from)) {
                normalized[variant] = to;
            }
        }
    }

    return normalized;
}

const svgoConfig: SvgoConfig = {
    js2svg: { pretty: true },
    plugins: [
        'removeXMLNS',
        'removeTitle',
        'removeDesc',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'removeEmptyAttrs',
        'removeHiddenElems',
        'removeEmptyText',
        'removeEmptyContainers',
        'convertStyleToAttrs',
        'convertPathData',
        'convertTransform',
        'removeUnknownsAndDefaults',
        'removeNonInheritableGroupAttrs',
        'removeUselessStrokeAndFill',
        'cleanupNumericValues',
        'moveElemsAttrsToGroup',
        'moveGroupAttrsToElems',
        'collapseGroups',
        'mergePaths',
        'convertShapeToPath',
    ],
};

export function buildSvgrOptions(config: ResolvedConfig): Config {
    return {
        dimensions: config.dimensions,
        expandProps: 'start',
        icon: config.icon,
        jsxRuntime: config.jsxRuntime,
        native: config.native,
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx', '@svgr/plugin-prettier'],
        prettier: true,
        prettierConfig: {
            arrowParens: 'avoid',
            bracketSpacing: true,
            endOfLine: 'lf',
            htmlWhitespaceSensitivity: 'css',
            insertPragma: false,
            jsxSingleQuote: false,
            printWidth: 80,
            proseWrap: 'preserve',
            quoteProps: 'as-needed',
            requirePragma: false,
            semi: true,
            singleQuote: false,
            tabWidth: 2,
            trailingComma: 'none',
            useTabs: false,
        },
        replaceAttrValues: normalizeReplaceAttrValues(config.replaceAttrValues),
        svgoConfig,
        template: customTemplate,
        typescript: true,
    };
}
