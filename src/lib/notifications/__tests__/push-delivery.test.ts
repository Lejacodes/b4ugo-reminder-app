import { authorizedScheduler, ticketOutcome } from '../push-delivery';

describe('push delivery acceptance', () => {
  it('requires a valid individual ticket before recording acceptance', () => {
    expect(ticketOutcome(undefined).state).toBe('uncertain');
    expect(ticketOutcome({ status: 'ok' }).state).toBe('uncertain');
    expect(ticketOutcome({ status: 'ok', id: 'ticket-1' })).toEqual({ state: 'accepted', ticketId: 'ticket-1', invalidToken: false });
  });
  it('treats HTTP-200 ticket errors as failures and removes invalid tokens only', () => {
    expect(ticketOutcome({ status: 'error', details: { error: 'DeviceNotRegistered' } })).toEqual({ state: 'failed', error: 'DeviceNotRegistered', invalidToken: true });
    expect(ticketOutcome({ status: 'error', details: { error: 'MessageRateExceeded' } }).invalidToken).toBe(false);
  });
  it('rejects missing/wrong scheduler authorization and non-POST methods', () => {
    const secret = 'x'.repeat(32);
    expect(authorizedScheduler('POST', secret, secret)).toBe(true);
    expect(authorizedScheduler('GET', secret, secret)).toBe(false);
    expect(authorizedScheduler('POST', null, secret)).toBe(false);
    expect(authorizedScheduler('POST', 'wrong', secret)).toBe(false);
    expect(authorizedScheduler('POST', null, undefined)).toBe(false);
  });
});
