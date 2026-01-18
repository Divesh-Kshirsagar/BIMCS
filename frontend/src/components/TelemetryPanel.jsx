import React from 'react';
import { Droplets, Gauge, Thermometer, RefreshCw } from 'lucide-react';

const TelemetryPanel = ({
  waterLevel = 50,
  pressure = 10,
  predictedTemp = 540,
  steamGeneration = 0,
}) => {
  return (
    <div className="w-full glass-panel rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center justify-between mb-3 border-b border-cyan-500/20 pb-2">
        <p className="text-[10px] text-cyan-500/70 font-mono uppercase tracking-widest pl-1 border-l-2 border-cyan-500/50">
           System Telemetry
        </p>
        <div className="flex gap-1">
             <div className="w-1 h-1 rounded-full bg-cyan-500/50"></div>
             <div className="w-1 h-1 rounded-full bg-cyan-500/30"></div>
             <div className="w-1 h-1 rounded-full bg-cyan-500/10"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Water Level */}
        <div className="bg-slate-900/40 rounded border border-slate-700/50 p-3 hover:border-cyan-500/30 transition-colors group">
           <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                 <Droplets className="w-3 h-3 text-cyan-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">H2O Level</span>
           </div>
           <div className={`text-xl font-mono font-bold ${
                waterLevel < 20 ? 'text-rose-400' : 
                waterLevel > 80 ? 'text-blue-400' : 
                'text-cyan-400'
           }`}>
             {waterLevel.toFixed(1)}<span className="text-xs opacity-50 ml-0.5">%</span>
           </div>
           <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                 className={`h-full transition-all duration-500 ${
                    waterLevel < 20 ? 'bg-rose-500' : 
                    waterLevel > 80 ? 'bg-blue-500' : 
                    'bg-cyan-500'
                 }`} 
                 style={{ width: `${waterLevel}%` }}
              ></div>
           </div>
        </div>

        {/* Pressure */}
        <div className="bg-slate-900/40 rounded border border-slate-700/50 p-3 hover:border-emerald-500/30 transition-colors group">
           <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                 <Gauge className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pressure</span>
           </div>
           <div className={`text-xl font-mono font-bold ${
              pressure > 18 ? 'text-rose-400' : 
              pressure > 15 ? 'text-amber-400' : 
              'text-emerald-400'
           }`}>
             {pressure.toFixed(1)}<span className="text-xs opacity-50 ml-0.5">MPa</span>
           </div>
        </div>

        {/* Temp */}
        <div className="bg-slate-900/40 rounded border border-slate-700/50 p-3 hover:border-orange-500/30 transition-colors group">
           <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                 <Thermometer className="w-3 h-3 text-orange-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Core Temp</span>
           </div>
           <div className={`text-xl font-mono font-bold ${
              predictedTemp > 560 ? 'text-rose-400' : 
              predictedTemp > 550 ? 'text-amber-400' : 
              'text-emerald-400'
           }`}>
             {predictedTemp.toFixed(0)}<span className="text-xs opacity-50 ml-0.5">°C</span>
           </div>
        </div>

         {/* Output */}
        <div className="bg-slate-900/40 rounded border border-slate-700/50 p-3 hover:border-slate-500/30 transition-colors group">
           <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-slate-500/10 group-hover:bg-slate-500/20 transition-colors">
                 <RefreshCw className="w-3 h-3 text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Steam Out</span>
           </div>
           <div className="text-xl font-mono font-bold text-slate-200">
             {steamGeneration.toFixed(1)}<span className="text-xs opacity-50 ml-0.5">t/h</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
