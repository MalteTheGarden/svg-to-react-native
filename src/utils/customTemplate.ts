import { type Config } from '@svgr/core';
import toPascalCase from './toPascalCase.js';

/**
 * Custom SVGR template that generates a React Native-compatible SVG component.
 * The component accepts optional `fill` and `color` props and spreads remaining
 * props via `...rest`.
 */
const customTemplate: NonNullable<Config['template']> = (
    { componentName, imports, jsx },
    { tpl },
) => {
    const pascalCaseName = toPascalCase(componentName);

    return tpl`
    ${imports}

  const ${pascalCaseName} = ({ ...rest }: SvgProps) => (
      ${jsx}
    );
    export default ${pascalCaseName};
  `;
};

export default customTemplate;
