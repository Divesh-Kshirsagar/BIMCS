import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useGLTF, Html, Cloud } from "@react-three/drei";
import * as THREE from "three";
import { useFireParticles } from "./useFireParticles";
import { useBoilingBubbles } from "./useBoilingBubbles";
import { useLavaEffect } from "./useLavaEffect";
import { useWater2Effect } from "./useWater2Effect";
import { useSmokeParticles } from "./useSmokeParticles";

const PART_LABELS = {
  "water_drum": "Water Drum",
  "steam_drum": "Steam Drum",
  "furnace": "Furnace",
  "Cube": "Mud Drum",
  "pipes011": "Smoke Outlet",
  "Water": "Water Level",
  "fire": "Burner Flame",
  "fuel_inlet": "Fuel Inlet",
  "side_water ": "Side Water",
  "smoke": "Steam/Smoke"
};

export default function Model({
  waterLevel = 50,
  pressure = 10,
  fireIntensity = 30,
  status = "NORMAL",
  ...props
}) {
  const { scene } = useGLTF("/model.glb");

  const [smokeMesh, setSmokeMesh] = useState(null);
  const [hoveredPart, setHoveredPart] = useState(null);
  const [waterMesh, setWaterMesh] = useState(null);
  const [sideWaterMesh, setSideWaterMesh] = useState(null);
  const [fireMesh, setFireMesh] = useState(null);
  
  // External Effects
  const firePosition = { x: 0.4136, y: -0.0432, z: 0.6 };
  useFireParticles(scene, firePosition, fireIntensity);

  const waterBounds = {
    centerX: -0.0029, centerY: 1.0975,
    bottomZ: -0.3, topZ: 0.3,
    radiusX: 0.6, radiusY: 0.8,
  };
  useBoilingBubbles(scene, waterBounds, fireIntensity);

  useLavaEffect(scene, fireMesh, fireIntensity);
  useWater2Effect(scene, waterMesh, { color: 0x0088aa, scale: 2, flowSpeed: 0.03, reflectivity: 0.5 });
  useWater2Effect(scene, sideWaterMesh, { color: 0x0077aa, scale: 1.5, flowSpeed: 0.02, reflectivity: 0.4 });
  // Steam effect using Water2 shader
  useWater2Effect(scene, smokeMesh, { color: 0x000000, scale: 1.0, flowSpeed: 10, reflectivity: 0.9 });

  // Smoke Outlet Particles
  // Blender Coordinates (Z-up): [0.1742, 0.0878, 3.8507]
  // Three.js Coordinates (Y-up): [x, z, -y] or [x, z, y] depending on export.
  // We map Blender Z (3.8507) to Three Y (Up).
  // We map Blender Y (0.0878) to Three Z (Depth).
  const smokeOutletPos = { x: 0.45, y: 4.4, z: -0.2 };
  useSmokeParticles(scene, smokeOutletPos);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;

        if (child.name === "Water") setWaterMesh(child);
        if (child.name === "side water " || child.name === "side water") setSideWaterMesh(child);
        if (child.name === "fire") setFireMesh(child);

        if (child.name === "smoke") setSmokeMesh(child);
      }
    });
  }, [scene]);

  return (
    <group {...props} dispose={null}>
      <primitive 
        object={scene} 
        onPointerOver={(e) => {
          e.stopPropagation();
          const label = PART_LABELS[e.object.name];
          if (label) {
            document.body.style.cursor = 'pointer';
            setHoveredPart({ name: label, position: e.point });
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
          setHoveredPart(null);
        }}
      />
      

      
      {hoveredPart && (
        <Html position={[hoveredPart.position.x, hoveredPart.position.y + 0.5, hoveredPart.position.z]} center>
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500 rounded px-3 py-1 pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.5)] transform -translate-y-8">
            <div className="text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-2">
               <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
               {hoveredPart.name}
            </div>
          </div>
          <div className="w-px h-8 bg-gradient-to-t from-cyan-500 to-transparent mx-auto"></div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/model.glb");