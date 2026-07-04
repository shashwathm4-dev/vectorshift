// toolbar.js
// Toolbar with draggable node items, auto-generated from the registry.

import { DraggableNode } from './draggableNode';
import { toolbarItems } from './nodes/nodeRegistry';

// Group toolbar items by category for organized display
const CATEGORY_LABELS = {
  io: 'I/O',
  ai: 'AI',
  transform: 'Transform',
  logic: 'Logic',
  integration: 'Integration',
};

const groupedItems = toolbarItems.reduce((groups, item) => {
  const cat = item.category || 'other';
  if (!groups[cat]) groups[cat] = [];
  groups[cat].push(item);
  return groups;
}, {});

export const PipelineToolbar = () => {
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
