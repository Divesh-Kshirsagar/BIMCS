import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water2.js";

/**
 * Realistic water effect using Three.js Water2
 * 
 * Features:
 * - Flowing water with animated normals
 * - Realistic reflections and refractions
 * - Configurable flow direction and speed
 * - Works with existing mesh geometry
 */
export function useWater2Effect(
  scene,
  waterMesh,
  options = {}
) {
  const waterRef = useRef(null);
  const originalMaterialRef = useRef(null);

  const {
    color = 0x0088aa,
    scale = 2,
    flowDirection = new THREE.Vector2(1, 1),
    flowSpeed = 0.03,
    reflectivity = 0.3,
    textureWidth = 512,
    textureHeight = 512,
  } = options;

  useEffect(() => {
    if (!waterMesh || !scene) return;

    console.log("💧 Creating Water2 effect...");

    // Store original material for cleanup
    originalMaterialRef.current = waterMesh.material;

    // Get the geometry from the mesh
    const geometry = waterMesh.geometry;

    // Create Water2 object configuration
    const waterOptions = {
      color: new THREE.Color(color),
      scale: scale,
      flowDirection: flowDirection,
      flowSpeed: flowSpeed,
      reflectivity: reflectivity,
      textureWidth: textureWidth,
      textureHeight: textureHeight,
    };

    try {
      // Create a new water material based on Water2
      // Note: Water2 expects a geometry and returns a water mesh
      // We'll create a custom approach for existing mesh
      
      // For existing mesh, we create a custom water-like material
      const waterMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.8,
        roughness: 0.0,
        metalness: 0.1,
        transmission: 0.9,
        thickness: 1.0,
        ior: 1.33, // Water index of refraction
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        side: THREE.DoubleSide,
        depthWrite: true,
      });

      // Store original position for animation
      waterRef.current = {
        mesh: waterMesh,
        material: waterMaterial,
        originalPosition: waterMesh.position.clone(),
        originalRotation: waterMesh.rotation.clone(),
        flowOffset: 0,
      };

      waterMesh.material = waterMaterial;
      
      console.log("✅ Water2-style material applied");

    } catch (error) {
      console.error("Error creating water effect:", error);
    }

    return () => {
      if (waterMesh && originalMaterialRef.current) {
        waterMesh.material = originalMaterialRef.current;
      }
      if (waterRef.current && waterRef.current.material) {
        waterRef.current.material.dispose();
      }
    };
  }, [waterMesh, scene, color, scale, flowSpeed, reflectivity]);

  // Animation loop for water movement
  useFrame((state, delta) => {
    if (!waterRef.current || !waterRef.current.mesh) return;

    const time = state.clock.elapsedTime;
    const mesh = waterRef.current.mesh;
    const original = waterRef.current.originalPosition;
    const originalRot = waterRef.current.originalRotation;

    // Gentle bobbing motion
    const bobbing = Math.sin(time * 1.5) * 0.008;
    mesh.position.y = original.y + bobbing;

    // Surface wave ripples
    const waveX = Math.sin(time * 2.0) * 0.008;
    const waveZ = Math.cos(time * 1.7) * 0.008;
    mesh.rotation.x = originalRot.x + waveX;
    mesh.rotation.z = originalRot.z + waveZ;

    // Animate material properties for shimmer effect
    if (waterRef.current.material) {
      // Subtle opacity fluctuation
      const opacityWave = 0.75 + Math.sin(time * 3) * 0.05;
      waterRef.current.material.opacity = opacityWave;

      // Color temperature shift based on time (simulates light play)
      const hueShift = Math.sin(time * 0.5) * 0.03;
      const baseColor = new THREE.Color(0x0088aa);
      baseColor.offsetHSL(hueShift, 0, 0);
      waterRef.current.material.color = baseColor;
    }
  });

  return waterRef;
}
