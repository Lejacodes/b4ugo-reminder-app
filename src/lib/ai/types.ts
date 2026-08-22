import type { PackingSuggestion } from '@/types/trip';

export type AIToolName =
  | 'createReminder'
  | 'updateReminder'
  | 'deleteReminder'
  | 'completeReminder'
  | 'createSavedPlace'
  | 'updateSavedPlace'
  | 'deleteSavedPlace'
  | 'createTrip'
  | 'updateTrip'
  | 'getTrip'
  | 'getUpcomingTrips'
  | 'getPackingList'
  | 'addPackingItem'
  | 'removePackingItem'
  | 'suggestPacking'
  | 'getPersonalNecessities'
  | 'addPersonalNecessity'
  | 'addIntention'
  | 'getTodayContext'
  | 'getUpcomingContext'
  | 'getWeather';

export type AIToolCall = {
  id?: string;
  name: AIToolName;
  args: Record<string, unknown>;
};

export type AIMessageRole = 'user' | 'assistant' | 'tool';

export type AIMessage = {
  role: AIMessageRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: AIToolCall[];
};

export type AIToolSchema = {
  name: AIToolName;
  description: string;
  parameters: Record<string, unknown>;
};

export type AIRequest = {
  messages: AIMessage[];
  context: AIContextSnapshot;
  tools?: AIToolSchema[];
};

export type AIResponse = {
  message: string;
  toolCalls: AIToolCall[];
  unavailable?: boolean;
};

export type CompactReminder = {
  id: string;
  title: string;
  category: string;
  status: string;
  place: string | null;
  dueAt: string | null;
};

export type CompactTrip = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  durationDays: number | null;
  activity: string | null;
  packed: number;
  total: number;
};

export type CompactPlace = {
  id: string;
  name: string;
  type: string;
};

export type CompactIntention = {
  id: string;
  tripId: string;
  title: string;
  type: string;
  placeName: string | null;
};

export type CompactWeather = {
  summary: string;
  rainLikely: boolean;
  temperatureC: number | null;
};

export type AIContextSnapshot = {
  today: string;
  reminders: CompactReminder[];
  necessities: string[];
  trips: CompactTrip[];
  places: CompactPlace[];
  intentions: CompactIntention[];
  weather: CompactWeather | null;
  activeDestination: string | null;
};

export type ValidatedTool =
  | { ok: true; name: AIToolName; args: Record<string, unknown> }
  | { ok: false; reason: 'ambiguous' | 'invalid' | 'destructive' | 'protected'; message: string };

export type LittleGuyMood =
  | 'idle'
  | 'happy'
  | 'thinking'
  | 'excited'
  | 'sleepy'
  | 'surprised'
  | 'proud'
  | 'remembering';

export type ConstellationKind = 'reminder' | 'buy' | 'trip' | 'task' | 'important';

export type ConstellationPixel = {
  id: string;
  kind: ConstellationKind;
  label: string;
};

export type PackingAdvice = {
  suggestions: PackingSuggestion[];
};
