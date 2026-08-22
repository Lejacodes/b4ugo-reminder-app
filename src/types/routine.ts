/**
 * A recurring personal routine that B4UGO can attach reminders to.
 * e.g. "Leaving for university", "Morning commute".
 */
export type Routine = {
  id: string;
  name: string;
  /** Human-readable description of when this routine occurs. */
  description: string | null;
  /** Whether this routine is actively monitored. */
  isActive: boolean;
  createdAt: string;
};

export type CreateRoutineInput = Pick<Routine, 'name' | 'description'>;
