import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Enhanced smoke particle system with realistic effects
 *
 * Features:
 * - Turbulent noise-based movement for natural dissipation
 * - Size expansion as smoke rises (puffs grow)
 * - Color variation from dark gray to light white
 * - Improved blending for ethereal smoke look
 *
 * @param {THREE.Scene} scene - The Three.js scene to add particles to
 * @param {Object} outletPosition - The 3D position where smoke should emit from
 * @returns {React.RefObject} Reference to the particle system
 */
export function useSmokeParticles(
  scene,
  outletPosition = { x: 0.37581, y: 0.18107, z: 3.795 }
) {
  const smokeParticlesRef = useRef(null);
  const smokeParticleDataRef = useRef([]);
  const timeRef = useRef(0);

  const PARTICLE_COUNT = 100;

  // Noise function for turbulent movement
  const turbulence = (x, y, z, t) => {
    const freq1 = Math.sin(x * 2.5 + t * 0.8) * Math.cos(y * 3.0 + t);
    const freq2 = Math.sin(z * 2.0 + t * 0.6) * Math.cos(x * 2.5 + t * 0.9);
    const freq3 = Math.sin((x + y) * 1.5 + t * 1.2);
    return (freq1 + freq2 + freq3) / 3;
  };

  useEffect(() => {
    if (!scene) return;

    console.log("🌫️ Creating enhanced smoke particle system...");

    const { x: outletX, y: outletY, z: outletZ } = outletPosition;

    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const alphas = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      smokeParticleDataRef.current[i] = {
        x: outletX + (Math.random() - 0.5) * 0.1,
        y: outletY + (Math.random() - 0.5) * 0.1,
        z: outletZ + Math.random() * 0.5,

        // Velocity with more variation
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        vz: 0.15 + Math.random() * 0.25,

        // Lifetime
        age: Math.random() * 5,
        maxAge: 4 + Math.random() * 3,

        // Visual
        baseSize: 0.2 + Math.random() * 0.15,
        opacity: 0.5 + Math.random() * 0.2,
        
        // Unique noise offset
        noiseOffset: Math.random() * 100,
        
        // Initial gray value (0.4-0.6 = darker gray at start)
        grayValue: 0.4 + Math.random() * 0.2,
      };

      positions[i3] = smokeParticleDataRef.current[i].x;
      positions[i3 + 1] = smokeParticleDataRef.current[i].y;
      positions[i3 + 2] = smokeParticleDataRef.current[i].z;

      sizes[i] = smokeParticleDataRef.current[i].baseSize;
      alphas[i] = smokeParticleDataRef.current[i].opacity;

      const gray = smokeParticleDataRef.current[i].grayValue;
      colors[i3] = gray;
      colors[i3 + 1] = gray;
      colors[i3 + 2] = gray;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const smokeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },

      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute vec3 color;
        
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vAlpha = alpha;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (350.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,

      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;
        
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Soft, fluffy smoke edge
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
          
          // Additional soft glow around edges
          float glow = smoothstep(0.5, 0.3, dist) * 0.3;
          
          if (alpha < 0.01) discard;
          
          // Final smoke color with slight blue tint
          vec3 smokeColor = vColor + vec3(0.0, 0.02, 0.05);
          
          gl_FragColor = vec4(smokeColor, alpha + glow * vAlpha);
        }
      `,

      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const particleSystem = new THREE.Points(particleGeometry, smokeMaterial);
    smokeParticlesRef.current = particleSystem;
    scene.add(particleSystem);

    console.log("✅ Enhanced smoke system created with", PARTICLE_COUNT, "particles");

    return () => {
      if (smokeParticlesRef.current) {
        scene.remove(smokeParticlesRef.current);
        smokeParticlesRef.current.geometry.dispose();
        smokeParticlesRef.current.material.dispose();
      }
    };
  }, [scene, outletPosition.x, outletPosition.y, outletPosition.z]);

  useFrame((state, delta) => {
    if (!smokeParticlesRef.current || smokeParticleDataRef.current.length === 0) return;

    timeRef.current += delta;

    const positions = smokeParticlesRef.current.geometry.attributes.position.array;
    const sizes = smokeParticlesRef.current.geometry.attributes.size.array;
    const alphas = smokeParticlesRef.current.geometry.attributes.alpha.array;
    const colors = smokeParticlesRef.current.geometry.attributes.color.array;

    const { x: outletX, y: outletY, z: outletZ } = outletPosition;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = smokeParticleDataRef.current[i];
      const i3 = i * 3;

      particle.age += delta;

      const lifeRatio = particle.age / particle.maxAge;

      // Turbulent movement
      const t = timeRef.current + particle.noiseOffset;
      const turbX = turbulence(particle.x, particle.y, particle.z, t) * 0.2;
      const turbY = turbulence(particle.y, particle.z, particle.x, t * 1.1) * 0.2;

      // Apply turbulence to velocity
      particle.vx += turbX * delta;
      particle.vy += turbY * delta;

      // Dampen horizontal velocity over time (smoke settles)
      particle.vx *= 0.995;
      particle.vy *= 0.995;

      // Slow down vertical speed as smoke ages
      const vzMultiplier = 1.0 - lifeRatio * 0.5;

      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.z += particle.vz * delta * vzMultiplier;

      // SIZE EXPANSION: Smoke puffs grow as they rise
      const sizeExpansion = 1.0 + lifeRatio * 2.5; // Up to 3.5x original size
      sizes[i] = particle.baseSize * sizeExpansion;

      // OPACITY: Fade out as it ages
      const fadeout = Math.max(0, 1.0 - lifeRatio * 1.2);
      alphas[i] = particle.opacity * fadeout;

      // COLOR: Transition from dark gray to lighter white
      const grayShift = particle.grayValue + lifeRatio * 0.4; // Gets lighter
      colors[i3] = Math.min(1.0, grayShift);
      colors[i3 + 1] = Math.min(1.0, grayShift);
      colors[i3 + 2] = Math.min(1.0, grayShift + 0.05); // Slight blue tint

      // Respawn
      if (particle.age >= particle.maxAge || particle.z > outletZ + 3.0) {
        particle.x = outletX + (Math.random() - 0.5) * 0.1;
        particle.y = outletY + (Math.random() - 0.5) * 0.1;
        particle.z = outletZ + Math.random() * 0.2;

        particle.vx = (Math.random() - 0.5) * 0.08;
        particle.vy = (Math.random() - 0.5) * 0.08;
        particle.vz = 0.15 + Math.random() * 0.25;

        particle.age = 0;
        particle.maxAge = 4 + Math.random() * 3;
        particle.baseSize = 0.2 + Math.random() * 0.15;
        particle.opacity = 0.5 + Math.random() * 0.2;
        particle.noiseOffset = Math.random() * 100;
        particle.grayValue = 0.4 + Math.random() * 0.2;
      }

      positions[i3] = particle.x;
      positions[i3 + 1] = particle.y;
      positions[i3 + 2] = particle.z;
    }

    smokeParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    smokeParticlesRef.current.geometry.attributes.size.needsUpdate = true;
    smokeParticlesRef.current.geometry.attributes.alpha.needsUpdate = true;
    smokeParticlesRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return smokeParticlesRef;
}
