// toolbar.js
// Toolbar with draggable node items, dynamically loaded from the backend registry.

import React, { useMemo } from 'react';
import { DraggableNode } from './draggableNode';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

// Group toolbar items by category for organized display
const CATEGORY_LABELS = {
  io: 'I/O',
  ai: 'AI',
  transform: 'Transform',
  logic: 'Logic',
  integration: 'Integration',
};

const selector = (state) => ({
  configs: state.configs,
  loadingConfigs: state.loadingConfigs,
});

export const PipelineToolbar = () => {
  const { configs, loadingConfigs } = useStore(selector, shallow);

  // Group items inside the component, dynamic based on fetched configs
  const groupedItems = useMemo(() => {
    return configs.reduce((groups, config) => {
      const cat = config.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        type: config.type,
        label: config.title,
        icon: config.icon,
      });
      return groups;
    }, {});
  }, [configs]);

  if (loadingConfigs) {
    return (
      <div className="toolbar loading">
        <div className="toolbar-inner" style={{ justifyContent: 'center', color: 'var(--text-muted)' }}>
          <span>Loading node configurations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="toolbar">
      <div className="toolbar-inner">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="toolbar-group">
            <span className="toolbar-group-label">
              {CATEGORY_LABELS[category] || category}
            </span>
            <div className="toolbar-items">
              {items.map((item) => (
                <DraggableNode
                  key={item.type}
                  type={item.type}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
