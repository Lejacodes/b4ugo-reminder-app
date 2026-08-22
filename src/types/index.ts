export type { UserProfile } from './user';
export { defaultUserProfile } from './user';

export type { InterestOption, OnboardingInterest } from './onboarding';
export { interestOptions } from './onboarding';

export type { BeforeUgoItem, HomeJourneyData, OnTheWayBackItem, TodaySummary } from './home';

export type {
  BeforeUgoDetailData,
  BeforeUgoListItem,
  BeforeUgoSource,
} from './before-ugo';

export type {
  NotificationPreferences,
  ReminderPreferences,
  PrivacyPreferences,
  UserPreferences,
} from './preferences';
export {
  defaultNotificationPreferences,
  defaultReminderPreferences,
  defaultPrivacyPreferences,
  defaultUserPreferences,
} from './preferences';

export type {
  BeforeUgoContext,
  BeforeUgoLayer,
  CreateReminderInput,
  PersonalNecessity,
  Reminder,
  ReminderCategory,
  ReminderLocation,
  ReminderSource,
  ReminderStatus,
} from './reminder';
export type { Place, CreatePlaceInput } from './place';
export type { Routine, CreateRoutineInput } from './routine';
