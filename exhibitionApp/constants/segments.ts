export const PRODUCT_SEGMENTS = [
  'Raw Material',
  'Injection Moulding',
  'Blow Moulding',
  'Reprocess Machines',
  'Lab & Analytical Equipment',
  'Pipes',
  'Auxiliary Equipment',
  'Virgin Granules',
  'Pharma',
  'Confectionary',
  'Printing',
  'Semi & Finished Products',
  'Packaging & Printing Equipment',
  'Moulds & Dies',
  'Reprocess Granules',
  'Turnkey Project & Consultants',
  'Other',
] as const;

export type ProductSegment = (typeof PRODUCT_SEGMENTS)[number];

export const CONTACT_PREFIXES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.'] as const;
export type ContactPrefix = (typeof CONTACT_PREFIXES)[number];

export const SPACE_TYPES = [
  'Bare space',
  'Shell space',
  '2-side space',
  '3-side space',
] as const;
export type SpaceType = (typeof SPACE_TYPES)[number];

export const COUNTRIES = [
  'India',
  'USA',
  'UK',
  'Germany',
  'China',
  'Japan',
  'UAE',
  'Singapore',
  'Australia',
  'Canada',
  'Other',
];

export const EVENT_NAME = 'PlastPack';
export const EVENT_LOCATION = 'Exhibition Ground, Mumbai';
export const EVENT_DATE = '13–16 February 2026';
