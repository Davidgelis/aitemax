
import React from "react";

export const StepThreeStyles = () => {
  return (
    <style dangerouslySetInnerHTML={{
      __html: `
      .variable-placeholder {
        position: relative;
        border-radius: 4px;
        transition: background-color 0.3s ease;
      }

      .variable-placeholder:hover {
        background-color: rgba(51, 254, 166, 0.2);
      }

      .variable-highlight {
        position: relative;
        display: inline-block;
      }

      .editing-mode {
        outline: none;
        white-space: pre-wrap;
      }

      .editing-mode:focus {
        outline: none;
      }

      .non-editable-variable {
        background-color: rgba(51, 254, 166, 0.15);
        padding: 2px 4px;
        border-radius: 4px;
        border-bottom: 1px solid rgba(51, 254, 166, 0.7);
        font-weight: 500;
        display: inline-block;
        margin: 0 2px;
      }

      /* Ensure that multi-selection works well */
      .multi-selection-marker {
        background-color: rgba(51, 254, 166, 0.3);
        border-radius: 2px;
      }

      /* Add better styling for action buttons */
      .edit-action-button {
        font-size: 14px;
        padding: 6px 16px;
        transition: all 0.2s ease;
      }

      .edit-save-button {
        background-color: rgba(51, 254, 166, 0.8);
        color: #000;
        border: none;
      }

      .edit-save-button:hover {
        background-color: rgba(51, 254, 166, 1);
      }

      /* Variable styling */
      .variable-container {
        transition: all 0.2s ease;
      }

      .variable-container:hover {
        background-color: rgba(51, 254, 166, 0.05);
        border-radius: 6px;
      }
    `}} />
  );
};
