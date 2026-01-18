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
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload
      return (
        <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-3 shadow-lg">
          <p className="text-cyan-400 font-semibold mb-1">Time: {point.time}s</p>
          <div className="space-y-1 text-xs">
            <p className="text-blue-400">
              Water: {point.water_level?.toFixed(1)}%
            </p>
            <p className="text-red-400">
              Pressure: {point.pressure?.toFixed(1)} MPa
            </p>
            <p className="text-orange-400">
              Predicted Temp: {point.predicted_temp?.toFixed(0)}°C
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">
        System Trends
      </h3>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Simulation data will appear here</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              label={{ 
                value: 'Time (steps)', 
                position: 'insideBottom', 
                offset: -5, 
                fill: '#cbd5e1' 
              }}
            />
            
            <YAxis
              stroke="#94a3b8"
              label={{ 
                value: 'Value', 
                angle: -90, 
                position: 'insideLeft', 
                fill: '#cbd5e1' 
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{ color: '#cbd5e1' }}
              iconType="line"
            />

            {/* Reference lines for safety limits */}
            <ReferenceLine
              y={20}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ 
                value: 'Low Water (20%)', 
                position: 'right', 
                fill: '#ef4444', 
                fontSize: 10 
              }}
            />
            
            <ReferenceLine
              y={80}
              stroke="#1e40af"
              strokeDasharray="5 5"
              label={{ 
                value: 'High Water (80%)', 
                position: 'right', 
                fill: '#1e40af', 
                fontSize: 10 
              }}
            />

            {/* Data lines */}
            <Line
              type="monotone"
              dataKey="water_level"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
              name="Water Level (%)"
            />
            
            <Line
              type="monotone"
              dataKey="pressure"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Pressure (MPa)"
            />
            
            <Line
              type="monotone"
              dataKey="predicted_temp"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="AI Predicted Temp (°C / 10)"
            />
          </LineChart>
        </ResponsiveContainer>
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
