import React, { useEffect, useRef, useState } from 'react';
import { HandResults } from '../types';

// Declare globals for the script-loaded MediaPipe
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface HandManagerProps {
  onUpdate: (data: { strength: number; rotation: number; isTracking: boolean }) => void;
}

const HandManager: React.FC<HandManagerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let camera: any = null;
    let hands: any = null;

    const onResults = (results: HandResults) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // 1. Calculate Open/Closed (Strength)
        // Measure distance between Wrist (0) and Middle Finger Tip (12)
        // vs Wrist (0) and Middle Finger PIP (10) to determine curl
        // A simpler robust way: Average distance of fingertips to wrist
        
        const wrist = landmarks[0];
        const tips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
        
        let totalDist = 0;
        tips.forEach(idx => {
          const tip = landmarks[idx];
          const d = Math.sqrt(
            Math.pow(tip.x - wrist.x, 2) + 
            Math.pow(tip.y - wrist.y, 2) + 
            Math.pow(tip.z - wrist.z, 2)
          );
          totalDist += d;
        });
        
        const avgDist = totalDist / 5;
        // Normalize: roughly 0.15 is closed, 0.4 is open (values depend on coord system, but MP is normalized 0-1)
        // We clamp and map to 0-1
        const strength = Math.min(Math.max((avgDist - 0.15) / (0.35 - 0.15), 0), 1);

        // 2. Calculate Rotation based on Hand X position on screen
        // Center is 0.5. Left is 0, Right is 1.
        // Map 0 -> 1 to -1 -> 1
        const rotation = (wrist.x - 0.5) * -3; // Multiply to make it more sensitive

        onUpdate({
          strength, // 0 = fist (collapsed), 1 = open (expanded)
          rotation,
          isTracking: true
        });

      } else {
        onUpdate({ strength: 0.5, rotation: 0, isTracking: false });
      }
    };

    const initMediaPipe = async () => {
      if (!window.Hands || !videoRef.current) return;

      hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults(onResults);

      if (typeof window.Camera !== 'undefined' && videoRef.current) {
         camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && hands) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        camera.start();
      }
    };

    // Check permissions first
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => {
        setPermissionGranted(true);
        // Delay slightly to ensure Scripts are fully loaded if network is slow
        setTimeout(initMediaPipe, 1000);
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setError("Camera access denied. Please enable camera to play.");
      });

    return () => {
      // Cleanup not easily available in the simple Camera util version without stopping tracks manually
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute bottom-4 right-4 z-40 w-32 h-24 bg-black/50 rounded-lg overflow-hidden border border-white/20">
      {/* Hidden processing video */}
      <video ref={videoRef} className="w-full h-full object-cover opacity-50 mirror transform -scale-x-100" playsInline muted />
      {!permissionGranted && !error && <div className="absolute inset-0 flex items-center justify-center text-xs text-white">Loading Cam...</div>}
      {error && <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 text-center p-1">{error}</div>}
    </div>
  );
};

export default HandManager;
