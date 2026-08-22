export type { UserProfile } from './user';
export { defaultUserProfile } from './user';

export type { InterestOption, OnboardingInterest } from './onboarding';
export { interestOptions } from './onboarding';

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

export type { Place, CreatePlaceInput } from './place';
export type { Routine, CreateRoutineInput } from './routine';
