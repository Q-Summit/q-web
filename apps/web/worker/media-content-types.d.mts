// Types for media-content-types.mjs so the Worker's isolated tsconfig
// (types: [], no allowJs) can import the shared map under strict mode.
export const EXTENSION_CONTENT_TYPES: Record<string, string>;
export function extensionContentType(key: string): string | undefined;
