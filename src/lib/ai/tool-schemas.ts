import type { AIToolSchema } from './types';

/**
 * Function-calling descriptions for the LLM.
 * The model may request these. The app validates and executes them.
 */
export const AI_TOOL_SCHEMAS: AIToolSchema[] = [
  {
    name: 'createReminder',
    description:
      'Save a reminder the user clearly asked to remember. Do not use for feelings, venting, or small talk. If a place is vague (supermarket, store), do not call this — ask which place first.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'What to remember' },
        category: {
          type: 'string',
          enum: ['specific', 'beforeUgo', 'onTheWayBack'],
          description: 'specific for dated/general, beforeUgo before leaving, onTheWayBack near a place',
        },
        dueAt: { type: 'string', description: 'ISO datetime or YYYY-MM-DD from user words. Never invent.' },
        placeName: {
          type: 'string',
          description: 'Exact saved place name. Never a generic word like supermarket.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateReminder',
    description: 'Change an existing reminder. Requires a real reminder id from context. Never guess an id.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        dueAt: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'completeAllReminders',
    description: 'Mark every open reminder done when the user says they finished everything or wants all reminders checked off.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'completeReminder',
    description: 'Mark one reminder done. Use id or title from B4UGO MEMORY.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
      },
    },
  },
  {
    name: 'deleteReminder',
    description: 'Delete a reminder only when the user is explicit. Requires id and confirm="yes". Never guess.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        confirm: { type: 'string', description: 'Must be yes' },
      },
      required: ['id', 'confirm'],
    },
  },
  {
    name: 'createSavedPlace',
    description: 'Save a specific named place. Do not use for generic place words.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        label: { type: 'string' },
      },
      required: ['name'],
    },
  },
  {
    name: 'updateSavedPlace',
    description: 'Update a saved place. Requires a real place id.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        label: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteSavedPlace',
    description: 'Delete a saved place only when explicit. Requires id and confirm="yes".',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        confirm: { type: 'string' },
      },
      required: ['id', 'confirm'],
    },
  },
  {
    name: 'createTrip',
    description:
      'Create a trip only when destination AND dates are known. If dates are missing, ask. Never invent dates or hotels.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        destination: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        activity: { type: 'string' },
        accommodation: { type: 'string' },
        transportation: { type: 'string' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'updateTrip',
    description: 'Update an existing trip dates, destination, or title. Use id from context, or destination/title hint.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        destination: { type: 'string' },
        title: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
      },
    },
  },
  {
    name: 'deleteTrip',
    description: 'Delete a trip only when the user is explicit. Requires id or destination and confirm="yes".',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        destination: { type: 'string' },
        confirm: { type: 'string', description: 'Must be yes' },
      },
      required: ['confirm'],
    },
  },
  {
    name: 'getTrip',
    description: 'Look up one trip by id or destination from current context.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        destination: { type: 'string' },
      },
    },
  },
  {
    name: 'getUpcomingTrips',
    description: 'Read the user\'s actual upcoming trips. Use when they ask what is happening with a trip.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getPackingList',
    description: 'Read the actual packing list for a trip. Use for "what am I missing" / packing status. Never mark items packed.',
    parameters: {
      type: 'object',
      properties: { tripId: { type: 'string' } },
    },
  },
  {
    name: 'addPackingItem',
    description: 'Add one packing item the user chose. Never add personal necessities. Never mark packed.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        tripId: { type: 'string' },
        category: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'removePackingItem',
    description: 'Remove a packing item only when explicit. Use id or title from context. Requires confirm="yes".',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        tripId: { type: 'string' },
        confirm: { type: 'string' },
      },
      required: ['confirm'],
    },
  },
  {
    name: 'togglePackingItem',
    description: 'Mark one packing item packed or unpacked. Use id or title from B4UGO MEMORY.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        tripId: { type: 'string' },
      },
    },
  },
  {
    name: 'toggleAllPackingItems',
    description:
      'Mark all open packing items packed when the user says they packed everything or wants all packing checked off. Optional tripId.',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        destination: { type: 'string' },
      },
    },
  },
  {
    name: 'suggestPacking',
    description:
      'Suggest packing items with reasons. Suggestions only — do not add them, do not mark packed, do not change necessities.',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string' },
        destination: { type: 'string' },
      },
    },
  },
  {
    name: 'getPersonalNecessities',
    description: 'Read lasting personal necessities (keys, wallet, charger). Read-only.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'addPersonalNecessity',
    description: 'Add a lasting necessity only when the user asks to keep one generally, not as trip packing.',
    parameters: {
      type: 'object',
      properties: { title: { type: 'string' } },
      required: ['title'],
    },
  },
  {
    name: 'addIntention',
    description:
      'Save something the user wants to try, visit, or do on a trip. Use a real trip id when one matches. If the place is generic, ask first.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['food', 'place', 'activity', 'other'] },
        tripId: { type: 'string' },
        placeName: { type: 'string' },
        note: { type: 'string' },
      },
      required: ['title'],
    },
  },
  {
    name: 'updateIntention',
    description: 'Update a saved trip intention/plan. Use id or title from context.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['food', 'place', 'activity', 'other'] },
        placeName: { type: 'string' },
        note: { type: 'string' },
      },
    },
  },
  {
    name: 'deleteIntention',
    description: 'Delete a trip intention only when explicit. Requires confirm="yes".',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        confirm: { type: 'string' },
      },
      required: ['confirm'],
    },
  },
  {
    name: 'getTodayContext',
    description: 'Read actual open reminders / things to remember today. Use instead of inventing a list.',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getUpcomingContext',
    description: 'Read saved places, trip plans, and intentions. Use for "what did I save?"',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'getWeather',
    description: 'Read the last known compact weather snapshot. Do not invent weather.',
    parameters: { type: 'object', properties: {} },
  },
];
