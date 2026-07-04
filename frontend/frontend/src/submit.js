// submit.js
// Submit button: posts pipeline to backend and shows results in a modal.

import { useState, useCallback } from 'react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import { Modal } from './components/Modal';

const API_URL = 'http://localhost:8000/pipelines/parse';

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
});

export const SubmitButton = () => {
  const { nodes, edges } = useStore(selector, shallow);
  const [modalData, setModalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setModalData(data);
      setIsModalOpen(true);
    } catch (error) {
      setModalData({
        num_nodes: nodes.length,
        num_edges: edges.length,
        is_dag: false,
        issues: [
          {
            type: 'error',
            node: error.message || 'Failed to connect to backend',
          },
        ],
      });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalData(null);
  }, []);

  return (
    <div className="submit-container">
      <button
        className="submit-btn"
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="submit-spinner" />
            Analyzing...
          </>
        ) : (
          <>
            <span className="submit-icon">▶</span>
            Submit Pipeline
          </>
        )}
      </button>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} data={modalData} />
    </div>
  );
};
