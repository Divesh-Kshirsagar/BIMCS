# B.I.M.C.S - Backend (FastAPI + Physics + AI)

The backend is the "brain" and "heart" of the digital twin. It uniquely combines a deterministic Physics Engine with a probabilistic AI Model to create a sophisticated simulation environment.

## 🧠 Hybrid Architecture

The system uses a **Hybrid Digital Twin** approach:

1.  **Physics Engine (`boiler_physics.py`)**:
    -   Simulates the *current state* of the boiler (Water Level, Pressure, Temperature).
    -   Follows laws of thermodynamics (e.g., Heat causing expansion, pressure rising with temperature).
    -   Deterministic and grounded in reality.

2.  **AI Supervisor (`main.py` + LSTM)**:
    -   Acts as a "Fortune Teller".
    -   Predicts the *future state* (Steam Temperature) 30 seconds ahead.
    -   **Intervention**: If the AI predicts dangerous conditions (e.g., overheating), it *overrides* the user's input to clamp the fire intensity, preventing accidents.

## 🔌 API Endpoints

### 1. Simulation Loop (`POST /simulate`)
The main heartbeat of the application.
-   **Input**: `user_fire_intensity` (0-100), `ai_mode_enabled` (bool).
-   **Process**:
    1.  Calculates next Physics step.
    2.  Runs LSTM model to predict future temperature.
    3.  If `ai_mode_enabled` + `High Risk` -> **AI CLAMPS INPUT**.
    4.  Updates Physics with (potentially clamped) input.
-   **Output**: Current `visual_state` (for Three.js) and `ai_data` (predictions/interventions).

### 2. Standalone Prediction (`POST /predict`)
Used for generating trend lines.
-   **Input**: `valve_open`, `pressure`, `flow`.
-   **Output**: Array of 30 future temperature values.

### 3. System Management
-   `POST /reset`: Resets physics engine to initial safe state (Water=50%, Pressure=10MPa).
-   `GET /health`: Checks status of Tensorflow model and Scaler loading.

## 🛠️ Setup & Running

```bash
# 1. Install Dependencies
pip install -r requirements.txt

# 2. Run Server
python main.py
```
Server listens on `0.0.0.0:8000`.
Docs available at: `http://localhost:8000/docs`.

## 📂 Files
-   `main.py`: FastAPI application and AI Supervisor logic.
-   `boiler_physics.py`: The physics simulation class.
-   `train_model.ipynb`: Jupyter notebook used to train the LSTM model.
-   `boiler_model.keras`: Saved TensorFlow model.
