import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, Thermometer, Flame, Shield, PlayCircle } from 'lucide-react';
import BoilerSchematic from './BoilerSchematic';
import TrendChart from './TrendChart';
import ControlPanel from './ControlPanel';
import TelemetryPanel from './TelemetryPanel';

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

  // Audio Context for alerts
  const audioContextRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // ========================
  // Audio Alert System
  // ========================
  const playAlertSound = (type) => {
    // Basic rate limiter (max 1 alert per 2 seconds to avoid spam)
    const now = Date.now();
    if (now - lastAlertTimeRef.current < 2000) return;
    lastAlertTimeRef.current = now;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'CRITICAL') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'WARNING') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    }
  };

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
      const newState = response.data.visual_state;
      const newStatus = response.data.status;
      setSimulationState(newState);
      setAiData(response.data.ai_data);
      setSystemStatus(newStatus);

      // Trigger Alert if needed
      if (newStatus === 'CRITICAL' || newStatus === 'WARNING') {
          playAlertSound(newStatus);
      }
      
      // Update chart history (keep last 50 points)
      setChartHistory(prev => {
        const newPoint = {
          timestamp: Date.now(),
          time: prev.length,
          water_level: newState.water_level,
          pressure: newState.pressure,
          predicted_temp: response.data.ai_data.predicted_temp_final,
          temperature: newState.temperature
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
    <div className="h-screen w-screen overflow-hidden bg-[var(--color-t-base)] text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30">
      {/* Header */}
      <header className="shrink-0 bg-[var(--color-t-surface)] border-b border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)] z-20">
        <div className="mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-cyan-950/50 border border-cyan-500/50 t-glow-box">
                <Flame className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-cyan-400 t-glow-text tracking-widest">B.I.M.C.S <span className="text-xs align-top opacity-70">v2.0</span></h1>
                <p className="text-[10px] text-cyan-200/50 uppercase tracking-widest">
                  Boiler Intelligent Monitoring & Control System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${
                systemStatus === 'NORMAL' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400' :
                systemStatus === 'WARNING' ? 'bg-amber-950/30 border-amber-500/50 text-amber-400 animate-pulse' :
                'bg-rose-950/30 border-rose-500/50 text-rose-400 animate-pulse'
              }`}>
                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                  systemStatus === 'NORMAL' ? 'bg-emerald-500 shadow-emerald-500' :
                  systemStatus === 'WARNING' ? 'bg-amber-500 shadow-amber-500' :
                  'bg-rose-500 shadow-rose-500'
                }`}></div>
                <span className="text-xs font-bold tracking-wider">{systemStatus}</span>
              </div>
              
              {/* AI Mode Indicator */}
              {aiModeEnabled && (
                <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-500/30 px-3 py-1.5 rounded-sm">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-bold text-blue-400 tracking-wider">AI SUPERVISOR</span>
                </div>
              )}

              {/* Connection Status */}
              <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-sm">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-rose-500' : 'bg-emerald-500 shadow-[0_0_5px_#10b981]'}`}></div>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  {error ? 'Offline' : 'Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-6 py-2 backdrop-blur-sm absolute w-full z-50 top-[60px]">
          <div className="container mx-auto flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <p className="text-xs text-rose-200 font-mono">{error}</p>
          </div>
        </div>
      )}
      
      {/* AI Intervention Banner */}
      {aiData.intervention_active && (
        <div className="bg-blue-950/80 border-b border-blue-500/30 px-6 py-2 backdrop-blur-sm animate-in slide-in-from-top-2">
          <div className="container mx-auto">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-blue-400" />
              <div className="flex-1 flex items-center gap-4">
                <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">⚠️ AI OVERRIDE ACTIVE</p>
                <div className="h-4 w-px bg-blue-500/30"></div>
                <p className="text-xs text-blue-300 font-mono">
                  Input: <span className="text-white">{aiData.original_user_input.toFixed(0)}%</span> 
                  <span className="mx-2 text-blue-500">→</span> 
                  Limited: <span className="text-cyan-300 border-b border-cyan-500">{aiData.actual_system_input.toFixed(0)}%</span>
                </p>
                <p className="text-[10px] text-blue-400/80 ml-auto uppercase bg-blue-900/50 px-2 py-0.5 rounded">
                  {aiData.intervention_reason}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Layout - Full Height Grid */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-hidden">
        {/* Left Panel - Boiler Schematic & Telemetry (8/12 cols) */}
        <div className="lg:col-span-8 h-full min-h-0 flex flex-col gap-4">
           {/* 3D View (Flex-1 to take available space) */}
           <div className="flex-1 min-h-0 relative glass-panel rounded-xl overflow-hidden shadow-2xl flex flex-col">
              {/* Schematic Header */}
              <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10 bg-gradient-to-b from-black/60 to-transparent">
                 <div>
                   <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                     <span className="w-2 h-6 bg-cyan-500 rounded-sm"></span>
                     LIVE VIEW
                   </h2>
                 </div>
              </div>

             <div className="flex-1 min-h-0">
               <BoilerSchematic 
                 waterLevel={simulationState.water_level}
                 pressure={simulationState.pressure}
                 fireIntensity={simulationState.fire_intensity}
                 status={systemStatus}
               />
             </div>
           </div>

           {/* Telemetry Panel (Fixed/Auto height at bottom) */}
           <div className="flex-none">
              <TelemetryPanel 
                 waterLevel={simulationState.water_level}
                 pressure={simulationState.pressure}
                 predictedTemp={aiData.predicted_temp_final}
                 steamGeneration={simulationState.steam_generation}
              />
           </div>
        </div>

        {/* Right Panel - Controls and Trend Chart (4/12 cols) */}
        <div className="lg:col-span-4 h-full min-h-0 flex flex-col gap-4">
            
          {/* Top Right: Control Panel (Compact) */}
          <div className="flex-none">
             <ControlPanel
              fireIntensity={fireIntensity}
              aiModeEnabled={aiModeEnabled}
              onFireChange={setFireIntensity}
              onAiModeChange={setAiModeEnabled}
              onReset={handleReset}
              aiInterventionActive={aiData.intervention_active}
            />
          </div>

          {/* Bottom Right: Trend Chart (Fills remaining space) */}
          <div className="flex-1 min-h-0 glass-panel rounded-xl p-4 border border-slate-700/50 flex flex-col">
            <div className="flex items-center justify-between mb-2 shrink-0">
               <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                 <Activity className="w-4 h-4" />
                 System Analytics
               </h3>
               <div className="text-[10px] text-slate-500 font-mono">REALTIME_DATA_STREAM</div>
            </div>
            <div className="flex-1 w-full min-h-0 bg-slate-900/50 rounded-lg overflow-hidden relative border border-slate-800">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
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
