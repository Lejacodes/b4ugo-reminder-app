/**
 * How and when B4UGO may notify the user.
 * Permission requests are deferred — these are preference intentions only.
 */
export type NotificationPreferences = {
  /** Whether the user wants reminders delivered as push notifications. */
  pushEnabled: boolean;
};

export const defaultNotificationPreferences = (): NotificationPreferences => ({
  pushEnabled: false,
});

/**
 * How reminders should behave for this user.
 */
export type ReminderPreferences = {
  /** Prefer context-based reminders over fixed-time reminders. */
  preferContextual: boolean;
  /** Allow location-based reminder triggers (requires future permission). */
  locationRemindersEnabled: boolean;
  /** Allow routine-based reminder triggers. */
  routineRemindersEnabled: boolean;
};

export const defaultReminderPreferences = (): ReminderPreferences => ({
  preferContextual: true,
  locationRemindersEnabled: false,
  routineRemindersEnabled: true,
});

/**
 * Privacy-related user choices.
 */
export type PrivacyPreferences = {
  /** Whether analytics may be collected (not implemented — default false). */
  analyticsEnabled: boolean;
  /** Whether AI-assisted reminder parsing is allowed (not implemented). */
  aiParsingEnabled: boolean;
};

export const defaultPrivacyPreferences = (): PrivacyPreferences => ({
  analyticsEnabled: false,
  aiParsingEnabled: false,
});

/**
 * Aggregated user preferences stored locally.
 */
export type AppearancePreference = 'light' | 'dark';

export type UserPreferences = {
  notifications: NotificationPreferences;
  reminders: ReminderPreferences;
  privacy: PrivacyPreferences;
  /** Explicit light/dark choice. Persisted with the rest of preferences. */
  appearance: AppearancePreference;
  /** Whether onboarding has been completed. */
  hasCompletedOnboarding: boolean;
};

export const defaultUserPreferences = (): UserPreferences => ({
  notifications: defaultNotificationPreferences(),
  reminders: defaultReminderPreferences(),
  privacy: defaultPrivacyPreferences(),
  appearance: 'light',
  hasCompletedOnboarding: false,
});
