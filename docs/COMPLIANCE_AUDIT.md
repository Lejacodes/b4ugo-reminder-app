# B4UGO release compliance audit

Reviewed 29 October 2026. This is an engineering and product-risk review, not a substitute for advice from a qualified lawyer in every country where the app is offered.

## Implemented in this review

- In-app Privacy notice, Terms and conditions, Cookie/device-storage policy, and Refund policy.
- Separate, unchecked account-creation agreement with direct links to the Terms and Privacy notice. No marketing consent is bundled with account creation.
- Cloud AI is now opt-in. With AI parsing off, Little Guy uses only the on-device parser and does not send chat or context to Gemini.
- Analytics remains off by default and no analytics, advertising, session-replay, social-pixel, or crash-reporting SDK is installed.
- Account deletion UI plus an authenticated Supabase Edge Function. The function verifies the signed-in user and deletes only that user; foreign-key cascades remove associated rows.
- Legal pages are accessible while signed out and from Profile.
- Form fields already expose labels, correct keyboard types, return-key flow, password-manager metadata, visible focus state, and minimum 44-point targets. The new consent and deletion controls have explicit roles, state, and labels.
- Little Guy's meaningful image now has a screen-reader description. Decorative vectors and icons remain hidden within labeled controls.
- Measured contrast: primary text/paper 14.88:1, secondary text/paper 5.46:1, dark primary/paper 13.61:1, dark secondary/paper 6.66:1. Normal-size cream text on matcha measured 3.53:1 and was moved to compliant deep-forest surfaces (5.69:1); normal text on light green uses espresso on sage (5.94:1).
- No reviews or testimonials exist in the repository, so there were no fake reviews to remove. No performance, health, safety, or “best” claims were found. The legal copy explicitly says reminders and AI can be wrong and are not for safety-critical use.
- No `WebView`, iframe, ad, social embed, or third-party content embed is installed.

## Data minimization and third parties

The app currently handles only data needed for selected features: account email/session, optional display name/interests, reminders, trips, packing items, saved places, preferences, optional coordinates, push token, voice input, and AI input/context after opt-in.

Potential processors or recipients that must be covered by final contracts and store disclosures:

- Supabase: authentication, database sync, Edge Functions.
- Google Gemini: opted-in AI prompts and limited app context through the Edge Function.
- Expo: push-notification delivery.
- Apple/Google operating-system services: notifications and speech recognition.
- Open-Meteo: weather and some geocoding requests.
- OpenStreetMap Nominatim: place queries and location-biased search.

Network providers necessarily receive IP addresses. Location/search providers receive coordinates or queries included in requests. The operator must verify each provider's current terms, retention, sub-processors, and international-transfer mechanism.

## Cookie-consent decision

No consent banner is needed for the present native app or for strictly necessary web storage. The code contains no non-essential cookie, tracker, analytics SDK, or embed. Under the Turkish KVKK Board's cookie decision, non-essential analytics, performance, advertising, or marketing storage must be blocked until an active opt-in; necessary storage can rely on another applicable processing condition. Reassess before adding any SDK or embed.

## Release blockers requiring owner action

1. Configure the real legal operator name, monitored privacy/support email, and physical business address with the `EXPO_PUBLIC_LEGAL_*` variables. The app deliberately displays a release-blocker warning instead of inventing these facts.
2. Have counsel select and review the governing law, courts/dispute process, limitation of liability, minimum user age, KVKK/GDPR legal bases, international transfer safeguards, retention schedule, and any required Turkish distance-contract/consumer wording for the actual business model and markets.
3. Deploy and end-to-end test `supabase/functions/delete-account`. Google Play additionally requires a publicly accessible web deletion-request URL; the in-app page alone is insufficient.
4. Publish the Privacy notice at a stable public URL for App Store Connect and Google Play. Ensure App Store privacy labels and Play Data Safety answers exactly match production behavior, including precise location, email, user-generated content, identifiers/push token, and AI transfer.
5. Complete a real-device screen-reader, Dynamic Type/text scaling, keyboard-only web, switch control, reduced-motion, landscape/tablet, and 200% web zoom audit. Automated code review cannot certify full WCAG or EN 301 549 conformance.
6. Verify trademark availability for “B4UGO” and preserve source/license evidence for the app icon, splash art, Fraunces font, and all custom artwork. Unused Expo/React template images remain in `assets/images`; remove them before release or retain their upstream licenses. Do not assume repository presence proves commercial rights.
7. If payments are added, update the Refund policy and Terms before sale, implement store-compliant purchase/cancellation flows, and obtain a jurisdiction-specific consumer-law review. The current app contains no payments.
8. Establish incident response, processor agreements, deletion/backup procedures, and a tested retention schedule. Policy text alone does not create operational compliance.

## Primary sources checked

- Expo SDK 57 reference: https://docs.expo.dev/versions/v57.0.0/
- Turkish Personal Data Protection Law No. 6698 and Articles 4, 5, 10, 11: https://www.kvkk.gov.tr/Icerik/6649/Personal-Data-Protection-Law
- Turkish KVKK cookie decision 2022/229: https://www.kvkk.gov.tr/Icerik/7408/
- EU GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EU ePrivacy Directive: https://eur-lex.europa.eu/eli/dir/2002/58/oj
- Apple App Review Guidelines 5.1.1: https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Google Play account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
