import React from 'react';
import { Settings, Activity, Droplets } from 'lucide-react';

const ControlPanel = ({
  valve = 50,
  pressure = 5,
  flow = 50,
  onValveChange,
  onPressureChange,
  onFlowChange
}) => {
  return (
    <div className="w-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700">
      <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Control Panel
      </h3>

      <div className="space-y-6">
        {/* Valve Position Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              Valve Position
            </label>
            <span className="text-cyan-400 font-bold text-lg">
              {valve.toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={valve}
            onChange={(e) => onValveChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>Closed ← → Open</span>
            <span>100%</span>
          </div>
        </div>

        {/* Furnace Pressure Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Furnace Pressure
            </label>
            <span className="text-amber-400 font-bold text-lg">
              {pressure.toFixed(1)} bar
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={pressure}
            onChange={(e) => onPressureChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 bar</span>
            <span>Pressure</span>
            <span>10 bar</span>
          </div>
        </div>

        {/* Flow Rate Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-semibold flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-400" />
              Flow Rate
            </label>
            <span className="text-blue-400 font-bold text-lg">
              {flow.toFixed(0)} L/min
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={flow}
            onChange={(e) => onFlowChange(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0 L/min</span>
            <span>Flow</span>
            <span>100 L/min</span>
          </div>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="mt-6 pt-6 border-t border-slate-700">
        <p className="text-xs text-slate-400 mb-3">SYSTEM STATUS</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${valve > 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <div className={`w-2 h-2 rounded-full ${valve > 50 ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping`} />
            </div>
            <p className="text-xs text-slate-400">Valve</p>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${pressure > 3 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <div className={`w-2 h-2 rounded-full ${pressure > 3 ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping`} />
            </div>
            <p className="text-xs text-slate-400">Pressure</p>
          </div>
          <div className="bg-slate-700 rounded p-2 text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${flow > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
              <div className={`w-2 h-2 rounded-full ${flow > 30 ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping`} />
            </div>
            <p className="text-xs text-slate-400">Flow</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
