import { Platform, ViewStyle } from 'react-native';

type ShadowStyle = Pick<
  ViewStyle,
  'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'
>;

/** Minimal shadows — prefer borders and tonal surfaces over elevation. */
export const shadows = {
  none: {} as ShadowStyle,
  sm: Platform.select<ShadowStyle>({
    ios: {
      shadowColor: '#603314',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
} as const;
