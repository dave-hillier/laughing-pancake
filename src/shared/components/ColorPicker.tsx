import React, { useState, useRef, useEffect } from 'react';
import type { Color } from '../types';
import './ColorPicker.css';

interface ColorPickerProps {
  label: string;
  value: Color;
  onChange: (color: Color) => void;
  showAlpha?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  value,
  onChange,
  showAlpha = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const toHex = (c: Color): string => {
    const r = Math.round(c.r * 255)
      .toString(16)
      .padStart(2, '0');
    const g = Math.round(c.g * 255)
      .toString(16)
      .padStart(2, '0');
    const b = Math.round(c.b * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  const fromHex = (hex: string): Color => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
        a: value.a,
      };
    }
    return value;
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (hex.length === 7 || hex.length === 4) {
      onChange(fromHex(hex));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(fromHex(e.target.value));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="color-picker-container" ref={pickerRef}>
      <div className="color-picker-header">
        <label className="color-picker-label">{label}</label>
        <div className="color-picker-preview-container">
          <button
            className="color-picker-preview"
            style={{ backgroundColor: toHex(value) }}
            onClick={() => setIsOpen(!isOpen)}
          />
          <input
            type="text"
            className="color-picker-hex"
            value={toHex(value)}
            onChange={handleHexChange}
          />
        </div>
      </div>
      {isOpen && (
        <div className="color-picker-popup">
          <input
            type="color"
            className="color-picker-native"
            value={toHex(value)}
            onChange={handleColorChange}
          />
          {showAlpha && (
            <div className="color-picker-alpha">
              <label>Alpha</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value.a ?? 1}
                onChange={e =>
                  onChange({ ...value, a: parseFloat(e.target.value) })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
