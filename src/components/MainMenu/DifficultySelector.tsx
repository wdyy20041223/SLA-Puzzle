import React from 'react';
import { DifficultyLevel } from '../../types';

interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  colorClass: string;
}

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
}

// 使用马卡龙色系来区分不同难度
const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'easy', label: '简单 (3×3)', colorClass: 'border-[var(--accent-green)] bg-[var(--accent-green)]' },
  { value: 'medium', label: '中等 (4×4)', colorClass: 'border-[var(--lavender)] bg-[var(--lavender)]' },
  { value: 'hard', label: '困难 (5×5)', colorClass: 'border-[var(--accent-yellow)] bg-[var(--accent-yellow)]' },
  { value: 'expert', label: '专家 (6×6)', colorClass: 'border-[var(--secondary-pink)] bg-[var(--secondary-pink)]' },
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onDifficultyChange,
}) => {
  return (
    <div>
      <h4 className="text-base font-medium text-[var(--text-primary)] mb-3">难度等级</h4>
      <div className="grid grid-cols-1 gap-2">
        {DIFFICULTY_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`px-4 py-3 text-left text-sm font-medium rounded-lg border-2 transition-all duration-200 ${              selectedDifficulty === option.value                ? `${option.colorClass} text-[var(--text-primary)] border-transparent shadow-[var(--shadow-pink)] opacity-100`                : 'border-[var(--border-color)] bg-[var(--light-pink-1)] text-[var(--text-secondary)] hover:border-[var(--primary-pink)] hover:bg-[var(--light-pink-2)] opacity-100'            }`}
            onClick={() => onDifficultyChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
