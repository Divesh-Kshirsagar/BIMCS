import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom hook for creating and animating a smoke particle system
 * 
 * This hook creates a realistic smoke effect using Three.js particles with:
 * - Custom ShaderMaterial for per-particle opacity control
 * - Upward movement with slight horizontal drift
 * - Fade-out effect as particles age
 * - Continuous respawning at the outlet position
 * 
 * @param {THREE.Scene} scene - The Three.js scene to add particles to
 * @param {Object} outletPosition - The 3D position where smoke should emit from
 * @param {number} outletPosition.x - X coordinate of the outlet
 * @param {number} outletPosition.y - Y coordinate of the outlet
 * @param {number} outletPosition.z - Z coordinate of the outlet
 * @returns {React.RefObject} Reference to the particle system (for debugging/modification)
 * 
 * @example
 * // In your component:
 * const smokeOutletPosition = { x: 0.37581, y: 0.18107, z: 3.795 };
 * useSmokeParticles(scene, smokeOutletPosition);
 */
export function useSmokeParticles(scene, outletPosition = { x: 0.37581, y: 0.18107, z: 3.795 }) {
  // Refs to store particle system and individual particle data
  const smokeParticlesRef = useRef(null);
  const smokeParticleDataRef = useRef([]);
  
  // Configuration
  const PARTICLE_COUNT = 80; // Total number of smoke particles

  // ============================================================================
  // INITIALIZATION: Create particle system on mount
  // ============================================================================
  useEffect(() => {
    if (!scene) return;

    console.log("🌫️ Creating smoke particle system...");

    const { x: outletX, y: outletY, z: outletZ } = outletPosition;
    console.log("📍 Smoke outlet position:", outletPosition);

    // Create buffer geometry for particles
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3); // x,y,z for each particle
    const opacities = new Float32Array(PARTICLE_COUNT); // Alpha value for each particle

    // -------------------------------------------------------------------------
    // Initialize each particle with random properties
    // -------------------------------------------------------------------------
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3; // Index in positions array (x,y,z)

      // Store particle properties in data array
      smokeParticleDataRef.current[i] = {
        // Position: Start at outlet with slight random offset
        x: outletX + (Math.random() - 0.5) * 0.1,
        y: outletY + (Math.random() - 0.5) * 0.1,
        z: outletZ + Math.random() * 0.5,

        // Velocity: Particles rise upward with slight horizontal drift
        vx: (Math.random() - 0.5) * 0.05, // Horizontal drift X
        vy: (Math.random() - 0.5) * 0.05, // Horizontal drift Y
        vz: 0.2 + Math.random() * 0.3,    // Upward speed (0.2-0.5 units/sec)

        // Lifetime: How long the particle exists before respawning
        age: Math.random() * 5,           // Stagger initial ages (0-5 sec)
        maxAge: 3 + Math.random() * 2,    // Lifetime (3-5 seconds)

        // Visual properties
        opacity: 0.3 + Math.random() * 0.2, // Initial opacity (0.3-0.5)
        size: 0.15 + Math.random() * 0.1,   // Particle size (currently unused)
      };

      // Set initial positions in geometry buffer
      positions[i3] = smokeParticleDataRef.current[i].x;
      positions[i3 + 1] = smokeParticleDataRef.current[i].y;
      positions[i3 + 2] = smokeParticleDataRef.current[i].z;

      // Set initial opacity
      opacities[i] = smokeParticleDataRef.current[i].opacity;
    }

    // Add attributes to geometry
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3) // 3 values per particle (x,y,z)
    );
    particleGeometry.setAttribute(
      "alpha",
      new THREE.BufferAttribute(opacities, 1) // 1 value per particle (opacity)
    );

    // -------------------------------------------------------------------------
    // Create custom shader material for per-particle opacity
    // Note: PointsMaterial doesn't support per-particle opacity, so we use ShaderMaterial
    // -------------------------------------------------------------------------
    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },                      // Unused, but available for animations
        uSize: { value: 15.0 },                   // Base particle size in pixels
        uColor: { value: new THREE.Color(0x888888) }, // Gray smoke color
      },
      
      // Vertex Shader: Runs once per particle
      // Calculates final particle position and size
      vertexShader: `
        attribute float alpha;     // Per-particle opacity from geometry
        varying float vAlpha;      // Pass opacity to fragment shader
        uniform float uSize;       // Base particle size
        
        void main() {
          vAlpha = alpha;
          
          // Transform particle position to view space
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Apply size attenuation (particles get smaller with distance)
          gl_PointSize = uSize * (300.0 / -mvPosition.z);
          
          // Final particle position
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      
      // Fragment Shader: Runs for each pixel of each particle
      // Creates circular soft-edged particles
      fragmentShader: `
        uniform vec3 uColor;       // Particle color
        varying float vAlpha;      // Particle opacity from vertex shader
        
        void main() {
          // Create circular particles with soft edges
          vec2 center = gl_PointCoord - vec2(0.5); // Center point (0,0)
          float dist = length(center);              // Distance from center
          
          // Smooth falloff from center to edge (creates soft circle)
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          
          // Discard fully transparent pixels (optimization)
          if (alpha < 0.01) discard;
          
          // Output final color with alpha
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      
      // Material properties
      transparent: true,              // Enable transparency
      depthWrite: false,              // Don't write to depth buffer (prevents sorting issues)
      blending: THREE.NormalBlending, // Standard alpha blending
    });

    // -------------------------------------------------------------------------
    // Create and add particle system to scene
    // -------------------------------------------------------------------------
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    smokeParticlesRef.current = particleSystem;
    scene.add(particleSystem);
    
    console.log("✅ Smoke particle system created with", PARTICLE_COUNT, "particles");

    // -------------------------------------------------------------------------
    // Cleanup function: Remove particles when component unmounts
    // -------------------------------------------------------------------------
    return () => {
      if (smokeParticlesRef.current) {
        scene.remove(smokeParticlesRef.current);
        smokeParticlesRef.current.geometry.dispose();
        smokeParticlesRef.current.material.dispose();
      }
    };
  }, [scene, outletPosition.x, outletPosition.y, outletPosition.z]);

  // ============================================================================
  // ANIMATION: Update particles every frame
  // ============================================================================
  useFrame((state, delta) => {
    if (!smokeParticlesRef.current || smokeParticleDataRef.current.length === 0) return;

    // Get direct access to geometry arrays for performance
    const positions = smokeParticlesRef.current.geometry.attributes.position.array;
    const alphas = smokeParticlesRef.current.geometry.attributes.alpha.array;

    const { x: outletX, y: outletY, z: outletZ } = outletPosition;

    // -------------------------------------------------------------------------
    // Update each particle
    // -------------------------------------------------------------------------
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = smokeParticleDataRef.current[i];
      const i3 = i * 3; // Position index in array

      // Age the particle
      particle.age += delta;

      // Move particle based on velocity
      particle.x += particle.vx * delta; // Horizontal drift
      particle.y += particle.vy * delta; // Horizontal drift
      particle.z += particle.vz * delta; // Upward movement

      // Fade out particle as it ages (0% age = full opacity, 100% age = transparent)
      const lifeRatio = particle.age / particle.maxAge;
      particle.opacity = (1 - lifeRatio) * 0.6; // Max opacity of 0.6

      // -----------------------------------------------------------------------
      // Respawn particle if it's too old or has risen too high
      // -----------------------------------------------------------------------
      if (particle.age >= particle.maxAge || particle.z > outletZ + 2.5) {
        // Reset position to outlet with random offset
        particle.x = outletX + (Math.random() - 0.5) * 0.1;
        particle.y = outletY + (Math.random() - 0.5) * 0.1;
        particle.z = outletZ + Math.random() * 0.2;

        // Reset velocity with new random values
        particle.vx = (Math.random() - 0.5) * 0.05;
        particle.vy = (Math.random() - 0.5) * 0.05;
        particle.vz = 0.2 + Math.random() * 0.3;

        // Reset lifetime
        particle.age = 0;
        particle.maxAge = 3 + Math.random() * 2; // 3-5 seconds

        // Reset opacity
        particle.opacity = 0.4 + Math.random() * 0.2;
      }

      // -----------------------------------------------------------------------
      // Write updated values back to geometry arrays
      // -----------------------------------------------------------------------
      positions[i3] = particle.x;
      positions[i3 + 1] = particle.y;
      positions[i3 + 2] = particle.z;
      alphas[i] = particle.opacity;
    }

    // Tell Three.js that the geometry has changed and needs to be re-uploaded to GPU
    smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    smokeParticlesRef.current.geometry.attributes.alpha.needsUpdate = true;
  });

  // Return reference to particle system (can be used for debugging or further customization)
  return smokeParticlesRef;
}
