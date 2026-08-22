/**
 * Before U Go detail — things to take before leaving.
 *
 * Shaped so a reminder/intelligence engine can replace the mock later.
 * Nothing here is weather, location, or AI — just the data the UI needs.
 */

export type BeforeUgoSource = 'always' | 'tripSpecific' | 'suggestion';

export type BeforeUgoListItem = {
  id: string;
  title: string;
  checked: boolean;
  /**
   * Why this is on the list. Required for suggestions; optional elsewhere.
   * Written for the user, not as a system log.
   */
  reason?: string;
  source: BeforeUgoSource;
};

export type BeforeUgoDetailData = {
  /** Short context for the trip section, e.g. "going to university". */
  tripLabel: string;
  always: BeforeUgoListItem[];
  tripSpecific: BeforeUgoListItem[];
  suggestions: BeforeUgoListItem[];
};
