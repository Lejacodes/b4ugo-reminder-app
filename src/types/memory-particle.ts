import type { MemoryParticleColor } from '@/constants/colors';

export type { MemoryParticleColor };

export type MemoryParticleProps = {
  /** Semantic color type for the particle. */
  type: MemoryParticleColor;
  /** Diameter in logical pixels. */
  size?: number;
  /** Absolute position within a parent container. */
  x?: number;
  y?: number;
  /** Whether to apply a subtle floating animation. */
  animated?: boolean;
};

export type MemoryParticlePosition = {
  x: number;
  y: number;
  type: MemoryParticleColor;
  size: number;
};
