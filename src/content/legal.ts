export type LegalDocumentId = 'privacy' | 'terms' | 'cookies' | 'refunds';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  title: string;
  summary: string;
  sections: LegalSection[];
};

const configured = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed && !trimmed.includes('your-') ? trimmed : null;
};

export const legalBusiness = {
  operatorName: configured(process.env.EXPO_PUBLIC_LEGAL_OPERATOR_NAME),
  contactEmail: configured(process.env.EXPO_PUBLIC_LEGAL_CONTACT_EMAIL),
  address: configured(process.env.EXPO_PUBLIC_LEGAL_BUSINESS_ADDRESS),
};

export const legalBusinessIsComplete = Boolean(
  legalBusiness.operatorName && legalBusiness.contactEmail && legalBusiness.address,
);

const operator = legalBusiness.operatorName ?? '[operator name required before release]';
const email = legalBusiness.contactEmail ?? '[privacy contact required before release]';
const address = legalBusiness.address ?? '[business address required before release]';

const contactSection: LegalSection = {
  heading: 'Operator and contact',
  paragraphs: [
    `B4UGO is operated by ${operator}. Contact: ${email}. Business address: ${address}.`,
    'These details must identify the actual data controller and contracting business before the app is published.',
  ],
};

export const legalDocuments: Record<LegalDocumentId, LegalDocument> = {
  privacy: {
    title: 'Privacy notice',
    summary: 'What B4UGO processes, why it is needed, and the choices available to you.',
    sections: [
      contactSection,
      {
        heading: 'Data we process',
        paragraphs: [
          'Account data: email address, authentication identifiers, and session tokens when online accounts are enabled. B4UGO does not receive your plaintext password.',
          'Content you choose to save: display name, preferences, reminders, necessities, trips, packing lists, saved places, approximate or precise coordinates attached to places, and notification settings.',
          'Optional device data: location is accessed only after you enable location reminders or set Home; microphone and speech recognition are accessed only when you hold the voice button; push tokens are created only when push notifications are enabled.',
          'AI input: when AI parsing is enabled, your message and a limited snapshot of relevant reminders, trips, places, packing items, and weather context may be sent to the configured AI service so it can answer or perform the requested action.',
        ],
      },
      {
        heading: 'Purposes and legal bases',
        paragraphs: [
          'We use account and saved-content data to provide, secure, sync, and support the service; this is necessary to perform the service you request. Optional location, notifications, voice, and AI features remain off until you choose or permit them.',
          'We do not sell personal data, serve targeted advertising, or run an analytics SDK in the current app. Analytics preference is off by default and no analytics events are currently collected.',
        ],
      },
      {
        heading: 'Service providers and transfers',
        paragraphs: [
          'Depending on enabled features, data may be processed by Supabase for authentication and sync, Google Gemini through a server-side function for AI responses, Expo for push delivery, Apple or Google for operating-system speech and notification services, Open-Meteo for weather and geocoding, and OpenStreetMap Nominatim for place search.',
          'Requests to weather and place providers can reveal an IP address and the location or search query included in the request. Providers may process data outside your country. The operator must verify contracts, transfer safeguards, and provider retention terms before release.',
        ],
      },
      {
        heading: 'Storage, retention, and security',
        paragraphs: [
          'Local app data is kept on your device. Authentication secrets use the operating system secure store on iOS and Android; web storage may use browser storage. When cloud sync is enabled, saved content remains until you delete it or your account, unless law requires a limited longer retention period.',
          'We minimize the context sent to AI and do not intentionally include your password. Do not put highly sensitive personal, financial, health, or identity information into reminders or AI chat.',
        ],
      },
      {
        heading: 'Your choices and rights',
        paragraphs: [
          'You can disable AI parsing, location reminders, and notifications in Profile and can deny operating-system permissions. You may request access, correction, deletion, restriction, objection, portability, or withdrawal of consent where applicable.',
          `Send privacy requests to ${email}. You can delete your account and associated data from Profile. The operator must deploy and test the authenticated deletion function before public release.`,
        ],
      },
      {
        heading: 'Children and changes',
        paragraphs: [
          'B4UGO is not directed to children and should not be used by anyone below the minimum digital-consent age applicable in their country without valid parent or guardian authorization.',
          'Material changes will be shown in the app before they take effect. Effective date: 29 October 2026.',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms and conditions',
    summary: 'The rules for using B4UGO and the limits of the reminder service.',
    sections: [
      contactSection,
      {
        heading: 'Using the service',
        paragraphs: [
          'You must provide accurate account information, protect your login, use the app lawfully, and have authority to submit any information you enter. You may not interfere with the service, misuse location or notification features, or use the app to violate another person’s rights.',
          'B4UGO is a planning aid. Reminders, notifications, location triggers, weather information, place results, and AI output can be delayed, unavailable, incomplete, or wrong. Do not rely on B4UGO for emergencies, medical care, safety-critical travel, legal deadlines, or other situations where a missed alert could cause harm.',
        ],
      },
      {
        heading: 'AI and third-party information',
        paragraphs: [
          'AI output is generated automatically and may make mistakes. Review actions and saved details before relying on them. Weather, maps, geocoding, app stores, and other services are provided by third parties under their own terms.',
        ],
      },
      {
        heading: 'Your content and intellectual property',
        paragraphs: [
          'You keep ownership of content you enter. You give the operator a limited permission to host, process, transmit, and back up that content only as needed to provide and secure B4UGO.',
          'The B4UGO name, original interface, code, and artwork are protected by applicable intellectual-property laws. Third-party names and marks belong to their owners.',
        ],
      },
      {
        heading: 'Availability, suspension, and liability',
        paragraphs: [
          'The service may change or be interrupted for maintenance, security, or legal reasons. Accounts may be restricted for material misuse after reasonable notice where practicable.',
          'Nothing in these terms excludes rights or liability that cannot legally be excluded. Any additional warranty disclaimer, liability cap, governing law, and dispute clause must be reviewed for the operator’s actual jurisdiction before release.',
        ],
      },
      {
        heading: 'Ending use',
        paragraphs: [
          'You may stop using B4UGO at any time and can start account deletion from Profile. Google Play also requires a public web deletion-request page; the operator must publish and submit that URL before distribution.',
          'Effective date: 29 October 2026.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie and device-storage policy',
    summary: 'B4UGO currently uses only storage needed to run the app and keep your choices.',
    sections: [
      contactSection,
      {
        heading: 'Current use',
        paragraphs: [
          'The native iOS and Android app does not use browser cookies. It uses device storage and secure storage for sessions, preferences, reminders, trips, and other features you request.',
          'The web build may use browser local storage for authentication and preferences. This storage is strictly necessary to sign you in, keep the service secure, and remember settings. The current code contains no advertising pixels, third-party embeds, behavioral analytics SDK, or non-essential analytics cookies.',
        ],
      },
      {
        heading: 'Is a consent banner required?',
        paragraphs: [
          'Not for the current strictly necessary storage alone. A cookie banner would add consent theater without giving a real choice. If analytics, advertising, social embeds, or other non-essential tracking is added, it must remain blocked until an informed opt-in where required, with an equally easy reject and withdrawal control.',
        ],
      },
      {
        heading: 'Controls and changes',
        paragraphs: [
          'You can clear app data through device or browser settings. Signing out removes the active session, but complete cloud-account deletion requires the deletion feature described in the Privacy notice.',
          'This policy must be updated before any new cookie, SDK, embed, or tracking technology is enabled. Effective date: 29 October 2026.',
        ],
      },
    ],
  },
  refunds: {
    title: 'Refund policy',
    summary: 'There are currently no paid products or subscriptions in B4UGO.',
    sections: [
      contactSection,
      {
        heading: 'Current service',
        paragraphs: [
          'The current build does not sell subscriptions, digital goods, or physical goods, so there is currently no B4UGO purchase to refund.',
          'If paid features are introduced, the price, renewal terms, cancellation method, statutory withdrawal rights, and refund route will be shown before purchase and this policy will be updated before sales begin.',
        ],
      },
      {
        heading: 'App-store purchases',
        paragraphs: [
          'Purchases processed by Apple App Store or Google Play are billed and refunded through that store, subject to the store’s process and any mandatory consumer rights. Nothing in this policy limits rights that cannot be waived under applicable consumer law.',
          `For billing questions, contact ${email}. Effective date: 29 October 2026.`,
        ],
      },
    ],
  },
};

export function isLegalDocumentId(value: string | string[] | undefined): value is LegalDocumentId {
  return typeof value === 'string' && value in legalDocuments;
}
