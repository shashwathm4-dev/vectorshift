// nodeRegistry.js
// Dynamically generates React Flow nodeTypes from configurations.
// No node type is registered by hand — everything is configuration-driven.

import React from 'react';
import { BaseNode } from '../components/BaseNode';
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
 * Generates the nodeTypes map dynamically for React Flow.
 */
export const createNodeTypes = (configs) => {
  return Object.fromEntries(
    configs.map((config) => [
      config.type,
      COMPONENT_OVERRIDES[config.type] || createNodeComponent(config),
    ])
  );
};
