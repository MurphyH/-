import * as THREE from 'three';
import { ShapeType } from '../types';

const TREE_HEIGHT = 10;
const TREE_RADIUS = 4;

export const generateParticles = (count: number, type: ShapeType): Float32Array => {
  const positions = new Float32Array(count * 3);
  
  // Define zones for Tree (indices must match color generation for the effect to work)
  const starCount = Math.floor(count * 0.05); // Top 5% are star
  const ornamentCount = Math.floor(count * 0.15); // Next 15% are ornaments
  // Remaining 80% are tree body

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;

    if (type === ShapeType.TREE) {
      if (i < starCount) {
        // STAR at the top
        // Create a small dense sphere/star shape at the very top
        const r = Math.pow(Math.random(), 1/3) * 0.8; // Concentrated center
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        x = r * Math.sin(phi) * Math.cos(theta);
        y = (TREE_HEIGHT / 2) + 0.5 + r * Math.sin(phi) * Math.sin(theta); // Just above tree
        z = r * Math.cos(phi);
      } else if (i < starCount + ornamentCount) {
        // ORNAMENTS
        // Randomly distributed on the surface of the cone
        const ratio = Math.random();
        const angle = Math.random() * Math.PI * 2;
        // Surface radius at this height
        const radius = (1 - ratio) * TREE_RADIUS;
        
        // Push slightly outside the main tree volume to be visible
        const rOffset = radius + 0.2; 
        
        x = Math.cos(angle) * rOffset;
        y = (ratio * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        z = Math.sin(angle) * rOffset;
      } else {
        // TREE BODY
        // Spiral Cone
        // Remap index to 0..1 for the body section
        const bodyIndex = i - (starCount + ornamentCount);
        const bodyTotal = count - (starCount + ornamentCount);
        const ratio = bodyIndex / bodyTotal;
        
        const angle = ratio * Math.PI * 60; // More windings for denser look
        const radius = (1 - ratio) * TREE_RADIUS;
        
        // Add thickness/volume
        const randomOffset = Math.random();
        const r = radius * (0.8 + 0.2 * randomOffset); // Mostly outer shell but some depth

        x = Math.cos(angle) * r;
        y = (ratio * TREE_HEIGHT) - (TREE_HEIGHT / 2);
        z = Math.sin(angle) * r;

        // Add some random jitter
        x += (Math.random() - 0.5) * 0.5;
        z += (Math.random() - 0.5) * 0.5;
      }
    } else {
      // Standard generation for other shapes (Random distribution)
      switch (type) {
        case ShapeType.HEART:
          const t = Math.random() * Math.PI * 2;
          const scale = 0.35; // Slightly larger
          const r = Math.random(); 
          // Use more volume
          const vol = 1 - Math.pow(Math.random(), 3); // More density near shell
          x = 16 * Math.pow(Math.sin(t), 3) * scale * vol;
          y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale * vol;
          z = (Math.random() - 0.5) * 3 * vol;
          break;

        case ShapeType.STAR:
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos((Math.random() * 2) - 1);
          const len = Math.pow(Math.random(), 2) * 6; // Bigger star
          
          const spikeCount = 5;
          const spikeVal = Math.sin(theta * spikeCount) * Math.sin(phi * spikeCount);
          const finalLen = len + (spikeVal > 0 ? spikeVal * 3 : 0);

          x = finalLen * Math.sin(phi) * Math.cos(theta);
          y = finalLen * Math.sin(phi) * Math.sin(theta);
          z = finalLen * Math.cos(phi);
          break;

        case ShapeType.SPHERE:
          const sTheta = Math.random() * Math.PI * 2;
          const sPhi = Math.acos((Math.random() * 2) - 1);
          const sR = Math.cbrt(Math.random()) * 5; 

          x = sR * Math.sin(sPhi) * Math.cos(sTheta);
          y = sR * Math.sin(sPhi) * Math.sin(sTheta);
          z = sR * Math.cos(sPhi);
          break;

        case ShapeType.SPIRAL:
          const tSpiral = i / count * Math.PI * 15;
          const radSpiral = tSpiral * 0.3;
          x = Math.cos(tSpiral) * radSpiral;
          y = (Math.random() - 0.5) * 8; // Taller
          z = Math.sin(tSpiral) * radSpiral;
          break;
      }
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;
  }

  return positions;
};

export const generateColors = (count: number, baseColor: string): Float32Array => {
  const colors = new Float32Array(count * 3);
  const base = new THREE.Color(baseColor);
  
  // Check if we are in the default "Christmas Tree" mode (Matte Green)
  // If so, we apply the special multicolored decorations
  const isChristmasTheme = baseColor === '#2F5C46'; 

  const starCount = Math.floor(count * 0.05);
  const ornamentCount = Math.floor(count * 0.15);

  const colorPalette = [
    new THREE.Color('#FF0000'), // Red
    new THREE.Color('#FFD700'), // Gold
    new THREE.Color('#800080'), // Purple
    new THREE.Color('#FF4500'), // Orange-Red
    new THREE.Color('#00FFFF'), // Cyan
    new THREE.Color('#FF69B4'), // Hot Pink
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let c = base.clone();

    if (isChristmasTheme) {
      if (i < starCount) {
        // STAR: Bright Yellow/Gold/White
        const r = Math.random();
        if (r > 0.8) c.setHex(0xFFFFFF); // Sparkle
        else c.setHex(0xFFD700); // Gold
        // Boost brightness
        c.multiplyScalar(1.5); 
      } else if (i < starCount + ornamentCount) {
        // ORNAMENTS: Random vibrant colors
        const colorIdx = Math.floor(Math.random() * colorPalette.length);
        c = colorPalette[colorIdx].clone();
        c.multiplyScalar(1.2); // Make them pop
      } else {
        // BODY: Green variation with some snow
        if (Math.random() > 0.92) {
            c.setHex(0xFFFFFF); // Snow
            c.multiplyScalar(0.8);
        } else {
            // Variation in green
            c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.2);
            // Darken inner parts slightly for depth? handled by lighting/opacity mostly
        }
      }
    } else {
      // Logic for other single-color themes (e.g., if user selects Gold or Red explicitly)
      // Just add some variation
      const r = Math.random();
      if (r > 0.8) {
        c.offsetHSL(0, 0, 0.2); // Highlight
      } else if (r < 0.2) {
        c.offsetHSL(0, 0, -0.2); // Shadow
      }
    }

    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;
  }
  return colors;
};