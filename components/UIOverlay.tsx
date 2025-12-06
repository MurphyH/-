import React from 'react';
import { ShapeType } from '../types';

interface UIOverlayProps {
  currentShape: ShapeType;
  currentColor: string;
  onShapeChange: (s: ShapeType) => void;
  onColorChange: (c: string) => void;
  handStatus: { isTracking: boolean; strength: number };
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  currentShape,
  currentColor,
  onShapeChange,
  onColorChange,
  handStatus
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const colors = [
    { name: 'Matte Green', value: '#2F5C46' },
    { name: 'Gold', value: '#D4AF37' },
    { name: 'Red', value: '#880808' },
    { name: 'Ice Blue', value: '#A5F2F3' },
    { name: 'Warm White', value: '#FDF4DC' },
  ];

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 z-30">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="text-white">
          <h1 className="text-3xl font-light tracking-widest text-gold-400 drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]">
            NOEL <span className="font-bold">PARTICLES</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Gesture Controlled Experience</p>
        </div>
        
        <button 
          onClick={toggleFullscreen}
          className="border border-white/20 hover:bg-white/10 text-white px-4 py-2 rounded text-xs transition-colors uppercase tracking-widest backdrop-blur-sm"
        >
          Fullscreen
        </button>
      </div>

      {/* Instructions Overlay (Contextual) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none transition-opacity duration-500">
        {!handStatus.isTracking && (
          <div className="animate-pulse">
            <p className="text-white text-lg font-light">Show your hand to camera</p>
            <div className="w-12 h-12 border-2 border-dashed border-white/30 rounded-full mx-auto mt-4 animate-spin-slow"></div>
          </div>
        )}
        
        {handStatus.isTracking && (
          <div className="flex gap-8 text-white/50 text-sm font-light">
             <div className="flex flex-col items-center">
                <span className={`block w-2 h-2 rounded-full mb-2 ${handStatus.strength < 0.3 ? 'bg-green-400 shadow-[0_0_10px_lime]' : 'bg-gray-600'}`}></span>
                <span>Fist: Gather</span>
             </div>
             <div className="flex flex-col items-center">
                <span className={`block w-2 h-2 rounded-full mb-2 ${handStatus.strength > 0.7 ? 'bg-red-400 shadow-[0_0_10px_red]' : 'bg-gray-600'}`}></span>
                <span>Open: Scatter</span>
             </div>
          </div>
        )}
      </div>

      {/* Controls Footer */}
      <div className="flex flex-col md:flex-row gap-6 items-end pointer-events-auto bg-black/20 p-4 rounded-xl backdrop-blur-md border border-white/5 w-fit mx-auto md:mx-0">
        
        {/* Shapes */}
        <div className="flex flex-col gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-widest">Shape</span>
          <div className="flex gap-2">
            {Object.values(ShapeType).map((shape) => (
              <button
                key={shape}
                onClick={() => onShapeChange(shape)}
                className={`px-3 py-1.5 rounded-md text-xs transition-all duration-300 border ${
                  currentShape === shape 
                    ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
                    : 'bg-transparent border-white/10 text-gray-400 hover:border-white/30'
                }`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-10 bg-white/10 hidden md:block"></div>

        {/* Colors */}
        <div className="flex flex-col gap-2">
          <span className="text-white/40 text-[10px] uppercase tracking-widest">Theme</span>
          <div className="flex gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => onColorChange(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  currentColor === c.value ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-70'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;
