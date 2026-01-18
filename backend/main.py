"""
Boiler Digital Twin - FastAPI Backend
Serves LSTM predictions for boiler steam temperature based on control inputs.

NEW: Drum Boiler Simulation with AI Supervisor
- Physics engine simulates fire -> water level -> pressure dynamics
- LSTM acts as "fortune teller" to predict dangerous states
- AI supervisor intervenes when LSTM predicts critical conditions
"""

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import pickle
import tensorflow as tf
from tensorflow import keras
import os

# Import the new physics engine
from boiler_physics import DrumBoilerPhysics

# ========================
# Configuration
# ========================

app = FastAPI(
    title="Boiler Digital Twin API",
    description="LSTM-based digital twin for predicting boiler steam temperature",
    version="1.0.0"
)

# ========================
# CORS Configuration
# ========================

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev; specify ["http://localhost:5173"] for tighter security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "boiler_model.keras"
SCALER_PATH = "scaler.pkl"
SEQUENCE_LENGTH = 60  # Must match training
FORECAST_STEPS = 30   # Number of steps to predict ahead

# ========================
# Global Model & Scaler
# ========================

model = None
scaler = None

# ========================
# Physics Engine Instance
# ========================

# Global physics engine for drum boiler simulation
physics_engine = DrumBoilerPhysics(
    initial_water_level=50.0,
    initial_pressure=10.0,
    initial_temperature=540.0
)

# ========================
# Request/Response Models
# ========================

class PredictionRequest(BaseModel):
    valve_open: float = Field(..., description="Valve position 0-100%", ge=0, le=100)
    pressure: float = Field(..., description="Furnace pressure (context variable)")
    flow: float = Field(..., description="Fan flow rate (context variable)")

class PredictionResponse(BaseModel):
    time: List[int] = Field(..., description="Time steps (1 to 30)")
    temperature: List[float] = Field(..., description="Predicted temperatures")

# ========================
# NEW: Drum Boiler Simulation Models
# ========================

class SimulationRequest(BaseModel):
    """Request for drum boiler simulation step"""
    user_fire_intensity: float = Field(..., description="User's fire slider input (0-100%)", ge=0, le=100)
    ai_mode_enabled: bool = Field(default=False, description="Enable AI supervisor intervention")

class SimulationResponse(BaseModel):
    """Response containing visual state and AI telemetry"""
    visual_state: Dict = Field(..., description="State for 3D visualization (water_level, pressure, etc)")
    ai_data: Dict = Field(..., description="AI supervisor information (predictions, interventions)")
    status: str = Field(..., description="System status: NORMAL, WARNING, CRITICAL, TRIPPED")

# ========================
# Startup/Shutdown Events
# ========================

@app.on_event("startup")
async def load_model_and_scaler():
    """Load the trained model and scaler on startup"""
    global model, scaler
    
    try:
        # Load model
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        print(f"Loading model from {MODEL_PATH}...")
        model = keras.models.load_model(MODEL_PATH)
        print("✓ Model loaded successfully")
        
        # Load scaler
        if not os.path.exists(SCALER_PATH):
            raise FileNotFoundError(f"Scaler file not found: {SCALER_PATH}")
        
        print(f"Loading scaler from {SCALER_PATH}...")
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        print("✓ Scaler loaded successfully")
        
        print("\n" + "="*60)
        print("🎉 Boiler Digital Twin API is ready!")
        print("="*60)
        print(f"Model: {MODEL_PATH}")
        print(f"Scaler: {SCALER_PATH}")
        print(f"Sequence length: {SEQUENCE_LENGTH}")
        print(f"Forecast steps: {FORECAST_STEPS}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Failed to load model/scaler: {e}")
        raise

# ========================
# Helper Functions
# ========================

def create_input_sequence(valve: float, pressure: float, flow: float, current_temp: float = 538.0):
    """
    Create a 60-timestep sequence for LSTM input.
    
    Physics assumption: The system was stable at these values for the past 60 timesteps.
    
    Args:
        valve: Valve position (0-100%)
        pressure: Furnace pressure
        flow: Fan flow rate
        current_temp: Current/initial temperature (default ~538 based on data)
    
    Returns:
        Normalized sequence ready for LSTM input
    """
    # Create a sequence where all 60 timesteps have the same values
    # This simulates a "stable" history at the current operating point
    sequence = np.array([[valve, pressure, flow, current_temp]] * SEQUENCE_LENGTH)
    
    # Normalize using the fitted scaler
    normalized_sequence = scaler.transform(sequence)
    
    # Reshape for LSTM: (1, 60, 4)
    return normalized_sequence.reshape(1, SEQUENCE_LENGTH, 4)

def iterative_forecast(initial_sequence: np.ndarray, valve: float, pressure: float, flow: float, steps: int = 30):
    """
    Perform iterative forecasting for N steps.
    
    The model predicts the next temperature, then we use that prediction
    to create the next input sequence and predict again.
    
    Args:
        initial_sequence: Initial 60-timestep sequence (normalized)
        valve: Target valve position to hold constant
        pressure: Target pressure to hold constant
        flow: Target flow to hold constant
        steps: Number of future steps to predict
    
    Returns:
        List of predicted temperatures (denormalized)
    """
    predictions = []
    current_sequence = initial_sequence.copy()
    
    for step in range(steps):
        # Predict next temperature (normalized)
        pred_norm = model.predict(current_sequence, verbose=0)[0, 0]
        predictions.append(pred_norm)
        
        # Create next timestep with predicted temperature
        next_step_norm = scaler.transform([[valve, pressure, flow, 0]])  # temp placeholder
        next_step_norm[0, 3] = pred_norm  # Replace with predicted temp
        
        # Shift sequence: remove oldest, add newest
        current_sequence = np.roll(current_sequence, -1, axis=1)
        current_sequence[0, -1, :] = next_step_norm[0, :]
    
    # Denormalize temperature predictions
    # Create dummy array with all features, then denormalize
    dummy = np.zeros((len(predictions), 4))
    dummy[:, 3] = predictions  # Temperature is column 3
    
    denormalized = scaler.inverse_transform(dummy)
    temperatures = denormalized[:, 3].tolist()
    
    return temperatures

# ========================
# API Endpoints
# ========================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Boiler Digital Twin API",
        "status": "running",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None
    }

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict boiler steam temperature for the next 30 seconds.
    
    Physics: Higher valve position → more cooling spray → lower temperature
    
    Args:
        request: Contains valve_open, pressure, flow
    
    Returns:
        Time series of predicted temperatures for next 30 steps
    """
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="Model or scaler not loaded")
    
    try:
        # Extract inputs
        valve = request.valve_open
        pressure = request.pressure
        flow = request.flow
        
        print(f"\n📊 Prediction request: valve={valve:.1f}%, pressure={pressure:.2f}, flow={flow:.2f}")
        
        # Create initial sequence (assume stable at current values)
        input_sequence = create_input_sequence(valve, pressure, flow)
        
        # Perform iterative forecasting
        temperatures = iterative_forecast(input_sequence, valve, pressure, flow, steps=FORECAST_STEPS)
        
        # Create response
        time_steps = list(range(1, FORECAST_STEPS + 1))
        
        print(f"✓ Prediction complete: T[1]={temperatures[0]:.2f}, T[30]={temperatures[-1]:.2f}")
        
        return PredictionResponse(
            time=time_steps,
            temperature=temperatures
        )
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy" if (model is not None and scaler is not None) else "unhealthy",
        "model": {
            "loaded": model is not None,
            "path": MODEL_PATH,
            "exists": os.path.exists(MODEL_PATH)
        },
        "scaler": {
            "loaded": scaler is not None,
            "path": SCALER_PATH,
            "exists": os.path.exists(SCALER_PATH)
        },
        "config": {
            "sequence_length": SEQUENCE_LENGTH,
            "forecast_steps": FORECAST_STEPS
        }
    }

# ========================
# NEW: Drum Boiler Simulation Endpoints
# ========================

@app.post("/simulate", response_model=SimulationResponse)
async def simulate_boiler(request: SimulationRequest):
    """
    Run one step of the drum boiler simulation with optional AI supervision
    
    FEATURE MAPPING STRATEGY:
    - Fire Intensity → Flow (for LSTM input)
    - Physics Pressure → Pressure (real value)
    - Constant 50% → Valve (placeholder since no valve in drum boiler)
    
    AI SUPERVISOR LOGIC:
    - LSTM predicts temperature 30 steps ahead
    - High predicted temp = proxy for "water will run low soon"
    - If danger detected, AI clamps the fire input
    
    Args:
        request: User fire intensity and AI mode flag
        
    Returns:
        Visual state for Three.js + AI telemetry for UI
    """
    if model is None or scaler is None:
        raise HTTPException(status_code=503, detail="LSTM model or scaler not loaded")
    
    try:
        # ========================
        # STEP 1: GET CURRENT PHYSICS STATE
        # ========================
        current_pressure = physics_engine.pressure
        current_temperature = physics_engine.temperature
        
        user_fire_input = request.user_fire_intensity
        
        print(f"\n🔥 Simulation step: Fire={user_fire_input:.1f}%, AI Mode={'ON' if request.ai_mode_enabled else 'OFF'}")
        
        # ========================
        # STEP 2: FEATURE MAPPING FOR LSTM
        # ========================
        # Map drum boiler inputs to LSTM's expected format
        
        # NOTE: LSTM expects [valve, pressure, flow, temperature]
        # We "lie" to the LSTM by mapping our new inputs:
        
        mapped_valve = 50.0  # Constant (no valve in drum boiler yet)
        mapped_pressure = current_pressure  # Real physics value
        mapped_flow = user_fire_input * 2.0  # Fire → Flow conversion (scale to training data range)
        
        # ========================
        # STEP 3: LSTM PREDICTION (THE "FORTUNE TELLER")
        # ========================
        # Create input sequence for LSTM
        input_sequence = create_input_sequence(
            valve=mapped_valve,
            pressure=mapped_pressure,
            flow=mapped_flow,
            current_temp=current_temperature
        )
        
        # Get temperature prediction 30 steps ahead
        future_temperatures = iterative_forecast(
            initial_sequence=input_sequence,
            valve=mapped_valve,
            pressure=mapped_pressure,
            flow=mapped_flow,
            steps=FORECAST_STEPS
        )
        
        # Use the final predicted temperature as danger indicator
        predicted_temp_final = future_temperatures[-1]
        predicted_temp_avg = sum(future_temperatures) / len(future_temperatures)
        
        print(f"   📊 LSTM predicts: Avg={predicted_temp_avg:.1f}°C, Final={predicted_temp_final:.1f}°C")
        
        # ========================
        # STEP 4: AI SUPERVISOR INTERVENTION
        # ========================
        # The AI's job: Prevent dangerous states BEFORE they happen
        
        final_fire_input = user_fire_input
        ai_intervention_active = False
        intervention_reason = ""
        
        # AI SUPERVISOR THRESHOLDS
        DANGER_TEMP_THRESHOLD = 560.0  # °C (High temp = low water imminent)
        SAFE_FIRE_LIMIT = 60.0  # % (Maximum safe fire when danger detected)
        
        if request.ai_mode_enabled:
            # Check if LSTM predicts danger
            if predicted_temp_final > DANGER_TEMP_THRESHOLD:
                # INTERVENTION: Clamp the fire to safe level
                final_fire_input = min(user_fire_input, SAFE_FIRE_LIMIT)
                ai_intervention_active = True
                intervention_reason = f"Predicted temperature {predicted_temp_final:.1f}°C exceeds safe limit ({DANGER_TEMP_THRESHOLD}°C)"
                
                print(f"   🤖 AI OVERRIDE: {user_fire_input:.1f}% → {final_fire_input:.1f}%")
                print(f"   Reason: {intervention_reason}")
        
        # ========================
        # STEP 5: UPDATE PHYSICS ENGINE
        # ========================
        # Send the (possibly AI-limited) fire input to the physics simulation
        physics_state = physics_engine.update(fire_intensity=final_fire_input)
        
        print(f"   💧 Water: {physics_state['water_level']:.1f}% | "
              f"⚡ Pressure: {physics_state['pressure']:.1f} MPa | "
              f"📈 Status: {physics_state['status']}")
        
        # ========================
        # STEP 6: PACKAGE RESPONSE
        # ========================
        return SimulationResponse(
            visual_state={
                "water_level": physics_state['water_level'],
                "pressure": physics_state['pressure'],
                "temperature": physics_state['temperature'],
                "fire_intensity": final_fire_input,  # The ACTUAL fire (after AI intervention)
                "steam_generation": physics_state['steam_generation']
            },
            ai_data={
                "predicted_temp_avg": round(predicted_temp_avg, 2),
                "predicted_temp_final": round(predicted_temp_final, 2),
                "predicted_temps_series": [round(t, 2) for t in future_temperatures],
                "original_user_input": user_fire_input,
                "actual_system_input": final_fire_input,
                "intervention_active": ai_intervention_active,
                "intervention_reason": intervention_reason,
                "ai_mode_enabled": request.ai_mode_enabled
            },
            status=physics_state['status']
        )
        
    except Exception as e:
        print(f"❌ Simulation error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

@app.post("/reset")
async def reset_simulation():
    """
    Reset the drum boiler simulation to initial conditions
    
    Use this to start a new demo or recover from a trip condition
    """
    try:
        physics_engine.reset(
            water_level=50.0,
            pressure=10.0,
            temperature=540.0
        )
        
        print("\n🔄 Simulation reset to initial conditions")
        
        return {
            "status": "success",
            "message": "Boiler simulation reset to initial state",
            "initial_state": physics_engine.get_state()
        }
        
    except Exception as e:
        print(f"❌ Reset error: {e}")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.get("/state")
async def get_current_state():
    """
    Get current boiler state without updating physics
    
    Useful for debugging or reconnecting frontend
    """
    try:
        return {
            "status": "success",
            "state": physics_engine.get_state()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get state: {str(e)}")

# ========================
# Run Server
# ========================

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*60)
    print("Starting Boiler Digital Twin API Server...")
    print("="*60)
    print("Access API docs at: http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
