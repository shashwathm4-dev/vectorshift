// nodeConfigs/index.js
// Explicit imports of all JSON configs. To add a new node type,
// import its JSON file here and add it to the `configs` array.
// No other file needs to change.

import input from './input.json';
import output from './output.json';
import llm from './llm.json';
import text from './text.json';
import apiWebhook from './apiWebhook.json';
import fileUpload from './fileUpload.json';
import branch from './branch.json';
import loop from './loop.json';
import mathTransform from './mathTransform.json';
import portfolioAlert from './portfolioAlert.json';

/** All node configs as an ordered array */
export const configs = [
  input,
  output,
  llm,
  text,
  apiWebhook,
  fileUpload,
  branch,
  loop,
  mathTransform,
  portfolioAlert,
];

/** Configs keyed by node type — used for handle type lookups */
export const NODE_CONFIGS = Object.fromEntries(
  configs.map((cfg) => [cfg.type, cfg])
);
