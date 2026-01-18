import React, { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Model Component - 3D Boiler Visualization
 *
 * This component loads the Blender model and updates it based on simulation state
 *
 * BLENDER MODEL MESHES USED (from model_data.json):
 * ===================================================
 * ANIMATED CONTENT MESHES:
 * 1. WATER MESH:
 *    - Name: "Water" (exact, capital W)
 *    - Effect: Gentle bobbing animation for water movement
 *    - Material: Cyan/blue with transparency
 *
 * 2. FIRE MESH:
 *    - Name: "fire" (exact, lowercase)
 *    - Effect: Glow intensity based on pressure
 *    - Color shifts with intensity (orange → yellow → white)
 *
 * 3. SMOKE MESH:
 *    - Name: "smoke" (exact, lowercase)
 *    - Effect: Animated opacity for smoke/steam effect
 *    - Material: White with transparency
 *
 * STATIC CONTAINER MESHES (no animation):
 * - "water drum" - water container
 * - "steam drum" - steam container
 * - "furnace" - furnace body
 * - "fuel inlet" - burner
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

  // Refs to store mesh references (found during scene traversal)
  const waterMeshRef = useRef(null);
  const fireMeshRef = useRef(null);
  const smokeMeshRef = useRef(null);

  // Store original positions to apply animations as offsets
  const originalPositions = useRef({});

  // Animation state for water waves
  const timeRef = useRef(0);

  // Initial setup - find meshes by name
  useEffect(() => {
    console.log("🔍 Searching for meshes in model...");

    scene.traverse((child) => {
      if (child.isMesh) {
        // Log all mesh names for debugging
        console.log(`Found mesh: "${child.name}"`);

        // Make materials transparent for visual effect
        child.material.transparent = true;
        child.material.needsUpdate = true;

        // MESH NAMES FROM BLENDER MODEL (model_data.json):
        // CONTENT MESHES (to animate):
        // - "Water" - actual water (blue transparent)
        // - "smoke" - smoke/steam content
        // - "fire" - fire/flame content
        // CONTAINER MESHES (should be static):
        // - "water drum" - water container
        // - "steam drum" - steam container
        // - "furnace" - main furnace body
        // - "fuel inlet" - fuel burner

        // Find Water mesh (exact match - capital W)
        if (child.name === "Water") {
          waterMeshRef.current = child;
          console.log("✅ Found Water mesh:", child.name);

          // Save original position for animation offsets
          originalPositions.current.water = {
            x: child.position.x,
            y: child.position.y,
            z: child.position.z,
          };

          // Save original rotation for wobble offsets
          originalPositions.current.waterRotation = {
            x: child.rotation.x,
            y: child.rotation.y,
            z: child.rotation.z,
          };

          // Set initial color - cyan/blue for water
          if (child.material) {
            child.material.color.set("#00ffff"); // Cyan
            child.material.opacity = 0.5; // Transparent water
          }
        }

        // Find fire mesh (exact match - lowercase)
        if (child.name === "fire") {
          fireMeshRef.current = child;
          console.log("✅ Found fire mesh:", child.name);

          // Setup emissive material for glow effect
          if (child.material) {
            child.material.emissive.set("#ff6600"); // Orange glow
            child.material.emissiveIntensity = 1.0;
          }
        }
        
        // Find smoke mesh (exact match - lowercase)
        if (child.name === "smoke") {
          smokeMeshRef.current = child;
          console.log("✅ Found smoke mesh:", child.name);

          // Setup smoke material with transparency
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.3;
            child.material.color.set("#ffffff"); // White smoke/steam
          }
        }
      }
    });

    // Warning if meshes not found
    if (!waterMeshRef.current) {
      console.warn("⚠️ Water mesh not found! Check mesh names in Blender.");
      console.warn('   Expected exact mesh name: "Water" (capital W)');
    }
    if (!fireMeshRef.current) {
      console.warn("⚠️ Fire mesh not found! Check mesh names in Blender.");
      console.warn('   Expected exact mesh name: "fire" (lowercase)');
    }
    if (!smokeMeshRef.current) {
      console.warn("⚠️ Smoke mesh not found! Check mesh names in Blender.");
      console.warn('   Expected exact mesh name: "smoke" (lowercase)');
    }
  }, [scene]);

  // Animation loop - update meshes every frame
  useFrame((state, delta) => {
    // Increment time for animations
    timeRef.current += delta;
    
    // ========================
    // UPDATE WATER MESH - LIVE ANIMATION
    // ========================
    if (waterMeshRef.current && originalPositions.current.water) {
      // NOTE: No scaling - fire intensity doesn't change water volume
      // Instead, create gentle bobbing/wave motion for "live" feeling
      
      // Gentle vertical bobbing (simulates water movement)
      const bobbingAmount = Math.sin(timeRef.current * 2) * 0.005; // Small movement
      
      // IMPORTANT: Add offset to ORIGINAL position, don't replace it
      waterMeshRef.current.position.y = originalPositions.current.water.y + bobbingAmount;
      
      // Subtle rotation wobble (like water sloshing)
      // IMPORTANT: Add wobble to ORIGINAL rotation, don't replace it
      if (originalPositions.current.waterRotation) {
        const wobbleX = Math.sin(timeRef.current * 1.5) * 0.01;
        const wobbleZ = Math.cos(timeRef.current * 1.3) * 0.01;
        
        waterMeshRef.current.rotation.x = originalPositions.current.waterRotation.x + wobbleX;
        waterMeshRef.current.rotation.z = originalPositions.current.waterRotation.z + wobbleZ;
      }
      
      // Update water color based on status (visual feedback only)
      if (waterMeshRef.current.material) {
        // Keep water cyan/blue - just adjust opacity for "flow" effect
        waterMeshRef.current.material.color.set("#00ffff");
        
        // Pulsing opacity for "flowing" effect
        const opacityPulse = 0.6 + Math.sin(timeRef.current * 3) * 0.1;
        waterMeshRef.current.material.opacity = opacityPulse;
      }
    }

    // ========================
    // UPDATE FIRE MESH
    // ========================
    if (fireMeshRef.current && fireMeshRef.current.material) {
      // Fire glow intensity based on pressure
      // Higher pressure = brighter fire (more energy in system)
      const targetIntensity = (pressure / 25.0) * 3.0; // Scale 0-25 MPa → 0-3 intensity

      // Smooth transition
      if (fireMeshRef.current.material.emissiveIntensity !== undefined) {
        fireMeshRef.current.material.emissiveIntensity +=
          (targetIntensity - fireMeshRef.current.material.emissiveIntensity) *
          0.1;
      }

      // Color shift based on fire intensity
      if (fireIntensity > 80) {
        fireMeshRef.current.material.emissive.set("#ffffff"); // White hot
      } else if (fireIntensity > 50) {
        fireMeshRef.current.material.emissive.set("#ffaa00"); // Yellow
      } else {
        fireMeshRef.current.material.emissive.set("#ff6600"); // Orange
      }
      
      // Add flickering effect to fire
      const flicker = 1 + Math.sin(timeRef.current * 10) * 0.1;
      if (fireMeshRef.current.material.emissiveIntensity !== undefined) {
        fireMeshRef.current.material.emissiveIntensity *= flicker;
      }
    }

    // ========================
    // UPDATE SMOKE/STEAM MESH - ANIMATED OPACITY
    // ========================
    if (smokeMeshRef.current && smokeMeshRef.current.material) {
      // NOTE: No scaling or position changes as requested

      // Animate opacity to create smoke effect (rising/dissipating)
      const smokeOpacity = 0.2 + Math.sin(timeRef.current * 1.5) * 0.15;
      smokeMeshRef.current.material.opacity = smokeOpacity;

      // Subtle color variation (simulate smoke density)
      const smokeShade = 0.7 + Math.sin(timeRef.current * 2) * 0.2;
      smokeMeshRef.current.material.color.setRGB(
        smokeShade,
        smokeShade,
        smokeShade,
      );
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

// NOTE: This preloads the model on app start
useGLTF.preload("/model.glb");
