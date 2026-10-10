'use client';

import React from 'react';

interface ScoreGaugeProps {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  size?: number;
  strokeWidth?: number;
  coverageScore?: number;
}

export function ScoreGauge({
  score,
  grade,
  size = 180,
  strokeWidth = 14,
  coverageScore,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return { stroke: '#10B981', glow: 'rgba(16, 185, 129, 0.3)', text: 'text-emerald-400' };
    if (s >= 80) return { stroke: '#06B6D4', glow: 'rgba(6, 182, 212, 0.3)', text: 'text-cyan-400' };
    if (s >= 70) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)', text: 'text-amber-400' };
    if (s >= 50) return { stroke: '#F97316', glow: 'rgba(249, 115, 22, 0.3)', text: 'text-orange-400' };
    return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.3)', text: 'text-red-400' };
  };

  const style = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          style={{ filter: `drop-shadow(0 0 12px ${style.glow})` }}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={style.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-extrabold font-mono tracking-tight ${style.text}`}>
            {grade}
          </span>
          <span className="text-xl font-bold text-white font-mono mt-0.5">
            {score}<span className="text-xs text-slate-400 font-sans">/100</span>
          </span>
        </div>
      </div>

      {coverageScore !== undefined && (
        <div className="mt-3 text-center">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
            {coverageScore}% Passive Coverage
          </span>
        </div>
      )}
    </div>
  );
}
