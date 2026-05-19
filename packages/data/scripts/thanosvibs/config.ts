import path from 'node:path';

export const ROOT = process.cwd();
export const BASE_URL = process.env.THANOSVIBS_BASE_URL ?? 'https://thanosvibs.money';
export const OUT_JSON_PACKAGE = path.join(ROOT, 'packages/data/generated/thanosvibs.json');
export const OUT_IMPORTS = path.join(ROOT, 'supabase/imports');
export const OUT_DEBUG = path.join(ROOT, 'packages/data/generated/debug');
export const PUBLIC_ASSET_ROOT = path.join(ROOT, 'apps/web/public/mff-assets');
export const WEBP_QUALITY = Number(process.env.MFF_WEBP_QUALITY ?? 85);

export const pages = {
  uniforms: `${BASE_URL}/uniforms`,
  artifacts: `${BASE_URL}/artifacts`,
  cards: `${BASE_URL}/cards`,
  abxl: `${BASE_URL}/abxl`,
  supports: `${BASE_URL}/supports`,
  attributes: `${BASE_URL}/attributes`,
};
