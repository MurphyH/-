import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ShapeType } from '../types';
import { generateParticles, generateColors } from '../utils/shapes';

// Add global type augmentation for React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
    }
  }
}

interface SceneProps {
  shape: ShapeType;
  color: string;
  handData: React.MutableRefObject<{ strength: number; rotation: number; isTracking: boolean }>;
}

const ParticleSystem: React.FC<SceneProps> = ({ shape, color, handData }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 15000; // Increased particle count for richer visuals
  
  // Geometries for morphing
  const currentPositions = useRef(new Float32Array(count * 3));
  
  // Memoize target shapes to avoid re-calculation on every frame
  const targetGeometries = useMemo(() => {
    return {
      [ShapeType.TREE]: generateParticles(count, ShapeType.TREE),
      [ShapeType.HEART]: generateParticles(count, ShapeType.HEART),
      [ShapeType.STAR]: generateParticles(count, ShapeType.STAR),
      [ShapeType.SPHERE]: generateParticles(count, ShapeType.SPHERE),
      [ShapeType.SPIRAL]: generateParticles(count, ShapeType.SPIRAL),
    };
  }, []);

  const colors = useMemo(() => generateColors(count, color), [color]);

  // Initial setup: update colors and positions when shape/color changes
  useEffect(() => {
    // We don't reset positions instantly to allow morphing, 
    // but we do need to update colors which might be shape-dependent in our new logic
    if (pointsRef.current) {
      pointsRef.current.geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(colors, 3)
      );
      pointsRef.current.geometry.attributes.color.needsUpdate = true;
    }
  }, [colors]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const { strength, rotation, isTracking } = handData.current;
    
    // Smoothly interpolate rotation based on hand
    if (isTracking) {
      pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, rotation, 0.05);
    } else {
      pointsRef.current.rotation.y += 0.002; // Auto rotate
    }

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const target = targetGeometries[shape];
    
    // Interaction Logic:
    // Strength 0 (Fist) -> Tight gather (scale < 1)
    // Strength 1 (Open) -> Wide scatter (scale > 1)
    
    // Map strength (0 to 1) to Scale Factor
    // 0 -> 0.4 (Tight)
    // 0.5 -> 1.0 (Normal)
    // 1.0 -> 2.5 (Scattered)
    const targetScale = isTracking 
      ? 0.4 + (strength * 2.1) 
      : 1.0; // Default state

    // Lerp factor
    const lerpSpeed = isTracking ? 0.08 : 0.04;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Target Coordinates from shape definition
      const tx = target[i3];
      const ty = target[i3 + 1];
      const tz = target[i3 + 2];

      // Time-based noise for "alive" feeling
      const time = state.clock.elapsedTime;
      const noiseAmp = isTracking ? 0.05 + strength * 0.2 : 0.1;
      
      const noiseX = Math.sin(time * 2 + i * 0.1) * noiseAmp;
      const noiseY = Math.cos(time * 1.5 + i * 0.2) * noiseAmp;
      const noiseZ = Math.sin(time * 2.2 + i * 0.1) * noiseAmp;

      // Calculate final target position with scale and noise
      const destX = tx * targetScale + noiseX;
      const destY = ty * targetScale + noiseY;
      const destZ = tz * targetScale + noiseZ;

      // Current positions
      const cx = positions[i3];
      const cy = positions[i3 + 1];
      const cz = positions[i3 + 2];

      // Move particle
      positions[i3] += (destX - cx) * lerpSpeed;
      positions[i3 + 1] += (destY - cy) * lerpSpeed;
      positions[i3 + 2] += (destZ - cz) * lerpSpeed;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Softer, glowier particle texture
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={currentPositions.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors} // Initial colors
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12} // Slightly smaller individual particles for higher density
        vertexColors
        map={texture}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

const ParticlesScene: React.FC<SceneProps> = (props) => {
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#050a05] to-black">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 14]} fov={60} />
        <ambientLight intensity={0.5} />
        
        <ParticleSystem {...props} />

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableRotate={false} 
        />
        
        <EffectComposer disableNormalPass>
          {/* Enhanced Bloom for Christmas Lights feeling */}
          <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.2} radius={0.6} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default ParticlesScene;