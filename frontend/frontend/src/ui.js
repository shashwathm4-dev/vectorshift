// ui.js
// Pipeline editor canvas with React Flow.

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { createNodeTypes } from './nodes/nodeRegistry';
import { Toast } from './components/Toast';

import 'reactflow/dist/style.css';

const gridSize = 20;
const proOptions = { hideAttribution: true };

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  connectionError: state.connectionError,
  clearConnectionError: state.clearConnectionError,
  configs: state.configs,
  connectNodeConfigsSSE: state.connectNodeConfigsSSE,
});

export const PipelineUI = () => {
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const {
    nodes,
    edges,
    getNodeID,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    connectionError,
    clearConnectionError,
    configs,
    connectNodeConfigsSSE,
  } = useStore(selector, shallow);

  // Maintain real-time Server-Sent Events (SSE) connection to pick up config updates instantly
  useEffect(() => {
    const disconnect = connectNodeConfigsSSE();
    return () => disconnect();
  }, [connectNodeConfigsSSE]);

  // Compute node types dynamically from fetched server configs
  const nodeTypes = useMemo(() => {
    return createNodeTypes(configs);
  }, [configs]);

  const getInitNodeData = (nodeID, type) => ({
    id: nodeID,
    nodeType: type,
  });

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(
          event.dataTransfer.getData('application/reactflow')
        );
        const type = appData?.nodeType;

        if (typeof type === 'undefined' || !type) return;

        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        addNode(newNode);
      }
    },
    [reactFlowInstance, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <>
      <div ref={reactFlowWrapper} className="reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapGrid={[gridSize, gridSize]}
          connectionLineType="smoothstep"
        >
          <Background color="#334155" gap={gridSize} />
          <Controls />
          <MiniMap
            nodeStrokeColor="#6366f1"
            nodeColor="#1e293b"
            nodeBorderBorder={8}
            maskColor="rgba(15, 23, 42, 0.7)"
          />
        </ReactFlow>
      </div>

      <Toast
        message={connectionError}
        type="error"
        onClose={clearConnectionError}
      />
    </>
  );
};
