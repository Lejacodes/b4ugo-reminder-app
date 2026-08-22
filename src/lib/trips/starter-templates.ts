import type { PackingTemplateItem } from '@/types/trip';

/** Local starter templates. Not user trips and not live recommendations. */
export const STARTER_TEMPLATES: { name: string; items: PackingTemplateItem[] }[] = [
  {
    name: 'Weekend trip',
    items: [
      { title: 'Phone', category: 'essentials' },
      { title: 'Charger', category: 'essentials' },
      { title: 'Wallet', category: 'essentials' },
      { title: 'Keys', category: 'essentials' },
      { title: 'Change of clothes', category: 'clothing' },
      { title: 'Underwear', category: 'clothing' },
      { title: 'Toothbrush', category: 'toiletries' },
      { title: 'Medication', category: 'health' },
    ],
  },
  {
    name: 'Camping',
    items: [
      { title: 'Tent', category: 'activity' },
      { title: 'Sleeping bag', category: 'activity' },
      { title: 'Headlamp', category: 'activity' },
      { title: 'Water bottle', category: 'essentials' },
      { title: 'Warm layer', category: 'clothing' },
      { title: 'Insect repellent', category: 'health' },
      { title: 'First-aid kit', category: 'health' },
    ],
  },
  {
    name: 'Sleepover',
    items: [
      { title: 'Pajamas', category: 'clothing' },
      { title: 'Toothbrush', category: 'toiletries' },
      { title: 'Phone charger', category: 'electronics' },
      { title: 'Change of clothes', category: 'clothing' },
    ],
  },
  {
    name: 'Beach day',
    items: [
      { title: 'Towel', category: 'activity' },
      { title: 'Sunscreen', category: 'health' },
      { title: 'Swimwear', category: 'clothing' },
      { title: 'Water bottle', category: 'essentials' },
      { title: 'Sunglasses', category: 'activity' },
    ],
  },
  {
    name: 'International travel',
    items: [
      { title: 'Passport', category: 'documents' },
      { title: 'Travel documents', category: 'documents' },
      { title: 'Adapter', category: 'electronics' },
      { title: 'Medication', category: 'health' },
      { title: 'Phone', category: 'essentials' },
      { title: 'Charger', category: 'essentials' },
      { title: 'Wallet', category: 'essentials' },
    ],
  },
];
