# Boiler Digital Twin - LSTM Backend

A Python-based digital twin for predicting boiler steam temperature using LSTM neural networks.

## 🎯 Overview

This system predicts steam temperature based on control inputs (valve position, pressure, flow rate) using a trained LSTM model. It respects the physical relationship: **higher valve position → more cooling spray → lower temperature**.

## 📋 Features

- **LSTM Model Training**: 60-timestep sequences, early stopping, progress indicators
- **FastAPI Backend**: REST API for temperature predictions
- **Synthetic Data Fallback**: Generates physics-based test data if `data.csv` is missing
- **Iterative Forecasting**: Predicts 30 future timesteps
- **Health Monitoring**: `/health` endpoint for system status

## 🚀 Quick Start

### 1. Install Dependencies

```bash
uv pip install tensorflow pandas numpy scikit-learn fastapi uvicorn tqdm
```

### 2. Train the Model

```bash
# Open and run the Jupyter notebook
jupyter notebook train_model.ipynb
```

This will:
- Load `data.csv` (or generate synthetic data)
- Train LSTM model with early stopping
- Save `boiler_model.keras` and `scaler.pkl`

### 3. Start the API Server

```bash
python main.py
```

Server will start at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### 4. Make Predictions

**Example Request:**
```bash
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "valve_open": 50.0,
    "pressure": 101.3,
    "flow": 45.2
  }'
```

**Example Response:**
```json
{
  "time": [1, 2, 3, ..., 30],
  "temperature": [540.1, 539.8, 539.5, ..., 538.2]
}
```

## 📁 Files

- `train_model.ipynb` - LSTM model training notebook
- `main.py` - FastAPI server
- `data.csv` - Time-series boiler data (86,402 rows)
- `boiler_model.keras` - Trained model (created after training)
- `scaler.pkl` - Feature scaler (created after training)

## 🧪 Test the Physics

Higher valve → Lower temperature:
```json
{"valve_open": 80.0, "pressure": 101.0, "flow": 45.0}
→ Temperature: ~530-535°C
```

Lower valve → Higher temperature:
```json
{"valve_open": 20.0, "pressure": 101.0, "flow": 45.0}
→ Temperature: ~545-550°C
```

## 📊 Model Details

- **Architecture**: LSTM(50) → Dropout(0.2) → Dense(1)
- **Input**: 60 timesteps × 4 features (valve, pressure, flow, temp)
- **Output**: Next temperature value
- **Training**: Adam optimizer, MSE loss, early stopping

## 🔗 API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed system status
- `POST /predict` - Predict temperature (30 future steps)

## 📝 Notes

- Model uses **CPU** by default (TensorFlow will detect GPU if CUDA is configured)
- Synthetic data generated if `data.csv` is missing
- Predictions assume system was stable for past 60 timesteps

## 🛠️ Troubleshooting

**Model not found error:**
```
→ Run train_model.ipynb first to generate boiler_model.keras
```

**Poor predictions:**
```
→ Check that data.csv has the correct columns
→ Retrain with more epochs if needed
```

---

For detailed walkthrough, see `walkthrough.md` in the artifacts folder.
