import React from 'react';

interface ProgressBarProps {
  value: number; // 0 a 100
  label?: string;
  className?: string;
}

export default function ProgressBar({ value, label, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5 font-medium">
          <span>{label}</span>
          <span className="font-mono text-slate-300">{clamped}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            clamped >= 80 ? 'bg-emerald-500' : clamped >= 40 ? 'bg-blue-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
