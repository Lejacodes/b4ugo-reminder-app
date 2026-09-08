import { chatReply, isCasualTalk, looksLikeAction } from './conversation';
import { AI_AMBIGUOUS_MESSAGE, AI_GENTLE_HERE_MESSAGE } from './ai-prompts';
import type { AIProvider } from './ai-provider';
import { isGenericPlaceName } from './ai-tools';
import { parseDateRange, parseRelativeDay, parseRelativeDueAt } from './parse-when';
import { composeVerifiedReply, formatVerifiedMutation } from './tool-result';
import type { AIContextSnapshot, AIRequest, AIResponse, AIToolName, CompactPlace } from './types';

function findTrip(context: AIContextSnapshot, hint?: string | null) {
  if (!context.trips.length) return null;
  if (!hint) return context.trips[0];
  const needle = hint.toLowerCase();
  return (
    context.trips.find(
      (trip) =>
        trip.destination.toLowerCase().includes(needle) || trip.title.toLowerCase().includes(needle),
    ) ?? null
  );
}

function placeMatches(place: CompactPlace, needle: string): boolean {
  const hay = `${place.name} ${place.type}`.toLowerCase();
  return hay.includes(needle);
}

function resolveMentionedPlace(hint: string, context: AIContextSnapshot):
  | { status: 'named' | 'resolved'; name: string }
  | { status: 'ambiguous'; label: string } {
  const cleaned = hint.replace(/^[.!?]+|[.!?]+$/g, '').replace(/^the /i, '').trim();
  const generic = isGenericPlaceName(cleaned) || isGenericPlaceName(`the ${cleaned}`);
  if (!generic) return { status: 'named', name: cleaned };

  const needle = cleaned.toLowerCase();
  const matches = context.places.filter((place) => placeMatches(place, needle));
  if (matches.length === 1) return { status: 'resolved', name: matches[0].name };
  return { status: 'ambiguous', label: needle };
}

function whichPlaceMessage(label: string): string {
  return `which ${label} should i keep that for? ♡`;
}

function isLocalErrand(destination: string): boolean {
  const name = destination.replace(/^the /i, '').trim().toLowerCase();
  return (
    isGenericPlaceName(name) ||
    isGenericPlaceName(`the ${name}`) ||
    /^(store|shop|gym|work|office|home|school|pharmacy|bakery)$/i.test(name)
  );
}

export function interpretLocally(text: string, context: AIContextSnapshot): AIResponse {
  const raw = text.trim();
  const lower = raw.toLowerCase();

  const near =
    /(?:remind me to|don't forget to|dont forget to|can you remind me to) (.+?) (?:when i(?:['’]m| am) near|from|at) (?:the )?(.+)$/i.exec(
      raw,
    );
  if (near) {
    const placeHint = near[2].trim();
    const resolved = resolveMentionedPlace(placeHint, context);
    if (resolved.status === 'ambiguous') {
      return { message: whichPlaceMessage(resolved.label), toolCalls: [] };
    }
    return {
      message: `sure ♡ i'll remind you near ${resolved.name}.`,
      toolCalls: [
        {
          name: 'createReminder',
          args: { title: near[1].trim(), category: 'onTheWayBack', placeName: resolved.name },
        },
      ],
    };
  }

  if (/check\s*off\s+all\s+(?:my\s+)?(?:reminders?\s+and\s+pack(?:ing|ings)?|pack(?:ing|ings)?\s+and\s+reminders?)|(?:check\s*off|complete|mark)\s+all\s+(?:my\s+)?(?:reminders?\s+and\s+pack)/.test(lower)) {
    const trip = findTrip(context, null);
    return {
      message: '',
      toolCalls: [
        { name: 'completeAllReminders', args: {} },
        { name: 'toggleAllPackingItems', args: { tripId: trip?.id } },
      ],
    };
  }

  if (/check\s*off\s+all\s+(?:my\s+)?reminders?|complete\s+all\s+(?:my\s+)?reminders?|mark\s+all\s+(?:my\s+)?reminders?/.test(lower)) {
    return {
      message: '',
      toolCalls: [{ name: 'completeAllReminders', args: {} }],
    };
  }

  if (/clear checked|remove (?:the )?checked|delete (?:the )?checked/.test(lower)) {
    return {
      message: '',
      toolCalls: [{ name: 'completeAllReminders', args: {} }],
    };
  }

  if (
    /check\s*off\s+all\s+(?:my\s+)?pack(?:ing|ings)?|(?:i\s+)?packed\s+everything|mark\s+all\s+(?:my\s+)?pack(?:ing|ings)?/.test(
      lower,
    )
  ) {
    const trip = findTrip(context, null);
    return {
      message: 'marked everything packed ♡',
      toolCalls: [{ name: 'toggleAllPackingItems', args: { tripId: trip?.id } }],
    };
  }

  const remind = /(?:remind me to|don't forget to|dont forget to|can you remind me to|make a reminder to|make a reminder for|add a reminder to) (.+)$/i.exec(raw);
  if (remind) {
    const title = remind[1]
      .replace(/\s+(?:in|after)\s+\d+\s+(?:minutes?|hours?)\s*$/i, '')
      .replace(/\s+(tomorrow|today)\s*$/i, '')
      .trim();
    const due = parseRelativeDueAt(raw) ?? parseRelativeDay(raw);
    const when = /\bin \d+ (?:minutes?|hours?)\b/i.test(raw)
      ? 'soon'
      : /\btomorrow\b/i.test(raw)
        ? 'tomorrow'
        : due
          ? 'today'
          : '';
    return {
      message: when ? `sure ♡ i'll remind you ${when}.` : `sure ♡ i'll remember that.`,
      toolCalls: [{ name: 'createReminder', args: { title, category: 'specific', dueAt: due } }],
    };
  }

  const rememberTo = /^(?:please )?remember (?:to |that )(.+)$/i.exec(raw);
  if (rememberTo && !/today|what do i need/.test(lower)) {
    const title = rememberTo[1].replace(/\s+(tomorrow|today)\s*$/i, '').trim();
    const due = parseRelativeDay(raw);
    return {
      message: `i'll keep that ♡`,
      toolCalls: [{ name: 'createReminder', args: { title, category: 'specific', dueAt: due } }],
    };
  }

  const intention = /i want to (try|visit|do) (?:this |the )?(.+?)(?: in (.+))?$/i.exec(raw);
  if (intention) {
    const verb = intention[1].toLowerCase();
    const title = intention[2].trim();
    const placeName = intention[3]?.trim() ?? null;
    const trip = findTrip(context, placeName);
    const type = verb === 'try' ? 'food' : verb === 'visit' ? 'place' : 'activity';
    if (trip) {
      return {
        message: `saved for ${trip.title} ♡`,
        toolCalls: [{ name: 'addIntention', args: { title, type, tripId: trip.id, placeName } }],
      };
    }
    if (placeName) {
      const resolved = resolveMentionedPlace(placeName, context);
      if (resolved.status === 'ambiguous') {
        return { message: whichPlaceMessage(resolved.label), toolCalls: [] };
      }
    }
    return {
      message: placeName ? `i'll keep ${title} near ${placeName}.` : `i'll keep ${title}.`,
      toolCalls: [{ name: 'createSavedPlace', args: { name: placeName || title, label: title } }],
    };
  }

  const going = /i(?:['’]m| am) going to (.+)$/i.exec(raw);
  if (going) {
    const rest = going[1].trim();
    const range = parseDateRange(rest);
    const destination = rest
      .replace(/\s+([A-Za-z]+\s+\d{1,2}|\d{1,2}\s+[A-Za-z]+|\d{4}-\d{2}-\d{2}).*$/i, '')
      .trim();
    if (!destination) return { message: 'where are you going?', toolCalls: [] };
    if (isLocalErrand(destination) && !range) {
      return {
        message: 'is that a trip, or should i remind you when you are near there?',
        toolCalls: [],
      };
    }
    if (!range) {
      return { message: 'when are you going? i need dates before i make a trip.', toolCalls: [] };
    }
    return {
      message: `i'll plan ${destination} ♡`,
      toolCalls: [
        {
          name: 'createTrip',
          args: {
            title: destination,
            destination,
            startDate: range.startDate,
            endDate: range.endDate,
          },
        },
      ],
    };
  }

  if (/what should i pack|help me pack|pack for /.test(lower)) {
    const forPlace = /for (.+?)\??$/i.exec(raw);
    const hint = forPlace?.[1]?.replace(/[?.!]+$/g, '').trim() ?? null;
    const trip = findTrip(context, hint);
    if (!trip) return { message: 'i do not see a trip to pack for yet.', toolCalls: [] };
    return {
      message: `let me look at ${trip.destination}...`,
      toolCalls: [{ name: 'suggestPacking', args: { tripId: trip.id } }],
    };
  }

  if (/still missing|left to pack|haven't packed|packing list|missing for (?:my )?trip|am i missing/.test(lower)) {
    const trip = findTrip(context, null);
    if (!trip) return { message: 'no packing list yet.', toolCalls: [] };
    return {
      message: 'checking what is still open...',
      toolCalls: [{ name: 'getPackingList', args: { tripId: trip.id } }],
    };
  }

  if (/what do i need to remember|remember today|what do i need\??$/.test(lower)) {
    return { message: 'let me see...', toolCalls: [{ name: 'getTodayContext', args: {} }] };
  }

  if (/happening with (?:my )?trip|how's my trip|trip status|what(?:'s| is) my trip/.test(lower)) {
    return { message: 'looking at your trip...', toolCalls: [{ name: 'getUpcomingTrips', args: {} }] };
  }

  if (
    /what did i save|what have i saved|saved places|want to (try|visit|do)/.test(lower) &&
    !/i want to/.test(lower)
  ) {
    return { message: 'here is what i have nearby...', toolCalls: [{ name: 'getUpcomingContext', args: {} }] };
  }

  const done = /^(?:i )?(?:done|finished|completed|did) (.+)$/i.exec(raw);
  if (done) {
    return {
      message: 'nice ♡',
      toolCalls: [{ name: 'completeReminder', args: { title: done[1].trim() } }],
    };
  }

  const deleteReminder = /(?:delete|remove) (?:the )?reminder (?:for )?(.+)$/i.exec(raw);
  if (deleteReminder) {
    return {
      message: 'okay, i will remove it.',
      toolCalls: [{ name: 'deleteReminder', args: { title: deleteReminder[1].trim(), confirm: 'yes' } }],
    };
  }

  const packed = /(?:i )?(?:packed|brought) (.+)$/i.exec(raw);
  if (packed) {
    const trip = findTrip(context, null);
    return {
      message: 'marked ♡',
      toolCalls: [{ name: 'togglePackingItem', args: { title: packed[1].trim(), tripId: trip?.id } }],
    };
  }

  const chat = chatReply(raw, context);
  if (chat) return chat;

  if (looksLikeAction(raw) || /remember|save|buy|don't forget|dont forget/.test(lower)) {
    return { message: AI_AMBIGUOUS_MESSAGE, toolCalls: [] };
  }

  if (isCasualTalk(raw)) {
    return { message: '♡', toolCalls: [] };
  }

  return { message: AI_GENTLE_HERE_MESSAGE, toolCalls: [] };
}

function followUpFromTools(request: AIRequest): AIResponse | null {
  const tools = request.messages.filter((item) => item.role === 'tool');
  const lastAssistant = [...request.messages]
    .reverse()
    .find((item) => item.role === 'assistant' && (item.toolCalls?.length ?? 0) > 0);
  if (!tools.length || !lastAssistant) return null;

  const results = tools.map((item, index) => {
    let payload: unknown = item.content;
    try {
      payload = JSON.parse(item.content);
    } catch {
      payload = item.content;
    }
    const name = (item.name ?? lastAssistant.toolCalls?.[index]?.name ?? '') as AIToolName;
    return { name, payload };
  });

  return {
    message: composeVerifiedReply(lastAssistant.content, results, formatToolResult, AI_GENTLE_HERE_MESSAGE),
    toolCalls: [],
  };
}

export class FallbackAIProvider implements AIProvider {
  async complete(request: AIRequest): Promise<AIResponse> {
    const followUp = followUpFromTools(request);
    if (followUp) return followUp;
    const last = [...request.messages].reverse().find((item) => item.role === 'user');
    if (!last) return { message: "hey ♡ what's on your mind?", toolCalls: [] };
    return interpretLocally(last.content, request.context);
  }
}

export function formatToolResult(name: string, payload: unknown): string {
  const verified = formatVerifiedMutation(name, payload);
  if (verified !== null) return verified;
  if (name === 'createReminder' || name === 'createTrip' || name === 'addIntention' || name === 'createSavedPlace') {
    return '';
  }
  if (name === 'suggestPacking' && Array.isArray(payload)) {
    const lines = (payload as Array<{ title: string; reason?: string }>).slice(0, 8).map((item) =>
      item.reason ? `${item.title} — ${item.reason}` : item.title,
    );
    return lines.length ? `you might want:\n${lines.join('\n')}` : 'your list already looks complete.';
  }
  if (name === 'getPackingList' && payload && typeof payload === 'object') {
    const data = payload as { missing: string[]; packed: number; total: number };
    if (!data.total) return 'nothing on the packing list yet.';
    if (!data.missing.length) return 'everything on the list is packed. proud of you.';
    return `still open: ${data.missing.slice(0, 8).join(', ')}`;
  }
  if (name === 'getTodayContext' && Array.isArray(payload)) {
    const titles = (payload as Array<{ title: string }>).map((item) => item.title);
    if (!titles.length) return 'your constellation is looking pretty calm now.';
    if (titles.length === 1) return `you've got one little thing waiting today ♡\n${titles[0]}`;
    return `you've got a few little things waiting today ♡\n${titles.slice(0, 8).join(', ')}`;
  }
  if (name === 'getUpcomingTrips' && Array.isArray(payload)) {
    const trips = payload as Array<{
      title: string;
      destination: string;
      startDate: string | null;
      packed: number;
      total: number;
    }>;
    if (!trips.length) return 'no trips planned yet.';
    const trip = trips[0];
    const pack = trip.total ? `${trip.packed} / ${trip.total} packed` : 'no packing yet';
    return `${trip.title} — ${trip.destination}${trip.startDate ? `, ${trip.startDate}` : ''}. ${pack}.`;
  }
  if (name === 'getUpcomingContext' && payload && typeof payload === 'object') {
    const data = payload as {
      trips?: Array<{ title: string }>;
      places?: Array<{ name: string }>;
      intentions?: Array<{ title: string }>;
    };
    const kept = [
      ...(data.intentions ?? []).map((item) => item.title),
      ...(data.places ?? []).map((item) => item.name),
      ...(data.trips ?? []).map((item) => item.title),
    ].filter(Boolean);
    return kept.length ? `you've kept: ${kept.slice(0, 8).join(', ')}` : 'nothing saved yet.';
  }
  return '';
}
