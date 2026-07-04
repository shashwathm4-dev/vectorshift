// handleTypes.js
// Data type constants for typed handles and connection validation.

export const HANDLE_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DOCUMENT: 'document',
  TABLE: 'table',
  ANY: 'any',
};

/** Color map for visual differentiation of handle types */
export const HANDLE_TYPE_COLORS = {
  [HANDLE_TYPES.TEXT]: '#8b5cf6',
  [HANDLE_TYPES.NUMBER]: '#3b82f6',
  [HANDLE_TYPES.BOOLEAN]: '#f59e0b',
  [HANDLE_TYPES.DOCUMENT]: '#10b981',
  [HANDLE_TYPES.TABLE]: '#ec4899',
  [HANDLE_TYPES.ANY]: '#94a3b8',
};

/**
 * Look up the declared data type for a specific handle on a node.
 * Searches both static config handles and dynamic handles stored in node.data.
 */
export const getHandleType = (nodeId, handleId, nodes, nodeConfigs) => {
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const config = nodeConfigs[node.type];
  if (!config) return null;

  // Check dynamic handles (e.g. text node variables)
  const dynamicInputs = node.data?.dynamicInputs || [];
  const dynamicMatch = dynamicInputs.find(
    (h) => `${nodeId}-${h.id}` === handleId || h.id === handleId
  );
  if (dynamicMatch) return dynamicMatch.dataType || HANDLE_TYPES.TEXT;

  // Check static config handles
  const allHandles = [...(config.inputs || []), ...(config.outputs || [])];
  const match = allHandles.find(
    (h) => `${nodeId}-${h.id}` === handleId || h.id === handleId
  );

  return match?.dataType || HANDLE_TYPES.ANY;
};

/**
 * Check if two handle types are compatible for connection.
 * ANY type is compatible with everything.
 */
export const areTypesCompatible = (sourceType, targetType) => {
  if (!sourceType || !targetType) return true;
  if (sourceType === HANDLE_TYPES.ANY || targetType === HANDLE_TYPES.ANY) return true;
  return sourceType === targetType;
};
