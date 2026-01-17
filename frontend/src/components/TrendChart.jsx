import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

const TrendChart = ({ data = [] }) => {
  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-400 font-semibold">Time: {payload[0].payload.time}s</p>
          <p className="text-amber-400 font-semibold">
            Temp: {payload[0].value.toFixed(2)}°C
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">
        Temperature Prediction Trend
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Adjust controls to generate predictions</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }}
            />
            
            <YAxis
              stroke="#94a3b8"
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ color: '#cbd5e1' }}
              iconType="line"
            />

            {/* Reference line at current time (0) */}
            <ReferenceLine
              x={0}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Current', position: 'top', fill: '#f59e0b', fontWeight: 'bold' }}
            />

            {/* Area chart for future predictions */}
            <Area
              type="monotone"
              dataKey="temperature"
              stroke="#06b6d4"
              strokeWidth={2}
              fill="url(#tempGradient)"
              name="Predicted Temperature"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xs text-slate-400">Min Temp</p>
            <p className="text-lg font-bold text-emerald-400">
              {Math.min(...data.map(d => d.temperature)).toFixed(1)}°C
            </p>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xs text-slate-400">Max Temp</p>
            <p className="text-lg font-bold text-rose-400">
              {Math.max(...data.map(d => d.temperature)).toFixed(1)}°C
            </p>
          </div>
          <div className="bg-slate-700 rounded p-2">
            <p className="text-xs text-slate-400">Avg Temp</p>
            <p className="text-lg font-bold text-cyan-400">
              {(data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1)}°C
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendChart;
