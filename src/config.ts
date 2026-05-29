import { cosmiconfig } from 'cosmiconfig';
import type { Config } from './types.js';

/**
 * Searches upward from `cwd` for a `svgrn` configuration using cosmiconfig.
 *
 * Supported file names (in search order):
 *   - package.json  → "svgrn" key
 *   - .svgrnrc
 *   - .svgrnrc.json
 *   - .svgrnrc.yaml / .svgrnrc.yml
 *   - .svgrnrc.js / .svgrnrc.mjs / .svgrnrc.cjs
 *   - svgrn.config.js / svgrn.config.mjs / svgrn.config.cjs
 *
 * Returns an empty object when no config file is found.
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<Partial<Config>> {
    const explorer = cosmiconfig('svgrn');
    const result = await explorer.search(cwd);

    if (!result || result.isEmpty) {
        return {};
    }

    return result.config as Partial<Config>;
}
