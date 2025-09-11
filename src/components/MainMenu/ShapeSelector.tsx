import React from 'react';
import { PieceShape } from '../../types';

interface ShapeOption {
  value: PieceShape;
  label: string;
  icon: string;
}

interface ShapeSelectorProps {
  selectedShape: PieceShape;
  onShapeChange: (shape: PieceShape) => void;
}

const SHAPE_OPTIONS: ShapeOption[] = [
  { value: 'square', label: '方形', icon: '⬜' },
  { value: 'triangle', label: '三角形', icon: '🔺' },
  { value: 'irregular', label: '异形', icon: '🧩' },
];

export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  selectedShape,
  onShapeChange,
}) => {
  return (
    <div>
      <h4 className="text-base font-medium text-slate-700 mb-3">拼图形状</h4>
      <div className="grid grid-cols-3 gap-2">
        {SHAPE_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`px-2 py-4 flex flex-col items-center gap-1 rounded-lg border-2 transition-all duration-200 ${              selectedShape === option.value                ? 'border-[var(--lavender)] bg-[var(--lavender)] text-[var(--text-primary)]'                : 'border-[var(--border-color)] bg-[var(--light-pink-1)] text-[var(--text-secondary)] hover:border-[var(--primary-pink)] hover:bg-[var(--light-pink-2)]'            }`}
            onClick={() => onShapeChange(option.value)}
          >
            <span className="text-2xl">{option.icon}</span>
            <span className="text-xs font-medium">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
