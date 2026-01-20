import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Custom hook for creating a realistic volumetric fire particle system
 *
 * Features:
 * - Temperature-based color gradient (blue core → white → yellow → orange → red tips)
 * - Perlin noise for turbulent, natural flame movement
 * - Size attenuation as particles rise and age
 * - Emissive glow for realistic light emission
 * - Responds to fireIntensity prop for dynamic control
 *
 * @param {THREE.Scene} scene - The Three.js scene to add particles to
 * @param {Object} firePosition - The 3D position where fire should originate
 * @param {number} fireIntensity - Fire intensity (0-100), controls particle count and brightness
 * @returns {React.RefObject} Reference to the particle system
 */
export function useFireParticles(
  scene,
  firePosition = { x: 0.4136, y: -0.0432, z: 0.978 },
  fireIntensity = 50
) {
  const fireParticlesRef = useRef(null);
  const fireParticleDataRef = useRef([]);
  const timeRef = useRef(0);

  // Configuration - scales with intensity
  const BASE_PARTICLE_COUNT = 120;
  const PARTICLE_COUNT = Math.floor(BASE_PARTICLE_COUNT * (0.5 + (fireIntensity / 100) * 0.5));

  // Simplex-like noise function for turbulence
  const noise = (x, y, z, t) => {
    return (
      Math.sin(x * 3.0 + t) * 0.5 +
      Math.sin(y * 4.0 + t * 1.3) * 0.3 +
      Math.sin(z * 2.5 + t * 0.7) * 0.2 +
      Math.sin((x + y) * 2.0 + t * 1.5) * 0.4
    );
  };

  useEffect(() => {
    if (!scene) return;

    console.log("🔥 Creating fire particle system...");

    const { x: fireX, y: fireY, z: fireZ } = firePosition;

    // Create buffer geometry
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const temperatures = new Float32Array(PARTICLE_COUNT);

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Random spawn within flame base area
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.15;

      fireParticleDataRef.current[i] = {
        x: fireX + Math.cos(angle) * radius,
        y: fireY + Math.sin(angle) * radius,
        z: fireZ + Math.random() * 0.3,

        // Velocity - primarily upward with some variation
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        vz: 0.4 + Math.random() * 0.6, // Strong upward

        // Lifetime
        age: Math.random() * 2,
        maxAge: 0.8 + Math.random() * 1.2,

        // Visual
        baseSize: 0.08 + Math.random() * 0.06,
        temperature: 0, // 0 = hot (core), 1 = cool (tips)
        
        // Noise offset for unique movement
        noiseOffset: Math.random() * 100,
      };

      positions[i3] = fireParticleDataRef.current[i].x;
      positions[i3 + 1] = fireParticleDataRef.current[i].y;
      positions[i3 + 2] = fireParticleDataRef.current[i].z;

      // Initial color (will be updated in animation)
      colors[i3] = 1.0;
      colors[i3 + 1] = 0.5;
      colors[i3 + 2] = 0.0;

      sizes[i] = fireParticleDataRef.current[i].baseSize;
      temperatures[i] = 0;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("temperature", new THREE.BufferAttribute(temperatures, 1));

    // Custom shader material for fire
    const fireMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: fireIntensity / 100 },
      },

      vertexShader: `
        attribute float size;
        attribute float temperature;
        attribute vec3 color;
        
        varying float vTemperature;
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          vTemperature = temperature;
          vColor = color;
          
          // Alpha based on temperature (hotter = more visible)
          vAlpha = 1.0 - temperature * 0.7;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Size attenuation with distance
          gl_PointSize = size * (400.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        varying float vTemperature;
        varying vec3 vColor;
        varying float vAlpha;
        
        // Temperature-based fire color
        vec3 getFireColor(float temp) {
          // temp: 0.0 (hot core) to 1.0 (cool tips)
          vec3 blue = vec3(0.2, 0.4, 1.0);
          vec3 white = vec3(1.0, 1.0, 0.95);
          vec3 yellow = vec3(1.0, 0.95, 0.2);
          vec3 orange = vec3(1.0, 0.55, 0.1);
          vec3 red = vec3(0.9, 0.15, 0.05);
          
          if (temp < 0.15) return mix(blue, white, temp / 0.15);
          if (temp < 0.3) return mix(white, yellow, (temp - 0.15) / 0.15);
          if (temp < 0.55) return mix(yellow, orange, (temp - 0.3) / 0.25);
          if (temp < 0.8) return mix(orange, red, (temp - 0.55) / 0.25);
          return mix(red, vec3(0.2, 0.0, 0.0), (temp - 0.8) / 0.2);
        }
        
        void main() {
          // Create circular particle with soft edges
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Soft circular falloff
          float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
          
          if (alpha < 0.01) discard;
          
          vec3 fireColor = getFireColor(vTemperature);
          
          // Add glow effect (brighter at center)
          float glow = 1.0 + (1.0 - dist * 2.0) * 0.5;
          fireColor *= glow;
          
          gl_FragColor = vec4(fireColor, alpha);
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const particleSystem = new THREE.Points(particleGeometry, fireMaterial);
    fireParticlesRef.current = particleSystem;
    scene.add(particleSystem);

    console.log("✅ Fire particle system created with", PARTICLE_COUNT, "particles");

    return () => {
      if (fireParticlesRef.current) {
        scene.remove(fireParticlesRef.current);
        fireParticlesRef.current.geometry.dispose();
        fireParticlesRef.current.material.dispose();
      }
    };
  }, [scene, firePosition.x, firePosition.y, firePosition.z, PARTICLE_COUNT]);

  // Update intensity uniform when it changes
  useEffect(() => {
    if (fireParticlesRef.current && fireParticlesRef.current.material) {
      fireParticlesRef.current.material.uniforms.uIntensity.value = fireIntensity / 100;
    }
  }, [fireIntensity]);

  // Animation loop
  useFrame((state, delta) => {
    if (!fireParticlesRef.current || fireParticleDataRef.current.length === 0) return;

    timeRef.current += delta;

    const positions = fireParticlesRef.current.geometry.attributes.position.array;
    const temperatures = fireParticlesRef.current.geometry.attributes.temperature.array;
    const sizes = fireParticlesRef.current.geometry.attributes.size.array;

    const { x: fireX, y: fireY, z: fireZ } = firePosition;
    const intensityMultiplier = 0.5 + (fireIntensity / 100) * 0.5;

    for (let i = 0; i < fireParticleDataRef.current.length; i++) {
      const particle = fireParticleDataRef.current[i];
      const i3 = i * 3;

      particle.age += delta;

      // Calculate life ratio (0 = born, 1 = dead)
      const lifeRatio = particle.age / particle.maxAge;

      // Temperature increases as particle ages (rises and cools)
      particle.temperature = lifeRatio;

      // Turbulent movement using noise
      const t = timeRef.current + particle.noiseOffset;
      const turbulenceX = noise(particle.x, particle.y, particle.z, t) * 0.15;
      const turbulenceY = noise(particle.y, particle.z, particle.x, t * 1.1) * 0.15;

      // Update velocity with turbulence
      particle.vx += turbulenceX * delta;
      particle.vy += turbulenceY * delta;

      // Apply velocity
      particle.x += particle.vx * delta * intensityMultiplier;
      particle.y += particle.vy * delta * intensityMultiplier;
      particle.z += particle.vz * delta * intensityMultiplier;

      // Size decreases as particle ages
      const sizeMultiplier = 1.0 - lifeRatio * 0.6;
      sizes[i] = particle.baseSize * sizeMultiplier * intensityMultiplier;

      // Respawn if too old
      if (particle.age >= particle.maxAge) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.15;

        particle.x = fireX + Math.cos(angle) * radius;
        particle.y = fireY + Math.sin(angle) * radius;
        particle.z = fireZ + Math.random() * 0.2;

        particle.vx = (Math.random() - 0.5) * 0.1;
        particle.vy = (Math.random() - 0.5) * 0.1;
        particle.vz = 0.4 + Math.random() * 0.6;

        particle.age = 0;
        particle.maxAge = 0.8 + Math.random() * 1.2;
        particle.baseSize = 0.08 + Math.random() * 0.06;
        particle.noiseOffset = Math.random() * 100;
      }

      positions[i3] = particle.x;
      positions[i3 + 1] = particle.y;
      positions[i3 + 2] = particle.z;
      temperatures[i] = particle.temperature;
    }

    fireParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    fireParticlesRef.current.geometry.attributes.temperature.needsUpdate = true;
    fireParticlesRef.current.geometry.attributes.size.needsUpdate = true;

    // Update time uniform
    fireParticlesRef.current.material.uniforms.uTime.value = timeRef.current;
  });

  return fireParticlesRef;
}
