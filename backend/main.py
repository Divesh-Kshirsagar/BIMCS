"""
Boiler Digital Twin - FastAPI Backend
Serves LSTM predictions for boiler steam temperature based on control inputs.
"""

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import pickle
import tensorflow as tf
from tensorflow import keras
import os

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
