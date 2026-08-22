import type { MemoryParticleColor } from '@/constants/colors';

export type { MemoryParticleColor };

export type MemoryParticleProps = {
  /** Semantic color type for the particle. */
  type: MemoryParticleColor;
  /** Diameter in logical pixels. */
  size?: number;
  /** Absolute top-left position within a parent container, in pixels. */
  x?: number;
  y?: number;
  /** Whether to apply a subtle floating animation. */
  animated?: boolean;
  /** Offsets this dot's drift and twinkle so the constellation stays uneven. */
  phase?: number;
};

/**
 * A dot in Little Guy's constellation. `x` and `y` are the dot's centre in the
 * 100 x 118 artboard from constants/little-guy-art, so they scale with him.
 */
export type MemoryParticlePosition = {
  x: number;
  y: number;
  type: MemoryParticleColor;
  size: number;
};
