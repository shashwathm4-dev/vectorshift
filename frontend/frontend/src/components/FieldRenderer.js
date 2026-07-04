// FieldRenderer.js
// Renders form fields from a config array. Pure presentational component.

import React from 'react';

/**
 * Renders a single field based on its type configuration.
 * Supports: text, select, textarea, number, checkbox, static.
 */
const renderField = (field, value, onChange) => {
  const handleChange = (e) => {
    const val = field.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(field.key, field.type === 'number' ? Number(val) : val);
  };

  switch (field.type) {
    case 'select':
      return (
        <select
          id={field.key}
          className="base-node-select"
          value={value ?? field.defaultValue ?? ''}
          onChange={handleChange}
        >
          {(field.options || []).map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      );

    case 'textarea':
      return (
        <textarea
          id={field.key}
          className="base-node-textarea"
          value={value ?? field.defaultValue ?? ''}
          onChange={handleChange}
          rows={field.rows || 3}
          placeholder={field.placeholder || ''}
        />
      );

    case 'number':
      return (
        <input
          id={field.key}
          className="base-node-input"
          type="number"
          value={value ?? field.defaultValue ?? 0}
          onChange={handleChange}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder || ''}
        />
      );

    case 'checkbox':
      return (
        <label className="base-node-checkbox-label">
          <input
            id={field.key}
            type="checkbox"
            checked={value ?? field.defaultValue ?? false}
            onChange={handleChange}
          />
          <span>{field.checkboxLabel || ''}</span>
        </label>
      );

    case 'static':
      return (
        <p className="base-node-static">{field.content}</p>
      );

    case 'text':
    default:
      return (
        <input
          id={field.key}
          className="base-node-input"
          type="text"
          value={value ?? field.defaultValue ?? ''}
          onChange={handleChange}
          placeholder={field.placeholder || ''}
        />
      );
  }
};

/**
 * Renders all fields for a node from its config.
 * @param {Array} fields - Field config array from node config
 * @param {Object} values - Current field values from node data
 * @param {Function} onChange - Callback (fieldKey, value) => void
 */
export const FieldRenderer = ({ fields, values, onChange }) => {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="base-node-fields">
      {fields.map((field) => (
        <div key={field.key} className="base-node-field-group">
          {field.type !== 'checkbox' && field.type !== 'static' && (
            <label className="base-node-label" htmlFor={field.key}>
              {field.label}
              {field.required && <span className="required-marker">*</span>}
            </label>
          )}
          {renderField(field, values[field.key], onChange)}
        </div>
      ))}
    </div>
  );
};
