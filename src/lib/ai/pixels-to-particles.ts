import { CONSTELLATION_SLOTS } from '@/constants/little-guy-art';
import type { ConstellationPixel } from '@/lib/ai/types';
import type { MemoryParticleColor } from '@/constants/colors';
import type { MemoryParticlePosition } from '@/types/memory-particle';

const KIND_TO_COLOR: Record<ConstellationPixel['kind'], MemoryParticleColor> = {
  reminder: 'reminder',
  buy: 'buy',
  trip: 'trip',
  task: 'task',
  important: 'memory',
};

/**
 * Places one dot per thing Little Guy is currently holding. Nothing is padded
 * out: an empty list means an empty sky, and finishing things thins it out.
 */
export function pixelsToParticles(pixels: ConstellationPixel[]): MemoryParticlePosition[] {
  return pixels.slice(0, CONSTELLATION_SLOTS.length).map((pixel, index) => {
    const slot = CONSTELLATION_SLOTS[index] ?? CONSTELLATION_SLOTS[0];
    return {
      x: slot.x,
      y: slot.y,
      type: KIND_TO_COLOR[pixel.kind],
      size: pixel.kind === 'important' || pixel.kind === 'trip' ? 8.5 : 6.8,
    };
  });
}
