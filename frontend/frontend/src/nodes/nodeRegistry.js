// nodeRegistry.js
// Auto-generates React Flow nodeTypes and toolbar items from JSON configs.
// No node type is registered by hand — everything flows from nodeConfigs/.

import React from 'react';
import { BaseNode } from '../components/BaseNode';
import { configs, NODE_CONFIGS } from '../nodeConfigs';
import { TextNode } from './textNode';

/**
 * Creates a component for a given JSON config.
 * Pure data in → React component out. Zero per-node custom JSX.
 */
const createNodeComponent = (config) => {
  const NodeComponent = (props) => (
    <BaseNode config={config} {...props} />
  );
  NodeComponent.displayName = `${config.title.replace(/[\s/]/g, '')}Node`;
  return NodeComponent;
};

/**
 * Special component overrides, keyed by node type.
 * Only nodes with truly custom render logic belong here.
 * Every other node is auto-generated from its JSON config.
 */
const COMPONENT_OVERRIDES = {
  text: TextNode,
};

/**
 * nodeTypes map for React Flow — populated entirely from JSON configs.
 */
export const nodeTypes = Object.fromEntries(
  configs.map((config) => [
    config.type,
    COMPONENT_OVERRIDES[config.type] || createNodeComponent(config),
  ])
);

/**
 * Toolbar items derived from JSON configs.
 */
export const toolbarItems = configs.map((config) => ({
  type: config.type,
  label: config.title,
  icon: config.icon,
  category: config.category,
}));

// Re-export for consumers that need the config map
export { NODE_CONFIGS };
