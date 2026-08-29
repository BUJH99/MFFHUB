export const THANOSVIBS_ORIGIN = 'https://thanosvibs.money';

const legacyPathRewrites = [
  ['/static/attributes/', '/images/attributes/'],
  ['/static/assets/items/', '/images/items/'],
  ['/static/assets/portraits_128/', '/images-thumbnails/portraits/md/'],
  ['/static/assets/portraits/', '/images/portraits/'],
  ['/static/assets/banners/', '/images/banners/'],
  ['/static/cards/', '/images/cards/'],
] as const;

export function normalizeMffImageUrl(value: string) {
  const normalizedSlashes = value.replace(/\\/g, '/');
  const publicAsset = normalizedSlashes.match(/(?:^|\/)apps\/web\/public\/(.+)$/i);
  if (publicAsset) return `/${publicAsset[1]}`;

  if (value.startsWith('/images/') || value.startsWith('/images-thumbnails/')) {
    return `${THANOSVIBS_ORIGIN}${value}`;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return value;
  }

  if (url.hostname !== 'thanosvibs.money' && url.hostname !== 'www.thanosvibs.money') {
    return value;
  }

  for (const [legacyPrefix, currentPrefix] of legacyPathRewrites) {
    if (!url.pathname.startsWith(legacyPrefix)) continue;
    url.protocol = 'https:';
    url.hostname = 'thanosvibs.money';
    url.pathname = `${currentPrefix}${url.pathname.slice(legacyPrefix.length)}`;
    return url.toString();
  }

  return value;
}

export const thanosvibsAttributeIconUrl = (filename: string) =>
  `${THANOSVIBS_ORIGIN}/images/attributes/${filename}.png`;

export const thanosvibsItemIconUrl = (filename: string) =>
  `${THANOSVIBS_ORIGIN}/images/items/${filename}.png`;

export const thanosvibsPortraitUrl = (filename: string) =>
  `${THANOSVIBS_ORIGIN}/images/portraits/${filename}.png`;
