import type { AIContextSnapshot, AIResponse } from './types';

const GREETING =
  /^(hi+|hey+|hello+|hiya|heya|yo|good (morning|afternoon|evening))(\s+little guy)?[\s!.~*♡❤♥✨]*$/i;
const THANKS = /^(thanks|thank you|thx|ty|thank u)[\s!.~*♡❤♥]*$/i;
const VENTING = /\b(ugh+|argh+|so much to do|too much going on|i have so much|swamped)\b/i;
const BYE = /^(bye+|goodbye|good ?night|night|see you|see ya)[\s!.~*♡❤♥]*$/i;
const HOW_ARE_YOU = /how are you|how(?:'s| is| r) it going|how r u|you good\??$/i;
const WHAT_DOING = /what(?:'s| are| r) you doing|what are you up to/i;
const WHO_ARE_YOU = /who are you|what are you\??$|what(?:'s| is) your name/i;
const WHAT_CAN_YOU = /what can you do|how do you work|help me\??$/i;
const LOVE = /you(?:'re| are) (cute|sweet|kind|nice)|i love you|good (job|boy|work)/i;
const ACK = /^(ok|okay|k|cool|nice|alright|got it|yes|yeah|yep|yup|no|nah|mm+|mhm)[\s!.]*$/i;
const HEARTS = /^[♡❤♥✨\s.]+$/;
const FEELING =
  /^i(?:['’]m| am) (tired|sleepy|sad|happy|stressed|ok|okay|good|fine|bored|lonely|anxious|overwhelmed|busy|sick)(?:\s+today)?[\s!.]*$/i;

const ACTION_HINT =
  /\b(remind|remember|don't forget|dont forget|save this|pack|packing|trip|going to|want to try|want to visit|want to do|add |delete |remove |buy |pick up)\b/i;

export function looksLikeAction(text: string): boolean {
  return ACTION_HINT.test(text.trim());
}

export function isCasualTalk(text: string): boolean {
  const raw = text.trim();
  if (!raw) return false;
  if (looksLikeAction(raw)) return false;
  return (
    GREETING.test(raw) ||
    THANKS.test(raw) ||
    BYE.test(raw) ||
    HOW_ARE_YOU.test(raw) ||
    WHAT_DOING.test(raw) ||
    WHO_ARE_YOU.test(raw) ||
    WHAT_CAN_YOU.test(raw) ||
    LOVE.test(raw) ||
    ACK.test(raw) ||
    HEARTS.test(raw) ||
    FEELING.test(raw) ||
    VENTING.test(raw)
  );
}

function constellationBusy(context: AIContextSnapshot): boolean {
  return context.reminders.length + context.trips.length > 0;
}

function echoGreeting(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('little guy')) return 'hiiii ♡';
  const hi = lower.match(/h+i+/);
  if (hi && !/hello/.test(lower)) return `${hi[0]} ♡`;
  if (lower.includes('hey')) return 'hey ♡';
  if (lower.includes('hello')) return 'hello ♡';
  if (lower.includes('morning')) return 'good morning ♡';
  if (lower.includes('evening')) return 'good evening ♡';
  return 'hey ♡';
}

/**
 * Soft companion replies. Never creates tools.
 */
export function chatReply(text: string, context: AIContextSnapshot): AIResponse | null {
  const raw = text.trim();
  if (!raw || looksLikeAction(raw)) return null;

  if (GREETING.test(raw)) {
    return { message: echoGreeting(raw), toolCalls: [] };
  }

  if (THANKS.test(raw)) {
    return { message: 'always ♡', toolCalls: [] };
  }

  if (VENTING.test(raw)) {
    return { message: "that's a lot. i can hold a couple of things if you want.", toolCalls: [] };
  }

  if (BYE.test(raw)) {
    return { message: "i'll be right here ♡", toolCalls: [] };
  }

  if (HOW_ARE_YOU.test(raw)) {
    return {
      message: constellationBusy(context)
        ? "i'm good ♡ just keeping your little constellation tidy."
        : "quiet today. a little sleepy ♡",
      toolCalls: [],
    };
  }

  if (WHAT_DOING.test(raw)) {
    return { message: 'keeping an eye on your little plans ✨', toolCalls: [] };
  }

  if (WHO_ARE_YOU.test(raw)) {
    return { message: "i'm little guy. i keep the small things so you don't have to ♡", toolCalls: [] };
  }

  if (WHAT_CAN_YOU.test(raw)) {
    return {
      message: 'i can remember things, keep trip plans, and help you pack. or we can just talk.',
      toolCalls: [],
    };
  }

  if (LOVE.test(raw)) {
    return { message: '♡', toolCalls: [] };
  }

  if (ACK.test(raw) || HEARTS.test(raw)) {
    return { message: '♡', toolCalls: [] };
  }

  const feeling = FEELING.exec(raw);
  if (feeling) {
    const mood = feeling[1].toLowerCase();
    if (mood === 'tired' || mood === 'sleepy') {
      return { message: "then rest a little. i'll keep watch ♡", toolCalls: [] };
    }
    if (mood === 'stressed' || mood === 'anxious' || mood === 'overwhelmed') {
      return { message: "i've got your little things. you don't have to hold them all.", toolCalls: [] };
    }
    if (mood === 'sad' || mood === 'lonely') {
      return { message: "i'm here. we can just sit for a bit ♡", toolCalls: [] };
    }
    if (mood === 'happy' || mood === 'good' || mood === 'fine' || mood === 'ok' || mood === 'okay') {
      return { message: "that's nice to hear ♡", toolCalls: [] };
    }
    return { message: "i'm here with you ♡", toolCalls: [] };
  }

  return null;
}
