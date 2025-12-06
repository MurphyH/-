export enum ShapeType {
  TREE = 'Tree',
  HEART = 'Heart',
  STAR = 'Star',
  SPHERE = 'Sphere', // Using Sphere as abstract representation for Fireworks/Buddha base
  SPIRAL = 'Spiral'
}

export interface ParticleConfig {
  color: string;
  size: number;
  count: number;
}

// MediaPipe Types helper
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  multiHandLandmarks: HandLandmark[][];
}

export interface HandContextType {
  gestureStrength: number; // 0 (closed) to 1 (open)
  rotationX: number; // -1 to 1 based on hand position
  isTracking: boolean;
}
