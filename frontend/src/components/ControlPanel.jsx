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
    <div className="w-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700">
      <h3 className="text-xl font-bold text-cyan-400 mb-6 flex items-center gap-2">
        <Flame className="w-6 h-6" />
        Control Panel
      </h3>

      <div className="space-y-6">
        {/* Fire Intensity Control */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Coal Fire Intensity
            </label>
            <span className="text-orange-400 font-bold text-lg">
              {fireIntensity.toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={fireIntensity}
            onChange={(e) => onFireChange(parseFloat(e.target.value))}
            className="w-full accent-orange-500"
            style={{
              background: `linear-gradient(to right, #f97316 0%, #f97316 ${fireIntensity}%, #475569 ${fireIntensity}%, #475569 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0%</span>
            <span>🔥 Fire Power</span>
            <span>100%</span>
          </div>
        </div>

        {/* AI Supervisor Toggle */}
        <div className="bg-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={`w-5 h-5 ${aiModeEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <p className="text-slate-300 font-semibold">AI Supervisor Mode</p>
                <p className="text-xs text-slate-400">Prevent dangerous operating conditions</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiModeEnabled}
                onChange={(e) => onAiModeChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {/* AI Intervention Indicator */}
          {aiInterventionActive && (
            <div className="mt-3 p-2 bg-blue-900 border border-blue-500 rounded text-xs text-blue-300 animate-pulse">
              ⚠️ AI is currently limiting your input for safety
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700"></div>

        {/* Status Indicators Section */}
        <div>
          <p className="text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wide">
            Live Telemetry
          </p>

          <div className="space-y-3">
            {/* Water Level Gauge */}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets className={`w-4 h-4 ${
                    waterLevel < 20 ? 'text-rose-400' : 
                    waterLevel > 80 ? 'text-blue-600' : 
                    'text-cyan-400'
                  }`} />
                  <span className="text-xs text-slate-300">Drum Water Level</span>
                </div>
                <span className={`text-sm font-bold ${
                  waterLevel < 20 ? 'text-rose-400' : 
                  waterLevel > 80 ? 'text-blue-600' : 
                  'text-cyan-400'
                }`}>
                  {waterLevel.toFixed(1)}%
                </span>
              </div>
              {/* Mini progress bar */}
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    waterLevel < 20 ? 'bg-rose-500' : 
                    waterLevel > 80 ? 'bg-blue-600' : 
                    'bg-cyan-500'
                  }`}
                  style={{ width: `${waterLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Pressure Gauge */}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className={`w-4 h-4 ${
                    pressure > 18 ? 'text-rose-400' : 
                    pressure > 15 ? 'text-amber-400' : 
                    'text-emerald-400'
                  }`} />
                  <span className="text-xs text-slate-300">Steam Pressure</span>
                </div>
                <span className={`text-sm font-bold ${
                  pressure > 18 ? 'text-rose-400' : 
                  pressure > 15 ? 'text-amber-400' : 
                  'text-emerald-400'
                }`}>
                  {pressure.toFixed(1)} MPa
                </span>
              </div>
            </div>

            {/* Predicted Temperature */}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className={`w-4 h-4 ${
                    predictedTemp > 560 ? 'text-rose-400' : 
                    predictedTemp > 550 ? 'text-amber-400' : 
                    'text-emerald-400'
                  }`} />
                  <span className="text-xs text-slate-300">AI Predicted Temp</span>
                </div>
                <span className={`text-sm font-bold ${
                  predictedTemp > 560 ? 'text-rose-400' : 
                  predictedTemp > 550 ? 'text-amber-400' : 
                  'text-emerald-400'
                }`}>
                  {predictedTemp.toFixed(0)}°C
                </span>
              </div>
            </div>

            {/* Steam Generation */}
            <div className="bg-slate-700 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-300">Steam Generation</span>
                </div>
                <span className="text-sm font-bold text-slate-300">
                  {steamGeneration.toFixed(1)} t/h
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Simulation
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
