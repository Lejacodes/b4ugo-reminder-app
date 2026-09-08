const appJson = require('./app.json');

const plugins = (appJson.expo.plugins ?? []).filter((plugin) => {
  const name = Array.isArray(plugin) ? plugin[0] : plugin;
  return name !== 'expo-notifications' && name !== 'expo-location' && name !== 'expo-speech-recognition';
});
plugins.push([
  'expo-location',
  {
    locationWhenInUsePermission:
      'B4UGO uses your location to remind you when you pass a shop or market where you saved something to buy.',
    locationAlwaysAndWhenInUsePermission:
      'B4UGO needs background location to nudge you when you drive or walk past a saved shop — even if the app is closed.',
    isIosBackgroundLocationEnabled: true,
    isAndroidBackgroundLocationEnabled: true,
  },
]);
plugins.push([
  'expo-notifications',
  {
    enableBackgroundRemoteNotifications: true,
    icon: './assets/images/icon.png',
    color: '#4A5D3A',
  },
]);
plugins.push([
  'expo-speech-recognition',
  {
    microphonePermission: 'B4UGO uses the microphone so you can hold to speak a reminder.',
    speechRecognitionPermission: 'B4UGO uses speech recognition to turn what you say into a reminder.',
  },
]);

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...appJson.expo,
  ...config,
  ios: {
    ...appJson.expo.ios,
    ...config?.ios,
    bundleIdentifier: 'com.b4ugo.reminder',
    infoPlist: {
      ...(appJson.expo.ios?.infoPlist ?? {}),
      ...(config?.ios?.infoPlist ?? {}),
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    ...appJson.expo.android,
    ...config?.android,
    package: 'com.b4ugo.reminder',
  },
  extra: {
    ...appJson.expo.extra,
    ...config?.extra,
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? config?.extra?.eas?.projectId,
    },
  },
  plugins,
});
