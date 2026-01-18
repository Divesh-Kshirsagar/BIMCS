import React from 'react';
import { Flame, Shield, Droplets, Gauge, Thermometer, RefreshCw } from 'lucide-react';

const ControlPanel = ({
  fireIntensity = 30,
  aiModeEnabled = false,
  waterLevel = 50,
  pressure = 10,
  predictedTemp = 540,
  steamGeneration = 0,
  onFireChange,
  onAiModeChange,
  onReset,
  aiInterventionActive = false
}) => {
  return (
    <div className="w-full glass-panel rounded-xl p-5 relative overflow-hidden flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3">
        <h3 className="text-lg font-bold text-cyan-400 t-glow-text flex items-center gap-2 uppercase tracking-wider">
          <Flame className="w-5 h-5" />
          Control Deck
        </h3>
        <div className="text-[10px] text-cyan-500/70 font-mono">PNL-01</div>
      </div>

      <div className="space-y-5">
        {/* Fire Intensity Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-200 font-semibold text-xs uppercase tracking-wide flex items-center gap-2">
              <Flame className="w-3 h-3 text-orange-400" />
              Furnace Intensity
            </label>
            <span className="text-orange-400 font-mono font-bold text-lg t-glow-text">
              {fireIntensity.toFixed(0)}%
            </span>
          </div>
          <div className="relative h-6 flex items-center">
             <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={fireIntensity}
                onChange={(e) => onFireChange(parseFloat(e.target.value))}
                className="w-full z-10"
              />
              {/* Custom Track Background for visual flair if needed, simplistic for now */}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>IDLE</span>
            <span>MAX POWER</span>
          </div>
        </div>

        {/* AI Supervisor Toggle */}
        <div className={`rounded-lg p-3 border transition-all duration-300 ${
            aiModeEnabled ? 'bg-blue-950/40 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'bg-slate-900/40 border-slate-700/50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${aiModeEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500'}`}>
                 <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className={`font-bold text-xs uppercase tracking-wider ${aiModeEnabled ? 'text-blue-100' : 'text-slate-400'}`}>AI Supervisor</p>
                <p className="text-[10px] text-slate-500">Auto-safety overrides</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiModeEnabled}
                onChange={(e) => onAiModeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        {/* Divider */}
        {/* <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div> */}

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full group relative bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 font-mono text-xs uppercase tracking-widest py-3 rounded transition-all overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
            System Reset
          </span>
          <div className="absolute inset-0 bg-cyan-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
