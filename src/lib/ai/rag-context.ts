import type { AIContextSnapshot } from './types';

/**
 * Grounded memory block injected into every model call.
 * The model may only treat listed items as real; everything else requires a read tool first.
 */
export function formatContextForModel(context: AIContextSnapshot): string {
  const lines: string[] = [
    '=== B4UGO MEMORY (ground truth — never invent items not listed here) ===',
    `Today: ${context.today}`,
    '',
  ];

  if (context.reminders.length) {
    lines.push('OPEN REMINDERS (use id for update/complete/delete):');
    for (const item of context.reminders) {
      lines.push(
        `- ${item.id} | ${item.title} | category:${item.category}${item.dueAt ? ` | due:${item.dueAt}` : ''}${item.place ? ` | @${item.place}` : ''}`,
      );
    }
    lines.push('');
  } else {
    lines.push('OPEN REMINDERS: none');
    lines.push('');
  }

  if (context.necessities.length) {
    lines.push(`PERSONAL NECESSITIES: ${context.necessities.join(', ')}`);
    lines.push('');
  }

  if (context.trips.length) {
    lines.push('UPCOMING TRIPS (use id for trip/packing actions):');
    for (const trip of context.trips) {
      lines.push(
        `- ${trip.id} | ${trip.title} → ${trip.destination}${trip.startDate ? ` | ${trip.startDate}${trip.endDate ? `–${trip.endDate}` : ''}` : ''} | packing ${trip.packed}/${trip.total}`,
      );
    }
    lines.push('');
  } else {
    lines.push('UPCOMING TRIPS: none');
    lines.push('');
  }

  if (context.packing.length) {
    lines.push('PACKING ITEMS (use id with togglePackingItem / removePackingItem):');
    for (const item of context.packing) {
      lines.push(`- ${item.id} | trip:${item.tripId} | ${item.title} | ${item.checked ? 'packed' : 'open'}`);
    }
    lines.push('');
  }

  if (context.places.length) {
    lines.push('SAVED PLACES:');
    for (const place of context.places) {
      lines.push(`- ${place.id} | ${place.name}`);
    }
    lines.push('');
  }

  if (context.intentions.length) {
    lines.push('TRIP PLANS / INTENTIONS:');
    for (const item of context.intentions) {
      lines.push(`- ${item.id} | trip:${item.tripId} | ${item.title}${item.placeName ? ` @${item.placeName}` : ''}`);
    }
    lines.push('');
  }

  if (context.activeDestination) {
    lines.push(`ACTIVE DESTINATION: ${context.activeDestination}`);
    lines.push('');
  }

  lines.push(
    'RULES: If the user asks what they have, quote only from this snapshot or call a read tool.',
    'If they ask to save, change, complete, check off, or delete — you MUST call the matching tool. Never say you cannot do something the tools support.',
    'Never invent ids, titles, dates, or items.',
  );

  return lines.join('\n');
}
