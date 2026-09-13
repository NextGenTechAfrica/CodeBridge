// src/lib/constants/industries.ts

export const INDUSTRY_SECTORS = [
  'Corporate & Commercial',
  'FinTech, Banking & Payments',
  'E-Commerce & Retail Storefronts',
  'Healthcare, Medical & Pharmacy',
  'Logistics, Transport & Supply Chain',
  'Real Estate, Construction & PropTech',
  'Education, EdTech & Academic',
  'Hospitality, Tourism & Restaurants',
  'Agriculture, AgriTech & Food Production',
  'Energy, Utilities & Oil/Gas',
  'Media, Entertainment & Creative Agency',
  'Professional, Legal & Advisory Services',
  'Telecommunications & Network Infrastructure',
  'Manufacturing & Industrial Engineering',
  'Non-Profit, NGO & Public Sector',
  'Other / Custom (Specify)',
] as const;

export type IndustrySector = (typeof INDUSTRY_SECTORS)[number];
