/**
 * "Getting to know you" answers.
 *
 * Broad, low-stakes tags only. Nothing here should narrow down who someone is,
 * where they live, or anything they'd mind us holding — onboarding asks what
 * BLUGO is for, not who the user is.
 */
export type OnboardingInterest =
  | 'errands'
  | 'study'
  | 'work'
  | 'home'
  | 'health'
  | 'travel'
  | 'making'
  | 'people';

export type InterestOption = {
  id: OnboardingInterest;
  label: string;
  /** Short aside written under the label on the sticky note. */
  aside: string;
};

export const interestOptions: InterestOption[] = [
  { id: 'errands', label: 'errands', aside: 'milk, post, bits' },
  { id: 'study', label: 'study', aside: 'notes & deadlines' },
  { id: 'work', label: 'work', aside: 'the serious pile' },
  { id: 'home', label: 'home', aside: 'plants, bins, laundry' },
  { id: 'health', label: 'health', aside: 'water, meds, walks' },
  { id: 'travel', label: 'travel', aside: 'packing, tickets' },
  { id: 'making', label: 'making', aside: 'projects & ideas' },
  { id: 'people', label: 'people', aside: 'birthdays, replies' },
];
