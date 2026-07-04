// textNode.js
// Special node with auto-resizing textarea and dynamic variable handles.
// Uses BaseNode with a custom renderBody for the textarea.

import React, { useState, useCallback, useEffect, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { BaseNode } from '../components/BaseNode';
import { NODE_CONFIGS } from '../nodeConfigs';
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
});

export const TextNode = ({ id, data, selected }) => {
  const { updateNodeField, removeEdgesByHandle } = useStore(selector, shallow);
  const [text, setText] = useState(data?.text ?? '{{input}}');
  const prevVarsRef = useRef([]);

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

  // Initialize on mount
  useEffect(() => {
    syncVariables(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextChange = useCallback(
    (e) => {
      const newText = e.target.value;
      setText(newText);
      syncVariables(newText);
    },
    [syncVariables]
  );

  const renderBody = useCallback(
    () => (
      <div className="base-node-fields">
        <div className="base-node-field-group">
          <label className="base-node-label" htmlFor={`${id}-text`}>
            Text
          </label>
          <TextareaAutosize
            id={`${id}-text`}
            className="base-node-textarea"
            value={text}
            onChange={handleTextChange}
            minRows={2}
            maxRows={8}
            placeholder="Type text... use {{variable}} for inputs"
          />
        </div>
      </div>
    ),
    [id, text, handleTextChange]
  );

  return (
    <BaseNode
      config={NODE_CONFIGS.text}
      id={id}
      data={data}
      selected={selected}
      renderBody={renderBody}
    />
  );
};
