// store.js
// Zustand store with typed handle connection validation, dynamic config fetching, and edge cleanup.

import { create } from 'zustand';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from 'reactflow';
import { getHandleType, areTypesCompatible } from './utils/handleTypes';

// Default sample pipeline so the canvas isn't empty on first load
const DEFAULT_NODES = [
  {
    id: 'customInput-1',
    type: 'customInput',
    position: { x: 100, y: 200 },
    data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'user_query', inputType: 'Text' },
  },
  {
    id: 'text-1',
    type: 'text',
    position: { x: 400, y: 180 },
    data: { id: 'text-1', nodeType: 'text', text: 'Answer the following question:\n{{question}}' },
  },
  {
    id: 'llm-1',
    type: 'llm',
    position: { x: 750, y: 200 },
    data: { id: 'llm-1', nodeType: 'llm' },
  },
  {
    id: 'customOutput-1',
    type: 'customOutput',
    position: { x: 1100, y: 220 },
    data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'response', outputType: 'Text' },
  },
];

const DEFAULT_EDGES = [
  {
    id: 'e-input-text',
    source: 'customInput-1',
    sourceHandle: 'customInput-1-value',
    target: 'text-1',
    targetHandle: 'text-1-question',
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
  },
  {
    id: 'e-text-llm',
    source: 'text-1',
    sourceHandle: 'text-1-output',
    target: 'llm-1',
    targetHandle: 'llm-1-prompt',
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
  },
  {
    id: 'e-llm-output',
    source: 'llm-1',
    sourceHandle: 'llm-1-response',
    target: 'customOutput-1',
    targetHandle: 'customOutput-1-value',
    type: 'smoothstep',
    animated: true,
    markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
  },
];

export const useStore = create((set, get) => ({
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
  nodeIDs: { customInput: 1, text: 1, llm: 1, customOutput: 1 },
  connectionError: null,
  
  // Dynamic JSON configs fetched from backend
  configs: [],
  nodeConfigs: {},
  loadingConfigs: true,

  fetchNodeConfigs: async () => {
    try {
      set({ loadingConfigs: true });
      const response = await fetch('http://localhost:8000/pipelines/node-configs');
      if (!response.ok) throw new Error('Failed to fetch node configs');
      const data = await response.json();
      
      const configMap = Object.fromEntries(data.map((cfg) => [cfg.type, cfg]));
      set({
        configs: data,
        nodeConfigs: configMap,
        loadingConfigs: false,
      });
    } catch (err) {
      console.error('Error fetching node configurations:', err);
      set({ loadingConfigs: false });
    }
  },

  connectNodeConfigsSSE: () => {
    const eventSource = new EventSource('http://localhost:8000/pipelines/node-configs/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const configMap = Object.fromEntries(data.map((cfg) => [cfg.type, cfg]));
        set({
          configs: data,
          nodeConfigs: configMap,
          loadingConfigs: false,
        });
      } catch (err) {
        console.error('Error parsing SSE configurations:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      // Fallback to static fetch once if SSE fails
      get().fetchNodeConfigs();
    };

    return () => {
      eventSource.close();
    };
  },

  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },

  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  /**
   * onConnect with typed handle validation.
   * Looks up source and target handle types. Blocks mismatched connections.
   */
  onConnect: (connection) => {
    const { nodes, nodeConfigs } = get();

    const sourceType = getHandleType(
      connection.source,
      connection.sourceHandle,
      nodes,
      nodeConfigs
    );
    const targetType = getHandleType(
      connection.target,
      connection.targetHandle,
      nodes,
      nodeConfigs
    );

    if (!areTypesCompatible(sourceType, targetType)) {
      set({
        connectionError: `Cannot connect ${sourceType} output to ${targetType} input`,
      });
      return; // Block the connection
    }

    set({
      edges: addEdge(
        {
          ...connection,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.Arrow,
            height: '20px',
            width: '20px',
          },
        },
        get().edges
      ),
      connectionError: null,
    });
  },

  /** Clear the connection error message */
  clearConnectionError: () => {
    set({ connectionError: null });
  },

  /** Update a single field on a node's data */
  updateNodeField: (nodeId, fieldName, fieldValue) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, [fieldName]: fieldValue },
          };
        }
        return node;
      }),
    });
  },

  /**
   * Remove all edges connected to a specific handle.
   * Used when text node variables are removed.
   */
  removeEdgesByHandle: (nodeId, handleId) => {
    set({
      edges: get().edges.filter(
        (edge) =>
          !(
            (edge.source === nodeId && edge.sourceHandle === handleId) ||
            (edge.target === nodeId && edge.targetHandle === handleId)
          )
      ),
    });
  },
}));
