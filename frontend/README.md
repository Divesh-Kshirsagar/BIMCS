# B.I.M.C.S - Frontend (React + Three.js)

The frontend is a high-fidelity 3D visualization dashboard built with React 19, Vite, and React Three Fiber. It renders the digital twin of the boiler and provides a futuristic interface for monitoring and control.

## 🛠️ Technology Stack

-   **Core**: React 19, Vite
-   **3D Engine**: Three.js, @react-three/fiber, @react-three/drei
-   **Styling**: Tailwind CSS v4
-   **State/Network**: Axios (API communication)
-   **Charting**: Recharts

## 📂 Project Structure

```
src/
├── components/          # UI and 3D Components
│   ├── Dashboard.jsx    # Main Layout & State Manager
│   ├── Model.jsx        # 3D Boiler Scene (gLTF + Effects)
│   ├── ControlPanel.jsx # Sliders for User Input
│   ├── TrendChart.jsx   # Live Temperature Telemetry
│   └── hooks/           # Custom Hooks for 3D Effects
│       ├── useFireParticles.js
│       ├── useSmokeParticles.js
│       └── ...
├── App.jsx              # Root Component
└── main.jsx             # Entry Point
```

## 🗝️ Key Components

### 1. `Dashboard.jsx`
The "brain" of the frontend. It holds the simulation state (`fireIntensity`, `waterLevel`, `pressure`, `temperature`) and orchestrates the API calls to the backend `/simulate` endpoint. It distributes this state to the 3D Model and the UI panels.

### 2. `Model.jsx`
The "body" of the digital twin. It:
-   Loads the Boiler glTF model.
-   Applies dynamic visual effects:
    -   **Fire**: Custom shader material that intensifies with user input.
    -   **Water**: Realistic water shader that rises/falls based on physics state.
    -   **Smoke**: Volumetric particles that increase with fire intensity.
    -   **Heat Glow**: Emissive materials that react to temperature changes.

### 3. `ControlPanel.jsx`
The "hands" of the user. It provides:
-   Fire Intensity Slider (0-100%).
-   AI Mode Toggle (Enables/Disables the "Safe Mode" supervisor).
-   Manual Valve Controls (optional/future).

## 🚀 Development Scripts

-   `npm run dev`: Start local development server.
-   `npm run build`: Type-check and build for production.
-   `npm run preview`: Preview the production build.
