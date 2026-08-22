import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LittleGuy } from '@/components/little-guy/LittleGuy';
import { TripCard } from '@/components/trips';
import { ButterButton, Handwriting, PaperPanel, QuietLink } from '@/components/scrapbook';
import { readableType, TEXT_FONT, tiltAt } from '@/constants/scrapbook';
import { useDeskStyle, useScrapbookPalette } from '@/hooks/use-scrapbook-palette';
import { maxContentWidth, spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/use-responsive';
import { useTabBarInset } from '@/hooks/use-tab-bar-inset';
import { pixelsToParticles } from '@/lib/ai/pixels-to-particles';
import { tripHref } from '@/lib/trips/routes';
import { useLittleGuy } from '@/store/LittleGuyProvider';
import { useTrips } from '@/store/TripProvider';

import '@/components/opening-login/opening-login.css';

export default function TripsScreen() {
  const desk = useDeskStyle();
  const colors = useScrapbookPalette();
  const router = useRouter();
  const tabBarInset = useTabBarInset();
  const { horizontalPadding, isTablet } = useResponsive();
  const { upcomingTrips, pastTrips, templates, packingProgress, isLoading } = useTrips();
  const { mood, whisper, pixels } = useLittleGuy();
  const guySize = isTablet ? 64 : 52;

  return (
    <SafeAreaView className="opening-desk" style={desk} edges={['top']}>
      <View style={styles.desk}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={whisper ? `Little Guy. ${whisper}. Open chat.` : 'Little Guy. Open chat.'}
        onPress={() => router.push('/little-guy')}
        style={({ pressed }) => [styles.corner, pressed && styles.pressed]}>
        <LittleGuy mood={mood} size={guySize} floating particles={pixelsToParticles(pixels)} />
      </Pressable>
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
        showsVerticalScrollIndicator={false}>
        <Handwriting variant="heading" accessibilityRole="header">
          trips
        </Handwriting>

        {isLoading ? (
          <Text style={[styles.meta, { color: colors.inkSoft }]}>opening…</Text>
        ) : upcomingTrips.length === 0 ? (
          <PaperPanel tilt={tiltAt(1)} tape="top-left">
            <Text style={[styles.meta, { color: colors.inkSoft }]}>nothing planned</Text>
          </PaperPanel>
        ) : (
          <View style={styles.section}>
            <Handwriting variant="title">upcoming</Handwriting>
            {upcomingTrips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                tiltIndex={index}
                progress={packingProgress(trip.id)}
                onPress={() => router.push(tripHref(`/trip/${trip.id}`))}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Handwriting variant="title">templates</Handwriting>
          {templates.length === 0 ? (
            <Text style={[styles.meta, { color: colors.inkSoft }]}>none yet</Text>
          ) : (
            templates.slice(0, 3).map((template) => (
              <Text key={template.id} style={[styles.templateLine, { color: colors.ink }]}>
                {template.name}
                <Text style={[styles.meta, { color: colors.inkSoft }]}> · {template.items.length} items</Text>
              </Text>
            ))
          )}
          <QuietLink
            label="see all templates"
            accessibilityLabel="Open packing templates"
            onPress={() => router.push(tripHref('/trip/templates'))}
          />
        </View>

        {pastTrips.length > 0 ? (
          <View style={styles.section}>
            <Handwriting variant="title">past</Handwriting>
            {pastTrips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                tiltIndex={index + 2}
                progress={packingProgress(trip.id)}
                onPress={() => router.push(tripHref(`/trip/${trip.id}`))}
              />
            ))}
          </View>
        ) : null}

        <View style={styles.action}>
          <ButterButton
            label="+ plan a trip"
            accessibilityLabel="Plan a trip"
            onPress={() => router.push(tripHref('/trip/new'))}
          />
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  desk: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: spacing.md,
    gap: spacing.lg,
    width: '100%',
  },
  section: {
    gap: spacing.sm,
  },
  meta: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.meta.fontSize,
    lineHeight: readableType.meta.lineHeight,
  },
  templateLine: {
    fontFamily: TEXT_FONT,
    fontSize: readableType.item.fontSize,
    lineHeight: readableType.item.lineHeight,
    paddingVertical: 4,
  },
  action: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  corner: {
    position: 'absolute',
    top: 4,
    right: 8,
    zIndex: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
