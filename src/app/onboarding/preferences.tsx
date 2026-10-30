import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { ButterButton, DeskScreen, Handwriting, PaperPanel, QuietLink, ScrapbookSwitch } from '@/components/scrapbook';
import { readableFont, readableType } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { deviceLocationService } from '@/lib/location/device-location';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { usePreferences } from '@/store/PreferencesProvider';

export default function OnboardingPreferencesScreen() {
  const router = useRouter();
  const colors = useScrapbookPalette();
  const { preferences, updatePreferences } = usePreferences();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const change = async (task: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(null);
    try { await task(); } catch { setError('Could not save your choice. Please try again.'); }
    finally { setBusy(false); }
  };
  const textStyle = { ...readableFont, ...readableType.item, color: colors.ink };
  return (
    <DeskScreen scroll>
      <Handwriting variant="heading" accessibilityRole="header">how should I help?</Handwriting>
      <PaperPanel tape="top-left">
        <Text style={textStyle}>These choices are optional. You can change them in Profile. Reminders still work when permissions are off.</Text>
        <View style={{ gap: 20, marginTop: 20 }}>
          <Text style={textStyle}>Notifications let B4UGO show reminders when the app is closed. Turn this on to see your device’s permission request.</Text>
          <Text style={textStyle}>Allow reminder notifications</Text>
          <ScrapbookSwitch disabled={busy} accessibilityLabel="Allow reminder notifications" value={preferences.notifications.pushEnabled}
            onValueChange={(enabled) => void change(async () => {
              const granted = !enabled || await appNotificationService.requestPermission() === 'granted';
              await updatePreferences({ notifications: { pushEnabled: enabled && granted } });
              if (!granted) setError('Notifications are off in device settings. You can keep using your lists.');
            })} />
          <Text style={textStyle}>Location reminders can nudge you near saved shops. Enabling this requests foreground location only. Background access is a separate choice in Profile. Your location is not shared with another person.</Text>
          <Text style={textStyle}>Remind me near places</Text>
          <ScrapbookSwitch disabled={busy} accessibilityLabel="Remind me near places" value={preferences.reminders.locationRemindersEnabled}
            onValueChange={(enabled) => void change(async () => {
              const granted = !enabled || await deviceLocationService.requestPermission() === 'granted';
              await updatePreferences({ reminders: { ...preferences.reminders, locationRemindersEnabled: enabled && granted } });
              if (!granted) setError('Location reminders are unavailable. Your lists and scheduled reminders remain available.');
            })} />
          <Text style={textStyle}>Cloud AI sends your message and reminder or trip context to the configured AI service. Leave it off to use local commands. No analytics are collected.</Text>
          <Text style={textStyle}>Use optional cloud AI</Text>
          <ScrapbookSwitch disabled={busy} accessibilityLabel="Use optional cloud AI" value={preferences.privacy.aiParsingEnabled}
            onValueChange={(enabled) => void change(() => updatePreferences({ privacy: { ...preferences.privacy, aiParsingEnabled: enabled } }))} />
          <QuietLink label="read the privacy notice" onPress={() => router.push('/legal/privacy')} />
        </View>
        {error ? <Text accessibilityRole="alert" style={textStyle}>{error}</Text> : null}
      </PaperPanel>
      <ButterButton label="continue" disabled={busy} onPress={() => router.push('/onboarding/complete')} />
    </DeskScreen>
  );
}
