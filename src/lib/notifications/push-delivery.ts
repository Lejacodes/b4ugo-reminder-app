export type PushTicket = { status: 'ok' | 'error'; id?: string; details?: { error?: string } };
export type PushOutcome = { state: 'accepted' | 'failed' | 'uncertain'; ticketId?: string; error?: string; invalidToken: boolean };

/** HTTP success alone never proves Expo accepted an individual notification. */
export function ticketOutcome(ticket: PushTicket | undefined): PushOutcome {
  if (ticket?.status === 'ok' && typeof ticket.id === 'string' && ticket.id.length > 0) {
    return { state: 'accepted', ticketId: ticket.id, invalidToken: false };
  }
  if (ticket?.status === 'error') {
    const error = ticket.details?.error ?? 'ExpoRejected';
    return { state: 'failed', error, invalidToken: error === 'DeviceNotRegistered' };
  }
  return { state: 'uncertain', error: 'MissingExpoTicket', invalidToken: false };
}

export function authorizedScheduler(method: string, supplied: string | null, secret: string | undefined): boolean {
  return method === 'POST' && Boolean(secret && secret.length >= 32 && supplied === secret);
}
