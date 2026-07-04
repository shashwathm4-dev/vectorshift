// Toast.js
// Lightweight toast notification for connection warnings and errors.

import React, { useEffect } from 'react';

export const Toast = ({ message, type = 'error', duration = 3000, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{type === 'error' ? '⚠' : 'ℹ'}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close">×</button>
    </div>
  );
};
