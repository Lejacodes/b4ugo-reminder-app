import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { weatherInjections } from '@/lib/context/weather-injections';
import type { WeatherSnapshot } from '@/lib/engines/contracts';
import { weatherService } from '@/lib/engines';
import { DEFAULT_HOME_RADIUS_M, isWithinRadius } from '@/lib/geo/distance';
import { planClearChecked } from '@/lib/home/clear-checked';
import { buildContextStatus } from '@/lib/home/context-status';
import { packingItemsForHomeBoard } from '@/lib/home/departing-trips';
import { buildDepartureBoard, type DepartureBoardItem } from '@/lib/home/departure-board';
import type { DepartureSession } from '@/lib/home/departure-session';
import { groupErrandsByPlace } from '@/lib/home/group-errands';
import { deviceLocationService } from '@/lib/location/device-location';
import { todayIso } from '@/lib/trips/dates';
import { exportWidgetData } from '@/lib/widget/export-widget-data';
import { useAuth } from '@/store/AuthProvider';
import { usePlaces } from '@/store/PlaceProvider';
import { useReminders } from '@/store/ReminderProvider';
import { useTrips } from '@/store/TripProvider';

export function useHomeBoard() {
  const reminders = useReminders();
  const trips = useTrips();
  const { user } = useAuth();
  const { home } = usePlaces();
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [atHome, setAtHome] = useState(true);
  const session = reminders.departureSession;
  const persistSession = reminders.persistDepartureSession;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function refresh() {
        const position = await deviceLocationService.getCurrentPosition();
        if (cancelled) return;

        const homeCoords =
          home?.latitude != null && home.longitude != null
            ? { latitude: home.latitude, longitude: home.longitude }
            : null;
        if (position && homeCoords) {
          setAtHome(isWithinRadius(position, homeCoords, DEFAULT_HOME_RADIUS_M));
        } else {
          setAtHome(!reminders.context);
        }

        const contextCoords =
          reminders.context?.latitude != null && reminders.context.longitude != null
            ? { latitude: reminders.context.latitude, longitude: reminders.context.longitude }
            : null;
        const query = position ?? homeCoords ?? contextCoords;
        const snapshot = query ? await weatherService.getSnapshot(query) : null;
        if (!cancelled) setWeather(snapshot);
      }

      void refresh();
      return () => {
        cancelled = true;
      };
    }, [home?.latitude, home?.longitude, reminders.context]),
  );

  const tripReminders = useMemo(() => {
    if (!reminders.context) return [];
    const contextId = reminders.context.id;
    return reminders.reminders.filter(
      (item) => item.category === 'beforeUgo' && item.contextId === contextId,
    );
  }, [reminders.context, reminders.reminders]);

  const weatherItems = useMemo(() => weatherInjections(weather), [weather]);

  const packingItems = useMemo(
    () => packingItemsForHomeBoard(trips.trips, trips.packingItems, todayIso()),
    [trips.packingItems, trips.trips],
  );

  const board = useMemo(
    () =>
      buildDepartureBoard({
        context: reminders.context,
        tripReminders,
        necessities: reminders.personalNecessities,
        weatherItems,
        sessionChecks: session.checks,
        dismissedWeather: session.dismissed,
        cleared: session.cleared,
        packingItems,
      }),
    [
      packingItems,
      reminders.context,
      reminders.personalNecessities,
      session.checks,
      session.cleared,
      session.dismissed,
      tripReminders,
      weatherItems,
    ],
  );

  useEffect(() => {
    void exportWidgetData(board, user?.id ?? null);
  }, [board, user?.id]);

  const errandGroups = useMemo(
    () =>
      groupErrandsByPlace(
        reminders.onTheWayBackOpen.map((item) => ({
          id: item.id,
          title: item.title,
          placeName: item.location?.placeName ?? null,
        })),
      ),
    [reminders.onTheWayBackOpen],
  );

  const statusLine = useMemo(
    () =>
      buildContextStatus({
        now: new Date(),
        destination: reminders.context?.destination ?? null,
        purpose: reminders.context?.purpose,
        weather,
        atHome,
      }),
    [atHome, reminders.context, weather],
  );

  const toggleBoardItem = useCallback(
    async (id: string) => {
      const item = board.find((row) => row.id === id);
      if (!item) return;

      if (item.persistKind === 'packing' && item.packingItemId) {
        await trips.togglePackingItem(item.packingItemId);
        return;
      }

      if (item.persistKind === 'reminder' && item.reminderId) {
        await reminders.toggleReminder(item.reminderId);
        if (item.kind === 'weather' && item.checked && item.weatherId) {
          const next: DepartureSession = {
            ...session,
            dismissed: session.dismissed.includes(item.weatherId)
              ? session.dismissed
              : [...session.dismissed, item.weatherId],
          };
          await persistSession(next);
        }
        return;
      }

      if (item.kind === 'weather' && item.checked && item.weatherId) {
        const next: DepartureSession = {
          ...session,
          checks: { ...session.checks, [item.id]: false },
          dismissed: session.dismissed.includes(item.weatherId)
            ? session.dismissed
            : [...session.dismissed, item.weatherId],
        };
        await persistSession(next);
        return;
      }

      await persistSession({
        ...session,
        checks: { ...session.checks, [item.id]: !item.checked },
        dismissed:
          item.kind === 'weather' && item.weatherId
            ? session.dismissed.filter((value) => value !== item.weatherId)
            : session.dismissed,
        cleared: session.cleared.filter((value) => value !== item.id),
      });
    },
    [board, persistSession, reminders, session, trips],
  );

  const dismissWeatherItem = useCallback(
    async (item: DepartureBoardItem) => {
      if (item.kind !== 'weather' || !item.weatherId) return;
      await persistSession({
        ...session,
        checks: { ...session.checks, [item.id]: false },
        dismissed: session.dismissed.includes(item.weatherId)
          ? session.dismissed
          : [...session.dismissed, item.weatherId],
      });
    },
    [persistSession, session],
  );

  const deleteBoardItem = useCallback(
    async (id: string) => {
      const item = board.find((row) => row.id === id);
      if (!item) return;

      if (item.necessityId) {
        await reminders.deleteNecessity(item.necessityId);
        return;
      }
      if (item.packingItemId) {
        await trips.deletePackingItem(item.packingItemId);
        return;
      }
      if (item.kind === 'weather') {
        await dismissWeatherItem(item);
        return;
      }
      if (item.reminderId) {
        await reminders.deleteReminder(item.reminderId);
      }
    },
    [board, dismissWeatherItem, reminders, trips],
  );

  const clearCheckedBoard = useCallback(async () => {
    const plan = planClearChecked(board, session);
    await persistSession(plan.nextSession);
    await reminders.deleteReminders(plan.reminderIdsToDelete);
  }, [board, persistSession, reminders, session]);

  return {
    board,
    errandGroups,
    errandCount: reminders.onTheWayBackOpen.length,
    statusLine,
    context: reminders.context,
    weather,
    toggleBoardItem,
    dismissWeatherItem,
    deleteBoardItem,
    clearCheckedBoard,
    toggleReminder: reminders.toggleReminder,
    deleteReminder: reminders.deleteReminder,
    deleteReminders: reminders.deleteReminders,
    specificItems: reminders.specificItems,
  };
}
