import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  history: Array<{ time: number; instability: number; redshift: number }>;
}

export default function GravitationalEventTimeline({ history }: Props) {
  return (
    <div className="bg-[#0b0c16] rounded-xl border border-slate-800/80 p-5 h-[200px] w-full">
      <h2 className="text-xs font-semibold tracking-wider text-slate-200 uppercase mb-4">Gravitational Event Timeline</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={history}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} />
          <Line type="monotone" dataKey="instability" stroke="#ef4444" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="redshift" stroke="#3b82f6" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
