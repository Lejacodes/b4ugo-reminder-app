# B4UGO improvement plan

Updated 2026-10-30. Phase 0 baseline: `176799b`, 2026-10-29. The owner's 2026-10-30 execution request supersedes the earlier phase numbering: reliability now includes the former persistence, sync, and delivery phases. Historical CHANGELOG/REFACTOR_LOG phase numbers do not indicate completion here.

## Product and design contract

B4UGO helps people remember what to take before leaving, what to buy or collect on the way back, and what to prepare for travel. Little Guy uses the same application records. B4UGO is a friendly companion, not an emergency or medical-monitoring service.

Preserve the scrapbook desk and paper, cream/oat/matcha/espresso palette, Fraunces decorative headings, Little Guy and constellation, and paper-unfold opening. Keep essential content in readable system sans. Standard Mode stays available. Calm Mode must keep the same identity, use visible actions and larger controls, respect Reduce Motion, and avoid clinical labeling. A passing source/test check does not certify physical-device accessibility or delivery.

## Authorized execution order

Finish the current phase's checks before starting the next. Keep changes scoped, retain unrelated work, update the implementation log and docs at each boundary, and remain on Expo SDK 57. Install Expo packages with `npx expo install`. Do not weaken lint or tests. Finish safe local work when external/device checks are unavailable and name the remaining evidence precisely.

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Baseline audit and documentation | Complete; retained in BASELINE_AUDIT and historical sections of TESTING/ARCHITECTURE |
| 1 | Reliability: onboarding, persistence, outbox, record sync, delivery, diagnostics | Partial: local implementation checkpoint and automated checks pass; deployment/native/end-to-end acceptance remains open |
| 2 | Daily experience | Not started under this sequence; some existing app features are prerequisites, not completion evidence |
| 3 | Safe local-first Little Guy | Not started; persistence-result and account-isolation fixes belong to Phase 1 |
| 4 | Shared voice capture and review | Not started |
| 5 | Calm Mode and accessibility/launch lifecycle | Not started |
| 6 | Care-partner authorization foundation | Not started |
| 7 | Progressive travel assistant | Not started |

## Phase 1 — reliability

Implemented locally:

- Onboarding visits notification/location/privacy/cloud-AI choices; optional features start off. Explanation precedes a user-triggered permission request; background location has a separate action. Place search/map mounting no longer automatically requests location.
- Native SQLite/WAL and web localStorage with Web Locks; no successful memory-only save fallback. SecureStore retains credentials. Legacy scoped records migrate with verified counts/checksums, retry on interruption, and retained recovery evidence.
- One atomic account envelope contains records, versions, tombstones, device departure checks, and pending operations. Trip creation/packing, trip deletion, departure changes and necessity/session cleanup commit together locally.
- Per-record operations replace remote collection replacement. Operation IDs make retries idempotent; server compare-and-swap versions prevent stale-device overwrites. Conflicts retain the local proposal and remote result; diagnostics offers an explicit remote-version choice and retains local recovery data. No deletion follows from missing remote rows.
- Retry on launch, foreground, reconnect, and a bounded foreground timer. Pending, failed, recovered and conflict counts are visible. Account scopes remount before logout/deletion; stale domain callbacks fail. Confirmed account deletion removes scoped local/recovery data.
- Installation-scoped push registration/removal and retry. Quiet-hours fields were removed because the feature was unsupported. Native geofence first registration, platform region caps, cancellation fences, and bounded logout cleanup were added.
- Local and cloud due-delivery routes are mutually exclusive per installation. Local is default; cloud is a deliberate diagnostics choice requiring working registration. The sender requires a scheduler secret, claims attempts, checks individual Expo tickets, handles receipts/invalid tokens, and does not blindly resend an uncertain submission. Remote notification content is generic.
- Diagnostics covers permissions, schedules, location availability, geofence status/manifest, EAS project ID, registration, sync/conflicts, and AI opt-in.

Acceptance still required: install rebuilt SDK 57 binaries; complete fresh onboarding and permission denial/revocation tests; add → terminate → relaunch → retry on iOS/Android; two-installation reconnect/logout/token-rotation tests; native geofence races; cloud/local delivery-mode handoff; authorized hosted migration and Edge Function/cron deployment; live tickets/receipts and release notification-launch checks. EAS project ID is currently absent. See TESTING and IMPLEMENTATION_LOG. Phase 2 is gated until this evidence passes.

## Phase 2 — daily experience

Prioritize today/date, Before U Go, a large I'm leaving action, Way Back, Add, then supporting Little Guy. Essentials appear without a destination and support weekdays, optional photos and usual-location notes. Add explicit departure sessions, clear unchecked items, Done/Snooze/Undo where supported, grouped nearby errands, placeless errands, scheduled fallback and reasons location is unavailable. Provide visible destructive alternatives. Verify the complete add → close → reopen → departure → complete flow.

## Phase 3 — Little Guy

Create an authoritative read/safe-mutation/confirmation registry. Route common commands locally without Gemini; use opt-in Gemini for complex interpretation with small relevant context, validated arguments, deadlines/rate limits, offline fallback, duplicate prevention and stale-reply guards. Execute through application services and report only confirmed persistence. Clarify ambiguous entities; application-owned confirmation is required for deletion/bulk/privacy actions. Add the forgetting/add/pack/leaving prompts and adversarial tests. No model database access or sensitive prompt logging.

## Phase 4 — voice

Use one Add/chat system for tap/hold and accessible Start/Stop. Expose permission, idle, listening, partial transcript, processing, review, clarification, saving/saved, offline and error states. Preserve editable transcripts, preview interpreted fields, require confirmation, and support hesitant speech without a short silence-only timeout. Prefer device recognition; cloud fallback requires separate consent. Add haptics, optional audible feedback/read-back, and tests for denial, silence, interruption, duplicates, slow speech, network loss and failure. Continuous live AI conversation is outside this phase.

## Phase 5 — Calm Mode and accessibility

Retain Standard Mode; remove global text caps, support large text/reflow, larger controls, reduced decoration/tilt/motion, visible actions, persistent Home/Help, stable important information, confirmation/Undo, guided Little Guy and optional spoken help. Calm Mode has two or three destinations and one principal action per screen. Respect Reduce Motion during opening and Little Guy; notification destinations bypass presentation; full first launch/short later launch/no background replay; replay under Appearance. Run the VoiceOver/TalkBack, narrow/large-text/dark-mode/one-handed matrix where possible.

## Phase 6 — care-partner foundation

Define user/trusted-partner roles and granular grants; implement invitation, acceptance, revocation, expiration, agreed reminder edits, optional acknowledgement/escalation and a user-visible audit log. No default continuous location sharing. Enforce server-side RLS/Edge Function authorization, rate limits and abuse protection, with security/revocation tests. No placeholder authorization. If deployment is unavailable, test the domain/security model and list exact deployment steps.

## Phase 7 — travel

Progressive destination → dates → transport/activity → generated list → optional details. Add packed/wearing/buy-there/last-minute states, quantities/categories/templates, staged departure/return reminders, weather provenance/time/failure, timezone context, document/medication categories without medical advice, and Little Guy/voice packing tools. Keep offline persistence and revision-safe sync. Travel remains secondary to daily reminders.

## Continuation

Continue with the Phase 1 acceptance gates in IMPLEMENTATION_LOG. Do not infer completion from this plan, pre-existing features, or passing mocks. At the final release boundary, review the complete diff plus security/privacy/accessibility/offline/data-loss risks and report every unrun physical-device check.
