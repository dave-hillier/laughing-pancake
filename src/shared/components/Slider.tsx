import React from 'react';
import './Slider.css';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  showValue?: boolean;
  unit?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  showValue = true,
  unit = '',
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      onChange(Math.min(max, Math.max(min, newValue)));
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="slider-container">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        {showValue && (
          <input
            type="number"
            className="slider-value"
            value={value.toFixed(step >= 1 ? 0 : 2)}
            min={min}
            max={max}
            step={step}
            onChange={handleInputChange}
          />
        )}
        {unit && <span className="slider-unit">{unit}</span>}
      </div>
      <input
        type="range"
        className="slider-input"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleInputChange}
        style={{
          background: `linear-gradient(to right, #4a9eff 0%, #4a9eff ${percentage}%, #3a3a3a ${percentage}%, #3a3a3a 100%)`,
        }}
      />
    </div>
  );
};
