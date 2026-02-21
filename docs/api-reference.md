# API Reference

## Base URL

**Development**: `http://localhost:8000`  
**Production**: TBD

## Authentication

!!! info "Current Status"
    Authentication is not currently implemented. All endpoints are publicly accessible in development mode.

## Common Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input parameters |
| 422 | Unprocessable Entity | Pydantic validation failed |
| 500 | Internal Server Error | Server-side failure |

## Endpoints

### 1. Simulate Step

Run one simulation cycle with optional AI intervention.

```http
POST /simulate
Content-Type: application/json
```

#### Request Body

```json
{
  "user_fire_intensity": 75.0,
  "ai_mode_enabled": true
}
```

**Parameters**:

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `user_fire_intensity` | float | Yes | 0.0 - 100.0 | User's fire control slider value (%) |
| `ai_mode_enabled` | boolean | No (default: false) | - | Enable AI supervisor safety intervention |

#### Response

```json
{
  "visual_state": {
    "water_level": 45.2,
    "pressure": 12.5,
    "temperature": 565.3,
    "fire_intensity": 60.0,
    "steam_generation": 7.5
  },
  "ai_data": {
    "predicted_temp_avg": 590.2,
    "predicted_temp_final": 605.1,
    "predicted_temps_series": [565.3, 567.8, 570.2, 573.1, ...],
    "original_user_input": 75.0,
    "actual_system_input": 60.0,
    "intervention_active": true,
    "intervention_reason": "Predicted overheat: 605.1°C",
    "ai_mode_enabled": true
  },
  "status": "WARNING"
}
```

**Response Fields**:

##### visual_state

| Field | Type | Unit | Range | Description |
|-------|------|------|-------|-------------|
| `water_level` | float | % | 0-100 | Current drum water level |
| `pressure` | float | MPa | 0-25 | Steam pressure |
| `temperature` | float | °C | 0-700 | Steam temperature |
| `fire_intensity` | float | % | 0-100 | Actual fire intensity (may differ from user input if AI intervened) |
| `steam_generation` | float | units/sec | 0-∞ | Steam production rate |

##### ai_data

| Field | Type | Description |
|-------|------|-------------|
| `predicted_temp_avg` | float | Average temperature over 30-step forecast |
| `predicted_temp_final` | float | Temperature at end of 30-step forecast |
| `predicted_temps_series` | array[float] | Full 30-step temperature prediction array |
| `original_user_input` | float | User's requested fire intensity |
| `actual_system_input` | float | Fire intensity actually applied (clamped if dangerous) |
| `intervention_active` | boolean | Whether AI supervisor intervened |
| `intervention_reason` | string | Explanation if intervention occurred |
| `ai_mode_enabled` | boolean | Echo of request parameter |

##### status

| Value | Meaning | Trigger Condition |
|-------|---------|------------------|
| `NORMAL` | All parameters within safe range | All good |
| `WARNING` | Approaching safety limits | Temp > 580°C or Pressure > 18 MPa |
| `CRITICAL` | Dangerous conditions | Temp > 600°C or Pressure > 20 MPa |
| `TRIPPED` | Emergency shutdown | Water < 10% or Pressure > 25 MPa |

#### Example Usage

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/simulate \
      -H "Content-Type: application/json" \
      -d '{
        "user_fire_intensity": 75.0,
        "ai_mode_enabled": true
      }'
    ```

=== "Python (requests)"
    ```python
    import requests
    
    response = requests.post(
        'http://localhost:8000/simulate',
        json={
            'user_fire_intensity': 75.0,
            'ai_mode_enabled': True
        }
    )
    
    data = response.json()
    print(f"Temperature: {data['visual_state']['temperature']}°C")
    print(f"AI Intervention: {data['ai_data']['intervention_active']}")
    ```

=== "JavaScript (axios)"
    ```javascript
    import axios from 'axios';
    
    const response = await axios.post('http://localhost:8000/simulate', {
      user_fire_intensity: 75.0,
      ai_mode_enabled: true
    });
    
    const state = response.data.visual_state;
    const aiData = response.data.ai_data;
    
    console.log(`Temperature: ${state.temperature}°C`);
    console.log(`AI Active: ${aiData.intervention_active}`);
    ```

#### Error Responses

```json
{
  "detail": "user_fire_intensity must be between 0 and 100"
}
```

---

### 2. Predict Temperature

Get standalone 30-step temperature forecast without updating physics state.

```http
POST /predict
Content-Type: application/json
```

#### Request Body

```json
{
  "valve_open": 80.0,
  "pressure": 12.0,
  "flow": 500.0
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `valve_open` | float | Yes | Valve position 0-100% |
| `pressure` | float | Yes | Current furnace pressure (MPa) |
| `flow` | float | Yes | Fan flow rate (units/min) |

#### Response

```json
{
  "time": [1, 2, 3, 4, 5, ..., 30],
  "temperature": [560.0, 562.5, 565.2, 567.8, 570.5, ..., 595.3]
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `time` | array[int] | Time steps 1-30 (seconds) |
| `temperature` | array[float] | Predicted temperature at each time step (°C) |

#### Example Usage

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/predict \
      -H "Content-Type: application/json" \
      -d '{
        "valve_open": 80.0,
        "pressure": 12.0,
        "flow": 500.0
      }'
    ```

=== "Python"
    ```python
    response = requests.post(
        'http://localhost:8000/predict',
        json={
            'valve_open': 80.0,
            'pressure': 12.0,
            'flow': 500.0
        }
    )
    
    predictions = response.json()
    print(f"Final predicted temp: {predictions['temperature'][-1]}°C")
    ```

---

### 3. Reset Simulation

Reset the physics engine to safe initial conditions.

```http
POST /reset
Content-Type: application/json
```

#### Request Body

No body required (empty JSON `{}` or omit entirely).

#### Response

```json
{
  "message": "Simulation reset to initial conditions",
  "state": {
    "water_level": 50.0,
    "pressure": 10.0,
    "temperature": 540.0,
    "fire_intensity": 0.0
  }
}
```

#### Example Usage

=== "cURL"
    ```bash
    curl -X POST http://localhost:8000/reset \
      -H "Content-Type: application/json"
    ```

=== "Python"
    ```python
    response = requests.post('http://localhost:8000/reset')
    data = response.json()
    print(data['message'])
    ```

=== "JavaScript"
    ```javascript
    const response = await axios.post('http://localhost:8000/reset');
    console.log(response.data.message);
    ```

---

### 4. Health Check

Check if the backend services are operational.

```http
GET /health
```

#### Response

```json
{
  "status": "healthy",
  "model_loaded": true,
  "scaler_loaded": true,
  "physics_engine": "ready",
  "version": "1.0.0"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Overall health: "healthy" or "unhealthy" |
| `model_loaded` | boolean | LSTM model loaded successfully |
| `scaler_loaded` | boolean | Data scaler loaded successfully |
| `physics_engine` | string | Physics engine status: "ready", "error", "not initialized" |
| `version` | string | API version |

#### Example Usage

=== "cURL"
    ```bash
    curl http://localhost:8000/health
    ```

=== "Python"
    ```python
    response = requests.get('http://localhost:8000/health')
    health = response.json()
    
    if health['status'] == 'healthy':
        print("✓ Backend operational")
    else:
        print("✗ Backend issues detected")
    ```

---

## WebSocket Support (Future)

!!! note "Planned Feature"
    Real-time bidirectional communication for live telemetry streaming.

```javascript
// Future WebSocket API
const ws = new WebSocket('ws://localhost:8000/ws/telemetry');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateDashboard(data.visual_state);
};

ws.send(JSON.stringify({
  action: 'update_fire',
  value: 75.0
}));
```

---

## Rate Limiting (Future)

Planned rate limits for production:

| Endpoint | Rate Limit | Window |
|----------|-----------|--------|
| `/simulate` | 100 requests | per minute |
| `/predict` | 50 requests | per minute |
| `/reset` | 10 requests | per minute |
| `/health` | 1000 requests | per minute |

---

## Error Codes Reference

### 400 Bad Request

```json
{
  "detail": "Invalid fire_intensity value: must be between 0 and 100"
}
```

**Causes**:
- Parameter out of valid range
- Missing required field

### 422 Unprocessable Entity

```json
{
  "detail": [
    {
      "loc": ["body", "user_fire_intensity"],
      "msg": "ensure this value is greater than or equal to 0",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

**Causes**:
- Pydantic validation failure
- Type mismatch (e.g., string instead of float)

### 500 Internal Server Error

```json
{
  "detail": "Physics simulation error: Division by zero in pressure calculation"
}
```

**Causes**:
- Physics engine crash
- Model inference failure
- Unexpected system state

---

## OpenAPI / Swagger Documentation

The FastAPI backend automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

These interfaces allow you to:
- Explore all endpoints
- See request/response schemas
- Test API calls directly from browser
- Download OpenAPI specification

---

## SDK / Client Libraries (Future)

Planned official client libraries:

- **Python**: `pip install bimcs-client`
- **JavaScript/TypeScript**: `npm install @bimcs/client`
- **C#/.NET**: `dotnet add package BIMCS.Client`

Example usage:
```python
from bimcs_client import BoilerClient

client = BoilerClient(base_url='http://localhost:8000')

# Run simulation
result = client.simulate(fire_intensity=75.0, ai_enabled=True)
print(f"Temperature: {result.temperature}°C")

# Get predictions
forecast = client.predict(valve=80, pressure=12, flow=500)
print(f"30-sec ahead: {forecast[-1]}°C")
```

---

Next: [3D Model Documentation →](3d-model.md)
