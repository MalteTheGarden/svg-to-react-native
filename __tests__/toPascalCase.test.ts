import { describe, it, expect } from '@jest/globals';
import toPascalCase from '../src/utils/toPascalCase.js';

describe('toPascalCase', () => {
    it('converts a simple word', () => {
        expect(toPascalCase('icon')).toBe('Icon');
    });

    it('converts kebab-case', () => {
        expect(toPascalCase('my-icon')).toBe('MyIcon');
    });

    it('converts multi-segment kebab-case', () => {
        expect(toPascalCase('social-media-icon')).toBe('SocialMediaIcon');
    });

    it('leaves already-PascalCase input unchanged', () => {
        expect(toPascalCase('MyIcon')).toBe('MyIcon');
    });

    it('handles a single character', () => {
        expect(toPascalCase('a')).toBe('A');
    });

    it('handles a trailing hyphen segment', () => {
        expect(toPascalCase('icon-a')).toBe('IconA');
    });

    it('prefixes names that start with digits', () => {
        expect(toPascalCase('0kr')).toBe('Icon0kr');
    });

    it('normalizes symbols and separators', () => {
        expect(toPascalCase('money_0kr!')).toBe('Money0kr');
    });
});
