import { describe, expect, it } from 'vitest';
import {
  normalizeMffImageUrl,
  thanosvibsAttributeIconUrl,
  thanosvibsItemIconUrl,
  thanosvibsPortraitUrl,
} from './imageUrls';

describe('MFF image URL normalization', () => {
  it.each([
    ['https://thanosvibs.money/static/attributes/combat.png', 'https://thanosvibs.money/images/attributes/combat.png'],
    ['https://thanosvibs.money/static/assets/items/ctp_rage.png', 'https://thanosvibs.money/images/items/ctp_rage.png'],
    ['https://thanosvibs.money/static/assets/portraits_128/knull1.png', 'https://thanosvibs.money/images-thumbnails/portraits/md/knull1.png'],
    ['https://thanosvibs.money/static/assets/portraits/knull.png', 'https://thanosvibs.money/images/portraits/knull.png'],
    ['https://thanosvibs.money/static/assets/banners/upscale_jpg/6.5_knull.jpg', 'https://thanosvibs.money/images/banners/upscale_jpg/6.5_knull.jpg'],
    ['https://thanosvibs.money/static/cards/6anniv.png', 'https://thanosvibs.money/images/cards/6anniv.png'],
  ])('migrates %s', (legacyUrl, currentUrl) => {
    expect(normalizeMffImageUrl(legacyUrl)).toBe(currentUrl);
  });

  it('keeps app-local assets local and converts generated Windows public paths', () => {
    expect(normalizeMffImageUrl('/mff-assets/characters/knull1.webp')).toBe('/mff-assets/characters/knull1.webp');
    expect(normalizeMffImageUrl('C:\\repo\\apps\\web\\public\\mff-assets\\characters\\knull1.webp'))
      .toBe('/mff-assets/characters/knull1.webp');
  });

  it('builds current official asset URLs', () => {
    expect(thanosvibsAttributeIconUrl('combat')).toBe('https://thanosvibs.money/images/attributes/combat.png');
    expect(thanosvibsItemIconUrl('ctp_rage')).toBe('https://thanosvibs.money/images/items/ctp_rage.png');
    expect(thanosvibsPortraitUrl('knull')).toBe('https://thanosvibs.money/images/portraits/knull.png');
  });
});
