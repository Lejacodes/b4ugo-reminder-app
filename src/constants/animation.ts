/** Shared animation timing values for reanimated and RN Animated. */
export const animation = {
  duration: {
    fast: 200,
    normal: 400,
    slow: 800,
    float: 2400,
    blink: 120,
  },
  float: {
    distance: 6,
  },
  particle: {
    distance: 4,
    duration: 3000,
  },
  /**
   * Little Guy's idle life. Every period is deliberately a different length so
   * the motions drift out of phase and he never looks like he is on a loop.
   */
  littleGuy: {
    bobDistance: 2.6,
    bobDuration: 4200,
    breathScale: 0.022,
    breathDuration: 3400,
    antennaTilt: 2.2,
    antennaDuration: 5600,
    wandTilt: 3,
    wandDuration: 6800,
    sparkleDuration: 2600,
    blinkMinDelay: 3200,
    blinkExtraDelay: 3800,
    glanceMinDelay: 7000,
    glanceExtraDelay: 9000,
    glanceDistance: 0.9,
    reactionLift: 4,
  },
} as const;
