// CLI flag helpers shared by content scripts (and any future root CLIs).

/**
 * @param {string[]} [argv]
 * @returns {string[]}
 */
export function argvWithoutSeparators(argv = process.argv) {
  return argv.filter((a) => a !== "--");
}

/**
 * Value immediately after `flag`, or undefined if the flag is absent.
 * @param {string} flag
 * @param {string[]} [argv]
 * @returns {string | undefined}
 */
export function argValue(flag, argv = process.argv) {
  const args = argvWithoutSeparators(argv);
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}

/**
 * @param {string} flag
 * @param {string[]} [argv]
 * @returns {boolean}
 */
export function hasFlag(flag, argv = process.argv) {
  return argvWithoutSeparators(argv).includes(flag);
}

/**
 * Parse a comma-separated list flag. Omitted → `whenOmitted`; `all` → `whenAll`.
 * @param {string | undefined} raw
 * @param {readonly string[]} whenOmitted
 * @param {readonly string[]} [whenAll]
 * @returns {string[]}
 */
export function parseList(raw, whenOmitted, whenAll = whenOmitted) {
  if (raw === undefined) return [...whenOmitted];
  if (raw === "all") return [...whenAll];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
