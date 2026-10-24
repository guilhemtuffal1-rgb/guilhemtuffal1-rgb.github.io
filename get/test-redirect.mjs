// Run: node get/test-redirect.mjs
import assert from 'node:assert';
import {
  EDITIONS, pickEdition, sanitizeCampaign, detectPlatform,
  buildAppStoreUrl, buildPlayUrl, APPLE_PROVIDER_TOKEN,
  sanitizeQuizCode, buildAndroidQuizIntent, visitBeacon,
} from './redirect.mjs';

// pickEdition falls back to world for unknown/missing codes
assert.strictEqual(pickEdition('europe'), 'europe');
assert.strictEqual(pickEdition('atlantis'), 'world');
assert.strictEqual(pickEdition(null), 'world');

// sanitizeCampaign keeps a safe token, rejects everything else
assert.strictEqual(sanitizeCampaign('daily'), 'daily');
assert.strictEqual(sanitizeCampaign('score-2'), 'score-2');
assert.strictEqual(sanitizeCampaign('a b&c=1'), 'share');
assert.strictEqual(sanitizeCampaign(''), 'share');
assert.strictEqual(sanitizeCampaign('x'.repeat(999)), 'x'.repeat(40)); // trimmed to 40 chars, still valid charset

// detectPlatform
assert.strictEqual(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)', '', 0), 'ios');
assert.strictEqual(detectPlatform('Mozilla/5.0 (Linux; Android 14)', '', 0), 'android');
assert.strictEqual(detectPlatform('Mozilla/5.0 (Macintosh)', 'MacIntel', 5), 'ios'); // iPadOS desktop UA
assert.strictEqual(detectPlatform('Mozilla/5.0 (Macintosh)', 'MacIntel', 0), 'desktop'); // real Mac
assert.strictEqual(detectPlatform('Mozilla/5.0 (Windows NT 10.0)', 'Win32', 0), 'desktop');

// buildPlayUrl always carries a UTM referrer
const playUrl = buildPlayUrl(EDITIONS.world.androidId, 'daily');
assert.ok(playUrl.startsWith('https://play.google.com/store/apps/details?'));
assert.ok(playUrl.includes('id=com.guigui314.GeoMaster&'));
assert.ok(decodeURIComponent(playUrl).includes('utm_source=periplo_site&utm_medium=share&utm_campaign=daily'));

// The TikTok bio link get/?c=tiktok: c lands in utm_campaign (Play) and in ct (Apple, once pt is set)
const tiktok = sanitizeCampaign('tiktok');
assert.strictEqual(new URLSearchParams(new URL(buildPlayUrl(EDITIONS.world.androidId, tiktok)).searchParams.get('referrer')).get('utm_campaign'), 'tiktok');
const iosUrl = new URL(buildAppStoreUrl(EDITIONS.world.iosId, tiktok));
assert.strictEqual(iosUrl.pathname, '/app/id6764830622');
if (APPLE_PROVIDER_TOKEN.startsWith('REPLACE_')) {
  // placeholder: pt/ct are left out rather than sent broken
  assert.strictEqual(iosUrl.search, '?mt=8');
} else {
  assert.match(APPLE_PROVIDER_TOKEN, /^\d+$/, 'the provider token is the digits of pt=');
  assert.strictEqual(iosUrl.searchParams.get('pt'), APPLE_PROVIDER_TOKEN);
  assert.strictEqual(iosUrl.searchParams.get('ct'), 'tiktok');
  assert.strictEqual(iosUrl.searchParams.get('mt'), '8');
}

// Visit counter: fixed depth, the analytics rule's leaf, one bounded increment, a safe key
const beacon = visitBeacon('tiktok', 'ios', '2026-10-24');
assert.strictEqual(beacon.url, 'https://geomaster-43940-default-rtdb.firebaseio.com/analytics/get/2026-10-24/visit.json?x-http-method-override=PATCH');
assert.deepStrictEqual(JSON.parse(beacon.body), { 'tiktok:ios/n': { '.sv': { increment: 1 } } });
assert.deepStrictEqual(Object.keys(JSON.parse(visitBeacon('a/b.c$', 'android', '2026-10-24').body)), ['share:android/n']);
assert.ok(visitBeacon('quiz', 'desktop', '2026-10-24', 'get_dev').url.includes('/analytics/get_dev/2026-10-24/visit.json'));

// Shared quiz codes: the app's alphabet only, case-insensitive
assert.strictEqual(sanitizeQuizCode('ab3k7m'), 'AB3K7M');
assert.strictEqual(sanitizeQuizCode('AB3K70'), null);
assert.strictEqual(sanitizeQuizCode('AB3K7M&x=1'), null);
assert.strictEqual(sanitizeQuizCode(null), null);
const intent = buildAndroidQuizIntent('world', 'AB3K7M', EDITIONS.world.androidId, playUrl);
assert.ok(intent.startsWith('intent://quiz/AB3K7M#Intent;scheme=periplo-world;package=com.guigui314.GeoMaster;'));
assert.ok(intent.endsWith(';end'));
assert.strictEqual(decodeURIComponent(intent.split('S.browser_fallback_url=')[1].slice(0, -4)), playUrl);

console.log('get/redirect.mjs: all assertions passed');
