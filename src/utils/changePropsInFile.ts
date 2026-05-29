import fsp from 'fs/promises';
import chalk from 'chalk';

/**
 * Post-processes a generated component file:
 * - Renames JSX spread `...props` → `...rest`
 * - Adds `fill`/`color` props only when they are referenced in JSX
 * - Normalizes import order to `import type` first, then value import
 * - Adds a blank line after each import statement for readability
 */
const changePropsInFile = async (filePath: string): Promise<void> => {
    try {
        let content = await fsp.readFile(filePath, 'utf8');

        const usesFill = /=\{fill\}/.test(content);
        const usesColor = /=\{color\}/.test(content);

        const propParts = [
            ...(usesFill ? ['fill'] : []),
            ...(usesColor ? ['color'] : []),
            '...rest',
        ];
        const typeParts = [
            ...(usesFill ? ['fill?: string'] : []),
            ...(usesColor ? ['color?: string'] : []),
        ];
        const signatureType = typeParts.length
            ? `SvgProps & { ${typeParts.join('; ')} }`
            : 'SvgProps';

        content = content.replace(/\{\.\.\.props\}/g, '{...rest}');
        content = content.replace(
            /\(\{[^)]*\}:\s*SvgProps(?:\s*&\s*\{[^}]*\})?\)/,
            `({ ${propParts.join(', ')} }: ${signatureType})`,
        );

        // Keep output consistent: type import first, then runtime import.
        const typeImportMatch = content.match(
            /import type \{ SvgProps \} from ['"]react-native-svg['"];\n?/,
        );
        const valueImportMatch = content.match(
            /import Svg, \{[^}]+\} from ['"]react-native-svg['"];\n?/,
        );
        if (typeImportMatch && valueImportMatch) {
            content = content
                .replace(typeImportMatch[0], '')
                .replace(valueImportMatch[0], '');

            content =
                `${typeImportMatch[0].trim()}\n\n${valueImportMatch[0].trim()}\n\n` +
                content.trimStart();
        }

        content = content.replace(/import[^;]+;\n/g, (match: string) => match + '\n');

        await fsp.writeFile(filePath, content, 'utf8');
    } catch (error) {
        console.error(
            chalk.red(`❌ Error post-processing ${filePath}:`),
            (error as Error).message,
        );
        throw error;
    }
};

export default changePropsInFile;
