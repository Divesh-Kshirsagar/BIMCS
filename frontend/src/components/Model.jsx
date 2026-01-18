import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'

/**
 * Model Component - 3D Boiler Visualization
 * 
 * This component loads the Blender model and updates it based on simulation state
 * 
 * TODO: BLENDER MODEL PREPARATION REQUIRED
 * ========================================
 * Before this works properly, you must prepare your Blender model:
 * 
 * 1. WATER MESH:
 *    - Name it "Water" (case-sensitive)
 *    - Set the origin point to the BOTTOM of the cylinder (not center!)
 *    - In Blender: Select mesh → Right-click → Set Origin → Origin to Bottom
 *    - Why: So scale.y = 0.5 makes it half-full, not floating
 * 
 * 2. FIRE MESH (optional but recommended):
 *    - Name it "Fire" or "Flame"
 *    - Should be a plane or mesh at the bottom of the boiler
 *    - Apply an emissive material (orange/red color)
 * 
 * 3. BOILER DRUM (static body):
 *    - Name it "BoilerDrum" or "Tank"
 *    - This doesn't change - just the container
 * 
 * 4. EXPORT AS GLB:
 *    - Place in frontend/public/model.glb
 *    - Make sure mesh names are preserved in export
 * 
 * NOTE: If mesh names don't match, check browser console for available names
 */

export default function Model({ 
  waterLevel = 50,
  pressure = 10,
  fireIntensity = 30,
  status = 'NORMAL',
  ...props 
}) {
  const group = useRef()
  const { scene } = useGLTF('/model.glb')
  
  // Refs to store mesh references (found during scene traversal)
  const waterMeshRef = useRef(null)
  const fireMeshRef = useRef(null)

  // Initial setup - find meshes by name
  useEffect(() => {
    console.log('🔍 Searching for meshes in model...')
    
    scene.traverse((child) => {
      if (child.isMesh) {
        // Log all mesh names for debugging
        console.log(`Found mesh: "${child.name}"`)
        
        // Make materials transparent for visual effect
        child.material.transparent = true
        child.material.needsUpdate = true
        
        // TODO: MATCH THESE NAMES TO YOUR BLENDER MODEL
        // Adjust these conditions based on your actual mesh names
        
        // Find water mesh (try multiple possible names)
        if (child.name.toLowerCase().includes('water') || 
            child.name.toLowerCase().includes('liquid')) {
          waterMeshRef.current = child
          console.log('✅ Found water mesh:', child.name)
          
          // Set initial color
          if (child.material) {
            child.material.color.set('#00ffff') // Cyan
          }
        }
        
        // Find fire mesh (try multiple possible names)
        if (child.name.toLowerCase().includes('fire') || 
            child.name.toLowerCase().includes('flame') ||
            child.name.toLowerCase().includes('burner')) {
          fireMeshRef.current = child
          console.log('✅ Found fire mesh:', child.name)
          
          // Setup emissive material for glow effect
          if (child.material) {
            child.material.emissive.set('#ff6600') // Orange
            child.material.emissiveIntensity = 1.0
          }
        }
      }
    })
    
    // Warning if meshes not found
    if (!waterMeshRef.current) {
      console.warn('⚠️ Water mesh not found! Check mesh names in Blender.')
      console.warn('   Expected names containing: "water" or "liquid"')
    }
    if (!fireMeshRef.current) {
      console.warn('⚠️ Fire mesh not found! Check mesh names in Blender.')
      console.warn('   Expected names containing: "fire", "flame", or "burner"')
    }
    
  }, [scene])

  // Animation loop - update meshes every frame
  useFrame(() => {
    // ========================
    // UPDATE WATER MESH
    // ========================
    if (waterMeshRef.current) {
      // Scale water vertically based on level (0-100% → 0-1 scale)
      // CRITICAL: This assumes mesh origin is at BOTTOM
      const targetScale = waterLevel / 100
      
      // Smooth transition (lerp for smooth animation)
      waterMeshRef.current.scale.y += (targetScale - waterMeshRef.current.scale.y) * 0.1
      // After the waterMesh scaling line
console.log('Water scale.y:', waterMesh.scale.y, 'Target:', waterLevel / 100);
      // Update water color based on level
      if (waterMeshRef.current.material) {
        if (waterLevel < 20) {
          // DANGER: Red water (low level)
          waterMeshRef.current.material.color.set('#ff0000')
          waterMeshRef.current.material.opacity = 0.7
        } else if (waterLevel > 80) {
          // FLOODING: Dark blue (high level)
          waterMeshRef.current.material.color.set('#000080')
          waterMeshRef.current.material.opacity = 0.8
        } else {
          // NORMAL: Cyan (safe level)
          waterMeshRef.current.material.color.set('#00ffff')
          waterMeshRef.current.material.opacity = 0.6
        }
      }
    }
    
    // ========================
    // UPDATE FIRE MESH
    // ========================
    if (fireMeshRef.current && fireMeshRef.current.material) {
      // Fire glow intensity based on pressure
      // Higher pressure = brighter fire (more energy in system)
      const targetIntensity = (pressure / 25.0) * 3.0 // Scale 0-25 MPa → 0-3 intensity
      
      // Smooth transition
      if (fireMeshRef.current.material.emissiveIntensity !== undefined) {
        fireMeshRef.current.material.emissiveIntensity += 
          (targetIntensity - fireMeshRef.current.material.emissiveIntensity) * 0.1
      }
      
      // Color shift based on fire intensity
      if (fireIntensity > 80) {
        fireMeshRef.current.material.emissive.set('#ffffff') // White hot
      } else if (fireIntensity > 50) {
        fireMeshRef.current.material.emissive.set('#ffaa00') // Yellow
      } else {
        fireMeshRef.current.material.emissive.set('#ff6600') // Orange
      }
    }
  })

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}

// NOTE: This preloads the model on app start
useGLTF.preload('/model.glb')