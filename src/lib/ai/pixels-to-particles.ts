import { CONSTELLATION_SLOTS } from '@/constants/little-guy-art';
import type { MemoryParticleColor } from '@/constants/colors';
import type { ConstellationPixel } from '@/lib/ai/types';
import type { MemoryParticlePosition } from '@/types/memory-particle';

const KIND_TO_COLOR: Record<ConstellationPixel['kind'], MemoryParticleColor> = {
  urgent: 'urgent',
  due: 'due',
  errand: 'errand',
  nearby: 'nearby',
  necessity: 'necessity',
  general: 'general',
  trip: 'trip',
};

function hashSlot(id: string, slotCount: number): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return slotCount === 0 ? 0 : (hash >>> 0) % slotCount;
}

/**
 * Places one dot per thing Little Guy is currently holding. Slot choice is
 * hashed from the item id so checking one spark off does not reshuffle the rest.
 */
export function pixelsToParticles(pixels: ConstellationPixel[]): MemoryParticlePosition[] {
  const slots = CONSTELLATION_SLOTS;
  const used = new Set<number>();

  return pixels.slice(0, slots.length).map((pixel) => {
    let index = hashSlot(pixel.id, slots.length);
    while (used.has(index)) {
      index = (index + 1) % slots.length;
    }
    used.add(index);
    const slot = slots[index] ?? slots[0];
    const urgent = pixel.kind === 'urgent' || pixel.kind === 'due';
    return {
      id: pixel.id,
      x: slot.x,
      y: slot.y,
      type: KIND_TO_COLOR[pixel.kind],
      size: urgent ? 8.5 : 6.8,
    };
  });
}
