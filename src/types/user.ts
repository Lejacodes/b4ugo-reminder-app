import type { OnboardingInterest } from './onboarding';

/**
 * App-owned data about a person, kept deliberately separate from their
 * authentication record.
 *
 * `userId` is the only link between the two: it is the id issued by the auth
 * provider, and it is what a backend row would be keyed on and authorised
 * against. No email, password, or token ever lives in this object.
 */
export type UserProfile = {
  /** Auth provider user id this profile belongs to, or null when signed out. */
  userId: string | null;
  /** Display name chosen after sign-up. Editable later from Profile. */
  displayName: string | null;
  /** Loose interest tags from onboarding. Optional and skippable. */
  interests: OnboardingInterest[];
  /** ISO 8601 date when the profile was first created. */
  createdAt: string;
  /** ISO 8601 date of last profile update. */
  updatedAt: string;
};

export const defaultUserProfile = (userId: string | null = null): UserProfile => ({
  userId,
  displayName: null,
  interests: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
