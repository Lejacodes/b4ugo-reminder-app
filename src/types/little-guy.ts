export type LittleGuyExpression = 'neutral' | 'happy' | 'curious' | 'sleepy';

export type LittleGuyProps = {
  /** Overall width/height of the mascot container. */
  size?: number;
  /** Facial expression state. */
  expression?: LittleGuyExpression;
  /** Enable gentle up-and-down floating motion. */
  floating?: boolean;
  /** Show decorative memory particles around the mascot. */
  showParticles?: boolean;
  /** Enable occasional eye blinks. */
  blinking?: boolean;
};
