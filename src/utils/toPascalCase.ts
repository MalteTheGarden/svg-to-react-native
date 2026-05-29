const toPascalCase = (text: string): string => {
    // Normalize separators and strip unsupported identifier characters.
    const normalized = text
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const pascal = normalized
        .split('-')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    const fallback = pascal || 'Icon';

    // JS identifiers cannot start with a digit.
    if (/^[A-Za-z_]/.test(fallback)) {
        return fallback;
    }

    return `Icon${fallback}`;
};

export default toPascalCase;
