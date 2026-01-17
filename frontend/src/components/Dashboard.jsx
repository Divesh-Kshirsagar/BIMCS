import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, Thermometer } from 'lucide-react';
import BoilerSchematic from './BoilerSchematic';
import TrendChart from './TrendChart';
import ControlPanel from './ControlPanel';

const Dashboard = () => {
  // State for control inputs
  const [valve, setValve] = useState(50);
  const [pressure, setPressure] = useState(5);
  const [flow, setFlow] = useState(50);

  // State for API data
  const [predictionData, setPredictionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState(null);

  // API call function
  const fetchPrediction = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://127.0.0.1:8000/predict', {
        valve_open: valve / 100, // Convert percentage to 0-1 range
        pressure: pressure,
        flow: flow
      });

      // Transform API response to chart format
      const chartData = response.data.time.map((time, index) => ({
        time: time,
        temperature: response.data.temperature[index]
      }));

      setPredictionData(chartData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('API Error:', err);
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to connect to backend. Make sure the FastAPI server is running at http://127.0.0.1:8000'
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect to call API when controls change
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      fetchPrediction();
    }, 300); // 300ms debounce

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [valve, pressure, flow]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b-2 border-cyan-500 shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Thermometer className="w-8 h-8 text-cyan-400" />
              <div>
                <h1 className="text-2xl font-bold text-cyan-400">B.I.M.C.S</h1>
                <p className="text-sm text-slate-400">
                  Boiler Intelligent Monitoring & Control System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* System Status */}
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
                  <span className="text-sm">Updating...</span>
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

      {/* Main Dashboard Layout */}
      <main className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Boiler Schematic (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <BoilerSchematic valvePosition={valve} />
          </div>

          {/* Right Panel - Controls and Chart */}
          <div className="flex flex-col gap-6">
            {/* Control Panel */}
            <ControlPanel
              valve={valve}
              pressure={pressure}
              flow={flow}
              onValveChange={setValve}
              onPressureChange={setPressure}
              onFlowChange={setFlow}
            />

            {/* Trend Chart */}
            <div className="flex-1">
              <TrendChart data={predictionData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
