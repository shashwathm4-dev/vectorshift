// textNode.js
// Special node with auto-resizing textarea and dynamic variable handles.
// Uses BaseNode with a custom renderBody for the textarea.

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { BaseNode } from '../components/BaseNode';
import { useStore } from '../store';
import { shallow } from 'zustand/shallow';
import { HANDLE_TYPES } from '../utils/handleTypes';

const VARIABLE_REGEX = /{{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}}/g;

/** Extract unique variable names from text */
const extractVariables = (text) => {
  const vars = new Set();
  let match;
  while ((match = VARIABLE_REGEX.exec(text)) !== null) {
    vars.add(match[1]);
  }
  return Array.from(vars);
};

const selector = (state) => ({
  updateNodeField: state.updateNodeField,
  removeEdgesByHandle: state.removeEdgesByHandle,
  configs: state.configs,
});

export const TextNode = ({ id, data, selected }) => {
  const { updateNodeField, removeEdgesByHandle, configs } = useStore(selector, shallow);
  const [text, setText] = useState(data?.text ?? '{{input}}');
  const prevVarsRef = useRef([]);
  const textareaRef = useRef(null);

  // Sync variables → dynamic handles on every text change
  const syncVariables = useCallback(
    (newText) => {
      const newVars = extractVariables(newText);
      const prevVars = prevVarsRef.current;

      // Find removed variables and clean up their edges
      const removed = prevVars.filter((v) => !newVars.includes(v));
      removed.forEach((v) => {
        removeEdgesByHandle(id, `${id}-${v}`);
      });

      // Update dynamic inputs
      const dynamicInputs = newVars.map((v) => ({
        id: v,
        label: v,
        dataType: HANDLE_TYPES.TEXT,
      }));

      updateNodeField(id, 'dynamicInputs', dynamicInputs);
      updateNodeField(id, 'text', newText);
      prevVarsRef.current = newVars;
    },
    [id, updateNodeField, removeEdgesByHandle]
  );

  // Auto-resize the textarea height to fit content exactly, preventing scrollbars
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    syncVariables(text);
    adjustHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Adjust height when text changes
  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  const handleTextChange = useCallback(
    (e) => {
      const newText = e.target.value;
      setText(newText);
      syncVariables(newText);
    },
    [syncVariables]
  );

  // Find the text node config from fetched configs
  const nodeConfig = useMemo(() => {
    return configs.find((c) => c.type === 'text') || {
      type: 'text',
      title: 'Text',
      icon: '📝',
      category: 'transform',
      inputs: [],
      outputs: [{ id: 'output', label: 'Output', dataType: 'text' }],
    };
  }, [configs]);

  const renderBody = useCallback(
    () => (
      <div className="base-node-fields">
        <div className="base-node-field-group">
          <label className="base-node-label" htmlFor={`${id}-text`}>
            Text
          </label>
          <textarea
            ref={textareaRef}
            id={`${id}-text`}
            className="base-node-textarea"
            value={text}
            onChange={handleTextChange}
            placeholder="Type text... use {{variable}} for inputs"
            rows={2}
            style={{ overflow: 'hidden', resize: 'none' }}
          />
        </div>
      </div>
    ),
    [id, text, handleTextChange]
  );

  return (
    <BaseNode
      config={nodeConfig}
      id={id}
      data={data}
      selected={selected}
      renderBody={renderBody}
    />
  );
};
