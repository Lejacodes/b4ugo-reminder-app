import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ButterButton,
  Handwriting,
  PaperField,
  PaperPanel,
  QuietLink,
  ScrapbookSwitch,
} from '@/components/scrapbook';
import { palette as brand } from '@/constants/colors';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useResponsive } from '@/hooks/use-responsive';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { deviceLocationService } from '@/lib/location/device-location';
import { appNotificationService } from '@/lib/notifications/notification-service';
import { useAppearance } from '@/store/AppearanceProvider';
import { useAuth } from '@/store/AuthProvider';
import { usePlaces } from '@/store/PlaceProvider';
import { usePreferences } from '@/store/PreferencesProvider';
import { interestOptions, type OnboardingInterest } from '@/types/onboarding';

import '@/components/opening-login/opening-login.css';

export default function ProfileScreen() {
  const router = useRouter();
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const reduceMotion = useReducedMotion();
  const { scheme, setAppearance } = useAppearance();
  const { profile, preferences, updateProfile, updatePreferences, resetAll } = usePreferences();
  const { home, setHome } = usePlaces();
  const { user, signOut } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(profile.displayName ?? '');

  useEffect(() => {
    setNameDraft(profile.displayName ?? '');
  }, [profile.displayName]);

  const displayName = profile.displayName?.trim() || 'you';
  const email = user?.email ?? null;

  const saveName = async () => {
    const next = nameDraft.trim();
    await updateProfile({ displayName: next.length > 0 ? next : null });
    setEditingName(false);
  };

  const toggleInterest = async (id: OnboardingInterest) => {
    const next = profile.interests.includes(id)
      ? profile.interests.filter((item) => item !== id)
      : [...profile.interests, id];
    await updateProfile({ interests: next });
  };

  return (
    <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: horizontalPadding,
            paddingBottom: tabBarInset,
            maxWidth: isTablet ? maxContentWidth : undefined,
            alignSelf: isTablet ? ('center' as const) : undefined,
            width: isTablet ? ('100%' as const) : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Handwriting variant="heading" accessibilityRole="header">
              profile
            </Handwriting>
            <Ionicons
              name="leaf-outline"
              size={18}
              color={colors.doodle}
              style={styles.leaf}
            />
          </View>
          <Text style={[styles.displayName, { color: colors.ink }]}>{displayName}</Text>
          {email ? <Text style={[styles.email, { color: colors.inkSoft }]}>{email}</Text> : null}
        </View>

        <PaperPanel tilt={tiltAt(0)} tape="top-left">
          <Handwriting variant="title" accessibilityRole="header">
            your blugo
          </Handwriting>

          {editingName ? (
            <View style={styles.nameEdit}>
              <PaperField
                label="what should I call you?"
                variant="handwritten"
                value={nameDraft}
                onChangeText={setNameDraft}
                autoCapitalize="words"
                accessibilityLabel="Display name"
              />
              <ButterButton label="save" accessibilityLabel="Save display name" onPress={saveName} />
            </View>
          ) : (
            <QuietLink
              label="change name"
              accessibilityLabel="Edit display name"
              onPress={() => setEditingName(true)}
            />
          )}

          <Text style={[styles.sectionLabel, { color: colors.inkSoft }]}>this is for</Text>
          <View style={styles.chips}>
            {interestOptions.map((option) => {
              const selected = profile.interests.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${option.label}, ${option.aside}`}
                  onPress={() => toggleInterest(option.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: selected ? colors.stickyButter : colors.stickyCream,
                      borderColor: selected ? colors.ink : colors.stickyEdge,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.chipLabel, { color: selected ? brand.cream : colors.ink }]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </PaperPanel>

        <PaperPanel tilt={tiltAt(2)} tape="top-right">
          <Handwriting variant="title" accessibilityRole="header">
            preferences
          </Handwriting>

          <PreferenceRow
            title="Context-aware"
            value={preferences.reminders.preferContextual}
            onValueChange={(next) =>
              updatePreferences({
                reminders: { ...preferences.reminders, preferContextual: next },
              })
            }
          />
          <PreferenceRow
            title="Routines"
            value={preferences.reminders.routineRemindersEnabled}
            onValueChange={(next) =>
              updatePreferences({
                reminders: { ...preferences.reminders, routineRemindersEnabled: next },
              })
            }
          />
          <PreferenceRow
            title="Location reminders"
            value={preferences.reminders.locationRemindersEnabled}
            onValueChange={async (next) => {
              if (next) {
                await deviceLocationService.requestPermission();
                await appNotificationService.requestPermission();
              }
              await updatePreferences({
                reminders: { ...preferences.reminders, locationRemindersEnabled: next },
              });
            }}
          />
          <View style={[styles.row, { borderBottomColor: colors.line }]}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.ink }]}>Home</Text>
              <Text style={[styles.rowState, { color: colors.inkSoft }]}>
                {home?.latitude != null ? home.name : 'not set'}
              </Text>
            </View>
            <QuietLink
              label="set from here"
              accessibilityLabel="Set home from your current place"
              onPress={async () => {
                const permission = await deviceLocationService.requestPermission();
                if (permission !== 'granted') return;
                const here = await deviceLocationService.getCurrentPosition();
                if (!here) return;
                await setHome({
                  name: 'Home',
                  latitude: here.latitude,
                  longitude: here.longitude,
                });
              }}
            />
          </View>
          <PreferenceRow
            title="AI parsing"
            value={preferences.privacy.aiParsingEnabled}
            onValueChange={(next) =>
              updatePreferences({
                privacy: { ...preferences.privacy, aiParsingEnabled: next },
              })
            }
          />
        </PaperPanel>

        <PaperPanel tilt={tiltAt(1)}>
          <Handwriting variant="title" accessibilityRole="header">
            appearance
          </Handwriting>
          <PreferenceRow
            title="Dark mode"
            value={scheme === 'dark'}
            onValueChange={(next) => setAppearance(next ? 'dark' : 'light')}
          />
          <View style={[styles.row, { borderBottomColor: colors.line }]}>
            <View style={styles.rowCopy}>
              <Text style={[styles.rowTitle, { color: colors.ink }]}>Reduce motion</Text>
              <Text style={[styles.rowState, { color: colors.inkSoft }]}>
                {reduceMotion ? 'On' : 'Off'}
              </Text>
            </View>
          </View>
        </PaperPanel>

        <PaperPanel tilt={tiltAt(3)} tape="top-left">
          <Handwriting variant="title" accessibilityRole="header">
            account
          </Handwriting>
          {email ? (
            <Text style={[styles.email, { color: colors.ink }]}>{email}</Text>
          ) : null}
          <View style={styles.accountActions}>
            <QuietLink
              label="log out"
              accessibilityLabel="Log out of your account"
              onPress={signOut}
            />
          </View>
        </PaperPanel>

        {!preferences.hasCompletedOnboarding ? (
          <ButterButton
            label="finish setup"
            accessibilityLabel="Complete onboarding setup"
            onPress={() => router.push('/onboarding')}
          />
        ) : null}

        {__DEV__ ? (
          <View
            style={[
              styles.devSlip,
              { borderColor: colors.ink, backgroundColor: colors.paperWarm },
            ]}>
            <Text style={[styles.devLabel, { color: colors.inkSoft }]}>developer only</Text>
            <Text style={[styles.devCopy, { color: colors.ink }]}>
              clears local data on this device. not a user setting.
            </Text>
            <QuietLink
              label="reset onboarding"
              accessibilityLabel="Reset onboarding for development"
              onPress={resetAll}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

type PreferenceRowProps = {
  title: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
};

function PreferenceRow({ title, value, onValueChange }: PreferenceRowProps) {
  const colors = useScrapbookPalette();

  return (
    <View style={[styles.row, { borderBottomColor: colors.line }]}>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.rowState, { color: colors.inkSoft }]}>{value ? 'On' : 'Off'}</Text>
      </View>
      <ScrapbookSwitch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={`${title}. ${value ? 'On' : 'Off'}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
    width: '100%',
  },
  header: {
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaf: {
    marginTop: 2,
    transform: [{ rotate: '-10deg' }],
  },
  displayName: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '600',
    marginTop: 4,
  },
  email: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    marginTop: 16,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    transform: [{ rotate: '-0.8deg' }],
  },
  chipLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
  },
  pressed: {
    opacity: 0.75,
  },
  nameEdit: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    fontWeight: '500',
  },
  rowState: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  accountActions: {
    marginTop: 8,
  },
  devSlip: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    transform: [{ rotate: '0.5deg' }],
  },
  devLabel: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  devCopy: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.fine.fontSize,
    lineHeight: readableType.fine.lineHeight,
    marginBottom: 4,
  },
});
