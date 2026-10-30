import { readCollection, readSingleton, writeCollection, writeSingleton } from '@/lib/sync/local';
import type { BeforeUgoContext, PersonalNecessity, Reminder } from '@/types/reminder';

export const loadReminders = (userId: string) => readCollection<Reminder>(userId, 'reminders');
export const saveReminders = (userId: string, value: Reminder[], before?: Reminder[]) => writeCollection(userId, 'reminders', value, before);
export const loadNecessities = (userId: string) => readCollection<PersonalNecessity>(userId, 'necessities');
export const saveNecessities = (userId: string, value: PersonalNecessity[], before?: PersonalNecessity[]) => writeCollection(userId, 'necessities', value, before);
export const loadContext = (userId: string) => readSingleton<BeforeUgoContext>(userId, 'context');
export const saveContext = (userId: string, value: BeforeUgoContext | null) => writeSingleton(userId, 'context', value);
