// Modal.js
// Polished modal for displaying pipeline analysis results.

import React from 'react';

export const Modal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const hasIssues = data.issues && data.issues.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Pipeline Analysis</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          {/* Stats grid */}
          <div className="modal-stats">
            <div className="modal-stat">
              <span className="modal-stat-value">{data.num_nodes}</span>
              <span className="modal-stat-label">Nodes</span>
            </div>
            <div className="modal-stat">
              <span className="modal-stat-value">{data.num_edges}</span>
              <span className="modal-stat-label">Edges</span>
            </div>
            <div className={`modal-stat ${data.is_dag ? 'stat-success' : 'stat-error'}`}>
              <span className="modal-stat-value">{data.is_dag ? '✅' : '❌'}</span>
              <span className="modal-stat-label">Is DAG</span>
            </div>
          </div>

          {/* Issues list */}
          {hasIssues && (
            <div className="modal-issues">
              <h3 className="modal-issues-title">Issues Found</h3>
              <ul className="modal-issues-list">
                {data.issues.map((issue, idx) => (
                  <li key={idx} className={`modal-issue modal-issue-${issue.type}`}>
                    <span className="modal-issue-icon">
                      {issue.type === 'cycle' ? '🔄' : '⚡'}
                    </span>
                    <div className="modal-issue-content">
                      <strong className="modal-issue-type">
                        {issue.type === 'cycle' ? 'Cycle Detected' : 'Unreachable Output'}
                      </strong>
                      <span className="modal-issue-detail">
                        {issue.type === 'cycle'
                          ? `Edge: ${issue.edge[0]} → ${issue.edge[1]}`
                          : `Node: ${issue.node}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasIssues && (
            <div className="modal-success">
              <span className="modal-success-icon">🎉</span>
              <p>Pipeline is valid! No issues found.</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
