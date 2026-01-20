import React, { useRef, useEffect, useState } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSmokeParticles } from "./useSmokeParticles";
import { useFireParticles } from "./useFireParticles";
import { useBoilingBubbles } from "./useBoilingBubbles";
import { useLavaEffect } from "./useLavaEffect";
import { useWater2Effect } from "./useWater2Effect";

// Mapping of internal mesh names to display labels
const PART_LABELS = {
  "water_drum": "Water Drum",
  "steam_drum": "Steam Drum",
  "furnace": "Furnace",
  "Cube": "Mud Drum",
  "pipes011": "Smoke Outlet",
  "Water": "Water Level",
  "fire": "Burner Flame",
  "fuel_inlet": "Fuel Inlet"
};

/**
 * Model Component - 3D Boiler Visualization with Realistic Effects
 *
 * Effects:
 * - Fire: Lava shader using three-custom-shader-material + particle overlay
 * - Water: Water2-style physical material with animations
 * - Smoke: Enhanced particles with turbulence and size expansion
 */

export default function Model({
  waterLevel = 50,
  pressure = 10,
  fireIntensity = 30,
  status = "NORMAL",
  ...props
}) {
  const group = useRef();
  const { scene } = useGLTF("/model.glb");

  // Interaction State
  const [hoveredPart, setHoveredPart] = useState(null);

  // Mesh refs - populated after scene traversal
  const [waterMesh, setWaterMesh] = useState(null);
  const [fireMesh, setFireMesh] = useState(null);

  // ============================================================================
  // PARTICLE SYSTEMS
  // ============================================================================
  
  // Fire particles for additional flame effect
  const firePosition = { x: 0.4136, y: -0.0432, z: 0.6 };
  useFireParticles(scene, firePosition, fireIntensity);

  // Smoke particles inside steam drum
  const smokePosition = { x: -0.7101, y: 0.1609, z: 2.8478 };
  useSmokeParticles(scene, smokePosition);

  // Boiling bubbles in water
  const waterBounds = {
    centerX: -0.0029,
    centerY: -0.0512,
    bottomZ: 0.5,
    topZ: 1.7,
    radiusX: 0.6,
    radiusY: 0.6,
  };
  useBoilingBubbles(scene, waterBounds, fireIntensity);

  // ============================================================================
  // SHADER-BASED EFFECTS (applied to meshes after they're found)
  // ============================================================================
  
  // Lava effect on fire mesh
  useLavaEffect(scene, fireMesh, fireIntensity);

  // Water2 effect on water mesh
  useWater2Effect(scene, waterMesh, {
    color: 0x0088aa,
    scale: 2,
    flowSpeed: 0.03,
    reflectivity: 0.5,
  });

  // Initial setup - find meshes by name
  useEffect(() => {
    console.log("🔍 Setting up model with realistic effects...");

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true;
        child.material.needsUpdate = true;

        // Water mesh - store reference for Water2 effect
        if (child.name === "Water") {
          console.log("✅ Found Water mesh");
          setWaterMesh(child);
        }

        // Fire mesh - store reference for Lava effect
        if (child.name === "fire") {
          console.log("✅ Found fire mesh");
          setFireMesh(child);
        }

        // Smoke mesh - hide original (replaced by particles)
        if (child.name === "smoke") {
          child.visible = false;
          console.log("✅ Original smoke mesh hidden (using particles)");
        }
      }
    });
  }, [scene]);

  return (
    <group ref={group} {...props} dispose={null}>
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
        onPointerOut={(e) => {
           document.body.style.cursor = 'auto';
           setHoveredPart(null);
        }}
      />
      
      {/* 3D Label Overlay */}
      {hoveredPart && (
        <Html position={[hoveredPart.position.x, hoveredPart.position.y + 0.5, hoveredPart.position.z]} center>
          <div className="bg-black/80 backdrop-blur-md border border-cyan-500 rounded px-3 py-1 pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.5)] transform -translate-y-8">
            <div className="text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-2">
               <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
               {hoveredPart.name}
            </div>
          </div>
          {/* Connector Line */}
          <div className="w-px h-8 bg-gradient-to-t from-cyan-500 to-transparent mx-auto"></div>
        </Html>
      )}
    </group>
  );
}

// Preload the model
useGLTF.preload("/model.glb");
