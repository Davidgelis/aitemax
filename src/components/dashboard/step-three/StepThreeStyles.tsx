
export const StepThreeStyles = () => {
  return (
    <style>
      {`
      .variable-highlight {
        background: white;
        border: 1px solid #64bf95;
        border-radius: 2px;
        padding: 1px 2px;
        margin: 0 1px;
      }
      
      .variable-card {
        background: white;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        transition: all 0.2s ease;
      }
      
      .variable-card:hover {
        box-shadow: 0 3px 6px rgba(0,0,0,0.1);
      }
      
      .aurora-button {
        position: relative;
        overflow: hidden;
        background: linear-gradient(90deg, #041524, #084b49, #64bf95, #64bf95, white);
        background-size: 300% 100%;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 500;
        animation: aurora 8s ease infinite;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }
      
      .analyze-button {
        background: linear-gradient(to right, #22c55e, #4ade80);
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .analyze-button:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      @keyframes aurora {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .aurora-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(100, 191, 149, 0.1);
      }
      
      /* Updated variable selection hover styles */
      .variable-selection-btn:hover {
        color: #33fea6;
        border-color: #33fea6;
        background-color: white;
      }
      
      .variable-active {
        background-color: rgba(51, 254, 166, 0.2);
        border-color: #33fea6;
      }
      
      /* New editing mode styles */
      .editing-mode {
        background-color: #ddfff0 !important;
        border-color: #33fea6 !important;
        outline-color: #33fea6 !important;
      }
      
      .editing-mode:focus {
        border-color: #33fea6 !important;
        outline-color: #33fea6 !important;
        box-shadow: 0 0 0 2px rgba(51, 254, 166, 0.2) !important;
      }
      `}
    </style>
  );
};
