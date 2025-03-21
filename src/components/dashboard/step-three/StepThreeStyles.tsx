
import React from 'react';

export const StepThreeStyles = () => {
  const styles = `
    .editing-mode {
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      background-color: white;
      transition: border-color 0.2s ease;
    }

    .editing-mode:focus {
      outline: none;
      border-color: #33fea6;
      box-shadow: 0 0 0 1px rgba(51, 254, 166, 0.3);
    }

    .variable-highlight {
      background-color: rgba(51, 254, 166, 0.1);
      border-bottom: 1px solid #33fea6;
      display: inline-block;
      min-width: 4rem;
      font-weight: 500;
      color: inherit;
      padding: 0 0.25rem;
    }

    .non-editable-variable {
      background-color: rgba(51, 254, 166, 0.1);
      border-bottom: 1px solid #33fea6;
      display: inline-block;
      padding: 0 0.25rem;
      border-radius: 0.125rem;
      user-select: none;
      position: relative;
      font-weight: 500;
    }

    .edit-action-button {
      padding: 0.375rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
      transition: all 0.2s ease;
    }

    .edit-save-button {
      background-color: #33fea6;
      color: white;
    }

    .edit-save-button:hover {
      background-color: #22e696;
    }

    .edit-cancel-button {
      border: 1px solid #e2e8f0;
    }

    .edit-cancel-button:hover {
      border-color: #cbd5e1;
      background-color: #f8fafc;
    }

    .edit-icon-button {
      opacity: 0.5;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .edit-icon-button:hover {
      opacity: 1;
      transform: scale(1.1);
    }

    .edit-icon-button:hover .edit-icon {
      color: #33fea6;
    }
  `;

  return <style dangerouslySetInnerHTML={{ __html: styles }} />;
};
