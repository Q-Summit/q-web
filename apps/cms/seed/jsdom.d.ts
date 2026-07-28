// jsdom ships no types and @types/jsdom is not an installed dependency; the
// seed scripts only pass the JSDOM constructor through to
// @payloadcms/richtext-lexical's convertHTMLToLexical (which types it as
// `any`), so an ambient `any`-typed module declaration is sufficient here.
declare module "jsdom";
