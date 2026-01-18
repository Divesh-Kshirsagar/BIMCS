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
  ReferenceLine
} from 'recharts';

const TrendChart = ({ data = [], aiData = {} }) => {
  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-slate-900/90 border border-cyan-500/50 backdrop-blur-md rounded p-3 shadow-xl">
          <p className="text-cyan-400 font-mono text-xs mb-2 border-b border-cyan-500/30 pb-1">T+{point.time}s</p>
          <div className="space-y-1 text-xs font-mono">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-slate-300">{entry.name}:</span>
                <span className="font-bold" style={{ color: entry.color }}>
                  {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-sm">
          <div className="text-center animate-pulse">
             Waiting for simulation data...
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#64748b' }}
                label={{ 
                  value: 'TIME (S)', 
                  position: 'insideBottom', 
                  offset: -10, 
                  fill: '#94a3b8',
                  fontSize: 12,
                  fontFamily: 'monospace'
                }}
              />
              
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#64748b' }}
                domain={[0, 100]} /* Fixed domain for stability, or auto if preferred */
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeDasharray: '5 5' }} />
              
              <Legend 
                 verticalAlign="top" 
                 height={36} 
                 iconType="rect"
                 wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#cbd5e1' }}
              />

              {/* Reference lines for safety limits */}
              <ReferenceLine y={20} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.7} />
              <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.7} />

              {/* Data lines */}
              <Line
                type="category" /* Optimized smoothing */
                dataKey="water_level"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                name="Water (%)"
                isAnimationActive={false} /* Performance */
              />
              
              <Line
                type="category"
                dataKey="pressure"
                stroke="#f43f5e"
                strokeWidth={3}
                dot={false}
                name="Press (MPa)"
                isAnimationActive={false}
              />
              
              {/* Scale AI Prediction to fit on same chart if needed, or put on second axis */}
              {/* Here we assume it's scaled or just shown as raw value if it fits */}
              <Line
                type="step"
                dataKey="predicted_temp"
                stroke="#f59e0b"
                strokeWidth={3}
                strokeDasharray="4 4"
                dot={false}
                name="AI Model"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && aiData.ai_mode_enabled && (
        <div className="mt-4 p-3 bg-slate-700 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">AI Status:</span>
            <span className={`font-semibold ${
              aiData.intervention_active ? 'text-blue-400' : 'text-emerald-400'
            }`}>
              {aiData.intervention_active ? '🛡️ Intervention Active' : '✅ Monitoring'}
            </span>
          </div>
          {aiData.predicted_temp_final && (
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-slate-400">Predicted Final Temp:</span>
              <span className={`font-semibold ${
                aiData.predicted_temp_final > 560 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {aiData.predicted_temp_final.toFixed(0)}°C
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrendChart;
//         <div className="mt-4 grid grid-cols-3 gap-4 text-center">
//           <div className="bg-slate-700 rounded p-2">
//             <p className="text-xs text-slate-400">Min Temp</p>
//             <p className="text-lg font-bold text-emerald-400">
//               {Math.min(...data.map(d => d.temperature)).toFixed(1)}°C
//             </p>
//           </div>
//           <div className="bg-slate-700 rounded p-2">
//             <p className="text-xs text-slate-400">Max Temp</p>
//             <p className="text-lg font-bold text-rose-400">
//               {Math.max(...data.map(d => d.temperature)).toFixed(1)}°C
//             </p>
//           </div>
//           <div className="bg-slate-700 rounded p-2">
//             <p className="text-xs text-slate-400">Avg Temp</p>
//             <p className="text-lg font-bold text-cyan-400">
//               {(data.reduce((sum, d) => sum + d.temperature, 0) / data.length).toFixed(1)}°C
//             </p>
//           </div>
//         </div>
//       )
//     // </div>
//   // );
// };

// export default TrendChart;
