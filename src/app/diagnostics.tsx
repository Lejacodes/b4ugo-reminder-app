import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { ScrapbookHeader } from '@/components/before-ugo/ScrapbookHeader';
import { ButterButton, DeskScreen, Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableFont, readableType } from '@/constants/scrapbook';
import { useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { deviceLocationService } from '@/lib/location/device-location';
import { loadGeofenceManifest } from '@/lib/location/geofence-manifest';
import { GEOFENCE_TASK_NAME } from '@/lib/location/geofence-task';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { resolveEasProjectId, syncPushRegistration } from '@/lib/notifications/push-token';
import { localRepository } from '@/lib/sync/local';
import type { Operation } from '@/lib/sync/repository';
import { getSupabase } from '@/lib/supabase/client';
import { installationId } from '@/lib/notifications/installation';
import { useAuth } from '@/store/AuthProvider';
import { usePreferences } from '@/store/PreferencesProvider';
import { useSync } from '@/store/SyncProvider';
import { useNotificationDelivery } from '@/store/NotificationDeliveryProvider';

export default function DiagnosticsScreen() {
  const colors = useScrapbookPalette();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const sync = useSync();
  const delivery = useNotificationDelivery();
  const [rows, setRows] = useState<[string, string][]>([]);
  const [conflicts, setConflicts] = useState<Operation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inspect = useCallback(async () => {
    try {
      const [notification, location, background, available, manifest, scheduled] = await Promise.all([
        appNotificationService.getPermissionStatus(), deviceLocationService.getPermissionStatus(),
        deviceLocationService.getBackgroundPermissionStatus(), deviceLocationService.isAvailable(),
        loadGeofenceManifest(), appNotificationService.listScheduledIds(),
      ]);
      let registered = 'Unavailable on web';
      if (Platform.OS !== 'web') {
        const Location = await import('expo-location');
        registered = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME) ? 'Monitoring regions' : 'Not monitoring';
      }
      let push = 'Backend not configured';
      let attempts = 'Cloud delivery has not been checked';
      const client = getSupabase();
      if (user && client) {
        const { data, error } = await client.from('push_tokens').select('id').eq('user_id', user.id).eq('installation_id', await installationId());
        push = error ? 'Registration could not be checked' : data?.length ? 'This installation is registered' : 'This installation is not registered';
        if (data?.[0]?.id) {
          const result = await client.from('push_attempts').select('state').eq('user_id', user.id).eq('token_id', data[0].id).limit(100);
          if (result.error) attempts = 'Delivery attempts could not be checked';
          else {
            const counts = new Map<string, number>();
            for (const row of result.data ?? []) counts.set(row.state, (counts.get(row.state) ?? 0) + 1);
            attempts = [...counts].map(([state, count]) => `${count} ${state === 'delivered' ? 'receipt accepted' : state}`).join(', ') || 'No cloud delivery attempts';
          }
        }
      }
      const nextConflicts = user ? await localRepository.conflicts(user.id) : [];
      setConflicts(nextConflicts);
      setRows([
        ['Notifications', `${notification}; ${scheduled.length} scheduled on this device`],
        ['Foreground location', location], ['Background location', background],
        ['Location reminders', !preferences.reminders.locationRemindersEnabled ? 'Off by your choice' : available ? 'Available in foreground' : 'Unavailable: check permission and device location services'],
        ['Geofences', `${registered}; ${Object.keys(manifest.regions).length} regions in manifest`],
        ['EAS project', resolveEasProjectId() ?? 'Missing — remote push is unavailable'], ['Push registration', push],
        ['Recent cloud delivery attempts (up to 100)', attempts],
        ['Cloud AI', preferences.privacy.aiParsingEnabled ? 'Opted in; availability depends on the configured service' : 'Off — local commands only'],
      ]);
      setError(null);
    } catch { setError('Some checks could not finish. Your existing records have been retained.'); }
  }, [preferences.privacy.aiParsingEnabled, preferences.reminders.locationRemindersEnabled, user]);
  useEffect(() => {
    const timer = setTimeout(() => void inspect(), 0);
    return () => clearTimeout(timer);
  }, [inspect, sync.conflicts]);
  const run = async (task: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try { await task(); await inspect(); } catch { setError('This action could not finish. Please try again.'); }
    finally { setBusy(false); }
  };
  const style = { ...readableFont, ...readableType.item, color: colors.ink };
  return (
    <DeskScreen scroll>
      <ScrapbookHeader title="how things are working" />
      <PaperPanel tape="top-left">
        <Handwriting variant="title">saved &amp; synchronized</Handwriting>
        <Text accessibilityLiveRegion="polite" style={style}>{sync.status}. {sync.pending} pending, {sync.failed} failed, {sync.conflicts} conflicts, {sync.recovered} recovered.</Text>
        <Text style={style}>Pending changes are saved on this device. Failed synchronization retries when the app is open or reconnects. A conflict keeps your version until you review it.</Text>
        <ButterButton label="retry synchronization" busy={busy} onPress={() => void run(sync.refresh)} />
      </PaperPanel>
      <PaperPanel tape="top-right">
        <Text style={style}>Due reminders on this device: {delivery.mode === 'local' ? 'on-device scheduling' : 'cloud push'}.</Text>
        <Text style={style}>On-device scheduling works for reminders already loaded here, including offline edits. Cloud push can include changes from other devices while this app is closed, but needs synchronization and working push registration. Switching needs a connection. Choose one route to avoid duplicate due alerts.</Text>
        <QuietLink label={delivery.mode === 'local' ? 'switch to cloud due reminders' : 'switch to on-device due reminders'} onPress={() => void run(() => delivery.changeMode(delivery.mode === 'local' ? 'remote' : 'local'))} />
        {rows.map(([label, value]) => <View key={label} style={{ marginBottom: 16 }}><Text style={style}>{label}</Text><Text selectable style={style}>{value}</Text></View>)}
        <QuietLink label="refresh checks" onPress={() => void run(inspect)} />
        <QuietLink label="open device settings" onPress={() => void Linking.openSettings()} />
        <QuietLink label="retry this device’s push registration" onPress={() => void run(() => syncPushRegistration({ enabled: preferences.notifications.pushEnabled, requestPermission: false }))} />
      </PaperPanel>
      {conflicts.map((operation) => <PaperPanel key={operation.operationId}>
        <Text style={style}>Another device changed {operation.collection}. Your copy and the remote copy are retained.</Text>
        <Text selectable style={style}>This device: {JSON.stringify(operation.value)}</Text>
        <Text selectable style={style}>Other device: {JSON.stringify(operation.conflict?.value)}</Text>
        {confirm === operation.operationId ? <View>
          <Text style={style}>Use the other device’s version? Your current copy will be retained in local recovery storage.</Text>
          <ButterButton label="use other device’s version" disabled={busy} onPress={() => void run(async () => {
            if (user) await localRepository.resolveWithRemote(user.id, operation.operationId);
            setConfirm(null);
          })} />
          <QuietLink label="keep reviewing" onPress={() => setConfirm(null)} />
        </View> : <QuietLink label="review using the other version" onPress={() => setConfirm(operation.operationId)} />}
      </PaperPanel>)}
      {error ? <Text accessibilityRole="alert" style={style}>{error}</Text> : null}
    </DeskScreen>
  );
}
