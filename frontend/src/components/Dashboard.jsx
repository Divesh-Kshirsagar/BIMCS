import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, Thermometer, Flame, Shield } from 'lucide-react';
import BoilerSchematic from './BoilerSchematic';
import TrendChart from './TrendChart';
import ControlPanel from './ControlPanel';

const Dashboard = () => {
  // ========================
  // NEW: Drum Boiler State
  // ========================
  
  // User inputs
  const [fireIntensity, setFireIntensity] = useState(30); // 0-100%
  const [aiModeEnabled, setAiModeEnabled] = useState(false); // AI Supervisor toggle
  
  // Simulation state (from backend)
  const [simulationState, setSimulationState] = useState({
    water_level: 50.0,
    pressure: 10.0,
    temperature: 540.0,
    fire_intensity: 30.0,
    steam_generation: 0.0
  });
  
  // AI telemetry
  const [aiData, setAiData] = useState({
    predicted_temp_avg: 540.0,
    predicted_temp_final: 540.0,
    predicted_temps_series: [],
    original_user_input: 30.0,
    actual_system_input: 30.0,
    intervention_active: false,
    intervention_reason: '',
    ai_mode_enabled: false
  });
  
  // System status
  const [systemStatus, setSystemStatus] = useState('NORMAL'); // NORMAL, WARNING, CRITICAL, TRIPPED
  
  // Chart history
  const [chartHistory, setChartHistory] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // ========================
  // API Functions
  // ========================
  
  // Run simulation step
  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://127.0.0.1:8000/simulate', {
        user_fire_intensity: fireIntensity,
        ai_mode_enabled: aiModeEnabled
      });

      // Update state from response
      setSimulationState(response.data.visual_state);
      setAiData(response.data.ai_data);
      setSystemStatus(response.data.status);
      
      // Update chart history (keep last 50 points)
      setChartHistory(prev => {
        const newPoint = {
          timestamp: Date.now(),
          time: prev.length,
          water_level: response.data.visual_state.water_level,
          pressure: response.data.visual_state.pressure,
          predicted_temp: response.data.ai_data.predicted_temp_final,
          temperature: response.data.visual_state.temperature
        };
        
        const updated = [...prev, newPoint];
        return updated.slice(-50); // Keep last 50 points
      });
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Simulation API Error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to connect to backend. Make sure the FastAPI server is running at http://127.0.0.1:8000'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Reset simulation
  const handleReset = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/reset');
      
      // Reset local state
      setFireIntensity(30);
      setChartHistory([]);
      setError(null);
      
      // Run one simulation to get fresh state
      setTimeout(() => runSimulation(), 100);
      
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to reset simulation');
    }
  };

  // ========================
  // Effects
  // ========================
  
  // Debounced simulation updates when fire intensity changes
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer (300ms debounce)
    const timer = setTimeout(() => {
      runSimulation();
    }, 300);

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [fireIntensity, aiModeEnabled]); // Re-run when fire or AI mode changes

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-cyan-500 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flame className="w-8 h-8 text-orange-400" />
              <div>
                <h1 className="text-2xl font-bold text-cyan-400">B.I.M.C.S - Drum Boiler</h1>
                <p className="text-sm text-slate-400">
                  Boiler Intelligent Monitoring & Control System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Status Badge */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                systemStatus === 'NORMAL' ? 'bg-emerald-900 text-emerald-400' :
                systemStatus === 'WARNING' ? 'bg-amber-900 text-amber-400' :
                'bg-rose-900 text-rose-400'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  systemStatus === 'NORMAL' ? 'bg-emerald-500' :
                  systemStatus === 'WARNING' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}>
                  {systemStatus === 'NORMAL' && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <span className="text-sm">{systemStatus}</span>
              </div>
              
              {/* AI Mode Indicator */}
              {aiModeEnabled && (
                <div className="flex items-center gap-2 bg-blue-900 px-4 py-2 rounded-lg">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">AI SUPERVISOR</span>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                  {!error && (
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </div>
                <span className="text-sm font-semibold">
                  {error ? 'Offline' : 'Online'}
                </span>
              </div>

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <Activity className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Simulating...</span>
                </div>
              )}

              {/* Last Update */}
              {lastUpdate && !error && (
                <div className="text-xs text-slate-400">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-900 border-b-2 border-rose-500 px-6 py-3">
          <div className="container mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <p className="text-sm text-rose-100">{error}</p>
          </div>
        </div>
      )}
      
      {/* AI Intervention Banner */}
      {aiData.intervention_active && (
        <div className="bg-blue-900 border-b-2 border-blue-500 px-6 py-3 animate-pulse">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-100">⚠️ AI OVERRIDE ACTIVE</p>
                <p className="text-xs text-blue-300">
                  Your input: {aiData.original_user_input.toFixed(0)}% → 
                  System limited to: {aiData.actual_system_input.toFixed(0)}%
                </p>
                <p className="text-xs text-blue-400 mt-1">
                  Reason: {aiData.intervention_reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Boiler Schematic (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <BoilerSchematic 
              waterLevel={simulationState.water_level}
              pressure={simulationState.pressure}
              fireIntensity={simulationState.fire_intensity}
              status={systemStatus}
            />
          </div>

          {/* Right Panel - Controls and Chart */}
          <div className="flex flex-col gap-6">
            {/* Control Panel */}
            <ControlPanel
              fireIntensity={fireIntensity}
              aiModeEnabled={aiModeEnabled}
              waterLevel={simulationState.water_level}
              pressure={simulationState.pressure}
              predictedTemp={aiData.predicted_temp_final}
              steamGeneration={simulationState.steam_generation}
              onFireChange={setFireIntensity}
              onAiModeChange={setAiModeEnabled}
              onReset={handleReset}
              aiInterventionActive={aiData.intervention_active}
            />

            {/* Trend Chart */}
            <div className="flex-1">
              <TrendChart 
                data={chartHistory}
                aiData={aiData}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
