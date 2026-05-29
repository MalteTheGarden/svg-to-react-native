export interface Config {
    /** Directory to search for SVG files (recursively) */
    svgDir: string;
    /** Directory to write converted TSX components */
    outputDir: string;
    /** If set, a barrel export file is written at this path (opt-in) */
    exportFile?: string;
    /** If true, writes index.ts files in each output directory containing converted files */
    exportPerDirectory?: boolean;
    /** Casing applied to output filenames */
    filenameCase: 'pascal' | 'kebab' | 'camel';
    /** Attribute value replacements passed to SVGR, e.g. { "#fff": "{fill}" } */
    replaceAttrValues: Record<string, string>;
    /** Treat SVGs as icons (removes width/height from root element) */
    icon: boolean;
    /** Output React Native-compatible components (uses react-native-svg) */
    native: boolean;
    /** Preserve width/height dimensions in the component */
    dimensions: boolean;
    /** JSX transform to use */
    jsxRuntime: 'automatic' | 'classic';
}

/** Config with all optional fields resolved to concrete values */
export type ResolvedConfig = Required<Omit<Config, 'exportFile' | 'exportPerDirectory'>> & {
    exportFile?: string;
    exportPerDirectory: boolean;
};
