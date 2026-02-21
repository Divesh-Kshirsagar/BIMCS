# System Architecture

## Overview

B.I.M.C.S employs a **Hybrid Digital Twin** architecture that uniquely combines deterministic physics simulation with probabilistic machine learning to create a sophisticated industrial control system.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React UI Components]
        Canvas[Three.js 3D Canvas]
        State[State Management]
    end
    
    subgraph "Communication"
        API[REST API / Axios]
    end
    
    subgraph "Backend Layer"
        FastAPI[FastAPI Server]
        Router[API Routes]
    end
    
    subgraph "Simulation Core"
        Physics[Physics Engine]
        LSTM[LSTM Model]
        Supervisor[AI Supervisor]
    end
    
    subgraph "Data Layer"
        Model[Keras Model File]
        Scaler[Data Scaler]
        History[Simulation History]
    end
    
    UI --> State
    Canvas --> State
    State --> API
    API --> FastAPI
    FastAPI --> Router
    Router --> Physics
    Router --> LSTM
    LSTM --> Supervisor
    Supervisor --> Physics
    Physics --> Router
    LSTM -.loads.-> Model
    LSTM -.loads.-> Scaler
    Physics --> History
    Router --> API
    API --> State
    State --> UI
    State --> Canvas
    
```

## Core Design Principles

### 1. Hybrid Digital Twin Approach

The system combines two complementary modeling strategies:

| Component | Type | Role | Characteristics |
|-----------|------|------|-----------------|
| **Physics Engine** | Deterministic | Present State Calculator | Grounded in thermodynamic laws, 100% reproducible |
| **LSTM Model** | Probabilistic | Future State Predictor | Learns from data, handles uncertainty |
| **AI Supervisor** | Rule-based + ML | Safety Controller | Combines predictions with safety logic |

#### Why Hybrid?

- **Physics alone** cannot predict operator errors or equipment degradation
- **AI alone** may violate physical laws or make unrealistic predictions
- **Together** they provide grounded predictions with learned adaptability

### 2. Separation of Concerns

```mermaid
graph LR
    subgraph "Presentation"
        A[3D Visualization]
        B[Control Interface]
        C[Telemetry Display]
    end
    
    subgraph "Application"
        D[State Management]
        E[API Client]
        F[Effect Orchestration]
    end
    
    subgraph "Domain"
        G[Simulation Logic]
        H[Physics Calculations]
        I[AI Inference]
    end
    
    subgraph "Infrastructure"
        J[FastAPI Server]
        K[Model Loading]
        L[Data Persistence]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> J
    J --> G
    G --> H
    G --> I
    H --> L
    I --> K
    
```

## Component Interaction Flow

### Simulation Loop (Every Update Cycle)

```mermaid
sequenceDiagram
    participant User
    participant Dashboard
    participant ControlPanel
    participant API
    participant FastAPI
    participant Physics
    participant LSTM
    participant Supervisor
    
    User->>ControlPanel: Adjust Fire Slider
    ControlPanel->>Dashboard: Update fireIntensity
    Dashboard->>API: POST /simulate
    Note over API: {user_fire_intensity: 75, ai_mode_enabled: true}
    
    API->>FastAPI: HTTP Request
    FastAPI->>Physics: Get Current State
    Physics-->>FastAPI: {water: 45%, pressure: 12 MPa, temp: 560°C}
    
    FastAPI->>LSTM: Predict Future (30 steps)
    Note over LSTM: Input: [pressure, fire, water, flow...]
    LSTM-->>FastAPI: predicted_temps: [560, 562, 565, ...]
    
    FastAPI->>Supervisor: Evaluate Safety
    Note over Supervisor: Check if predicted_temp > 600°C
    
    alt Dangerous Prediction
        Supervisor->>Supervisor: CLAMP fire_intensity to safe level
        Supervisor-->>FastAPI: actual_fire = 40 (clamped)
    else Safe Prediction
        Supervisor-->>FastAPI: actual_fire = 75 (original)
    end
    
    FastAPI->>Physics: Update with actual_fire
    Physics->>Physics: Calculate next state
    Physics-->>FastAPI: Updated state
    
    FastAPI-->>API: SimulationResponse
    API-->>Dashboard: Update simulationState & aiData
    Dashboard->>User: Render 3D Effects & Charts
```

### AI Supervisor Decision Logic

```mermaid
flowchart TD
    Start[Receive User Input] --> Check{AI Mode Enabled?}
    Check -->|No| Direct[Pass Through Directly]
    Check -->|Yes| Predict[Run LSTM Prediction]
    
    Predict --> Analyze[Analyze 30-step Forecast]
    Analyze --> Danger{Predicted Temp > 600°C?}
    
    Danger -->|No| Safe[Use Original Input]
    Danger -->|Yes| Clamp[Calculate Safe Fire Level]
    
    Clamp --> Log[Log Intervention]
    Log --> Apply[Apply Clamped Value]
    
    Safe --> Update[Update Physics Engine]
    Direct --> Update
    Apply --> Update
    
    Update --> Return[Return State + Telemetry]
    
```

## Data Flow Architecture

### Request/Response Pipeline

```mermaid
graph LR
    subgraph "Client Side"
        A[React State]
        B[Axios Client]
    end
    
    subgraph "Network"
        C[HTTP POST]
        D[JSON Payload]
    end
    
    subgraph "Server Side"
        E[FastAPI Endpoint]
        F[Pydantic Validation]
        G[Business Logic]
    end
    
    subgraph "Processing"
        H[Physics Step]
        I[LSTM Inference]
        J[Data Transformation]
    end
    
    subgraph "Response"
        K[JSON Response]
        L[State Update]
    end
    
    A -->|Request| B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    H --> J
    I --> J
    J --> K
    K --> L
    L --> A
```

## Technology Stack Details

### Frontend Architecture

```mermaid
graph TB
    subgraph "UI Layer"
        React[React 19]
        Tailwind[Tailwind CSS v4]
        Lucide[Lucide Icons]
    end
    
    subgraph "3D Rendering"
        Three[Three.js]
        R3F[React Three Fiber]
        Drei[Drei Helpers]
    end
    
    subgraph "Data Viz"
        Recharts[Recharts]
        GSAP[GSAP Animations]
    end
    
    subgraph "Network"
        Axios[Axios]
    end
    
    subgraph "Build Tools"
        Vite[Vite]
        TS[TypeScript]
    end
    
    React --> Three
    React --> Tailwind
    React --> Recharts
    R3F --> Three
    R3F --> Drei
    React --> Axios
    Vite --> React
    TS --> React
```

### Backend Architecture

```mermaid
graph TB
    subgraph "API Layer"
        FastAPI[FastAPI Framework]
        Pydantic[Pydantic Models]
        CORS[CORS Middleware]
    end
    
    subgraph "Business Logic"
        Simulation[Simulation Controller]
        Prediction[Prediction Service]
    end
    
    subgraph "Domain Models"
        Physics[DrumBoilerPhysics]
        Supervisor[AI Supervisor Logic]
    end
    
    subgraph "ML Stack"
        TF[TensorFlow]
        Keras[Keras Model]
        Scaler[Scikit-learn Scaler]
    end
    
    subgraph "Data Processing"
        NumPy[NumPy]
        Pandas[Pandas]
    end
    
    FastAPI --> Pydantic
    FastAPI --> CORS
    FastAPI --> Simulation
    FastAPI --> Prediction
    Simulation --> Physics
    Simulation --> Supervisor
    Prediction --> Keras
    Supervisor --> Keras
    Keras --> TF
    Prediction --> Scaler
    Physics --> NumPy
    Keras --> NumPy
    Prediction --> Pandas
```

## Deployment Architecture

### Development Environment

```mermaid
graph LR
    subgraph "Developer Machine"
        subgraph "Frontend"
            Vite[Vite Dev Server<br/>:5173]
        end
        
        subgraph "Backend"
            Uvicorn[Uvicorn Server<br/>:8000]
        end
        
        subgraph "Browser"
            App[React App]
        end
    end
    
    App -->|HTTP| Vite
    App -->|API Calls| Uvicorn
    Vite -->|HMR WebSocket| App
```

### Production Deployment (Future)

```mermaid
graph TB
    subgraph "Client"
        Browser[Web Browser]
    end
    
    subgraph "Edge"
        CDN[CDN / Static Hosting]
        LB[Load Balancer]
    end
    
    subgraph "Application"
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
    end
    
    subgraph "Data"
        DB[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[Model Storage S3]
    end
    
    Browser --> CDN
    Browser --> LB
    CDN --> FE1
    CDN --> FE2
    LB --> BE1
    LB --> BE2
    BE1 --> DB
    BE2 --> DB
    BE1 --> Redis
    BE2 --> Redis
    BE1 --> S3
    BE2 --> S3
```

## State Management

### Frontend State Architecture

The Dashboard component acts as the central state manager:

```javascript
// User Inputs
fireIntensity: number (0-100)
aiModeEnabled: boolean

// Simulation State (from backend)
simulationState: {
  water_level: number
  pressure: number
  temperature: number
  fire_intensity: number
  steam_generation: number
}

// AI Telemetry
aiData: {
  predicted_temp_avg: number
  predicted_temp_final: number
  predicted_temps_series: number[]
  intervention_active: boolean
  intervention_reason: string
}

// System Status
systemStatus: 'NORMAL' | 'WARNING' | 'CRITICAL' | 'TRIPPED'

// UI State
loading: boolean
error: string | null
chartHistory: Array<dataPoint>
```

### Backend State Management

The physics engine maintains stateful simulation:

```python
class DrumBoilerPhysics:
    # State Variables
    water_level: float  # 0-100%
    pressure: float     # 0-25 MPa
    temperature: float  # °C
    fire_intensity: float  # 0-100%
    
    # Status
    status: str  # NORMAL, WARNING, CRITICAL, TRIPPED
    alarm_messages: List[str]
    
    # History
    history: List[Dict]  # For analysis
```

## Security Considerations

### Current Implementation (Development)

- CORS: Allow all origins (`allow_origins=["*"]`)
- No authentication
- No rate limiting
- Local execution only

### Production Requirements (Future)

```mermaid
graph TB
    A[Client] --> B[API Gateway]
    B --> C{Authentication}
    C -->|Invalid| D[401 Unauthorized]
    C -->|Valid| E{Rate Limit Check}
    E -->|Exceeded| F[429 Too Many Requests]
    E -->|OK| G{Authorization}
    G -->|Forbidden| H[403 Forbidden]
    G -->|Allowed| I[Backend Service]
    
```

Required security features:
- JWT authentication
- Role-based access control (Operator, Engineer, Admin)
- Rate limiting (per user/IP)
- Input validation and sanitization
- HTTPS/TLS encryption
- API key management for ML model access

## Scalability Considerations

### Current Limitations
- Single-threaded Python physics engine
- In-memory state (no persistence)
- Synchronous request processing
- One boiler simulation per instance

### Future Scaling Strategy
- Horizontal scaling with stateless backend
- Redis for distributed state management
- Message queue for async processing
- Multi-boiler support with isolation
- ML model caching and batching

## Performance Characteristics

| Metric | Current | Target (Production) |
|--------|---------|-------------------|
| Simulation Update Rate | ~10 Hz | 50-100 Hz |
| API Response Time | <50ms | <20ms |
| 3D Rendering FPS | 60 FPS | 60-120 FPS |
| LSTM Inference Time | ~10ms | <5ms |
| Concurrent Users | 1 | 100+ |

---

Next: [Frontend Architecture →](frontend.md)
