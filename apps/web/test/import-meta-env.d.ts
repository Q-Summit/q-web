// The "node" vitest project imports src/lib modules that read
// import.meta.env at module load (vitest defines it at runtime; Astro's
// astro/client types cover it in src builds). This shim gives the node
// typecheck the same shape without pulling in Astro's DOM-flavored client
// types, which would collide with @types/node here the same way the Workers
// types would (see tsconfig.node.json header).
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
