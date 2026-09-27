// Pure attribution/routing logic for get/index.html — no DOM access here so it
// can be unit-tested (see test-redirect.mjs) and imported by the page as a
// native ES module (no bundler, no dependency).

export const EDITIONS = {
  world:    { androidId: 'com.guigui314.GeoMaster',          iosId: '6764830622' },
  europe:   { androidId: 'com.guigui314.GeoMastereuEdition', iosId: '6764586510' },
  africa:   { androidId: 'com.guigui314.GeoMasterafEdition', iosId: '6764829384' },
  americas: { androidId: 'com.guigui314.GeoMasteramEdition', iosId: '6766255124' },
  asia:     { androidId: 'com.guigui314.GeoMasterasEdition', iosId: '6764829781' },
  pacific:  { androidId: 'com.guigui314.GeoMasterpaEdition', iosId: '6764829855' },
  us:       { androidId: 'com.guigui314.GeoMasterUSEdition', iosId: '6766081243' },
};

export const DEFAULT_EDITION = 'world';

// App Store Connect → App Analytics → Campaigns → your provider token.
// Leave the placeholder as-is until you have one: pt/ct are simply omitted.
export const APPLE_PROVIDER_TOKEN = 'REPLACE_WITH_YOUR_APPLE_PROVIDER_TOKEN';

export function pickEdition(code) {
  return Object.prototype.hasOwnProperty.call(EDITIONS, code) ? code : DEFAULT_EDITION;
}

// Query campaign codes are attacker-controlled input baked into outbound URLs
// (Play referrer, Apple ct) — keep them to a short safe charset.
export function sanitizeCampaign(raw) {
  const c = (raw == null ? '' : String(raw)).trim().slice(0, 40);
  return /^[a-zA-Z0-9_-]+$/.test(c) ? c : 'share';
}

export function detectPlatform(userAgent, platform, maxTouchPoints) {
  const ua = userAgent || '';
  const plat = platform || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (plat === 'MacIntel' && (maxTouchPoints || 0) > 1); // iPadOS 13+ reports as Mac
  if (isIOS) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

export function buildAppStoreUrl(iosId, campaign) {
  const params = new URLSearchParams({ mt: '8' });
  if (APPLE_PROVIDER_TOKEN && !APPLE_PROVIDER_TOKEN.startsWith('REPLACE_')) {
    params.set('pt', APPLE_PROVIDER_TOKEN);
    params.set('ct', campaign || 'share');
  }
  return `https://apps.apple.com/app/id${iosId}?${params.toString()}`;
}

export function buildPlayUrl(androidId, campaign) {
  const referrer = `utm_source=periplo_site&utm_medium=share&utm_campaign=${encodeURIComponent(campaign || 'share')}`;
  return `https://play.google.com/store/apps/details?${new URLSearchParams({ id: androidId, referrer }).toString()}`;
}
