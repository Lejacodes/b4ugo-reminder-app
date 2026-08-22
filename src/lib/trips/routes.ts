import type { Href } from 'expo-router';

/** Typed-routes lag behind new files until Expo regenerates `.expo/types`. */
export function tripHref(path: string): Href {
  return path as Href;
}
