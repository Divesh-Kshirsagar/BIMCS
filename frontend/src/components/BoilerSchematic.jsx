import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense } from 'react'
import { OrbitControls, Stage, Environment, Grid, Stars } from '@react-three/drei'
import Model from './Model'

/**
 * BoilerSchematic Component
 * 
 * Visualizes the drum boiler state in 3D using Three.js
 */

const BoilerSchematic = ({ 
  waterLevel = 50,
  pressure = 10, 
  fireIntensity = 30,
  status = 'NORMAL'
}) => {
  return (
    <div className="w-full h-full relative group">
      {/* Status Badge Overlay */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className={`px-4 py-2 rounded font-bold text-xs tracking-widest uppercase border ${
          status === 'NORMAL' ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-400' :
          status === 'WARNING' ? 'bg-amber-950/50 border-amber-500/50 text-amber-400 animate-pulse' :
          'bg-rose-950/50 border-rose-500/50 text-rose-400 animate-pulse'
        }`}>
          {status}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 text-[10px] text-slate-400 space-y-2 pointer-events-none p-2 rounded bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-rose-500 rounded-sm shadow-[0_0_5px_#f43f5e]"></div>
          <span className="uppercase tracking-wider">Danger (&lt;20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-cyan-500 rounded-sm shadow-[0_0_5px_#06b6d4]"></div>
          <span className="uppercase tracking-wider">Normal (20-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-sm shadow-[0_0_5px_#2563eb]"></div>
          <span className="uppercase tracking-wider">Flooding (&gt;80%)</span>
        </div>
      </div>

      <Canvas camera={{ position: [8, 5, 12], fov: 45 }} gl={{ antialias: true }} dpr={[1, 2]}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 5, 30]} />
        
        {/* Cinematic Lighting */}
        <ambientLight intensity={0.5} />
        <Environment preset="city" />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#06b6d4" />
        <pointLight position={[-10, -5, -10]} intensity={1.0} color="#d946ef" />
        <spotLight position={[0, 10, 0]} angle={0.5} penumbra={1} intensity={2} castShadow />

        {/* Futuristic Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          sectionColor="#06b6d4" 
          cellColor="#1e293b" 
          sectionSize={3} 
          cellSize={1}
          sectionThickness={1.5}
          cellThickness={0.5}
        />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            <Model 
              waterLevel={waterLevel}
              pressure={pressure}
              fireIntensity={fireIntensity}
              status={status}
            />
          </group>
        </Suspense>

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          target={[0, 1, 0]}
          maxPolarAngle={Math.PI / 1.5}
          autoRotate={false}
        />
      </Canvas>
      
      {/* Vignette Overlay for cinematic look */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.4)_100%)]"></div>
    </div>
  );
};

export default BoilerSchematic;
