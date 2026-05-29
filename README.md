# svg-to-react-native

Convert SVG files into React Native component files using a single CLI command.

The converter:

- Scans your input directory recursively
- Converts every `.svg` to `.tsx`
- Recreates the same nested folder structure in your output directory
- Deletes each original `.svg` after successful conversion
- Optionally generates a barrel export file

## Install

```bash
pnpm add -D svg-to-react-native
```

Or run it without installing:

```bash
pnpm dlx svg-to-react-native --help
```

## Quick Start

```bash
svg-to-react-native \
	--svg-dir ./assets/icons \
	--output-dir ./src/icons \
	--export-file
```

`--export-file` with no value writes `index.ts` inside each output directory that receives converted files.

## CLI Options

```text
Usage: svg-to-react-native [options]

Options:
	-s, --svg-dir <path>          Input directory containing SVG files
	-o, --output-dir <path>       Output directory for converted components
	-e, --export-file [path]      Generate export file(s): no path=per directory, with path=single barrel file
	-r, --replace-attr <pair...>  Attribute replacement: "from=to"
	-c, --filename-case <case>    pascal | kebab | camel
	-i, --icon [boolean]          Treat SVGs as icons
	-n, --native [boolean]        Output React Native-compatible components
	-d, --dimensions [boolean]    Preserve width/height attributes
	-j, --jsx-runtime <runtime>   automatic | classic
	-V, --version                 Print version
	-h, --help                    Show help
```

## Config File Support

The CLI reads config with cosmiconfig using the module name `svgrn`.

Supported locations include:

- `.svgrnrc`
- `.svgrnrc.json`
- `.svgrnrc.yaml`
- `.svgrnrc.yml`
- `.svgrnrc.js`
- `.svgrnrc.mjs`
- `.svgrnrc.cjs`
- `svgrn.config.js`
- `svgrn.config.mjs`
- `svgrn.config.cjs`
- `package.json` under the `svgrn` key

CLI flags override config file values.

### Example: .svgrnrc.json

```json
{
	"svgDir": "./assets/icons",
	"outputDir": "./src/icons",
	"exportFile": "./src/icons/index.ts",
	"filenameCase": "pascal",
	"replaceAttrValues": {
		"#2E2313": "{fill}",
		"#000": "{color}"
	},
	"icon": false,
	"native": true,
	"dimensions": false,
	"jsxRuntime": "automatic"
}
```

### Example: package.json

```json
{
	"name": "my-app",
	"svgrn": {
		"svgDir": "./assets/icons",
		"outputDir": "./src/icons",
		"filenameCase": "pascal"
	}
}
```

## Example Workflows

### 1. Convert everything and generate exports

```bash
svg-to-react-native -s ./assets/icons -o ./src/icons -e
```

With this mode, nested output folders get their own `index.ts` automatically.

### 2. Use a custom export file path

```bash
svg-to-react-native -s ./assets/icons -o ./src/icons -e ./src/icons/exports.ts
```

With a custom path, a single barrel file is generated at that exact location.

### 3. Replace hardcoded color values

```bash
svg-to-react-native \
	-s ./assets/icons \
	-o ./src/icons \
	-r "#2E2313={fill}" "#000={color}"
```

### 4. Keep dimensions and use classic JSX runtime

```bash
svg-to-react-native \
	-s ./assets/icons \
	-o ./src/icons \
	-d true \
	-j classic
```

## Input and Output Behavior

If your input looks like this:

```text
assets/icons/
	social/
		twitter.svg
	navigation/
		home.svg
```

And you run:

```bash
svg-to-react-native -s ./assets/icons -o ./src/icons
```

The output will look like this:

```text
src/icons/
	index.ts
	social/
		twitter.tsx
		index.ts
	navigation/
		home.tsx
		index.ts
```

Original `.svg` files are removed after successful conversion.

## Notes

- This package is focused on CLI usage.
- Generated components target React Native SVG usage.
- Run `svg-to-react-native --help` for the latest option list.

## License

MIT
