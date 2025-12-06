import React, { useState, useRef, useCallback } from 'react';
import ParticlesScene from './components/ParticlesScene';
import HandManager from './components/HandManager';
import UIOverlay from './components/UIOverlay';
import { ShapeType } from './types';

function App() {
  const [currentShape, setCurrentShape] = useState<ShapeType>(ShapeType.TREE);
  const [currentColor, setCurrentColor] = useState<string>('#2F5C46'); // Matte Green
  const [isTracking, setIsTracking] = useState(false);
  const [handStrength, setHandStrength] = useState(0.5);

  // Use a ref for the high-frequency 60fps hand data to avoid re-rendering React tree constantly
  const handDataRef = useRef({ strength: 0.5, rotation: 0, isTracking: false });

  const handleHandUpdate = useCallback((data: { strength: number; rotation: number; isTracking: boolean }) => {
    // Update the Ref for the 3D scene loop
    handDataRef.current = data;
    
    // Update local state less frequently or just for UI feedback boolean
    if (data.isTracking !== isTracking) {
      setIsTracking(data.isTracking);
    }
    // Update UI strength meter occasionally (throttling done via standard React batching usually handles this okay, but be careful)
    setHandStrength(data.strength);
  }, [isTracking]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans selection:bg-gold-500 selection:text-white">
      
      {/* 3D Scene Layer */}
      <ParticlesScene 
        shape={currentShape} 
        color={currentColor} 
        handData={handDataRef} 
      />

      {/* UI Overlay Layer */}
      <UIOverlay 
        currentShape={currentShape}
        currentColor={currentColor}
        onShapeChange={setCurrentShape}
        onColorChange={setCurrentColor}
        handStatus={{ isTracking, strength: handStrength }}
      />

      {/* Logic Layer (Headless) */}
      <HandManager onUpdate={handleHandUpdate} />
      
    </div>
  );
}

export default App;
