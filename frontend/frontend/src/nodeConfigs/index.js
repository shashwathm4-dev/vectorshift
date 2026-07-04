// nodeConfigs/index.js
// Auto-discovers all JSON configs in this directory using webpack's require.context.
// Rebuild triggered to pick up new json config.
// To add a new node: just drop a JSON file here. No other file needs to change.

const ctx = require.context('./', false, /\.json$/);

/** All node configs as an ordered array (sorted by category, then title) */
export const configs = ctx
  .keys()
  .map((key) => ctx(key))
  .sort((a, b) => {
    const categoryOrder = { io: 0, ai: 1, transform: 2, integration: 3, logic: 4 };
    const ca = categoryOrder[a.category] ?? 99;
    const cb = categoryOrder[b.category] ?? 99;
    if (ca !== cb) return ca - cb;
    return a.title.localeCompare(b.title);
  });

/** Configs keyed by node type — used for handle type lookups */
export const NODE_CONFIGS = Object.fromEntries(
  configs.map((cfg) => [cfg.type, cfg])
);
