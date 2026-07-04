// BaseNode.js
// Core node renderer. All nodes are rendered through this component.
// Accepts a config object and optional renderBody override for custom content.

import React, { useMemo, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { FieldRenderer } from './FieldRenderer';
import { HANDLE_TYPE_COLORS, HANDLE_TYPES } from '../utils/handleTypes';

const selector = (state) => ({
  updateNodeField: state.updateNodeField,
});

/**
 * BaseNode — the single component that renders every node type.
 *
 * @param {Object} props.config - Node configuration (title, icon, inputs, outputs, fields)
 * @param {string} props.id - React Flow node ID
 * @param {Object} props.data - React Flow node data
 * @param {boolean} props.selected - Whether node is currently selected
 * @param {Function} [props.renderBody] - Optional custom body renderer (used by TextNode)
 */
export const BaseNode = ({ config, id, data, selected, renderBody }) => {
  const { updateNodeField } = useStore(selector, shallow);

  // Merge static config inputs with dynamic inputs (e.g. text node variables)
  const allInputs = useMemo(
    () => [...(config.inputs || []), ...(data?.dynamicInputs || [])],
    [config.inputs, data?.dynamicInputs]
  );
  const outputs = config.outputs || [];

  // Compute handle positions evenly spaced along the node edge
  const computeHandlePosition = useCallback((index, total) => {
    if (total <= 1) return '50%';
    const spacing = 100 / (total + 1);
    return `${spacing * (index + 1)}%`;
  }, []);

  // Compute validation state: check required fields
  const isValid = useMemo(() => {
    if (!config.fields) return true;
    return config.fields
      .filter((f) => f.required)
      .every((f) => {
        const val = data?.[f.key];
        if (val === undefined || val === null || val === '') return false;
        return true;
      });
  }, [config.fields, data]);

  const handleFieldChange = useCallback(
    (fieldKey, value) => {
      updateNodeField(id, fieldKey, value);
    },
    [id, updateNodeField]
  );

  // Initialize default values on first render
  React.useEffect(() => {
    if (!config.fields) return;
    config.fields.forEach((field) => {
      if (data?.[field.key] === undefined) {
        if (field.defaultValue !== undefined) {
          updateNodeField(id, field.key, field.defaultValue);
        } else if (field.defaultPattern) {
          const suffix = id.replace(/^.*-/, '');
          updateNodeField(id, field.key, `${field.defaultPattern}${suffix}`);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validationClass = isValid ? 'valid' : 'invalid';
  const selectedClass = selected ? 'selected' : '';
  const categoryClass = `node-cat-${config.category || 'default'}`;

  // Ensure the node has enough height to space out handles vertically and avoid label overlapping
  const maxHandles = Math.max(allInputs.length, outputs.length);
  const dynamicMinHeight = maxHandles > 1 ? 40 + maxHandles * 36 : undefined;

  return (
    <div
      className={`base-node ${validationClass} ${selectedClass} ${categoryClass}`}
      style={dynamicMinHeight ? { minHeight: dynamicMinHeight } : undefined}
    >
      {/* Header */}
      <div className="base-node-header">
        {config.icon && <span className="base-node-icon">{config.icon}</span>}
        <span className="base-node-title">{config.title}</span>
        {!isValid && <span className="base-node-badge" title="Missing required fields">⚠</span>}
      </div>

      {/* Body */}
      <div className="base-node-body">
        {renderBody ? (
          renderBody({ id, data, handleFieldChange })
        ) : (
          <FieldRenderer
            fields={config.fields}
            values={data || {}}
            onChange={handleFieldChange}
          />
        )}
      </div>

      {/* Input Handles (left side) */}
      {allInputs.map((input, idx) => (
        <Handle
          key={`input-${input.id}`}
          type="target"
          position={Position.Left}
          id={`${id}-${input.id}`}
          className="base-node-handle handle-input"
          style={{
            top: computeHandlePosition(idx, allInputs.length),
            borderColor: HANDLE_TYPE_COLORS[input.dataType] || HANDLE_TYPE_COLORS[HANDLE_TYPES.ANY],
          }}
          data-handletype={input.dataType || HANDLE_TYPES.ANY}
        >
          <span className="handle-label handle-label-left">{input.label || input.id}</span>
        </Handle>
      ))}

      {/* Output Handles (right side) */}
      {outputs.map((output, idx) => (
        <Handle
          key={`output-${output.id}`}
          type="source"
          position={Position.Right}
          id={`${id}-${output.id}`}
          className="base-node-handle handle-output"
          style={{
            top: computeHandlePosition(idx, outputs.length),
            borderColor: HANDLE_TYPE_COLORS[output.dataType] || HANDLE_TYPE_COLORS[HANDLE_TYPES.ANY],
          }}
          data-handletype={output.dataType || HANDLE_TYPES.ANY}
        >
          <span className="handle-label handle-label-right">{output.label || output.id}</span>
        </Handle>
      ))}
    </div>
  );
};
