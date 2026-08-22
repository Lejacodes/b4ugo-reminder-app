import type { LittleGuyMood } from '@/lib/ai/types';
import type { MemoryParticlePosition } from '@/types/memory-particle';

/**
 * The faces from the character sheet. `curious` is kept as the older name for
 * the thoughtful face so existing callers keep working.
 */
export type LittleGuyExpression =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'thinking'
  | 'sleepy'
  | 'excited'
  | 'surprised'
  | 'proud';

export type LittleGuyProps = {
  /** Overall width of the mascot. Height follows the artboard aspect ratio. */
  size?: number;
  /** Facial expression state. */
  expression?: LittleGuyExpression;
  /** Contextual mood from Little Guy's situation. Maps onto expression. */
  mood?: LittleGuyMood;
  /** Enable gentle up-and-down floating motion. */
  floating?: boolean;
  /** Show decorative memory particles around the mascot. */
  showParticles?: boolean;
  /** Real constellation pixels. When set, these replace the placeholder dots. */
  particles?: MemoryParticlePosition[];
  /** Enable occasional eye blinks. */
  blinking?: boolean;
  /**
   * Describe him to screen readers. Left unset he is treated as decorative,
   * which is what you want when a surrounding pressable already has a label.
   */
  accessibilityLabel?: string;
};

export function expressionFromMood(mood?: LittleGuyMood): LittleGuyExpression {
  switch (mood) {
    case 'happy':
      return 'happy';
    case 'excited':
      return 'excited';
    case 'proud':
      return 'proud';
    case 'thinking':
      return 'thinking';
    case 'surprised':
      return 'surprised';
    case 'remembering':
      return 'curious';
    case 'sleepy':
      return 'sleepy';
    default:
      return 'neutral';
  }
}

type FaceShape = {
  /** `dot` eyes can blink and glance; the drawn shapes are already closed. */
  eyes: 'dot' | 'wide' | 'arcUp' | 'arcDown';
  mouth: 'neutral' | 'smile' | 'wavy' | 'tiny' | 'open' | 'round';
  /** Multiplier on the blush so bigger reactions warm his cheeks a little. */
  blush: number;
};

const FACES: Record<LittleGuyExpression, FaceShape> = {
  neutral: { eyes: 'dot', mouth: 'neutral', blush: 1 },
  happy: { eyes: 'arcUp', mouth: 'smile', blush: 1.1 },
  proud: { eyes: 'arcUp', mouth: 'neutral', blush: 1.1 },
  curious: { eyes: 'dot', mouth: 'tiny', blush: 1 },
  thinking: { eyes: 'dot', mouth: 'wavy', blush: 0.9 },
  excited: { eyes: 'wide', mouth: 'open', blush: 1.2 },
  surprised: { eyes: 'wide', mouth: 'round', blush: 1.05 },
  sleepy: { eyes: 'arcDown', mouth: 'tiny', blush: 0.95 },
};

export function faceForExpression(expression: LittleGuyExpression): FaceShape {
  return FACES[expression] ?? FACES.neutral;
}
