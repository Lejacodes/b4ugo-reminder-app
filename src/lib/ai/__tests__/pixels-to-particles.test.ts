import { ARTBOARD, CONSTELLATION_SLOTS } from '@/constants/little-guy-art';
import { pixelsToParticles } from '@/lib/ai/pixels-to-particles';
import type { ConstellationPixel } from '@/lib/ai/types';
import { expressionFromMood, faceForExpression } from '@/types/little-guy';

function pixel(id: string, kind: ConstellationPixel['kind']): ConstellationPixel {
  return { id, kind, label: id };
}

describe('constellation dots', () => {
  it('shows nothing when Little Guy is holding nothing', () => {
    expect(pixelsToParticles([])).toEqual([]);
  });

  it('places one dot per real pixel and never invents extras', () => {
    const dots = pixelsToParticles([pixel('a', 'reminder'), pixel('b', 'trip')]);

    expect(dots).toHaveLength(2);
    expect(dots.map((dot) => dot.type)).toEqual(['reminder', 'trip']);
  });

  it('thins out as things get resolved', () => {
    const busy = pixelsToParticles([
      pixel('a', 'reminder'),
      pixel('b', 'buy'),
      pixel('c', 'task'),
      pixel('d', 'trip'),
    ]);
    const calm = pixelsToParticles([pixel('d', 'trip')]);

    expect(calm.length).toBeLessThan(busy.length);
  });

  it('maps the important kind onto the memory hue', () => {
    expect(pixelsToParticles([pixel('a', 'important')])[0].type).toBe('memory');
  });

  it('caps at the number of available orbit slots', () => {
    const many = Array.from({ length: 20 }, (_, i) => pixel(`p${i}`, 'reminder'));

    expect(pixelsToParticles(many)).toHaveLength(CONSTELLATION_SLOTS.length);
  });

  it('keeps every dot inside the artboard so nothing clips', () => {
    const many = Array.from({ length: CONSTELLATION_SLOTS.length }, (_, i) => pixel(`p${i}`, 'trip'));

    for (const dot of pixelsToParticles(many)) {
      expect(dot.x - dot.size / 2).toBeGreaterThanOrEqual(0);
      expect(dot.x + dot.size / 2).toBeLessThanOrEqual(ARTBOARD.width);
      expect(dot.y - dot.size / 2).toBeGreaterThanOrEqual(0);
      expect(dot.y + dot.size / 2).toBeLessThanOrEqual(ARTBOARD.height);
    }
  });
});

describe('expressions', () => {
  it('gives each mood its own face', () => {
    expect(expressionFromMood('idle')).toBe('neutral');
    expect(expressionFromMood('thinking')).toBe('thinking');
    expect(expressionFromMood('happy')).toBe('happy');
    expect(expressionFromMood('proud')).toBe('proud');
    expect(expressionFromMood('excited')).toBe('excited');
    expect(expressionFromMood('surprised')).toBe('surprised');
    expect(expressionFromMood('remembering')).toBe('curious');
    expect(expressionFromMood('sleepy')).toBe('sleepy');
  });

  it('falls back to the calm face when there is no mood', () => {
    expect(expressionFromMood(undefined)).toBe('neutral');
  });

  it('only blinks on faces whose eyes are actually open', () => {
    expect(faceForExpression('neutral').eyes).toBe('dot');
    expect(faceForExpression('sleepy').eyes).toBe('arcDown');
    expect(faceForExpression('happy').eyes).toBe('arcUp');
  });
});
