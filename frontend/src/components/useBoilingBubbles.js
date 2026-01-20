import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom hook for creating boiling bubble particles in water
 *
 * Features:
 * - Bubbles spawn when fire intensity is above threshold
 * - Variable sizes with acceleration as they rise
 * - Pop/disappear at water surface
 * - Realistic transparency and refraction appearance
 *
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} waterBounds - Bounds of the water volume for bubble spawning
 * @param {number} fireIntensity - Fire intensity (0-100), controls bubble activity
 * @returns {React.RefObject} Reference to the particle system
 */
export function useBoilingBubbles(
  scene,
  waterBounds = {
    // Water mesh position and approximate bounds
    centerX: -0.0029,
    centerY: -0.0512,
    bottomZ: 0.4,  // Bottom of water
    topZ: 1.8,     // Top of water (surface)
    radiusX: 0.7,
    radiusY: 0.7,
  },
  fireIntensity = 50
) {
  const bubblesRef = useRef(null);
  const bubbleDataRef = useRef([]);

  // More bubbles when fire is more intense
  const BASE_BUBBLE_COUNT = 60;
  const BUBBLE_COUNT = fireIntensity > 20 
    ? Math.floor(BASE_BUBBLE_COUNT * (fireIntensity / 100)) 
    : 0;

  useEffect(() => {
    if (!scene || BUBBLE_COUNT === 0) return;

    console.log("💧 Creating boiling bubbles system...");

    const { centerX, centerY, bottomZ, topZ, radiusX, radiusY } = waterBounds;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(BUBBLE_COUNT * 3);
    const sizes = new Float32Array(BUBBLE_COUNT);
    const alphas = new Float32Array(BUBBLE_COUNT);

    // Initialize bubbles
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Random position within water volume
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.8; // Normalized radius

      bubbleDataRef.current[i] = {
        x: centerX + Math.cos(angle) * r * radiusX,
        y: centerY + Math.sin(angle) * r * radiusY,
        z: bottomZ + Math.random() * (topZ - bottomZ),

        // Velocity - bubbles accelerate upward
        vz: 0.1 + Math.random() * 0.2,
        acceleration: 0.05 + Math.random() * 0.05,

        // Wobble for realistic movement
        wobbleSpeed: 2 + Math.random() * 3,
        wobbleAmount: 0.02 + Math.random() * 0.03,
        wobbleOffset: Math.random() * Math.PI * 2,

        // Size and appearance
        baseSize: 0.015 + Math.random() * 0.025,
        alpha: 0.4 + Math.random() * 0.3,
      };

      positions[i3] = bubbleDataRef.current[i].x;
      positions[i3 + 1] = bubbleDataRef.current[i].y;
      positions[i3 + 2] = bubbleDataRef.current[i].z;
      sizes[i] = bubbleDataRef.current[i].baseSize;
      alphas[i] = bubbleDataRef.current[i].alpha;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    // Bubble shader - creates soft spherical bubbles
    const bubbleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },

      vertexShader: `
        attribute float size;
        attribute float alpha;
        
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        varying float vAlpha;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Create bubble appearance with highlight
          float alpha = smoothstep(0.5, 0.3, dist) * vAlpha;
          
          // Add specular highlight
          vec2 highlightPos = center + vec2(0.15, -0.15);
          float highlight = 1.0 - smoothstep(0.0, 0.15, length(highlightPos));
          
          // Bubble color - slightly blue-white
          vec3 bubbleColor = vec3(0.8, 0.9, 1.0);
          bubbleColor += highlight * 0.5;
          
          if (alpha < 0.05) discard;
          
          gl_FragColor = vec4(bubbleColor, alpha);
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const bubbleSystem = new THREE.Points(geometry, bubbleMaterial);
    bubblesRef.current = bubbleSystem;
    scene.add(bubbleSystem);

    console.log("✅ Boiling bubbles created with", BUBBLE_COUNT, "bubbles");

    return () => {
      if (bubblesRef.current) {
        scene.remove(bubblesRef.current);
        bubblesRef.current.geometry.dispose();
        bubblesRef.current.material.dispose();
      }
    };
  }, [scene, BUBBLE_COUNT, waterBounds.centerX, waterBounds.centerY, 
      waterBounds.bottomZ, waterBounds.topZ, waterBounds.radiusX, waterBounds.radiusY]);

  // Animation loop
  useFrame((state, delta) => {
    if (!bubblesRef.current || bubbleDataRef.current.length === 0) return;

    const time = state.clock.elapsedTime;
    const { centerX, centerY, bottomZ, topZ, radiusX, radiusY } = waterBounds;

    const positions = bubblesRef.current.geometry.attributes.position.array;
    const sizes = bubblesRef.current.geometry.attributes.size.array;

    for (let i = 0; i < bubbleDataRef.current.length; i++) {
      const bubble = bubbleDataRef.current[i];
      const i3 = i * 3;

      // Accelerate upward
      bubble.vz += bubble.acceleration * delta;
      bubble.z += bubble.vz * delta;

      // Wobble horizontally
      const wobble = Math.sin(time * bubble.wobbleSpeed + bubble.wobbleOffset) * bubble.wobbleAmount;
      bubble.x += wobble * delta;
      bubble.y += Math.cos(time * bubble.wobbleSpeed * 0.7 + bubble.wobbleOffset) * bubble.wobbleAmount * delta;

      // Grow slightly as it rises (pressure decreases)
      const heightRatio = (bubble.z - bottomZ) / (topZ - bottomZ);
      sizes[i] = bubble.baseSize * (1 + heightRatio * 0.5);

      // Respawn at bottom when reaching surface
      if (bubble.z >= topZ) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.8;

        bubble.x = centerX + Math.cos(angle) * r * radiusX;
        bubble.y = centerY + Math.sin(angle) * r * radiusY;
        bubble.z = bottomZ + Math.random() * 0.2;
        bubble.vz = 0.1 + Math.random() * 0.2;
        bubble.baseSize = 0.015 + Math.random() * 0.025;
      }

      positions[i3] = bubble.x;
      positions[i3 + 1] = bubble.y;
      positions[i3 + 2] = bubble.z;
    }

    bubblesRef.current.geometry.attributes.position.needsUpdate = true;
    bubblesRef.current.geometry.attributes.size.needsUpdate = true;
    bubblesRef.current.material.uniforms.uTime.value = time;
  });

  return bubblesRef;
}
