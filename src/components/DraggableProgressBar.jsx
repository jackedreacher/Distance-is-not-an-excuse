import { useState, useRef, useEffect } from 'react';
import './DraggableProgressBar.css';

const DraggableProgressBar = ({ 
  value = 0, 
  onChange, 
  min = 0, 
  max = 100, 
  label = 'Progress',
  color = '#87CEEB',
  height = 8,
  showValue = true 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const progressRef = useRef(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateValue(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newValue = min + (max - min) * percentage;
      setCurrentValue(newValue);
      if (onChange) {
        onChange(newValue);
      }
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="draggable-progress-container">
      {label && (
        <div className="progress-label">
          <span>{label}</span>
          {showValue && (
            <span className="progress-value">
              {Math.round(currentValue)}/{max}
            </span>
          )}
        </div>
      )}
      <div 
        ref={progressRef}
        className="progress-track"
        style={{ height: `${height}px` }}
        onMouseDown={handleMouseDown}
      >
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
            height: '100%'
          }}
        />
        <div 
          className="progress-thumb"
          style={{ 
            left: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export default DraggableProgressBar;