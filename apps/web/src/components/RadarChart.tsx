'use client';

import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { MultiPillarScores } from '@devsphere/shared';

interface Props {
  scores?: MultiPillarScores | MultiPillarScores['radar'];
}

export function RadarChart({ scores }: Props) {
  if (!scores) return null;

  const radar = 'radar' in scores ? scores.radar : scores;

  const data = [
    { subject: 'Performance', score: radar.performance, fullMark: 100 },
    { subject: 'Accessibility', score: radar.accessibility, fullMark: 100 },
    { subject: 'SEO & GEO', score: radar.seo, fullMark: 100 },
    { subject: 'Security', score: radar.security, fullMark: 100 },
    { subject: 'Code QA', score: radar.codeQa, fullMark: 100 },
  ];


  return (
    <div className="w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#334155" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              color: '#f8fafc',
            }}
            formatter={(value: any) => [`${value} / 100`, 'Score']}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
