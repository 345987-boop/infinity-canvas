import React from 'react';

interface ToolbarProps {
  onShapeSelect: () => void;
  onReset: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ onShapeSelect, onReset }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-content">
        <button className="reset-btn" onClick={onReset}>
          Reset
        </button>
        <button className="create-btn" onClick={onShapeSelect}>
          Create
        </button>
      </div>
    </div>
  );
};

export default Toolbar;