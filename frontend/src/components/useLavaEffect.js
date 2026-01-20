import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

/**
 * Realistic lava/fire effect using three-custom-shader-material
 * 
 * Features:
 * - Animated flowing lava texture using noise
 * - Temperature-based color gradient (black crust → red → orange → yellow hot spots)
 * - Emissive glow for realistic heat
 * - Responds to fireIntensity prop
 */
export function useLavaEffect(
  scene,
  fireMesh,
  fireIntensity = 50
) {
  const materialRef = useRef(null);
  const timeRef = useRef(0);

  // Create the lava shader material
  useEffect(() => {
    if (!fireMesh) return;

    console.log("🌋 Creating lava shader material...");

    // Lava shader using CustomShaderMaterial
    const lavaMaterial = new CustomShaderMaterial({
      baseMaterial: THREE.MeshStandardMaterial,
      
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: fireIntensity / 100 },
        uScale: { value: 3.0 },
      },

      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vPosition = position;
        }
      `,

      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uScale;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Simplex-like noise functions
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
        
        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                          + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                                  dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        
        // Fractal Brownian Motion for more detailed noise
        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          float frequency = 1.0;
          for (int i = 0; i < 5; i++) {
            value += amplitude * snoise(p * frequency);
            amplitude *= 0.5;
            frequency *= 2.0;
          }
          return value;
        }
        
        // Lava color palette
        vec3 lavaColor(float temperature) {
          // temperature: 0.0 (cool/crust) to 1.0 (hot/molten)
          vec3 black = vec3(0.05, 0.02, 0.02);
          vec3 darkRed = vec3(0.3, 0.05, 0.0);
          vec3 red = vec3(0.8, 0.1, 0.0);
          vec3 orange = vec3(1.0, 0.4, 0.0);
          vec3 yellow = vec3(1.0, 0.9, 0.3);
          vec3 white = vec3(1.0, 1.0, 0.8);
          
          if (temperature < 0.2) return mix(black, darkRed, temperature * 5.0);
          if (temperature < 0.4) return mix(darkRed, red, (temperature - 0.2) * 5.0);
          if (temperature < 0.6) return mix(red, orange, (temperature - 0.4) * 5.0);
          if (temperature < 0.8) return mix(orange, yellow, (temperature - 0.6) * 5.0);
          return mix(yellow, white, (temperature - 0.8) * 5.0);
        }
        
        void main() {
          vec2 uv = vUv * uScale;
          
          // Animated noise for flowing lava
          float time = uTime * 0.3;
          
          // Multiple noise layers for turbulent flow
          float noise1 = fbm(uv + vec2(time * 0.5, time * 0.3));
          float noise2 = fbm(uv * 2.0 - vec2(time * 0.3, time * 0.5));
          float noise3 = snoise(uv * 3.0 + vec2(time * 0.7, 0.0));
          
          // Combine noise layers
          float combinedNoise = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
          
          // Normalize to 0-1 range and apply intensity
          float temperature = (combinedNoise + 1.0) * 0.5;
          temperature = pow(temperature, 1.5 - uIntensity * 0.5); // More hot spots at higher intensity
          temperature = clamp(temperature * uIntensity * 1.5, 0.0, 1.0);
          
          // Get lava color based on temperature
          vec3 color = lavaColor(temperature);
          
          // Add pulsing glow
          float pulse = sin(uTime * 3.0) * 0.1 + 0.9;
          color *= pulse;
          
          // Set the diffuse color
          csm_DiffuseColor = vec4(color, 1.0);
          
          // Emissive for glow effect - hotter areas glow more
          csm_Emissive = color * temperature * uIntensity * 2.0;
        }
      `,

      // Base material properties
      color: new THREE.Color(0xff4400),
      emissive: new THREE.Color(0xff2200),
      emissiveIntensity: 1.0,
      roughness: 0.8,
      metalness: 0.0,
      transparent: false,
      side: THREE.DoubleSide,
    });

    // Store reference and apply to mesh
    materialRef.current = lavaMaterial;
    fireMesh.material = lavaMaterial;
    
    console.log("✅ Lava shader material applied");

    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
    };
  }, [fireMesh]);

  // Update uniforms
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uIntensity.value = fireIntensity / 100;
    }
  }, [fireIntensity]);

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current) return;
    
    timeRef.current += delta;
    materialRef.current.uniforms.uTime.value = timeRef.current;
  });

  return materialRef;
}
