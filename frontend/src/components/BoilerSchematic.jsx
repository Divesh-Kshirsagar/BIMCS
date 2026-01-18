import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Stage, Environment } from '@react-three/drei'
import Model from './Model'

/**
 * BoilerSchematic Component
 * 
 * Visualizes the drum boiler state in 3D using Three.js
 * 
 * TODO: In Blender, prepare the model with these separate meshes:
 * 1. Static Tank Body (name: "BoilerDrum" or similar)
 * 2. Water Cylinder (name: "Water") - IMPORTANT: Set origin to BOTTOM
 * 3. Fire Plane (name: "Fire") - Located at bottom of drum
 * 4. (Optional) Steam particles or pipes
 * 
 * CRITICAL: Water mesh origin MUST be at bottom, not center!
 * This ensures scale.y=0.5 makes it half-full, not floating
 */

const BoilerSchematic = ({ 
  waterLevel = 50,
  pressure = 10, 
  fireIntensity = 30,
  status = 'NORMAL'
}) => {
  // NOTE: These refs will be used to access 3D meshes from Model.jsx
  // The Model component needs to expose these refs or we need to modify it
  
  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-6 border-2 border-slate-700 relative">
      {/* Status Badge Overlay */}
      <div className="absolute top-8 right-8 z-10">
        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
          status === 'NORMAL' ? 'bg-emerald-900 text-emerald-400' :
          status === 'WARNING' ? 'bg-amber-900 text-amber-400 animate-pulse' :
          'bg-rose-900 text-rose-400 animate-pulse'
        }`}>
          {status}
        </div>
      </div>

      {/* TODO: Add legend showing water level zones */}
      <div className="absolute bottom-8 left-8 z-10 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Danger (&lt;20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded"></div>
          <span>Normal (20-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-800 rounded"></div>
          <span>Flooding (&gt;80%)</span>
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Environment preset="studio" />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <ambientLight intensity={0.3} />
      
        <Suspense fallback={null}>
          {/* 
            TODO: Modify Model.jsx to accept props and update mesh properties
            The Model component should:
            1. Find the "Water" mesh and set scale.y = waterLevel / 100
            2. Find the "Fire" mesh and set material.emissiveIntensity = pressure / 25
            3. Update water color based on level (Red < 20%, Blue > 80%, Cyan normal)
          */}
          <Model 
            waterLevel={waterLevel}
            pressure={pressure}
            fireIntensity={fireIntensity}
            status={status}
          />
        </Suspense>

        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default BoilerSchematic;
