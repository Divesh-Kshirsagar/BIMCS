import React, { useRef, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

export default function Model(props) {
  const group = useRef()
  const { scene } = useGLTF('/model.glb')

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = true
        child.material.opacity = 0.5 // Adjust value between 0 (fully transparent) and 1 (opaque)
        child.material.needsUpdate = true
      }
    })
  }, [scene])

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  )
}